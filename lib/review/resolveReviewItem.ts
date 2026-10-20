import {
  classifyJapaneseScript,
  extractHanVietFromMeaning,
  formatDisplayRomaji,
  formatJapaneseWithReading,
  normalizeJapaneseWord,
  parseKanjiMeaningAndHanViet,
  type JapaneseScriptType,
} from "@/lib/canonical-vocab";

export interface EnrichedReviewItem {
  id: string;
  contentType: string;
  contentId: string;
  title: string;
  subtitle: string;
  reading: string;
  /** Romaji bridge for the Japanese text. */
  romaji: string;
  /** Sentence-cased Romaji for primary column display */
  displayRomaji?: string;
  /** Japanese writing with reading when Kanji is present (e.g. 学校（がっこう）) */
  japaneseWithReading?: string;
  /** Primary script classification for VOCAB / KANJI / KANA */
  scriptType?: JapaneseScriptType;
  /** Separated Sino-Vietnamese (Hán Việt) note */
  hanVietNote?: string | null;
  extra: string;
  /** Actual JLPT level of the underlying content, e.g. "N3". */
  level: string;
  interval: number;
  repetitions: number;
  ease: number;
}

// Minimal types matching Prisma models to avoid importing heavy generic Prisma types
export type RawReviewItem = {
  id: string;
  contentType: string;
  contentId: string;
  interval: number;
  repetitions: number;
  ease: number;
};

export type KanaRowRecord = {
  id?: string;
  character: string;
  script: string;
  romaji: string;
  ipa: string | null;
};

export type ContentMaps = {
  kanaMap: Map<string, KanaRowRecord>;
  vocabMap: Map<string, { word: string; kana: string; romaji: string; meaning: string; partOfSpeech: string; jlptLevel: string }>;
  kanjiMap: Map<string, { character: string; meaning: string; jlptLevel: string; readings: { reading: string }[] }>;
  grammarMap: Map<string, { title: string; meaning: string; structure: string; level: string }>;
  exerciseMap: Map<string, { question: string; correctAnswer: string; prompt: string | null; level: string }>;
};

const VALID_KANA_SCRIPTS = new Set(["HIRAGANA", "KATAKANA"]);
const CUID_PATTERN = /^c[a-z0-9]{15,}$/i;

export interface KanaLookupPlan {
  characters: string[];
  scripts: ("HIRAGANA" | "KATAKANA")[];
  recordIds: string[];
}

/**
 * Strips legacy game prefixes (e.g. "db_vocab_", "db_kana_", "db_kanji_", "db_grammar_")
 * and trims whitespace. Returns null for null/undefined/empty or static curated fallback IDs ("cur_*").
 */
export function normalizeReviewContentId(rawId: unknown): string | null {
  if (typeof rawId !== "string") return null;
  const trimmed = rawId.trim();
  if (!trimmed || trimmed.startsWith("cur_")) return null;
  return trimmed.replace(/^db_(?:kana|vocab|kanji|grammar|exercise)_/i, "");
}

/**
 * Deduplicates and sanitizes non-Kana content IDs (VOCAB, KANJI, GRAMMAR, EXERCISE)
 * before passing them to Prisma `where: { id: { in: ... } }`.
 */
export function extractValidRecordIds(rawIds: readonly unknown[]): string[] {
  const unique = new Set<string>();
  for (const raw of rawIds) {
    const normalized = normalizeReviewContentId(raw);
    if (normalized) {
      unique.add(normalized);
    }
  }
  return Array.from(unique);
}

/**
 * Parses raw Kana contentIds from ReviewItem into deduplicated, non-null sets of:
 * - characters (e.g. "あ", "カ", "きゃ")
 * - scripts ("HIRAGANA" | "KATAKANA" — never null)
 * - recordIds (CUIDs when stored by record ID or "db_kana_<id>")
 */
export function buildKanaLookupPlan(rawKanaIds: readonly unknown[]): KanaLookupPlan {
  const characters = new Set<string>();
  const scripts = new Set<"HIRAGANA" | "KATAKANA">();
  const recordIds = new Set<string>();

  for (const raw of rawKanaIds) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("cur_")) continue;

    if (trimmed.startsWith("db_kana_")) {
      const cuid = trimmed.slice("db_kana_".length).trim();
      if (cuid) recordIds.add(cuid);
      continue;
    }

    if (trimmed.includes(":")) {
      const [rawScript, ...rest] = trimmed.split(":");
      const scriptUpper = rawScript.trim().toUpperCase();
      const charPart = rest.join(":").trim();
      if (VALID_KANA_SCRIPTS.has(scriptUpper)) {
        scripts.add(scriptUpper as "HIRAGANA" | "KATAKANA");
      }
      if (charPart) {
        if (CUID_PATTERN.test(charPart)) {
          recordIds.add(charPart);
        } else {
          characters.add(charPart);
        }
      }
      continue;
    }

    if (CUID_PATTERN.test(trimmed)) {
      recordIds.add(trimmed);
    } else {
      characters.add(trimmed);
    }
  }

  return {
    characters: Array.from(characters),
    scripts: Array.from(scripts),
    recordIds: Array.from(recordIds),
  };
}

/**
 * Builds a safe Prisma `where` clause for `prisma.kana.findMany` that:
 * - Never emits `script: { in: [null] }`
 * - Never emits duplicate values in `character: { in: [...] }` or `id: { in: [...] }`
 * - Returns `null` when there is nothing valid to query
 */
export function buildKanaPrismaWhere(rawKanaIds: readonly unknown[]): {
  OR: Array<
    | { character: { in: string[] }; script?: { in: ("HIRAGANA" | "KATAKANA")[] } }
    | { id: { in: string[] } }
  >;
} | null {
  const plan = buildKanaLookupPlan(rawKanaIds);
  const orClauses: Array<
    | { character: { in: string[] }; script?: { in: ("HIRAGANA" | "KATAKANA")[] } }
    | { id: { in: string[] } }
  > = [];

  if (plan.characters.length > 0) {
    orClauses.push({ character: { in: plan.characters } });
  }
  if (plan.recordIds.length > 0) {
    orClauses.push({ id: { in: plan.recordIds } });
  }

  if (orClauses.length === 0) {
    return null;
  }

  return { OR: orClauses };
}

/**
 * Indexes Kana rows by composite key (`SCRIPT:CHARACTER`), bare `character`,
 * database `id`, and legacy `db_kana_${id}` so all historical ReviewItem formats resolve.
 */
export function buildKanaMap(rows: readonly KanaRowRecord[]): Map<string, KanaRowRecord> {
  const map = new Map<string, KanaRowRecord>();
  for (const row of rows) {
    if (!row || !row.character || !row.script) continue;
    const scriptUpper = row.script.toUpperCase();
    map.set(`${scriptUpper}:${row.character}`, row);
    // Only set bare character if not already set, or let HIRAGANA take precedence if ambiguous
    if (!map.has(row.character) || scriptUpper === "HIRAGANA") {
      map.set(row.character, row);
    }
    if (row.id) {
      map.set(row.id, row);
      map.set(`db_kana_${row.id}`, row);
    }
  }
  return map;
}

/**
 * Resolves raw ReviewItems into EnrichedReviewItems.
 * Filters out any orphan items where the underlying content no longer exists,
 * and deduplicates resolved items that point to the same canonical content.
 */
export function resolveReviewItems(items: RawReviewItem[], maps: ContentMaps): EnrichedReviewItem[] {
  const { kanaMap, vocabMap, kanjiMap, grammarMap, exerciseMap } = maps;

  const enriched: EnrichedReviewItem[] = [];
  const seenReviewIds = new Set<string>();

  for (const item of items) {
    if (!item || !item.id || seenReviewIds.has(item.id)) continue;
    const rawContentId = typeof item.contentId === "string" ? item.contentId.trim() : "";
    if (!rawContentId) continue;
    const normalizedId = normalizeReviewContentId(rawContentId);

    let title = "";
    let subtitle = item.contentType;
    let reading = "";
    let romaji = "";
    let displayRomaji: string | undefined = undefined;
    let japaneseWithReading: string | undefined = undefined;
    let scriptType: JapaneseScriptType | undefined = undefined;
    let hanVietNote: string | null = null;
    let extra = "";
    let level = "";
    let isValid = false;

    if (item.contentType === "KANA") {
      const kanaDetail =
        kanaMap.get(rawContentId) ??
        (normalizedId ? kanaMap.get(normalizedId) : undefined);
      if (kanaDetail) {
        title = kanaDetail.character;
        subtitle = kanaDetail.script;
        reading = kanaDetail.romaji;
        romaji = kanaDetail.romaji;
        displayRomaji = formatDisplayRomaji(kanaDetail.romaji);
        scriptType = (kanaDetail.script.toUpperCase() as JapaneseScriptType) || "HIRAGANA";
        extra = kanaDetail.ipa ? `/${kanaDetail.ipa}/` : "";
        isValid = true;
      }
    } else if (item.contentType === "VOCAB") {
      const vocabDetail =
        vocabMap.get(rawContentId) ??
        (normalizedId ? vocabMap.get(normalizedId) : undefined);
      if (vocabDetail) {
        const { japanese } = normalizeJapaneseWord(vocabDetail.word);
        const { meaningVi, hanVietNote: extractedHanViet } = extractHanVietFromMeaning(vocabDetail.meaning);
        const scriptInfo = classifyJapaneseScript(japanese);
        title = japanese;
        reading = vocabDetail.kana;
        romaji = vocabDetail.romaji;
        displayRomaji = formatDisplayRomaji(vocabDetail.romaji);
        japaneseWithReading = formatJapaneseWithReading(japanese, vocabDetail.kana);
        scriptType = scriptInfo.primaryScript;
        hanVietNote = extractedHanViet;
        subtitle = `Từ Vựng · ${vocabDetail.partOfSpeech}`;
        extra = meaningVi;
        level = vocabDetail.jlptLevel;
        isValid = true;
      }
    } else if (item.contentType === "KANJI") {
      const kanjiDetail =
        kanjiMap.get(rawContentId) ??
        (normalizedId ? kanjiMap.get(normalizedId) : undefined);
      if (kanjiDetail) {
        title = kanjiDetail.character;
        subtitle = "Hán Tự";
        reading = kanjiDetail.readings.map((r) => r.reading).join(" · ");
        romaji = kanjiDetail.readings[0]?.reading ?? "";
        displayRomaji = formatDisplayRomaji(romaji);
        scriptType = "KANJI";
        const parsed = parseKanjiMeaningAndHanViet(kanjiDetail.meaning);
        extra = parsed.meaningVi;
        hanVietNote = parsed.hanViet;
        level = kanjiDetail.jlptLevel;
        isValid = true;
      }
    } else if (item.contentType === "GRAMMAR") {
      const grammarDetail =
        grammarMap.get(rawContentId) ??
        (normalizedId ? grammarMap.get(normalizedId) : undefined);
      if (grammarDetail) {
        title = grammarDetail.title;
        subtitle = "Ngữ Pháp";
        reading = grammarDetail.structure;
        extra = grammarDetail.meaning;
        level = grammarDetail.level;
        isValid = true;
      }
    } else if (item.contentType === "EXERCISE") {
      const exerciseDetail =
        exerciseMap.get(rawContentId) ??
        (normalizedId ? exerciseMap.get(normalizedId) : undefined);
      if (exerciseDetail) {
        title = exerciseDetail.question;
        subtitle = "Câu Hỏi Luyện Tập";
        reading = "";
        extra = `Đáp án: ${exerciseDetail.correctAnswer}`;
        level = exerciseDetail.level;
        isValid = true;
      }
    }

    if (isValid) {
      seenReviewIds.add(item.id);
      enriched.push({
        id: item.id,
        contentType: item.contentType,
        contentId: item.contentId,
        title,
        subtitle,
        reading,
        romaji,
        displayRomaji,
        japaneseWithReading,
        scriptType,
        hanVietNote,
        extra,
        level,
        interval: item.interval,
        repetitions: item.repetitions,
        ease: item.ease,
      });
    }
  }

  return enriched;
}

/**
 * Returns a clean question/prompt for the front face of a review card without
 * leaking the reading, romaji, or Vietnamese meaning embedded in the raw title.
 */
export function getReviewFrontPrompt(
  item: Pick<EnrichedReviewItem, "contentType" | "title" | "extra">
): string {
  const raw = (item.title || "").trim();
  if (!raw) return "";

  if (item.contentType === "GRAMMAR") {
    let cleaned = raw;
    // Strip trailing em-dash / en-dash / spaced hyphen explanations: "〜は (wa) — Trợ từ chủ đề" -> "〜は (wa)"
    cleaned = cleaned.replace(/\s+[—–-]\s+.*$/, "").trim();

    // If prefixed with Vietnamese label before ": " and followed by Japanese pattern, keep the Japanese pattern
    const colonIdx = cleaned.indexOf(":");
    if (colonIdx !== -1) {
      const before = cleaned.slice(0, colonIdx).trim();
      const after = cleaned.slice(colonIdx + 1).trim();
      const hasJapaneseAfter = /[\u3000-\u30ff\u4e00-\u9faf〜～]/.test(after);
      const hasLatinBefore = /[a-zA-ZÀ-ỹ]/.test(before);
      if (hasJapaneseAfter && hasLatinBefore) {
        cleaned = after;
      }
    }

    // Strip parenthetical hints containing Latin/Vietnamese text: "(へ - Phương hướng)" or "(wa)"
    cleaned = cleaned.replace(/\s*[（(][^）)]*[a-zA-ZÀ-ỹ][^）)]*[）)]/g, "").trim();

    return cleaned || raw;
  }

  if (item.contentType === "EXERCISE") {
    const answer = (item.extra || "").replace(/^Đáp án:\s*/i, "").trim();
    if (answer && answer.length <= 20) {
      const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const spoilerRegex = new RegExp(`\\s*[（(]\\s*${escaped}\\s*[）)]`, "gi");
      const cleaned = raw.replace(spoilerRegex, "").trim();
      if (cleaned) return cleaned;
    }
  }

  return raw;
}
