import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import { JourneyClient } from "./JourneyClient";
import { canUnlockJourney, resolveJourneyStatus } from "@/lib/journey";
import { JapanBackdrop } from "@/components/JapanIllustration";
import "./journey.css";

export default async function JourneyPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) redirect("/login");
  const locations = await prisma.journeyLocation.findMany({ orderBy: { order: "asc" } });
  const progress = await prisma.userJourneyProgress.findMany({ where: { userId: uid } });
  const byId = new Map(progress.map((p) => [p.locationId, p]));

  // Sync journey status to the real XP gate so all pages use the same source of truth.
  for (const loc of locations) {
    const existing = byId.get(loc.id);
    const currentStatus = existing?.status ?? "LOCKED";
    const currentProgress = existing?.progress ?? 0;
    const resolvedStatus = resolveJourneyStatus({
      currentStatus,
      locationOrder: loc.order,
      requirementXp: loc.requirementXp,
      totalXP: user.totalXP,
      previousCompleted: true,
      progress: currentProgress,
    });

    if (!byId.has(loc.id)) {
      const created = await prisma.userJourneyProgress.create({
        data: { userId: uid, locationId: loc.id, status: resolvedStatus, progress: currentProgress },
      });
      byId.set(loc.id, created);
      continue;
    }

    if (currentProgress >= 100 && existing?.status !== "COMPLETED") {
      const updated = await prisma.userJourneyProgress.update({
        where: { userId_locationId: { userId: uid, locationId: loc.id } },
        data: { status: "COMPLETED", progress: 100, completedAt: existing?.completedAt || new Date() },
      });
      byId.set(loc.id, updated);
      continue;
    }

    if (byId.get(loc.id)?.status !== resolvedStatus && resolvedStatus !== "IN_PROGRESS" && resolvedStatus !== "COMPLETED") {
      const updated = await prisma.userJourneyProgress.update({
        where: { userId_locationId: { userId: uid, locationId: loc.id } },
        data: { status: resolvedStatus },
      });
      byId.set(loc.id, updated);
    }
  }

  const achievements = await prisma.userAchievement.findMany({ where: { userId: uid }, include: { achievement: true } });

  const rows = locations.map((loc, i) => {
    const prev = i === 0 ? null : locations[i - 1];
    const prevProg = prev ? byId.get(prev.id) : null;
    const prevDone = prevProg?.status === "COMPLETED" || (prevProg?.progress ?? 0) >= 100;
    return {
      location: JSON.parse(JSON.stringify(loc)),
      progress: byId.get(loc.id) ? JSON.parse(JSON.stringify(byId.get(loc.id))) : null,
      unlockable: canUnlockJourney({
        locationOrder: loc.order,
        requirementXp: loc.requirementXp,
        totalXP: user.totalXP,
        previousCompleted: i === 0 || prevDone,
      }),
    };
  });

  // Streak: đọc an toàn từ field có sẵn trong schema (đổi tên field nếu schema của bạn khác).
  const u = user as unknown as Record<string, unknown>;
  const streak = typeof u.streak === "number" ? u.streak : typeof u.currentStreak === "number" ? u.currentStreak : undefined;

  return (
    <div className="nq-workspace jy-page">
      <JapanBackdrop />
      <AppNav
        userName={user.name}
        userImage={user.image}
        userLevel={user.level}
        userXP={user.totalXP}
        streak={streak}
      />
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-400 font-bold">Đang tải bản đồ hành trình...</div>}>
        <JourneyClient rows={rows} totalXP={user.totalXP} achievements={JSON.parse(JSON.stringify(achievements))} />
      </Suspense>
    </div>
  );
}