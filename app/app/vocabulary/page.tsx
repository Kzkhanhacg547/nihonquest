import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import { JapanBackdrop } from "@/components/JapanIllustration";
import { resolveCanonicalUserLevel } from "@/lib/learning-level";
import { VocabKanjiClient } from "./VocabKanjiClient";

export default async function VocabularyPage() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; name?: string | null; image?: string | null } | undefined;
  const uid = sessionUser?.id;
  if (!uid) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { learningLevel: true, levelChoice: true },
  });
  const userLevel = resolveCanonicalUserLevel(user);
  const vocabulary = await prisma.vocabulary.findMany({ orderBy: { word: "asc" }, include: { examples: true } });
  const kanji = await prisma.kanji.findMany({ orderBy: { strokeCount: "asc" }, include: { readings: true } });
  const userReviews = await prisma.reviewItem.findMany({
    where: { userId: uid, contentType: { in: ["VOCAB", "KANJI"] } },
    select: { contentId: true },
  });
  const savedItemIds = userReviews.map((r) => r.contentId);

  return (
    <div className="nq-workspace">
      <JapanBackdrop />
      <AppNav userName={sessionUser?.name} userImage={sessionUser?.image} />

      <header className="relative z-10 mx-auto mt-3 max-w-[1320px] px-3 sm:px-5">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/95 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-sumi-900/95 sm:flex-row sm:items-center sm:px-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-red-600 px-3 py-0.5 text-xs font-extrabold text-white">
                Kho Từ Vựng & Hán Tự Chuẩn Hóa
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-sumi-800 dark:text-slate-300">
                Pronunciation / Romaji | Chữ viết Nhật | Nghĩa tiếng Việt
              </span>
            </div>
            <h1 className="mt-1.5 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Từ vựng ({vocabulary.length.toLocaleString("vi-VN")}) &amp; Hán tự ({kanji.length.toLocaleString("vi-VN")})
            </h1>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
              Mỗi mục từ là một đơn vị học tập thống nhất kèm phân loại hệ chữ (Hiragana, Katakana, Kanji, Kết hợp) và tách biệt âm Hán Việt.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              href="/app/review"
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-red-700"
            >
              <span>🎴 Ôn tập sổ SRS ({savedItemIds.length})</span>
            </Link>
            <Link
              href="/app/practice"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-sumi-800 dark:text-slate-200"
            >
              <span>📖 Giáo trình</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto mt-3 max-w-[1320px] px-3 pb-28 sm:px-5 sm:pb-20">
        <VocabKanjiClient
          vocabulary={JSON.parse(JSON.stringify(vocabulary))}
          kanji={JSON.parse(JSON.stringify(kanji))}
          savedItemIds={savedItemIds}
          defaultLevel={userLevel}
        />
      </div>
    </div>
  );
}