import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayKeyForUser, incrementDailyMission } from "@/lib/missionDay";
import { awardUserXP } from "@/lib/progress-service";

const schema = z.object({
  scenarioId: z.string().optional(),
  slug: z.string().optional(),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.scenarioId && !parsed.data.slug)) {
    return NextResponse.json({ error: "Invalid scenario." }, { status: 400 });
  }

  const scenario = parsed.data.scenarioId
    ? await prisma.scenario.findUnique({ where: { id: parsed.data.scenarioId } })
    : await prisma.scenario.findUnique({ where: { slug: parsed.data.slug! } });
  if (!scenario) return NextResponse.json({ error: "Scenario not found." }, { status: 404 });

  const existing = await prisma.userScenarioProgress.findUnique({
    where: { userId_scenarioId: { userId, scenarioId: scenario.id } },
  });

  const now = new Date();
  if (existing?.status === "COMPLETED") {
    return NextResponse.json({ ok: true, alreadyCompleted: true, xpAwarded: 0 });
  }

  // Record completion & award XP once
  await prisma.userScenarioProgress.upsert({
    where: { userId_scenarioId: { userId, scenarioId: scenario.id } },
    update: { status: "COMPLETED", completedAt: now },
    create: { userId, scenarioId: scenario.id, status: "COMPLETED", completedAt: now },
  });

  const awardResult = await awardUserXP({
    userId,
    amount: scenario.xpReward,
    reason: "SCENARIO_COMPLETE",
    referenceId: scenario.id,
    now,
  });

  // Update daily mission if applicable
  await incrementDailyMission(userId, "LESSON", 1, now);

  return NextResponse.json({
    ok: true,
    xpAwarded: awardResult.xpAwarded,
    newLevel: awardResult.level,
    newTotalXP: awardResult.totalXP,
    leveledUp: awardResult.leveledUp,
    newlyUnlockedAchievements: awardResult.newlyUnlockedAchievements,
    newlyUnlockedJourney: awardResult.newlyUnlockedJourney,
  });
}

