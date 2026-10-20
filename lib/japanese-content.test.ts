import { describe, expect, it } from "vitest";
import { splitJapaneseRuby } from "@/components/JapaneseTerm";
import { kanaToRomaji } from "@/lib/romajiConverter";
import { KANJI_N5, VOCABULARY_N5 } from "@/prisma/seed-data/kanji-vocab";
import { KANJI_N4, VOCABULARY_N4, GRAMMAR_N4 } from "@/prisma/seed-data/n4-data";
import { KANJI_N3, VOCABULARY_N3, GRAMMAR_N3 } from "@/prisma/seed-data/n3-data";
import { grammarData as GRAMMAR_N5 } from "@/prisma/seed-data/grammar";
import { EXPANDED_KANJI, EXPANDED_VOCABULARY, EXPANDED_GRAMMAR } from "@/prisma/seed-data/expanded-curriculum";

describe("Japanese Term Presentation & Linguistic Data Integrity", () => {
  it("splits Kanji compounds and okurigana for semantic <ruby> furigana", () => {
    expect(splitJapaneseRuby("学生", "がくせい")).toEqual({
      prefix: "",
      kanjiBase: "学生",
      reading: "がくせい",
      okurigana: "",
    });

    expect(splitJapaneseRuby("食べる", "たべる")).toEqual({
      prefix: "",
      kanjiBase: "食",
      reading: "た",
      okurigana: "べる",
    });

    expect(splitJapaneseRuby("お水", "おみず")).toEqual({
      prefix: "お",
      kanjiBase: "水",
      reading: "みず",
      okurigana: "",
    });

    expect(splitJapaneseRuby("ありがとう", "ありがとう")).toEqual({
      prefix: "",
      kanjiBase: "ありがとう",
      reading: null,
      okurigana: "",
    });
  });

  it("ensures zero cross-level Kanji duplication and valid readings across N5, N4, N3", () => {
    const allKanji = [...KANJI_N5, ...KANJI_N4, ...KANJI_N3, ...EXPANDED_KANJI];
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const k of allKanji) {
      expect(k.character.trim().length).toBe(1);
      expect(k.meaning.trim().length).toBeGreaterThan(0);
      expect(k.readings.length).toBeGreaterThan(0);
      for (const r of k.readings) {
        expect(r.reading.trim().length).toBeGreaterThan(0);
      }
      if (seen.has(k.character)) {
        duplicates.push(`${k.character} (${seen.get(k.character)} vs ${k.jlptLevel})`);
      }
      seen.set(k.character, k.jlptLevel);
    }

    expect(duplicates).toEqual([]);
    // Core N5 Kanji must be classified as N5, not N4
    for (const n5Char of ["会", "社", "店", "駅", "校", "電", "車"]) {
      expect(seen.get(n5Char)).toBe("N5");
    }
    // Core N4 Kanji must be classified as N4, not N5
    for (const n4Char of ["勉", "強", "族", "明"]) {
      expect(seen.get(n4Char)).toBe("N4");
    }
  });

  it("ensures all Vocabulary and Grammar entries have non-empty Phiên âm (kana), Chữ Nhật (word), and Nghĩa (meaning)", () => {
    const allVocab = [...VOCABULARY_N5, ...VOCABULARY_N4, ...VOCABULARY_N3, ...EXPANDED_VOCABULARY];
    for (const v of allVocab) {
      expect(v.word.trim().length).toBeGreaterThan(0);
      expect(v.kana.trim().length).toBeGreaterThan(0);
      expect(v.meaning.trim().length).toBeGreaterThan(0);
      expect(["N5", "N4", "N3"]).toContain(v.jlptLevel);
    }

    const allGrammar = [...GRAMMAR_N5, ...GRAMMAR_N4, ...GRAMMAR_N3, ...EXPANDED_GRAMMAR];
    for (const g of allGrammar) {
      expect(g.title.trim().length).toBeGreaterThan(0);
      expect(g.meaning.trim().length).toBeGreaterThan(0);
      expect(g.structure.trim().length).toBeGreaterThan(0);
      expect(["N5", "N4", "N3"]).toContain(g.level);
    }
  });

  it("converts Kana to Hepburn Romaji adhering to sokuon before ch, choonpu, and hatsuon rules", () => {
    // 1. Chōonpu (ー) with macron
    expect(kanaToRomaji("コーヒー")).toBe("kōhī");
    expect(kanaToRomaji("ラーメン")).toBe("rāmen");
    expect(kanaToRomaji("ケーキ")).toBe("kēki");
    expect(kanaToRomaji("タクシー")).toBe("takushī");

    // 2. Sokuon (っ) before 'ch' becomes 'tch'
    expect(kanaToRomaji("まっちゃ")).toBe("matcha");
    expect(kanaToRomaji("こっち")).toBe("kotchi");
    expect(kanaToRomaji("きって")).toBe("kitte");

    // 3. Hatsuon (ん) before vowels or y uses apostrophe
    expect(kanaToRomaji("きんえん")).toBe("kin'en");
    expect(kanaToRomaji("ほん")).toBe("hon");
  });

  it("splits Katakana prefixes and okurigana correctly in splitJapaneseRuby", () => {
    expect(splitJapaneseRuby("ペンキ塗り", "ぺんきぬり")).toEqual({
      prefix: "ペンキ",
      kanjiBase: "塗",
      reading: "ぬ",
      okurigana: "り",
    });
  });

  it("validates all assessment mode questions for integrity and format correctness", async () => {
    const { TEST_MODES, getQuestionsForMode } = await import("@/lib/test-assessment");
    for (const mode of TEST_MODES) {
      const questions = getQuestionsForMode(mode.id);
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q.id.trim().length).toBeGreaterThan(0);
        expect(q.question.trim().length).toBeGreaterThan(0);
        expect(["N5", "N4", "N3"]).toContain(q.level);
        expect(["LISTENING", "SPEAKING", "READING", "WRITING"]).toContain(q.skill);

        if (q.format === "MULTIPLE_CHOICE") {
          expect(q.options && q.options.length).toBeGreaterThanOrEqual(2);
          const correctCount = (q.options || []).filter((o) => o.isCorrect).length;
          expect(correctCount).toBe(1);
        } else if (q.format === "WRITING_INPUT" || q.format === "SPEAKING_PROMPT") {
          expect(q.acceptedKeywords && q.acceptedKeywords.length).toBeGreaterThan(0);
          expect(q.sampleAnswer && q.sampleAnswer.length).toBeGreaterThan(0);
          expect(q.rubricCriteria && q.rubricCriteria.length).toBe(3);
        }
      }
    }
  });
});


