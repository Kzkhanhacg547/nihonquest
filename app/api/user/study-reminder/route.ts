import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getUserProgress } from "@/lib/progress-service";
import { sendStudyReminderEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: { profile: true },
  });

  if (!user || !user.email) {
    return NextResponse.json({ error: "User or email not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const nativeLanguage = body?.nativeLanguage === "en" ? "en" : "vi";

  const progress = await getUserProgress(uid);

  const result = await sendStudyReminderEmail({
    to: user.email,
    userName: user.profile?.displayName || user.name || "Học viên",
    streak: progress?.currentStreak ?? 0,
    dueCards: progress?.stats.dueReviewCount ?? 0,
    currentLevel: progress?.learningLevel || "N5",
    nativeLanguage,
  });

  if (!result.success && !result.devPreview) {
    return NextResponse.json(
      { error: result.error || "Không thể gửi email nhắc nhở." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message:
      nativeLanguage === "en"
        ? `Study reminder email sent to ${user.email}!`
        : `Đã gửi email nhắc nhở học tập đến ${user.email}!`,
    devPreview: result.devPreview,
  });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await getUserProgress(uid);

  return NextResponse.json({
    currentStreak: progress?.currentStreak ?? 0,
    dueReviewCount: progress?.stats.dueReviewCount ?? 0,
    userLevel: progress?.learningLevel || "N5",
    completedLessons: progress?.stats.completedLessonsCount ?? 0,
    totalLessons: progress?.stats.totalLessonsInLevel ?? 50,
  });
}
