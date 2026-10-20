import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { resolveCanonicalUserLevel } from "@/lib/learning-level";
import { AppNav } from "@/components/AppNav";
import { AvatarEditor } from "./AvatarEditor";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { DangerZone } from "./DangerZone";
import { panel } from "./parts";
import { BASE64_IMAGES } from "@/lib/assets/base64Images";

const FOCUS: Record<string, string> = { BALANCED: "Toàn diện", LISTENING: "Nghe", SPEAKING: "Nói", READING: "Đọc", WRITING: "Viết" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: uid }, include: { profile: true } });
  if (!user) redirect("/login");

  const canonicalLevel = resolveCanonicalUserLevel(user);
  const displayName = user.profile?.displayName ?? user.name ?? user.email.split("@")[0];
  const initial = displayName.slice(0, 1).toUpperCase();
  const avatarSrc = user.profile?.avatar ?? user.image ?? null;
  const stats = [
    ["Cấp độ hiện tại", `Level ${user.level} (${user.totalXP.toLocaleString("vi-VN")} XP)`],
    ["Chuỗi ngày học", `🔥 ${user.currentStreak} ngày (Kỷ lục: ${user.longestStreak})`],
    ["Mục tiêu mỗi ngày", `${user.dailyGoalMinutes} phút`],
    ["Kỹ năng trọng tâm", FOCUS[user.focusSkill] ?? "Toàn diện"],
    ["Múi giờ", user.timezone],
  ];

  return (
    <div className="nq-workspace min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-sumi-950 dark:text-white">
      <AppNav userName={displayName} avatar={avatarSrc} userLevel={user.level} userXP={user.totalXP} streak={user.currentStreak} />
      <main className="pb-24 sm:pb-16">
        <div className="relative h-28 overflow-hidden sm:h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BASE64_IMAGES.japanProfileHero} alt="" aria-hidden="true" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 dark:to-sumi-950" />
        </div>

        <div className="mx-auto mt-4 max-w-6xl px-4 sm:px-8 lg:px-10">
          {/* Unified Account & Settings Switcher */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 shadow-sm dark:border-slate-800 dark:bg-sumi-900/90">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">人</span>
              <span>Trung tâm Tài khoản &amp; Cài đặt thống nhất</span>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-sumi-950">
              <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-extrabold text-rose-600 shadow-xs dark:bg-sumi-800 dark:text-rose-400">
                👤 Hồ sơ tổng quan
              </span>
              <Link
                href="/app/settings"
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                ⚙️ Cài đặt chi tiết (7 mục)
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-8">
            <aside className={`${panel} p-6 text-center lg:sticky lg:top-24`}>
              <div className="flex flex-col items-center">
                <AvatarEditor src={avatarSrc} initial={initial} />
              </div>
              <h1 className="mt-4 break-words text-xl font-bold tracking-tight">{displayName}</h1>
              <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <span className="mt-3 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">JLPT {canonicalLevel}</span>

              <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                {stats.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                    <dd className="truncate font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>

              <Link
                href="/app/settings"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-sumi-900 dark:text-slate-200 dark:hover:bg-sumi-800"
              >
                ⚙️ Mở bảng Cài đặt nâng cao →
              </Link>
            </aside>

            <div className="min-w-0 space-y-6">
              <ProfileForm initial={{
                displayName: user.profile?.displayName ?? user.name ?? "",
                learningLevel: canonicalLevel,
                learningGoal: user.learningGoal,
                dailyGoalMinutes: user.dailyGoalMinutes,
                focusSkill: user.focusSkill,
                learningStyle: user.learningStyle,
                timezone: user.timezone,
                theme: user.theme,
                soundEnabled: user.soundEnabled,
              }} />
              <PasswordForm />
              <DangerZone />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}