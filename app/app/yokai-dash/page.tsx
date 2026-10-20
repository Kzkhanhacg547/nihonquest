import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/level";
import { resolveCanonicalUserLevel } from "@/lib/learning-level";
import { AppNav } from "@/components/AppNav";
import { JapanBackdrop } from "@/components/JapanIllustration";
import { YokaiDashClient } from "@/components/yokai-dash/YokaiDashClient";

export const metadata = {
  title: "Yōkai Dash (妖怪ダッシュ) — Mini Game Chạy Vô Tận Nihon Quest",
  description:
    "Trải nghiệm mini game chạy 3D vô tận phong cách thần thoại Nhật Bản, rèn luyện phản xạ từ vựng, kanji, ngữ pháp và nghe hiểu.",
};

export default async function YokaiDashPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: { profile: true },
  });

  if (!user) redirect("/login");

  const levelInfo = calculateLevel(user.totalXP);
  const userLevel = resolveCanonicalUserLevel(user);

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[#f6eef3] dark:bg-[#07041a] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Nền sakura nhẹ phía sau Hub (ẩn khi đang chơi vì game phủ fixed toàn màn hình) */}
      <JapanBackdrop />
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden dark:block bg-[radial-gradient(ellipse_at_20%_0%,rgba(168,85,247,0.16),transparent_45%),radial-gradient(ellipse_at_90%_60%,rgba(244,63,94,0.12),transparent_50%)]"
        aria-hidden
      />

      <AppNav
        userName={user.name}
        userImage={user.image}
        avatar={user.profile?.avatar}
        userLevel={levelInfo.level}
        userXP={user.totalXP}
        streak={user.currentStreak}
        levelLabel={userLevel}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28 sm:pb-16 relative z-10 flex flex-col">
        <YokaiDashClient />
      </main>
    </div>
  );
}