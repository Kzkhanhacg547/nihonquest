import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardUserXP, touchUserActivity } from "@/lib/progress-service";
import { getYokaiPlayerState } from "@/lib/yokai-dash/state";
import { updateSrs, nextDueDate } from "@/lib/srs";
import { todayKeyForUser } from "@/lib/missionDay";

const completeSchema = z.object({
  zoneId: z.string(),
  level: z.enum(["KANA", "N5", "N4", "N3", "LISTENING"]),
  beastId: z.string(),
  score: z.number().int().nonnegative(),
  distance: z.number().nonnegative(),
  maxCombo: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  wrongCount: z.number().int().nonnegative(),
  heartsRemaining: z.number().int().min(0).max(3),
  isVictory: z.boolean(),
  isPractice: z.boolean(),
  answeredQuestions: z.array(
    z.object({
      question: z.object({
        id: z.string(),
        category: z.string(),
        prompt: z.string(),
        correctAnswer: z.string(),
        audioText: z.string().optional(),
      }),
      chosenLane: z.number().int().min(0).max(2),
      isCorrect: z.boolean(),
      timeMs: z.number().int().nonnegative(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: parsed.error.format() }, { status: 400 });
    }

    const {
      zoneId,
      level,
      beastId,
      score,
      maxCombo,
      correctCount,
      wrongCount,
      heartsRemaining,
      isVictory,
      isPractice,
      answeredQuestions,
    } = parsed.data;

    // Check stamina if not practice
    const currentState = await getYokaiPlayerState(userId);
    if (!isPractice && currentState.stamina <= 0) {
      return NextResponse.json({ error: "Bạn đã hết lượt chạy hôm nay. Hãy thử chế độ Luyện tập!" }, { status: 403 });
    }

    // Calculate XP
    let earnedXP = 0;
    if (!isPractice) {
      const baseXP = isVictory ? 30 : 10;
      const questionXP = correctCount * 8;
      const comboXP = Math.min(maxCombo * 4, 40);
      const victoryBonus = isVictory ? 25 : 0;
      const perfectBonus = isVictory && wrongCount === 0 ? 35 : 0;

      let subtotal = baseXP + questionXP + comboXP + victoryBonus + perfectBonus;
      if (beastId === "tanuki") {
        subtotal = Math.round(subtotal * 1.25); // +25% Tanuki bonus
      }
      earnedXP = subtotal;
    } else {
      // Practice mode gives minimal encouragement XP
      earnedXP = Math.min(Math.round(correctCount * 2), 15);
    }

    const reason = isPractice
      ? "YOKAI_DASH_PRACTICE"
      : isVictory
      ? "YOKAI_DASH_STAGE_CLEAR"
      : "YOKAI_DASH_FAILED_RUN";

    // Award XP
    let awardResult = null;
    const referenceMeta = `${zoneId}_${level}_s${score}_c${maxCombo}_q${correctCount}_${Date.now()}`;
    if (earnedXP > 0 || !isPractice) {
      awardResult = await awardUserXP({
        userId,
        amount: Math.max(1, earnedXP),
        reason,
        referenceId: referenceMeta,
      });
    } else {
      // Record practice run with 0 correct answers so quest_1 and stats still track
      await prisma.xpTransaction.create({
        data: {
          userId,
          amount: 0,
          reason,
          referenceId: referenceMeta,
        },
      });
    }

    // Touch user activity to preserve streak
    await touchUserActivity(userId);

    // Save incorrect questions into SRS review items so user can practice them later
    const now = new Date();
    for (const item of answeredQuestions) {
      if (!item.isCorrect) {
        try {
          const rawId = item.question.id.trim();
          let contentType: "KANA" | "VOCAB" | "KANJI" | "GRAMMAR" | null = null;
          let contentId: string | null = null;

          if (rawId.startsWith("db_kana_")) {
            const kanaCuid = rawId.replace(/^db_kana_/, "");
            const kanaRow = await prisma.kana.findUnique({
              where: { id: kanaCuid },
              select: { script: true, character: true },
            });
            if (kanaRow) {
              contentType = "KANA";
              contentId = `${kanaRow.script}:${kanaRow.character}`;
            }
          } else if (rawId.startsWith("db_vocab_")) {
            contentType = "VOCAB";
            contentId = rawId.replace(/^db_vocab_/, "");
          } else if (rawId.startsWith("db_kanji_")) {
            contentType = "KANJI";
            contentId = rawId.replace(/^db_kanji_/, "");
          } else if (rawId.startsWith("db_grammar_")) {
            contentType = "GRAMMAR";
            contentId = rawId.replace(/^db_grammar_/, "");
          } else if (item.question.category === "KANA" && item.question.audioText && item.question.audioText.length <= 2) {
            const kanaRow = await prisma.kana.findFirst({
              where: { character: item.question.audioText },
              select: { script: true, character: true },
            });
            if (kanaRow) {
              contentType = "KANA";
              contentId = `${kanaRow.script}:${kanaRow.character}`;
            }
          } else if (!rawId.startsWith("cur_")) {
            // Direct database ID
            if (item.question.category === "KANA") contentType = "KANA";
            else if (item.question.category === "KANJI") contentType = "KANJI";
            else if (item.question.category === "GRAMMAR") contentType = "GRAMMAR";
            else contentType = "VOCAB";
            contentId = rawId;
          }

          if (!contentType || !contentId) continue;

          const existingReview = await prisma.reviewItem.findUnique({
            where: {
              userId_contentType_contentId: {
                userId,
                contentType,
                contentId,
              },
            },
          });

          if (existingReview) {
            const next = updateSrs(
              {
                ease: existingReview.ease,
                interval: existingReview.interval,
                repetitions: existingReview.repetitions,
              },
              "AGAIN"
            );
            await prisma.reviewItem.update({
              where: { id: existingReview.id },
              data: {
                ease: next.ease,
                interval: next.interval,
                repetitions: next.repetitions,
                dueAt: now,
                lastReviewedAt: now,
              },
            });
          } else {
            await prisma.reviewItem.create({
              data: {
                userId,
                contentType,
                contentId,
                ease: 2.1,
                interval: 0,
                repetitions: 0,
                dueAt: now,
                lastReviewedAt: now,
              },
            });
          }
        } catch (srsErr) {
          console.warn("Failed to update SRS item for missed question:", srsErr);
        }
      }
    }

    // Re-fetch updated player state
    const updatedState = await getYokaiPlayerState(userId);

    // Award XP for any newly completed daily quests today (idempotent per user + day + questId)
    const dayKey = await todayKeyForUser(userId, now);
    let questBonusXP = 0;
    for (const q of updatedState.dailyQuests) {
      if (q.completed && q.rewardXP > 0) {
        const qRes = await awardUserXP({
          userId,
          amount: q.rewardXP,
          reason: "YOKAI_DASH_DAILY_QUEST",
          referenceId: `${q.id}_${dayKey}`,
          now,
        });
        if (qRes.xpAwarded > 0) {
          questBonusXP += qRes.xpAwarded;
          awardResult = qRes;
        }
      }
    }

    return NextResponse.json({
      success: true,
      earnedXP: earnedXP + questBonusXP,
      questBonusXP,
      isVictory,
      score,
      maxCombo,
      correctCount,
      wrongCount,
      heartsRemaining,
      leveledUp: awardResult?.leveledUp || false,
      newTotalXP: awardResult?.totalXP,
      newLevel: awardResult?.level ?? 1,
      stamina: updatedState.stamina,
      maxStamina: updatedState.maxStamina,
      highScore: updatedState.highScore,
      bestCombo: updatedState.bestCombo,
      unlockedBeastIds: updatedState.unlockedBeastIds,
      dailyQuests: updatedState.dailyQuests,
    });
  } catch (error) {
    console.error("Error in POST /api/yokai-dash/complete:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
