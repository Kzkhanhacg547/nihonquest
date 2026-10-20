import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { synchronizeLevelFields } from "@/lib/learning-level";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimited } from "@/lib/rateLimit";

const updateSchema = z.object({
  displayName: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(300).optional(),
  timezone: z.string().trim().max(50).optional(),
  learningLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
  levelChoice: z.enum(["BEGINNER", "N5", "N4", "N3", "N2", "N1"]).optional(),
  learningGoal: z.enum(["JLPT", "TRAVEL", "CONVERSATION", "CULTURE"]).optional(),
  dailyGoalMinutes: z.number().int().min(5).max(180).optional(),
  focusSkill: z.enum(["BALANCED", "LISTENING", "SPEAKING", "READING", "WRITING"]).optional(),
  learningStyle: z.enum(["STRUCTURED", "IMMERSIVE", "GAMIFIED", "PRACTICAL"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  soundEnabled: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = rateLimit(`account-update:${userId}`, 30, 60_000);
  if (!limit.ok) return rateLimited(limit.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ.", details: parsed.error.issues }, { status: 400 });
  }

  const {
    displayName,
    bio,
    timezone,
    learningLevel,
    levelChoice,
    learningGoal,
    dailyGoalMinutes,
    focusSkill,
    learningStyle,
    theme,
    soundEnabled,
    onboardingCompleted,
  } = parsed.data;

  const userUpdateData: Record<string, unknown> = {};

  // Synchronize both learningLevel and levelChoice whenever either is modified
  // so Settings, Onboarding, Placement Test, Dashboard, and Learning Path always agree.
  if (learningLevel !== undefined || levelChoice !== undefined) {
    const synced = synchronizeLevelFields({ learningLevel, levelChoice });
    userUpdateData.learningLevel = synced.learningLevel;
    userUpdateData.levelChoice = synced.levelChoice;
  }

  if (learningGoal !== undefined) userUpdateData.learningGoal = learningGoal;
  if (dailyGoalMinutes !== undefined) userUpdateData.dailyGoalMinutes = dailyGoalMinutes;
  if (focusSkill !== undefined) userUpdateData.focusSkill = focusSkill;
  if (learningStyle !== undefined) userUpdateData.learningStyle = learningStyle;
  if (timezone !== undefined) userUpdateData.timezone = timezone;
  if (theme !== undefined) userUpdateData.theme = theme;
  if (soundEnabled !== undefined) userUpdateData.soundEnabled = soundEnabled;
  if (onboardingCompleted !== undefined) userUpdateData.onboardingCompleted = onboardingCompleted;
  if (displayName !== undefined && displayName.length > 0) {
    userUpdateData.name = displayName;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...userUpdateData,
      profile: {
        upsert: {
          create: {
            displayName: displayName ?? null,
            bio: bio ?? null,
          },
          update: {
            ...(displayName !== undefined ? { displayName } : {}),
            ...(bio !== undefined ? { bio } : {}),
          },
        },
      },
    },
    include: { profile: true },
  });

  const { passwordHash: _omit, ...safe } = updatedUser;
  return NextResponse.json({ ok: true, user: safe });
}

export async function DELETE() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = rateLimit(`account-delete:${userId}`, 3, 15 * 60_000);
  if (!limit.ok) return rateLimited(limit.retryAfterSeconds);

  await prisma.user.delete({
    where: { id: userId },
  });

  return NextResponse.json({ ok: true });
}
