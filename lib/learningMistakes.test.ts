import { describe, it, expect } from "vitest";
import { formatMistakesForAiPrompt, type UserMistakeSummary } from "./learningMistakes";
import { generateNaturalJapaneseResponse, getLanguageName } from "./naturalSenseiEngine";

describe("Learning Mistakes & Pedagogical AI Guidance", () => {
  it("formats empty mistakes correctly", () => {
    const emptySummary: UserMistakeSummary = {
      weakVocab: [],
      weakKanji: [],
      weakGrammar: [],
      failedExercises: [],
      lowScoreLessons: [],
      totalMistakesCount: 0,
    };

    const prompt = formatMistakesForAiPrompt(emptySummary, "Tiếng Việt");
    expect(prompt).toContain("Hiện tại học viên chưa có lịch sử lỗi sai nghiêm trọng");
  });

  it("formats vocabulary, exercises, and grammar mistakes into prompt", () => {
    const summary: UserMistakeSummary = {
      weakVocab: [
        { id: "v1", word: "食べる", kana: "たべる", meaning: "Ăn", romaji: "taberu" },
      ],
      weakKanji: [
        { id: "k1", character: "日", meaning: "Ngày, mặt trời" },
      ],
      weakGrammar: [
        { id: "g1", title: "〜てはいけない", meaning: "Không được làm gì", structure: "V-te + wa ikenai" },
      ],
      failedExercises: [
        {
          id: "ex1",
          question: "パン____食べます",
          userAnswer: "に",
          correctAnswer: "を",
        },
      ],
      lowScoreLessons: [
        { title: "Bài 1: Trợ từ cơ bản", slug: "bai-1", score: 60 },
      ],
      totalMistakesCount: 5,
    };

    const prompt = formatMistakesForAiPrompt(summary, "Tiếng Việt");
    expect(prompt).toContain("食べる");
    expect(prompt).toContain("パン____食べます");
    expect(prompt).toContain("Bài 1: Trợ từ cơ bản");
    expect(prompt).toContain("NHIỆM VỤ SƯ PHẠM CỦA SENSEI");
  });

  it("naturalSenseiEngine provides intelligent feedback when student asks to fix mistakes", () => {
    const summary: UserMistakeSummary = {
      weakVocab: [
        { id: "v1", word: "行く", kana: "いく", meaning: "Đi", romaji: "iku" },
      ],
      weakKanji: [],
      weakGrammar: [],
      failedExercises: [
        {
          id: "ex1",
          question: "私は学校____行きます",
          userAnswer: "で",
          correctAnswer: "へ",
        },
      ],
      lowScoreLessons: [],
      totalMistakesCount: 2,
    };

    const response = generateNaturalJapaneseResponse({
      userMessage: "Sensei ơi em hay làm sai những chỗ nào? Hãy sửa lỗi giúp em!",
      mistakes: summary,
      nativeLanguage: "vi",
    });

    expect(response).toContain("行く");
    expect(response).toContain("私は学校____行きます");
    expect(response).toContain("Mẹo khắc phục từ Sensei");
  });

  it("supports multilingual language naming", () => {
    expect(getLanguageName("vi")).toBe("Tiếng Việt");
    expect(getLanguageName("en")).toBe("English");
    expect(getLanguageName("ko")).toBe("한국어");
    expect(getLanguageName("zh-CN")).toBe("简体中文");
    expect(getLanguageName("fr")).toBe("Français");
  });
});
