import { prisma } from "@/lib/prisma";
import type { NativeLanguage } from "@/components/LanguageContext";

export interface UserMistakeSummary {
  weakVocab: Array<{
    id: string;
    word: string;
    kana: string;
    meaning: string;
    romaji?: string;
  }>;
  weakKanji: Array<{
    id: string;
    character: string;
    meaning: string;
  }>;
  weakGrammar: Array<{
    id: string;
    title: string;
    meaning: string;
    structure?: string;
  }>;
  failedExercises: Array<{
    id: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    prompt?: string | null;
  }>;
  lowScoreLessons: Array<{
    title: string;
    slug: string;
    score: number;
  }>;
  totalMistakesCount: number;
}

/**
 * Retrieves detailed recent mistakes, weak SRS items, and low-score lessons for a given user.
 */
export async function getUserLearningMistakes(userId: string): Promise<UserMistakeSummary> {
  try {
    const [failedAttempts, weakItems, lowLessons] = await Promise.all([
      // 1. Recent failed exercises
      prisma.exerciseAttempt.findMany({
        where: { userId, isCorrect: false },
        include: { exercise: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      // 2. Weak SRS review cards (repetitions = 0 or low ease)
      prisma.reviewItem.findMany({
        where: { userId, repetitions: 0 },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      // 3. Lessons with score below 75%
      prisma.userLessonProgress.findMany({
        where: { userId, score: { lt: 75 } },
        include: { lesson: { select: { title: true, slug: true } } },
        orderBy: { score: "asc" },
        take: 3,
      }),
    ]);

    // Parse failed exercises
    const failedExercises = failedAttempts.map((a) => ({
      id: a.id,
      question: a.exercise?.question || "Câu hỏi luyện tập",
      userAnswer: a.userAnswer || "(bỏ trống)",
      correctAnswer: a.exercise?.correctAnswer || "",
      prompt: a.exercise?.prompt,
    }));

    // Categorize weak review items by content type
    const vocabIds = weakItems.filter((i) => i.contentType === "VOCAB").map((i) => i.contentId);
    const kanjiIds = weakItems.filter((i) => i.contentType === "KANJI").map((i) => i.contentId);
    const grammarIds = weakItems.filter((i) => i.contentType === "GRAMMAR").map((i) => i.contentId);

    const [vocabs, kanjis, grammars] = await Promise.all([
      vocabIds.length > 0
        ? prisma.vocabulary.findMany({
            where: { id: { in: vocabIds } },
            select: { id: true, word: true, kana: true, meaning: true, romaji: true },
          })
        : [],
      kanjiIds.length > 0
        ? prisma.kanji.findMany({
            where: { id: { in: kanjiIds } },
            select: { id: true, character: true, meaning: true },
          })
        : [],
      grammarIds.length > 0
        ? prisma.grammar.findMany({
            where: { id: { in: grammarIds } },
            select: { id: true, title: true, meaning: true, structure: true },
          })
        : [],
    ]);

    const lowScoreLessons = lowLessons.map((l) => ({
      title: l.lesson?.title || "Bài học",
      slug: l.lesson?.slug || "",
      score: l.score || 0,
    }));

    const totalMistakesCount =
      failedExercises.length + vocabs.length + kanjis.length + grammars.length + lowScoreLessons.length;

    return {
      weakVocab: vocabs,
      weakKanji: kanjis,
      weakGrammar: grammars,
      failedExercises,
      lowScoreLessons,
      totalMistakesCount,
    };
  } catch (err) {
    console.error("Error retrieving user learning mistakes:", err);
    return {
      weakVocab: [],
      weakKanji: [],
      weakGrammar: [],
      failedExercises: [],
      lowScoreLessons: [],
      totalMistakesCount: 0,
    };
  }
}

/**
 * Builds a pedagogical briefing text for AI Sensei system prompt.
 */
export function formatMistakesForAiPrompt(
  mistakes: UserMistakeSummary,
  nativeLangName: string = "Tiếng Việt"
): string {
  if (mistakes.totalMistakesCount === 0) {
    return `\nTHÔNG TIN ĐIỂM YẾU & LỖI SAI: Hiện tại học viên chưa có lịch sử lỗi sai nghiêm trọng. Tinh thần học tập và độ chính xác rất cao. Hãy tiếp tục củng cố kiến thức nâng cao.`;
  }

  const lines: string[] = [];
  lines.push(`\nTHÔNG TIN CHI TIẾT VỀ LỖI SAI VÀ ĐIỂM YẾU CỦA HỌC VIÊN (CẦN TẬP TRUNG HƯỚNG DẪN KHẮC PHỤC):`);

  if (mistakes.weakVocab.length > 0) {
    lines.push(`- Từ vựng hay quên / độ thuần thục thấp (cần giải thích và cho ví dụ ghi nhớ):`);
    mistakes.weakVocab.forEach((v) => {
      lines.push(`  + ${v.word} (${v.kana}) [${v.romaji}]: nghĩa "${v.meaning}"`);
    });
  }

  if (mistakes.weakKanji.length > 0) {
    lines.push(`- Hán tự (Kanji) còn yếu:`);
    mistakes.weakKanji.forEach((k) => {
      lines.push(`  + Hán tự: ${k.character} (Nghĩa: ${k.meaning})`);
    });
  }

  if (mistakes.weakGrammar.length > 0) {
    lines.push(`- Mẫu ngữ pháp làm sai hoặc chưa nắm vững:`);
    mistakes.weakGrammar.forEach((g) => {
      lines.push(`  + Mẫu câu: ${g.title} (${g.structure || ""}) -> Ý nghĩa: ${g.meaning}`);
    });
  }

  if (mistakes.failedExercises.length > 0) {
    lines.push(`- Bài tập vừa làm sai gần đây:`);
    mistakes.failedExercises.forEach((ex, idx) => {
      lines.push(
        `  ${idx + 1}. Câu hỏi: "${ex.question}" | Học viên chọn: "${ex.userAnswer}" ❌ | Đáp án đúng: "${ex.correctAnswer}" ✔️`
      );
    });
  }

  if (mistakes.lowScoreLessons.length > 0) {
    lines.push(`- Các bài học có điểm kiểm tra thấp:`);
    mistakes.lowScoreLessons.forEach((l) => {
      lines.push(`  + ${l.title} (Điểm đạt: ${l.score}%)`);
    });
  }

  lines.push(`
NHIỆM VỤ SƯ PHẠM CỦA SENSEI:
1. Khi học viên hỏi về lỗi sai hoặc nhờ hỗ trợ ("tôi hay sai gì", "khắc phục lỗi sai", "hướng dẫn chỗ sai"), hãy trực tiếp chỉ ra các từ vựng hoặc câu bài tập ở trên.
2. Giải thích rõ ràng nguyên nhân vì sao người học thường nhầm lẫn (ví dụ: nhầm trợ từ は/が, に/で, nhầm âm On/Kun, hoặc nhầm các từ có phát âm tương tự).
3. Hướng dẫn mẹo ghi nhớ (mnemonics, ngữ cảnh thực tế) bằng ${nativeLangName}.
4. Luôn tạo ngay 1 câu hỏi bài tập nhỏ tương tự để học viên làm lại trực tiếp trong chat, sửa ngay khi học viên trả lời!`);

  return lines.join("\n");
}
