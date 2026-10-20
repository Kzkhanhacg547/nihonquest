import { prisma } from "@/lib/prisma";
import { localDateKey } from "@/lib/streak";
import { SPIRIT_BEASTS, INITIAL_DAILY_QUESTS } from "./constants";
import { DailyQuest, YokaiPlayerProfile } from "./types";

export const MAX_DAILY_STAMINA = 5;

export async function getYokaiPlayerState(userId: string): Promise<YokaiPlayerProfile & { dailyQuests: DailyQuest[] }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      totalXP: true,
      level: true,
      timezone: true,
      createdAt: true,
    },
  });

  const now = new Date();
  const userTimezone = user?.timezone || "UTC";
  const todayKey = localDateKey(now, userTimezone);

  // End of day (Midnight reset time based on user date)
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all Yokai Dash run transactions for this user
  const allRunTxs = await prisma.xpTransaction.findMany({
    where: {
      userId,
      reason: {
        in: [
          "YOKAI_DASH_STAGE_CLEAR",
          "YOKAI_DASH_FAILED_RUN",
          "YOKAI_DASH_STAMINA_CONSUMED",
          "YOKAI_DASH_PRACTICE",
        ],
      },
    },
    select: {
      reason: true,
      referenceId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Count runs today that consumed stamina (non-practice)
  const staminaRunsToday = allRunTxs.filter(
    (tx) =>
      localDateKey(tx.createdAt, userTimezone) === todayKey &&
      (tx.reason === "YOKAI_DASH_STAGE_CLEAR" ||
        tx.reason === "YOKAI_DASH_FAILED_RUN" ||
        tx.reason === "YOKAI_DASH_STAMINA_CONSUMED")
  ).length;

  const allRunsToday = allRunTxs.filter(
    (tx) => localDateKey(tx.createdAt, userTimezone) === todayKey
  );
  const stamina = Math.max(0, MAX_DAILY_STAMINA - staminaRunsToday);
  const totalRuns = allRunTxs.length;

  // Parse historical high score, best combo, cleared zones, and today's quest metrics
  let highScore = 0;
  let bestCombo = 0;
  let maxComboToday = 0;
  let correctGatesToday = 0;
  const clearedZonesSet = new Set<string>();

  for (const tx of allRunTxs) {
    const ref = tx.referenceId || "";
    const match = ref.match(/^(?:([a-z0-9_]+)_(?:KANA|N5|N4|N3|LISTENING)_)?s(\d+)_c(\d+)_q(\d+)_/i);
    if (match) {
      const zonePart = match[1];
      const sVal = parseInt(match[2], 10);
      const cVal = parseInt(match[3], 10);
      const qVal = parseInt(match[4], 10);

      if (!Number.isNaN(sVal) && sVal > highScore) highScore = sVal;
      if (!Number.isNaN(cVal) && cVal > bestCombo) bestCombo = cVal;
      if (tx.reason === "YOKAI_DASH_STAGE_CLEAR" && zonePart) {
        clearedZonesSet.add(zonePart);
      }
      if (localDateKey(tx.createdAt, userTimezone) === todayKey) {
        if (!Number.isNaN(cVal) && cVal > maxComboToday) maxComboToday = cVal;
        if (!Number.isNaN(qVal)) correctGatesToday += qVal;
      }
    } else {
      // Legacy referenceId format: `${zoneId}_${level}_${timestamp}`
      const legacyMatch = ref.match(/^([a-z0-9_]+)_(?:KANA|N5|N4|N3|LISTENING)_\d+$/i);
      if (legacyMatch && tx.reason === "YOKAI_DASH_STAGE_CLEAR") {
        clearedZonesSet.add(legacyMatch[1]);
      }
      if (localDateKey(tx.createdAt, userTimezone) === todayKey) {
        maxComboToday = Math.max(maxComboToday, 5);
        correctGatesToday += 5;
      }
    }
  }

  // Calculate unlocked beasts based on user totalXP, level, bestCombo, totalRuns, and clearedZones
  const userTotalXp = user?.totalXP || 0;
  const userLevel = user?.level || 1;
  const unlockedBeastIds: string[] = [];

  for (const beast of SPIRIT_BEASTS) {
    if (beast.unlockedByDefault) {
      unlockedBeastIds.push(beast.id);
    } else if (beast.id === "tanuki" && (userTotalXp >= 150 || userLevel >= 3 || totalRuns >= 3)) {
      unlockedBeastIds.push(beast.id);
    } else if (beast.id === "yatagarasu" && (userTotalXp >= 500 || bestCombo >= 8)) {
      unlockedBeastIds.push(beast.id);
    } else if (beast.id === "okami" && (userTotalXp >= 1000 || clearedZonesSet.has("fuji_summit"))) {
      unlockedBeastIds.push(beast.id);
    } else if (beast.requiredXp && userTotalXp >= beast.requiredXp) {
      unlockedBeastIds.push(beast.id);
    }
  }

  // Quests progress based on today's runs
  const dailyQuests: DailyQuest[] = INITIAL_DAILY_QUESTS.map((q) => {
    let current = 0;
    if (q.id === "quest_1") {
      current = Math.min(q.target, allRunsToday.length);
    } else if (q.id === "quest_2") {
      current = Math.min(q.target, maxComboToday);
    } else if (q.id === "quest_3") {
      current = Math.min(q.target, correctGatesToday);
    }
    return {
      ...q,
      current,
      completed: current >= q.target,
    };
  });

  return {
    stamina,
    maxStamina: MAX_DAILY_STAMINA,
    nextStaminaReset: endOfDay.toISOString(),
    selectedBeastId: "kitsune",
    unlockedBeastIds,
    highScore,
    bestCombo,
    totalRuns,
    clearedZones: Array.from(clearedZonesSet),
    practiceUnlocked: true,
    dailyQuests,
  };
}


