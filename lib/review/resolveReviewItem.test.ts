import { describe, expect, it } from "vitest";
import {
  buildKanaLookupPlan,
  buildKanaMap,
  buildKanaPrismaWhere,
  extractValidRecordIds,
  normalizeReviewContentId,
  resolveReviewItems,
  type ContentMaps,
  type RawReviewItem,
} from "./resolveReviewItem";

describe("resolveReviewItem & Kana Prisma Query Sanitization", () => {
  it("normalizes legacy game prefixes and rejects null/empty/curated fallback IDs", () => {
    expect(normalizeReviewContentId("db_kana_cmv2rm6em000aiqriy12mgyd0")).toBe("cmv2rm6em000aiqriy12mgyd0");
    expect(normalizeReviewContentId("db_vocab_cmv2rm6em000aiqriy12mgyd1")).toBe("cmv2rm6em000aiqriy12mgyd1");
    expect(normalizeReviewContentId("db_kanji_cmv2rm6em000aiqriy12mgyd2")).toBe("cmv2rm6em000aiqriy12mgyd2");
    expect(normalizeReviewContentId("db_grammar_cmv2rm6em000aiqriy12mgyd3")).toBe("cmv2rm6em000aiqriy12mgyd3");
    expect(normalizeReviewContentId("HIRAGANA:あ")).toBe("HIRAGANA:あ");
    expect(normalizeReviewContentId("cur_kana_1")).toBeNull();
    expect(normalizeReviewContentId("cur_n5_2")).toBeNull();
    expect(normalizeReviewContentId("")).toBeNull();
    expect(normalizeReviewContentId("   ")).toBeNull();
    expect(normalizeReviewContentId(null)).toBeNull();
    expect(normalizeReviewContentId(undefined)).toBeNull();
  });

  it("deduplicates and sanitizes non-Kana record IDs", () => {
    const ids = extractValidRecordIds([
      "v1",
      "db_vocab_v1",
      "v2",
      "  v2  ",
      null,
      undefined,
      "",
      "cur_n5_1",
    ]);
    expect(ids).toEqual(["v1", "v2"]);
  });

  it("builds Kana lookup plan without null scripts or duplicate characters", () => {
    const plan = buildKanaLookupPlan([
      "HIRAGANA:あ",
      "あ",
      "HIRAGANA:あ",
      "KATAKANA:ア",
      "db_kana_cmv2rm6em000aiqriy12mgyd0",
      "cmv2rm6em000aiqriy12mgyd0",
      "INVALID_SCRIPT:き",
      null,
      undefined,
      "",
      "cur_kana_1",
    ]);

    expect(plan.characters).toEqual(["あ", "ア", "き"]);
    expect(plan.scripts).toEqual(["HIRAGANA", "KATAKANA"]);
    expect(plan.scripts).not.toContain(null);
    expect(plan.recordIds).toEqual(["cmv2rm6em000aiqriy12mgyd0"]);
  });

  it("builds a Prisma where clause that never contains script: { in: [null] } or duplicate characters", () => {
    // Regression test for PrismaClientValidationError at app/app/review/page.tsx
    const whereBareAndComposite = buildKanaPrismaWhere([
      "あ",
      "HIRAGANA:あ",
      "db_kana_cmv2rm6em000aiqriy12mgyd0",
      null,
      undefined,
    ]);

    expect(whereBareAndComposite).toEqual({
      OR: [
        { character: { in: ["あ"] } },
        { id: { in: ["cmv2rm6em000aiqriy12mgyd0"] } },
      ],
    });
    expect(JSON.stringify(whereBareAndComposite)).not.toContain("null");
  });

  it("returns null from buildKanaPrismaWhere when list is empty or contains only invalid/curated IDs", () => {
    expect(buildKanaPrismaWhere([])).toBeNull();
    expect(buildKanaPrismaWhere([null, undefined, "", "   ", "cur_kana_1"])).toBeNull();
  });

  it("resolves valid, bare, composite, and legacy db_kana_ / db_vocab_ items while dropping orphans and duplicates", () => {
    const kanaMap = buildKanaMap([
      {
        id: "cmv2rm6em000aiqriy12mgyd0",
        character: "あ",
        script: "HIRAGANA",
        romaji: "a",
        ipa: "a",
      },
      {
        id: "cmv2rm6em000aiqriy12mgyd9",
        character: "ア",
        script: "KATAKANA",
        romaji: "a",
        ipa: "a",
      },
    ]);

    const maps: ContentMaps = {
      kanaMap,
      vocabMap: new Map([
        [
          "vocab_1",
          {
            word: "猫",
            kana: "ねこ",
            romaji: "neko",
            meaning: "Con mèo",
            partOfSpeech: "noun",
            jlptLevel: "N5",
          },
        ],
      ]),
      kanjiMap: new Map([
        [
          "kanji_1",
          {
            character: "日",
            meaning: "Mặt trời, ngày",
            jlptLevel: "N5",
            readings: [{ reading: "にち" }, { reading: "ひ" }],
          },
        ],
      ]),
      grammarMap: new Map([
        [
          "gram_1",
          {
            title: "〜てもいいです",
            meaning: "Được phép làm...",
            structure: "V-て + もいいです",
            level: "N5",
          },
        ],
      ]),
      exerciseMap: new Map(),
    };

    const rawItems: RawReviewItem[] = [
      // Composite Kana
      { id: "r1", contentType: "KANA", contentId: "HIRAGANA:あ", interval: 1, repetitions: 1, ease: 2.5 },
      // Duplicate ReviewItem ID should be ignored
      { id: "r1", contentType: "KANA", contentId: "HIRAGANA:あ", interval: 1, repetitions: 1, ease: 2.5 },
      // Legacy Yokai Dash db_kana_<cuid>
      { id: "r2", contentType: "KANA", contentId: "db_kana_cmv2rm6em000aiqriy12mgyd9", interval: 2, repetitions: 1, ease: 2.3 },
      // Bare Kana character
      { id: "r3", contentType: "KANA", contentId: "あ", interval: 3, repetitions: 2, ease: 2.5 },
      // Legacy Yokai Dash db_vocab_<id>
      { id: "r4", contentType: "VOCAB", contentId: "db_vocab_vocab_1", interval: 4, repetitions: 2, ease: 2.5 },
      // Valid Kanji
      { id: "r5", contentType: "KANJI", contentId: "kanji_1", interval: 5, repetitions: 3, ease: 2.6 },
      // Valid Grammar
      { id: "r6", contentType: "GRAMMAR", contentId: "gram_1", interval: 2, repetitions: 1, ease: 2.4 },
      // Missing / orphan items
      { id: "r7", contentType: "VOCAB", contentId: "missing_vocab", interval: 1, repetitions: 0, ease: 2.5 },
      { id: "r8", contentType: "KANA", contentId: "cur_kana_1", interval: 1, repetitions: 0, ease: 2.5 },
      { id: "r9", contentType: "KANA", contentId: "", interval: 1, repetitions: 0, ease: 2.5 },
    ];

    const resolved = resolveReviewItems(rawItems, maps);
    expect(resolved).toHaveLength(6);

    expect(resolved[0]).toMatchObject({
      id: "r1",
      title: "あ",
      subtitle: "HIRAGANA",
      reading: "a",
      romaji: "a",
      extra: "/a/",
    });
    expect(resolved[1]).toMatchObject({
      id: "r2",
      title: "ア",
      subtitle: "KATAKANA",
      reading: "a",
    });
    expect(resolved[2]).toMatchObject({
      id: "r3",
      title: "あ",
      subtitle: "HIRAGANA",
    });
    expect(resolved[3]).toMatchObject({
      id: "r4",
      title: "猫",
      reading: "ねこ",
      romaji: "neko",
      extra: "Con mèo",
      level: "N5",
    });
    expect(resolved[4]).toMatchObject({
      id: "r5",
      title: "日",
      reading: "にち · ひ",
      level: "N5",
    });
    expect(resolved[5]).toMatchObject({
      id: "r6",
      title: "〜てもいいです",
      level: "N5",
    });
  });
});

