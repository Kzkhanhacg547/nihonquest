import Image from "next/image";
import { BASE64_IMAGES } from "@/lib/assets/base64Images";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { resolveCanonicalUserLevel } from "@/lib/learning-level";
import { AppNav } from "@/components/AppNav";
import { TestClient } from "./TestClient";
import {
  TEST_MODES,
  getQuestionsForMode,
  type AssessmentQuestion,
  type SkillKey,
  type QuestionFormat,
  type DynamicExamDto,
} from "@/lib/test-assessment";

export const metadata = { title: "Bài Kiểm Tra Năng Lực & Kho Đề Thi JLPT — Nihon Quest" };
export const dynamic = "force-dynamic";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default async function TestPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) redirect("/login");

  const [user, dbExams, catalogDocCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: uid },
      select: {
        id: true,
        name: true,
        image: true,
        learningLevel: true,
        levelChoice: true,
        totalXP: true,
        currentStreak: true,
        profile: { select: { displayName: true, avatar: true } },
      },
    }),
    prisma.assessmentExam
      .findMany({
        where: { isPublished: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: { questions: { orderBy: { order: "asc" } } },
      })
      .catch(() => []),
    prisma.documentResource.count({ where: { isDuplicate: false } }).catch(() => 242),
  ]);

  const displayName =
    user?.profile?.displayName || user?.name || session?.user?.name || "Học viên";
  const userLevel = resolveCanonicalUserLevel(user);
  const avatarUrl = user?.profile?.avatar || user?.image || null;

  const initialExams: DynamicExamDto[] =
    dbExams.length > 0
      ? dbExams.map((e) => ({
          id: e.slug,
          slug: e.slug,
          title: e.title,
          description: e.description,
          kindLabel: e.kindLabel,
          category: e.category,
          targetLevel: e.targetLevel,
          skillFocus: e.skillFocus,
          timeMinutes: e.timeMinutes,
          icon: e.icon,
          badge: e.badge,
          sourceDocument: e.sourceDocument,
          answerAuthority: e.answerAuthority,
          questions: e.questions.map((q) => ({
            id: q.questionKey,
            skill: (q.skill as SkillKey) || "READING",
            subCategory:
              (q.subCategory as AssessmentQuestion["subCategory"]) || "Đọc hiểu",
            level: (q.level as "N5" | "N4" | "N3") || "N5",
            format: (q.format as QuestionFormat) || "MULTIPLE_CHOICE",
            question: q.question,
            contextPassage: q.contextPassage || undefined,
            audioUrl: q.audioUrl || undefined,
            audioScript: q.audioScript || undefined,
            promptHint: q.promptHint || undefined,
            options: safeParse(q.optionsJson, []),
            acceptedKeywords: safeParse(q.acceptedKeywordsJson, []),
            sampleAnswer: q.sampleAnswer || undefined,
            rubricCriteria: safeParse(q.rubricCriteriaJson, []),
            explanation: q.explanation,
            recommendedLesson: {
              slug: q.recommendedLessonSlug,
              title: q.recommendedLessonTitle,
              topic: q.recommendedLessonTopic,
            },
          })),
        }))
      : TEST_MODES.map((m) => ({
          id: m.id,
          slug: m.id,
          title: m.title,
          description: m.description,
          kindLabel: m.kindLabel,
          category: m.id === "DIAGNOSTIC" ? "PLACEMENT" : "LEVEL_TEST",
          targetLevel: m.targetLevel,
          skillFocus: "ALL",
          timeMinutes: m.timeMinutes,
          icon: m.icon,
          badge: m.badge,
          sourceDocument: "Nihon Quest 4-Skill Assessment Matrix",
          answerAuthority: "CURATED",
          questions: getQuestionsForMode(m.id),
        }));

  return (
    <div className="nq-workspace min-h-screen bg-slate-50 dark:bg-sumi-950">
      <AppNav
        userName={displayName}
        userImage={avatarUrl}
        userLevel={
          userLevel === "N5" ? 1 : userLevel === "N4" ? 2 : userLevel === "N3" ? 3 : 4
        }
        userXP={user?.totalXP ?? 0}
        streak={user?.currentStreak ?? 0}
      />

      {/* HERO BANNER */}
      <section className="mx-auto mt-3 max-w-[1320px] px-4 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#0b1230] shadow-xl">
          <Image
            src={BASE64_IMAGES.fujiHero}
            unoptimized
            alt=""
            fill
            priority
            sizes="(min-width: 1320px) 1320px, 100vw"
            className="-z-20 object-cover object-[70%_center]"
          />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1230]/95 via-[#0b1230]/75 to-transparent"
            aria-hidden="true"
          />

          <div className="relative px-6 py-8 sm:px-10 sm:py-12 lg:py-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/40 backdrop-blur-md">
              <span className="text-amber-400">★</span> HỆ THỐNG ĐỀ THI ĐỘNG & ĐÁNH GIÁ NĂNG LỰC NIHON QUEST
            </div>
            <h1 className="mt-3 max-w-2xl text-[clamp(1.875rem,5vw,3.25rem)] font-black leading-tight tracking-tight text-white">
              Kiểm Tra Năng Lực, Đề Thi JLPT &{" "}
              <span className="text-amber-400">Giáo Trình FPT</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
              Hệ thống <b>{initialExams.length} bộ đề thi động</b> từ cơ sở dữ liệu: Đánh giá đầu vào 4 kỹ năng, Chặng N5–N3, Học phần <b>FPT JPD113–126</b>, Chuyên đề Từ vựng・Ngữ pháp・Kanji・Nghe・Đọc và Đề thi chính thức JLPT có Audio gốc.
            </p>
          </div>

          <p
            className="jp-text pointer-events-none absolute right-6 top-6 hidden text-2xl font-medium tracking-[0.35em] text-white/80 [writing-mode:vertical-rl] md:block"
            aria-hidden="true"
          >
            実力テスト
          </p>
        </div>
      </section>

      {/* MAIN CLIENT CONTAINER */}
      <main className="mx-auto max-w-[1320px] px-4 pb-24 pt-6 sm:px-6">
        <TestClient
          userLevel={userLevel}
          userXP={user?.totalXP ?? 0}
          displayName={displayName}
          initialExams={initialExams}
          catalogDocCount={catalogDocCount}
        />
      </main>
    </div>
  );
}
