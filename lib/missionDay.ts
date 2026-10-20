import { prisma } from "./prisma";
import { localDateKey } from "./streak";
import { awardUserXP } from "./progress-service";

/**
 * Single source of truth for the "which learning day is it" key.
 *
 * Writers previously hardcoded UTC while readers used `user.timezone`, so for a
 * UTC+7 learner between 17:00 and 24:00 UTC progress landed on a row nobody
 * displayed. Every mission/review/survival writer and reader goes through here.
 */
export async function todayKeyForUser(
  userId: string,
  now: Date = new Date(),
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return localDateKey(now, user?.timezone ?? "UTC");
}

/**
 * Ensures today's daily missions exist for the user, increments matching mission type,
 * and immediately marks completed missions as COMPLETED + awards XP idempotently.
 */
export async function incrementDailyMission(
  userId: string,
  missionType: string,
  incrementBy: number = 1,
  now: Date = new Date(),
): Promise<void> {
  const today = await todayKeyForUser(userId, now);

  let entries = await prisma.userDailyMission.findMany({
    where: { userId, date: today, mission: { type: missionType } },
    include: { mission: true },
  });

  if (entries.length === 0) {
    const templates = await prisma.dailyMission.findMany({
      where: { type: missionType },
    });
    for (const t of templates) {
      await prisma.userDailyMission.upsert({
        where: { userId_missionId_date: { userId, missionId: t.id, date: today } },
        update: {},
        create: { userId, missionId: t.id, date: today, targetCount: t.targetCount },
      });
    }
    entries = await prisma.userDailyMission.findMany({
      where: { userId, date: today, mission: { type: missionType } },
      include: { mission: true },
    });
  }

  for (const entry of entries) {
    if (entry.status === "COMPLETED") continue;
    const nextProgress = entry.progress + incrementBy;
    const isNowComplete = nextProgress >= entry.targetCount;

    await prisma.userDailyMission.update({
      where: { id: entry.id },
      data: {
        progress: nextProgress,
        status: isNowComplete ? "COMPLETED" : "IN_PROGRESS",
        completedAt: isNowComplete ? now : entry.completedAt,
      },
    });

    if (isNowComplete && entry.mission.xpReward > 0) {
      await awardUserXP({
        userId,
        amount: entry.mission.xpReward,
        reason: "MISSION_COMPLETE",
        referenceId: entry.id,
        now,
      });
    }
  }
}