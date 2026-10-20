import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { evaluateLessonAccess, resolveCanonicalUserLevel } from "@/lib/learning-level";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, lesson] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { learningLevel: true, levelChoice: true },
    }),
    prisma.lesson.findUnique({
      where: { slug: params.slug },
      include: { exercises: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } } },
    }),
  ]);
  if (!lesson || !lesson.isPublished) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userLevel = resolveCanonicalUserLevel(user);
  const [progress, attempts, lessonsBefore, userLevelTotal, userLevelCompleted] = await Promise.all([
    prisma.userLessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId: lesson.id } } }),
    prisma.exerciseAttempt.findMany({ where: { userId, lessonId: lesson.id } }),
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
    isCompleted: progress?.status === "COMPLETED",
    isInProgress: progress?.status === "IN_PROGRESS",
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

  return NextResponse.json({ lesson, progress, attempts, access });
}
