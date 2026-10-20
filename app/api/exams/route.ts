import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  TEST_MODES,
  getQuestionsForMode,
  type AssessmentQuestion,
  type SkillKey,
  type QuestionFormat,
  type DynamicExamDto,
} from "@/lib/test-assessment";

export const dynamic = "force-dynamic";

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    const dbExams = await prisma.assessmentExam.findMany({
      where: { isPublished: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (dbExams.length > 0) {
      const exams: DynamicExamDto[] = dbExams.map((e) => ({
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
          subCategory: (q.subCategory as AssessmentQuestion["subCategory"]) || "Đọc hiểu",
          level: (q.level as "N5" | "N4" | "N3") || "N5",
          format: (q.format as QuestionFormat) || "MULTIPLE_CHOICE",
          question: q.question,
          contextPassage: q.contextPassage || undefined,
          audioUrl: q.audioUrl || undefined,
          audioScript: q.audioScript || undefined,
          promptHint: q.promptHint || undefined,
          options: safeJsonParse(q.optionsJson, []),
          acceptedKeywords: safeJsonParse(q.acceptedKeywordsJson, []),
          sampleAnswer: q.sampleAnswer || undefined,
          rubricCriteria: safeJsonParse(q.rubricCriteriaJson, []),
          explanation: q.explanation,
          recommendedLesson: {
            slug: q.recommendedLessonSlug,
            title: q.recommendedLessonTitle,
            topic: q.recommendedLessonTopic,
          },
        })),
      }));

      return NextResponse.json({ exams, source: "DATABASE" });
    }

    // Fallback to static TEST_MODES if DB has not been seeded yet
    const fallbackExams: DynamicExamDto[] = TEST_MODES.map((m) => ({
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

    return NextResponse.json({ exams: fallbackExams, source: "STATIC_FALLBACK" });
  } catch (error) {
    console.error("Error in GET /api/exams:", error);
    return NextResponse.json({ error: "Không thể tải danh sách đề thi" }, { status: 500 });
  }
}

