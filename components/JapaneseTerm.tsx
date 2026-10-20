import React from "react";

const KANJI_RE = /[\u3400-\u9fff]/;
const KANA_RE = /[\u3040-\u30ff]/;

function toHiragana(ch: string): string {
  const code = ch.charCodeAt(0);
  // Katakana range 0x30A1 - 0x30F6 maps to Hiragana 0x3041 - 0x3096 (-0x60)
  return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : ch;
}

export interface SplitRubyPart {
  prefix: string;
  kanjiBase: string;
  reading: string | null;
  okurigana: string;
}

/**
 * Splits a Japanese word and its kana reading into prefix (kana), kanji base,
 * furigana reading for the kanji base, and trailing okurigana.
 * Example:
 * - ("学生", "がくせい") -> { prefix: "", kanjiBase: "学生", reading: "がくせい", okurigana: "" }
 * - ("食べる", "たべる") -> { prefix: "", kanjiBase: "食", reading: "た", okurigana: "べる" }
 * - ("お水", "おみず")   -> { prefix: "お", kanjiBase: "水", reading: "みず", okurigana: "" }
 * - ("ペンキ塗り", "ぺんきぬり") -> { prefix: "ペンキ", kanjiBase: "塗", reading: "ぬ", okurigana: "り" }
 */
export function splitJapaneseRuby(word: string, kana?: string | null): SplitRubyPart {
  const cleanWord = (word || "").trim();
  const cleanKana = (kana || "").trim();

  if (!cleanWord || !cleanKana || cleanWord === cleanKana || !KANJI_RE.test(cleanWord)) {
    return { prefix: "", kanjiBase: cleanWord, reading: null, okurigana: "" };
  }

  let start = 0;
  while (
    start < cleanWord.length &&
    start < cleanKana.length &&
    KANA_RE.test(cleanWord[start]) &&
    toHiragana(cleanWord[start]) === toHiragana(cleanKana[start])
  ) {
    start++;
  }

  let endWord = cleanWord.length;
  let endKana = cleanKana.length;
  while (
    endWord > start &&
    endKana > start &&
    KANA_RE.test(cleanWord[endWord - 1]) &&
    toHiragana(cleanWord[endWord - 1]) === toHiragana(cleanKana[endKana - 1])
  ) {
    endWord--;
    endKana--;
  }

  const prefix = cleanWord.slice(0, start);
  const kanjiBase = cleanWord.slice(start, endWord);
  const okurigana = cleanWord.slice(endWord);
  const reading = cleanKana.slice(start, endKana);

  if (!kanjiBase || !reading) {
    return { prefix: "", kanjiBase: cleanWord, reading: cleanKana, okurigana: "" };
  }

  return { prefix, kanjiBase, reading, okurigana };
}

/**
 * Semantic <ruby> component that attaches furigana (<rt>) to Kanji compounds
 * while preserving leading/trailing okurigana cleanly.
 */
export function RubyWord({
  word,
  kana,
  showFurigana = true,
  className = "",
  rtClassName = "text-[0.55em] font-semibold text-red-600 dark:text-red-400 select-none",
}: {
  word: string;
  kana?: string | null;
  showFurigana?: boolean;
  className?: string;
  rtClassName?: string;
}) {
  if (!showFurigana || !kana || word === kana) {
    return <span className={`jp-text ${className}`}>{word}</span>;
  }

  const { prefix, kanjiBase, reading, okurigana } = splitJapaneseRuby(word, kana);
  if (!reading) {
    return <span className={`jp-text ${className}`}>{word}</span>;
  }

  return (
    <span className={`jp-text ${className}`}>
      {prefix}
      <ruby className="ruby-align-center">
        {kanjiBase}
        <rp>(</rp>
        <rt className={rtClassName}>{reading}</rt>
        <rp>)</rp>
      </ruby>
      {okurigana}
    </span>
  );
}

