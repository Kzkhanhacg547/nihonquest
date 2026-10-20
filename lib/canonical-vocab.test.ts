import { describe, it, expect } from "vitest";
import {
  classifyJapaneseScript,
  extractHanVietFromMeaning,
  parseKanjiMeaningAndHanViet,
  normalizeJapaneseWord,
  buildCanonicalVocabKey,
  formatDisplayRomaji,
  formatJapaneseWithReading,
  toCanonicalVocabularyItem,
  type ScriptClassification,
} from "./canonical-vocab";

describe("Canonical Japanese Vocabulary Model", () => {
  describe("Script Classification (classifyJapaneseScript)", () => {
    it("correctly identifies pure Hiragana words", () => {
      expect(classifyJapaneseScript("こんにちは").primaryScript).toBe<ScriptClassification>("HIRAGANA");
      expect(classifyJapaneseScript("ありがとう").primaryScript).toBe<ScriptClassification>("HIRAGANA");
      expect(classifyJapaneseScript("おはよう").primaryScript).toBe<ScriptClassification>("HIRAGANA");
    });

    it("correctly identifies pure Katakana words", () => {
      expect(classifyJapaneseScript("コーヒー").primaryScript).toBe<ScriptClassification>("KATAKANA");
      expect(classifyJapaneseScript("パン").primaryScript).toBe<ScriptClassification>("KATAKANA");
      expect(classifyJapaneseScript("ホテル").primaryScript).toBe<ScriptClassification>("KATAKANA");
    });

    it("correctly identifies pure Kanji words", () => {
      expect(classifyJapaneseScript("学校").primaryScript).toBe<ScriptClassification>("KANJI");
      expect(classifyJapaneseScript("日本語").primaryScript).toBe<ScriptClassification>("KANJI");
      expect(classifyJapaneseScript("先生").primaryScript).toBe<ScriptClassification>("KANJI");
      expect(classifyJapaneseScript("会社員").primaryScript).toBe<ScriptClassification>("KANJI");
    });

    it("correctly identifies Mixed words (Kanji + Okurigana / Kana)", () => {
      expect(classifyJapaneseScript("食べる").primaryScript).toBe<ScriptClassification>("MIXED");
      expect(classifyJapaneseScript("飲む").primaryScript).toBe<ScriptClassification>("MIXED");
      expect(classifyJapaneseScript("美味しい").primaryScript).toBe<ScriptClassification>("MIXED");
      expect(classifyJapaneseScript("消しゴム").primaryScript).toBe<ScriptClassification>("MIXED");
    });
  });

  describe("Sino-Vietnamese (Hán Việt) Separation", () => {
    it("extracts explicit Hán Việt notes from vocabulary meanings", () => {
      const res1 = extractHanVietFromMeaning("Trường học (Hán Việt: HỌC HIỆU)");
      expect(res1.meaningVi).toBe("Trường học");
      expect(res1.hanVietNote).toBe("HỌC HIỆU");

      const res2 = extractHanVietFromMeaning("Bác sĩ, giáo viên (Hán Việt: TIÊN SINH)");
      expect(res2.meaningVi).toBe("Bác sĩ, giáo viên");
      expect(res2.hanVietNote).toBe("TIÊN SINH");
    });

    it("returns null hanVietNote when no Sino-Vietnamese note exists", () => {
      const res = extractHanVietFromMeaning("Xin chào vào buổi sáng");
      expect(res.meaningVi).toBe("Xin chào vào buổi sáng");
      expect(res.hanVietNote).toBeNull();
    });

    it("parses all-caps leading Kanji meanings into Hán Việt notes", () => {
      const res1 = parseKanjiMeaningAndHanViet("HỌC — Học tập, trường học, học sinh");
      expect(res1.hanViet).toBe("HỌC");
      expect(res1.meaningVi).toBe("Học tập, trường học, học sinh");

      const res2 = parseKanjiMeaningAndHanViet("Học tập, học sinh (HỌC)");
      expect(res2.hanViet).toBe("HỌC");
      expect(res2.meaningVi).toBe("Học tập, học sinh");
    });
  });

  describe("Japanese Word Normalization", () => {
    it("strips leading particle prefixes and preserves them as notes", () => {
      const res1 = normalizeJapaneseWord("が 壊れる");
      expect(res1.japanese).toBe("壊れる");
      expect(res1.particleNote).toContain("Đi với trợ từ が");

      const res2 = normalizeJapaneseWord("を 食べる");
      expect(res2.japanese).toBe("食べる");
      expect(res2.particleNote).toContain("Đi với trợ từ を");
    });

    it("strips wave dash prefixes and (な) suffixes", () => {
      const res1 = normalizeJapaneseWord("~から");
      expect(res1.japanese).toBe("〜から");

      const res2 = normalizeJapaneseWord("静か (な)");
      expect(res2.japanese).toBe("静か");
      expect(res2.particleNote).toContain("Tính từ đuôi な");
    });
  });

  describe("Lexical Homonym Preservation (No Merging)", () => {
    it("generates distinct canonical keys for homonyms with different readings", () => {
      const keyKarai = buildCanonicalVocabKey("辛い", "からい");
      const keyTsurai = buildCanonicalVocabKey("辛い", "つらい");

      expect(keyKarai).toBe("辛い::からい");
      expect(keyTsurai).toBe("辛い::つらい");
      expect(keyKarai).not.toBe(keyTsurai);
    });

    it("generates distinct canonical keys for words with same kanji but different pitch/meaning", () => {
      const keyOmote = buildCanonicalVocabKey("表", "おもて");
      const keyHyou = buildCanonicalVocabKey("表", "ひょう");

      expect(keyOmote).toBe("表::おもて");
      expect(keyHyou).toBe("表::ひょう");
      expect(keyOmote).not.toBe(keyHyou);
    });

    it("normalizes spacing so equivalent representations match", () => {
      const key1 = buildCanonicalVocabKey(" 学校 ", "がっこう");
      const key2 = buildCanonicalVocabKey("学校", " がっこう ");
      expect(key1).toBe(key2);
    });
  });

  describe("Standard Presentation Formatting", () => {
    it("formats Japanese writing with reading cleanly", () => {
      expect(formatJapaneseWithReading("学校", "がっこう")).toBe("学校（がっこう）");
      // If word is already pure kana, do not redundantly append kana in parentheses
      expect(formatJapaneseWithReading("こんにちは", "こんにちは")).toBe("こんにちは");
      expect(formatJapaneseWithReading("コーヒー", "コーヒー")).toBe("コーヒー");
    });

    it("formats romaji with standard capitalization convention", () => {
      expect(formatDisplayRomaji("gakkou")).toBe("Gakkou");
      expect(formatDisplayRomaji("koohii")).toBe("Koohii");
      expect(formatDisplayRomaji("arigatou")).toBe("Arigatou");
    });

    it("verifies presentation standard: Romaji | Chữ viết tiếng Nhật | Nghĩa tiếng Việt", () => {
      const item = toCanonicalVocabularyItem({
        id: "v-gakkou-1",
        word: "学校",
        kana: "がっこう",
        romaji: "gakkou",
        meaning: "Trường học (Hán Việt: HỌC HIỆU)",
        partOfSpeech: "noun",
        jlptLevel: "N5",
      });

      // Strict standard presentation string
      const presentationLine = `${item.displayRomaji} | ${item.displayWrittenWithReading} | ${item.meaningVi}${item.hanVietNote ? ` (Hán tự: ${item.hanVietNote})` : ""}`;
      expect(presentationLine).toBe("Gakkou | 学校（がっこう） | Trường học (Hán tự: HỌC HIỆU)");
    });
  });

  describe("Canonical Entity Builder (toCanonicalVocabularyItem)", () => {
    it("constructs a complete canonical learning entity with all metadata", () => {
      const item = toCanonicalVocabularyItem({
        id: "v-gakkou-1",
        word: "学校",
        kana: "がっこう",
        romaji: "gakkou",
        meaning: "Trường học (Hán Việt: HỌC HIỆU)",
        partOfSpeech: "noun",
        jlptLevel: "N5",
        tags: "minna-1",
      });

      expect(item.id).toBe("v-gakkou-1");
      expect(item.canonicalKey).toBe("学校::がっこう");
      expect(item.writtenForm).toBe("学校");
      expect(item.kanaReading).toBe("がっこう");
      expect(item.displayRomaji).toBe("Gakkou");
      expect(item.displayWrittenWithReading).toBe("学校（がっこう）");
      expect(item.scriptType).toBe("KANJI");
      expect(item.scriptLabelVi).toBe("Kanji (Từ Hán Nhật)");
      expect(item.meaningVi).toBe("Trường học");
      expect(item.hanVietNote).toBe("HỌC HIỆU");
      expect(item.provenance.status).toBe("TEXTBOOK_VERIFIED");
      expect(item.provenanceLabelVi).toContain("Minna no Nihongo");
    });
  });
});
