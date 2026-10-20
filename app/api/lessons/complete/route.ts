import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { evaluateLessonAccess, resolveCanonicalUserLevel } from "@/lib/learning-level";
import { prisma } from "@/lib/prisma";
import { checkAnswer, scoreQuiz } from "@/lib/quiz";
import { incrementDailyMission } from "@/lib/missionDay";
import { awardUserXP, touchUserActivity } from "@/lib/progress-service";

/** Below this accuracy the lesson stays IN_PROGRESS and pays no XP. */
const PASS_THRESHOLD = 0.6;

const schema = z.object({
  lessonId: z.string(),
  answers: z.array(
    z.object({
      exerciseId: z.string(),
      answer: z.string(),
      timeSpent: z.number().min(0).max(3600).default(0),
    })
  ),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });

  const [user, lesson] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { learningLevel: true, levelChoice: true },
    }),
    prisma.lesson.findUnique({
      where: { id: parsed.data.lessonId },
      include: { exercises: true },
    }),
  ]);
  if (!lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const userLevel = resolveCanonicalUserLevel(user);
  const [existing, lessonsBefore, userLevelTotal, userLevelCompleted] = await Promise.all([
    prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
    }),
    prisma.lesson.count({ where: { isPublished: true, level: lesson.level, order: { lt: lesson.order } } }),
    prisma.lesson.count({ where: { isPublished: true, level: userLevel } }),
    prisma.userLessonProgress.count({
      where: { userId, status: "COMPLETED", lesson: { level: userLevel, isPublished: true } },
    }),
  ]);

  const access = evaluateLessonAccess({
    userLevel,
    lessonLevel: lesson.level,
    lessonIndexInLevel: lessonsBefore,
    isCompleted: existing?.status === "COMPLETED",
    isInProgress: existing?.status === "IN_PROGRESS",
    prevLessonCompleted: true,
    isFirstInUnit: lessonsBefore % 5 === 0,
    isFptSupplementary: lesson.slug.startsWith("fpt-jpd"),
    currentLevelCompletionRatio: userLevelTotal > 0 ? userLevelCompleted / userLevelTotal : 0,
  });

  if (!access.unlocked && access.lockReason === "HIGHER_LEVEL") {
    return NextResponse.json(
      { error: access.lockMessage, lockReason: access.lockReason },
      { status: 403 }
    );
  }

  const byId = new Map(lesson.exercises.map((e) => [e.id, e]));
  const graded = parsed.data.answers
    .map((a) => {
      const ex = byId.get(a.exerciseId);
      if (!ex) return null;
      const isCorrect = checkAnswer(ex.correctAnswer, a.answer);
      return { exerciseId: ex.id, isCorrect, points: ex.points, answer: a.answer, timeSpent: a.timeSpent };
    })
    .filter(Boolean) as Array<{
    exerciseId: string;
    isCorrect: boolean;
    points: number;
    answer: string;
    timeSpent: number;
  }>;

  // Validate complete submission BEFORE mutating database records
  if (graded.length !== lesson.exercises.length) {
    return NextResponse.json(
      {
        error: "Incomplete submission.",
        expected: lesson.exercises.length,
        received: graded.length,
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const summary = scoreQuiz(graded);
  const score = Math.round(summary.accuracy * 100);
  const passed = summary.accuracy >= PASS_THRESHOLD;
  const isPriorCompleted = existing?.status === "COMPLETED";
  const bestScore = existing?.score != null ? Math.max(existing.score, score) : score;
  const bestAccuracy = existing?.accuracy != null ? Math.max(existing.accuracy, summary.accuracy) : summary.accuracy;

  // Never downgrade an already-completed lesson back to IN_PROGRESS on review replay
  const status = isPriorCompleted || passed ? "COMPLETED" : "IN_PROGRESS";
  const completedAt = isPriorCompleted ? existing?.completedAt ?? now : passed ? now : null;

  const progress = await prisma.$transaction(async (tx) => {
    for (const g of graded) {
      await tx.exerciseAttempt.create({
        data: {
          userId,
          exerciseId: g.exerciseId,
          lessonId: lesson.id,
          isCorrect: g.isCorrect,
          userAnswer: g.answer,
          timeSpent: g.timeSpent,
          createdAt: now,
        },
      });

      if (!g.isCorrect) {
        const ex = byId.get(g.exerciseId);
        const contentType = ex?.contentType || "EXERCISE";
        const contentId = ex?.contentId || g.exerciseId;

        await tx.reviewItem.upsert({
          where: {
            userId_contentType_contentId: {
              userId,
              contentType,
              contentId,
            },
          },
          update: {
            dueAt: now,
            interval: 0,
            repetitions: 0,
          },
          create: {
            userId,
            contentType,
            contentId,
            ease: 2.5,
            interval: 0,
            repetitions: 0,
            dueAt: now,
          },
        });
      }
    }

    return tx.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      update: {
        status,
        score: bestScore,
        accuracy: bestAccuracy,
        completedAt,
      },
      create: {
        userId,
        lessonId: lesson.id,
        status,
        score,
        accuracy: summary.accuracy,
        completedAt,
      },
    });
  });

  let xpAwarded = 0;
  let awardResult = null;

  if (passed) {
    // Lower-level review or repeat completions award review XP when first-time LESSON_COMPLETE was already claimed
    const xpReason = isPriorCompleted ? `LESSON_REVIEW_${now.toISOString().slice(0, 10)}` : "LESSON_COMPLETE";
    const xpAmount = isPriorCompleted ? Math.max(10, Math.round(lesson.xpReward * 0.25)) : lesson.xpReward;
    awardResult = await awardUserXP({
      userId,
      amount: xpAmount,
      reason: xpReason,
      referenceId: lesson.id,
      now,
    });
    xpAwarded = awardResult.xpAwarded;
    await incrementDailyMission(userId, "LESSON", 1, now);
  } else {
    await touchUserActivity(userId, now);
  }

  return NextResponse.json({
    ok: true,
    passed,
    summary,
    score,
    bestScore,
    xpAwarded,
    isPriorCompleted,
    progressId: progress.id,
    newLevel: awardResult?.level,
    newTotalXP: awardResult?.totalXP,
    leveledUp: awardResult?.leveledUp ?? false,
    newlyUnlockedAchievements: awardResult?.newlyUnlockedAchievements ?? [],
    newlyUnlockedJourney: awardResult?.newlyUnlockedJourney ?? [],
  });
}
