/**
 * Canonical Japanese Vocabulary Model & Script Classification
 *
 * Enforces the core principles across Nihon Quest:
 * 1. One lexical item = one canonical learning entity (never split into separate
 *    records for Kanji, Hiragana, Katakana, and Romaji; never merge distinct homonyms).
 * 2. Consistent presentation order:
 *    Pronunciation / Romaji | Japanese writing | Vietnamese meaning
 * 3. Accurate Japanese script classification (HIRAGANA, KATAKANA, KANJI, MIXED),
 *    keeping ROMAJI as a pronunciation aid and separating Vietnamese Hán tự / Hán Việt
 *    notes from Japanese script classification.
 */

export type JapaneseScriptType = "HIRAGANA" | "KATAKANA" | "KANJI" | "MIXED";
export type ScriptClassification = JapaneseScriptType;

export type ScriptAttribute = JapaneseScriptType | "ROMAJI";

export type ContentProvenanceType =
  | "TEXTBOOK_VERIFIED"
  | "SUPPLEMENTARY_VERIFIED"
  | "APP_AUTHORED"
  | "AI_GENERATED"
  | "UNVERIFIED";

export interface ProvenanceMetadata {
  status: ContentProvenanceType;
  labelVi: string;
  shortLabelVi: string;
  sourceTitle: string;
  sourceDetail?: string;
}

export interface CanonicalVocabularyItem {
  id: string;
  /** Deterministic key preserving homonyms with distinct readings: `${japanese}::${kana}` */
  canonicalKey: string;
  /** Normalized Japanese written form (e.g. 学校, こんにちは, コーヒー, 食べる) */
  japanese: string;
  /** Alias for `japanese` (written form) */
  writtenForm: string;
  /** Kana reading (hiragana/katakana phonetic reading, e.g. がっこう, こんにちは, コーヒー, たべる) */
  kana: string;
  /** Alias for `kana` */
  kanaReading: string;
  /** Hiragana-normalized reading for pronunciation comparison */
  hiragana: string;
  /** Combined display string for tables/cards when furigana is inline: e.g. 学校（がっこう） or こんにちは */
  japaneseWithReading: string;
  /** Alias for `japaneseWithReading` */
  displayWrittenWithReading: string;
  /** Lowercase Hepburn romaji (e.g. gakkou, konnichiwa, koohii, taberu) */
  romaji: string;
  /** Sentence-cased Romaji for primary column display (e.g. Gakkou, Konnichiwa, Koohii, Taberu) */
  displayRomaji: string;
  /** Clean Vietnamese meaning with inline `(Hán Việt: ...)` stripped into `hanVietNote` */
  meaningVi: string;
  /** Separated Sino-Vietnamese (Hán tự / Hán Việt) note when applicable */
  hanVietNote: string | null;
  /** Primary script classification of the Japanese written form */
  primaryScript: JapaneseScriptType;
  /** Alias for `primaryScript` */
  scriptType: JapaneseScriptType;
  /** Human-readable Vietnamese label for the primary script */
  primaryScriptLabelVi: string;
  /** Alias for `primaryScriptLabelVi` */
  scriptLabelVi: string;
  /** Multi-script attributes applicable to this entry (includes ROMAJI as pronunciation aid) */
  scriptAttributes: ScriptAttribute[];
  /** Normalized part of speech */
  partOfSpeech: string;
  /** Vietnamese label for part of speech */
  partOfSpeechVi: string;
  /** Optional grammatical or particle usage note (e.g. "Đi với trợ từ が: 〜が壊れる") */
  usageNote: string | null;
  /** JLPT level guidance (N5, N4, N3) */
  jlptLevel: string;
  /** Source provenance metadata */
  provenance: ProvenanceMetadata;
  /** Short Vietnamese provenance label */
  provenanceLabelVi: string;
}

const HIRAGANA_CHAR_RE = /[\u3041-\u3096\u309D-\u309F]/;
const KATAKANA_CHAR_RE = /[\u30A1-\u30FA\u30FD-\u30FF]/;
const KANJI_CHAR_RE = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3005]/;
const IGNORED_PUNCT_RE = /[\s\u3000〜~・ー\-/()（）「」『』、。！？!?0-9０-９]/;

/**
 * Converts Katakana characters in a string to Hiragana for phonetic comparison.
 */
export function katakanaToHiragana(input: string): string {
  return Array.from(input)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) {
        return String.fromCharCode(code - 0x60);
      }
      return ch;
    })
    .join("");
}

/**
 * Classifies the written Japanese form into HIRAGANA, KATAKANA, KANJI, or MIXED.
 *
 * Rules:
 * - Only Hiragana characters (ignoring punctuation) -> HIRAGANA
 * - Only Katakana characters (including prolonged sound mark ー) -> KATAKANA
 * - Only Kanji characters (including 々 repeater) -> KANJI
 * - Combination of Kanji + Hiragana/Katakana (e.g. 食べる, 消しゴム, 電子レンジ) or Hiragana + Katakana -> MIXED
 */
export function classifyJapaneseScript(writtenForm: string): {
  primaryScript: JapaneseScriptType;
  scriptAttributes: ScriptAttribute[];
} {
  const cleaned = writtenForm.trim();
  let hasHiragana = false;
  let hasKatakana = false;
  let hasKanji = false;

  for (const ch of cleaned) {
    if (ch === "ー") {
      // Prolonged sound mark is standard in Katakana loanwords (e.g. コーヒー)
      continue;
    }
    if (IGNORED_PUNCT_RE.test(ch)) {
      continue;
    }
    if (KANJI_CHAR_RE.test(ch)) {
      hasKanji = true;
    } else if (HIRAGANA_CHAR_RE.test(ch)) {
      hasHiragana = true;
    } else if (KATAKANA_CHAR_RE.test(ch)) {
      hasKatakana = true;
    }
  }

  // Handle katakana word with ー
  if (!hasKanji && !hasHiragana && hasKatakana) {
    return {
      primaryScript: "KATAKANA",
      scriptAttributes: ["KATAKANA", "ROMAJI"],
    };
  }

  if (!hasKanji && hasHiragana && !hasKatakana) {
    return {
      primaryScript: "HIRAGANA",
      scriptAttributes: ["HIRAGANA", "ROMAJI"],
    };
  }

  if (hasKanji && !hasHiragana && !hasKatakana) {
    return {
      primaryScript: "KANJI",
      scriptAttributes: ["KANJI", "HIRAGANA", "ROMAJI"],
    };
  }

  if (hasKanji || (hasHiragana && hasKatakana)) {
    const attrs: ScriptAttribute[] = ["MIXED"];
    if (hasKanji) attrs.push("KANJI");
    if (hasHiragana) attrs.push("HIRAGANA");
    if (hasKatakana) attrs.push("KATAKANA");
    attrs.push("ROMAJI");
    return {
      primaryScript: "MIXED",
      scriptAttributes: attrs,
    };
  }

  return {
    primaryScript: "HIRAGANA",
    scriptAttributes: ["HIRAGANA", "ROMAJI"],
  };
}

export const SCRIPT_LABELS_VI: Record<JapaneseScriptType, string> = {
  HIRAGANA: "Hiragana (Thuần Nhật)",
  KATAKANA: "Katakana (Từ ngoại lai)",
  KANJI: "Kanji (Từ Hán Nhật)",
  MIXED: "Kết hợp (Kanji + Kana)",
};

export const SCRIPT_SHORT_LABELS_VI: Record<JapaneseScriptType, string> = {
  HIRAGANA: "Hiragana",
  KATAKANA: "Katakana",
  KANJI: "Kanji",
  MIXED: "Kết hợp",
};

/**
 * Separates inline Vietnamese Hán tự / Hán Việt notes from a vocabulary meaning string.
 * Example:
 *   "Trường học (Hán Việt: Học hiệu)" -> { meaningVi: "Trường học", hanVietNote: "Học hiệu" }
 *   "Hỏng (Hán Việt: Hoại)" -> { meaningVi: "Hỏng", hanVietNote: "Hoại" }
 */
export function extractHanVietFromMeaning(rawMeaning: string): {
  meaningVi: string;
  hanVietNote: string | null;
} {
  if (!rawMeaning) {
    return { meaningVi: "", hanVietNote: null };
  }

  const hanVietRegex = /\s*\(\s*Hán\s*Việt\s*:\s*([^)]+)\)\s*/i;
  const match = rawMeaning.match(hanVietRegex);
  if (!match) {
    return {
      meaningVi: rawMeaning.trim(),
      hanVietNote: null,
    };
  }

  const hanVietNote = match[1].trim();
  const meaningVi = rawMeaning.replace(hanVietRegex, " ").replace(/\s{2,}/g, " ").trim();

  return {
    meaningVi: meaningVi || rawMeaning.trim(),
    hanVietNote: hanVietNote || null,
  };
}

/**
 * Separates Sino-Vietnamese (Hán Việt) uppercase headers from Kanji meanings.
 * Examples:
 *   "THẾ — Thế gian, xã hội" -> { hanViet: "THẾ", meaningVi: "Thế gian, xã hội" }
 *   "THỪA Lên, đăng tải" -> { hanViet: "THỪA", meaningVi: "Lên, đăng tải" }
 *   "THẾThế gian, xã hội" -> { hanViet: "THẾ", meaningVi: "Thế gian, xã hội" }
 *   "Nhật, mặt trời (Nhật)" -> { hanViet: "NHẬT", meaningVi: "Nhật, mặt trời" }
 */
export function parseKanjiMeaningAndHanViet(rawMeaning: string): {
  hanViet: string | null;
  meaningVi: string;
} {
  const trimmed = (rawMeaning || "").trim();
  if (!trimmed) {
    return { hanViet: null, meaningVi: "" };
  }

  // Case 1: "HÁN VIỆT — Nghĩa tiếng Việt"
  const dashSplit = trimmed.split(/\s*[—–-]\s*/);
  if (dashSplit.length >= 2 && dashSplit[0].length <= 24 && dashSplit[0] === dashSplit[0].toUpperCase()) {
    return {
      hanViet: dashSplit[0].trim(),
      meaningVi: dashSplit.slice(1).join(" — ").trim(),
    };
  }

  // Case 2: "Nghĩa tiếng Việt (Hán Việt)" at end of N5/N4 seed Kanji
  const parenMatch = trimmed.match(/^(.+?)\s*\(([^()]{1,20})\)$/);
  if (parenMatch) {
    const baseMeaning = parenMatch[1].trim();
    const insideParen = parenMatch[2].trim();
    // Avoid stripping grammatical notes like "(lịch sự)" or "(tự động từ)"
    if (
      !/tự động|tha động|lịch sự|dùng khi|số đếm|chưa chế biến/i.test(insideParen) &&
      insideParen[0] === insideParen[0].toUpperCase()
    ) {
      return {
        hanViet: insideParen.toUpperCase(),
        meaningVi: baseMeaning,
      };
    }
  }

  // Case 3: Leading ALL-CAPS word(s) followed by Capitalized Vietnamese gloss: "THẾThế gian" or "THỪA Lên, đăng tải"
  const capsPrefixMatch = trimmed.match(/^([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s,]{1,18}?)\s*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ].*)$/);
  if (capsPrefixMatch) {
    const hanVietCandidate = capsPrefixMatch[1].trim();
    const restMeaning = capsPrefixMatch[2].trim();
    if (hanVietCandidate && restMeaning) {
      return {
        hanViet: hanVietCandidate,
        meaningVi: restMeaning,
      };
    }
  }

  // Case 4: Entire string is ALL-CAPS Hán Việt only (e.g. "TẢ", "ĐÔNG")
  if (trimmed === trimmed.toUpperCase() && trimmed.length <= 16) {
    return {
      hanViet: trimmed,
      meaningVi: trimmed,
    };
  }

  return {
    hanViet: null,
    meaningVi: trimmed,
  };
}

const PARTICLE_PREFIX_RE = /^(が|を|に|へ|で|と|から|まで)\s+(.+)$/;

/**
 * Strips leading particle prefixes (e.g. "が 壊れる" -> "壊れる") and normalizes wave dashes.
 */
export function normalizeJapaneseWord(rawWord: string): {
  japanese: string;
  particleNote: string | null;
} {
  let cleaned = (rawWord || "").trim();
  let particleNote: string | null = null;

  const particleMatch = cleaned.match(PARTICLE_PREFIX_RE);
  if (particleMatch) {
    const particle = particleMatch[1];
    cleaned = particleMatch[2].trim();
    particleNote = `Đi với trợ từ ${particle} (〜${particle}${cleaned})`;
  }

  // Normalize leading/trailing tilde to Japanese wave dash
  cleaned = cleaned.replace(/^~\s*/, "〜").replace(/\s*~$/, "〜");

  // Strip trailing "(な)" from na-adjective headwords while noting it
  if (/\s*\(な\)$/.test(cleaned) || /\s*（な）$/.test(cleaned)) {
    cleaned = cleaned.replace(/\s*[（(]な[)）]$/, "").trim();
    particleNote = particleNote
      ? `${particleNote} • Tính từ đuôi な (〜な)`
      : "Tính từ đuôi な (khi bổ nghĩa danh từ thêm な)";
  }

  return { japanese: cleaned, particleNote };
}

/**
 * Formats Romaji consistently for primary column display (e.g. "gakkou" -> "Gakkou").
 */
export function formatDisplayRomaji(rawRomaji: string): string {
  const cleaned = (rawRomaji || "")
    .trim()
    .replace(/^(ga|o|wo|ni)\s+/i, "")
    .replace(/^[-~〜]+/, "");
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Formats the Japanese writing column according to the canonical standard:
 * - If the word contains Kanji and its reading differs from the written form: `学校（がっこう）`
 * - If the word is pure Hiragana or Katakana: `こんにちは`, `コーヒー`
 */
export function formatJapaneseWithReading(japanese: string, kana: string): string {
  const j = (japanese || "").trim();
  const k = (kana || "").trim().replace(/^(が|を|に)\s+/, "");
  if (!j) return k;
  if (!k || j === k) return j;
  if (KANJI_CHAR_RE.test(j)) {
    return `${j}（${k}）`;
  }
  return j;
}

/**
 * Builds a deterministic canonical identity key for a lexical item.
 * Keeps one lexical item as one entity while preserving distinct homonyms
 * (e.g. 辛い::からい vs 辛い::つらい, 表::おもて vs 表::ひょう).
 */
export function buildCanonicalVocabKey(word: string, kana: string): string {
  const { japanese } = normalizeJapaneseWord(word);
  const normalizedKana = katakanaToHiragana(
    (kana || "").trim().replace(/^(が|を|に)\s+/, "").replace(/^~\s*/, "〜")
  );
  return `${japanese}::${normalizedKana}`;
}

export const POS_LABELS_VI: Record<string, string> = {
  noun: "Danh từ",
  verb: "Động từ",
  adjective: "Tính từ",
  adverb: "Trạng từ",
  particle: "Trợ từ",
  conjunction: "Liên từ",
  expression: "Cụm giao tiếp",
  counter: "Lượng từ",
};

/**
 * Infers source provenance metadata for a vocabulary, kanji, or grammar item.
 */
export function resolveVocabularyProvenance(input: {
  lessonId?: string | null;
  tags?: string | null;
  jlptLevel?: string | null;
}): ProvenanceMetadata {
  const tags = input.tags || "";
  const lessonId = input.lessonId || "";

  if (tags.includes("FPT-JPD") || lessonId.startsWith("n5-fpt-")) {
    return {
      status: "TEXTBOOK_VERIFIED",
      labelVi: "Giáo trình Dekiru Nihongo / FPT JPD113–126",
      shortLabelVi: "Dekiru / FPT",
      sourceTitle: "Dekiru Nihongo Shokyū (FPT University JPD113–126)",
    };
  }

  if (
    /^n5-lesson-([1-9]|1[0-9]|2[0-5])$/.test(lessonId) ||
    tags.includes("minna-1")
  ) {
    const lessonNum = lessonId.replace("n5-lesson-", "");
    return {
      status: "TEXTBOOK_VERIFIED",
      labelVi: `Giáo trình Minna no Nihongo I — Bài ${lessonNum}`,
      shortLabelVi: `Minna I • Bài ${lessonNum}`,
      sourceTitle: "Minna no Nihongo Shokyū I (Bản dịch & Honsatsu)",
      sourceDetail: `Bài ${lessonNum}`,
    };
  }

  if (/^n4-lesson-([1-9]|1[0-9]|2[0-5])$/.test(lessonId)) {
    const num = Number(lessonId.replace("n4-lesson-", "")) + 25;
    return {
      status: "TEXTBOOK_VERIFIED",
      labelVi: `Giáo trình Minna no Nihongo II — Bài ${num}`,
      shortLabelVi: `Minna II • Bài ${num}`,
      sourceTitle: "Minna no Nihongo Shokyū II (Honsatsu)",
      sourceDetail: `Bài ${num}`,
    };
  }

  if (
    tags.includes("unitcuments") ||
    tags.includes("Mimi-") ||
    tags.includes("TongHop-")
  ) {
    return {
      status: "SUPPLEMENTARY_VERIFIED",
      labelVi: "Tài liệu bổ trợ (Mimikara Oboeru / Tổng hợp JLPT)",
      shortLabelVi: "Tài liệu bổ trợ",
      sourceTitle: "Mimikara Oboeru & Tổng hợp Từ vựng JLPT N5–N3",
    };
  }

  if (lessonId.startsWith("n5-kana-")) {
    return {
      status: "APP_AUTHORED",
      labelVi: "Học phần Bảng chữ cái Gojūon chuẩn",
      shortLabelVi: "Chuẩn Gojūon",
      sourceTitle: "Nihon Quest Kana Foundations",
    };
  }

  if (input.jlptLevel === "N5" || input.jlptLevel === "N4") {
    return {
      status: "TEXTBOOK_VERIFIED",
      labelVi: `Giáo trình Sơ cấp (${input.jlptLevel} — Minna no Nihongo / Irodori)`,
      shortLabelVi: `Giáo trình ${input.jlptLevel}`,
      sourceTitle: `Minna no Nihongo Shokyū (${input.jlptLevel})`,
    };
  }

  return {
    status: "SUPPLEMENTARY_VERIFIED",
    labelVi: `Tài liệu luyện thi ${input.jlptLevel || "N3"} (Shinkanzen / Mimikara)`,
    shortLabelVi: `Bổ trợ ${input.jlptLevel || "N3"}`,
    sourceTitle: "Shinkanzen Master & Mimikara Oboeru N3",
  };
}

/**
 * Transforms a raw database Vocabulary record into a normalized CanonicalVocabularyItem.
 */
export function toCanonicalVocabularyItem(raw: {
  id: string;
  word: string;
  kana: string;
  romaji: string;
  meaning: string;
  partOfSpeech: string;
  jlptLevel: string;
  tags?: string | null;
  lessonId?: string | null;
}): CanonicalVocabularyItem {
  const { japanese, particleNote } = normalizeJapaneseWord(raw.word);
  const cleanedKana = (raw.kana || "")
    .trim()
    .replace(/^(が|を|に)\s+/, "")
    .replace(/^~\s*/, "〜");
  const hiragana = katakanaToHiragana(cleanedKana);
  const romaji = (raw.romaji || "")
    .trim()
    .replace(/^(ga|o|wo|ni)\s+/i, "");
  const displayRomaji = formatDisplayRomaji(romaji);
  const { meaningVi, hanVietNote } = extractHanVietFromMeaning(raw.meaning);
  const { primaryScript, scriptAttributes } = classifyJapaneseScript(japanese);
  const posKey = (raw.partOfSpeech || "noun").toLowerCase();
  const japaneseWithReading = formatJapaneseWithReading(japanese, cleanedKana);
  const primaryScriptLabelVi = SCRIPT_LABELS_VI[primaryScript];
  const provenance = resolveVocabularyProvenance({
    lessonId: raw.lessonId,
    tags: raw.tags,
    jlptLevel: raw.jlptLevel,
  });

  return {
    id: raw.id,
    canonicalKey: buildCanonicalVocabKey(japanese, cleanedKana),
    japanese,
    writtenForm: japanese,
    kana: cleanedKana,
    kanaReading: cleanedKana,
    hiragana,
    japaneseWithReading,
    displayWrittenWithReading: japaneseWithReading,
    romaji,
    displayRomaji,
    meaningVi,
    hanVietNote,
    primaryScript,
    scriptType: primaryScript,
    primaryScriptLabelVi,
    scriptLabelVi: primaryScriptLabelVi,
    scriptAttributes,
    partOfSpeech: posKey,
    partOfSpeechVi: POS_LABELS_VI[posKey] || raw.partOfSpeech || "Từ vựng",
    usageNote: particleNote,
    jlptLevel: raw.jlptLevel || "N5",
    provenance,
    provenanceLabelVi: provenance.labelVi,
  };
}
