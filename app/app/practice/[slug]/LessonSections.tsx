"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RubyWord } from "@/components/JapaneseTerm";
import { useSoundAndTheme } from "@/components/SoundAndThemeContext";
import {
  toCanonicalVocabularyItem,
  type ContentProvenanceType,
} from "@/lib/canonical-vocab";
import {
  IconBook,
  IconChat,
  IconChevronDown,
  IconCube,
  IconPlay,
  IconPlus,
  IconSpeaker,
} from "./LessonIcons";

// ─────────────────────────── Types (dữ liệu đã serialize từ page.tsx) ───────────────────────────
export interface VocabView {
  id: string;
  word: string;
  kana: string;
  romaji: string;
  meaning: string;
  partOfSpeech?: string;
  jlptLevel?: string;
  kanji?: string;
  tags?: string;
  imageUrl?: string;
}

export interface GrammarExampleView {
  japanese: string;
  romaji?: string;
  translation?: string;
}

export interface GrammarView {
  id: string;
  title: string;
  romaji?: string;
  meaning: string;
  usage?: string;
  commonMistakes?: string;
  structure: string;
  examples: GrammarExampleView[];
}

export interface DialogueLineView {
  id: string;
  side: "a" | "b";
  japanese: string;
  romaji?: string;
  translation?: string;
}

export interface LessonObjectiveNoteView {
  level: string;
  unitLabel: string;
  title: string;
  description: string;
  trackTitleVi?: string;
  chapterLabel?: string;
  provenanceStatus?: ContentProvenanceType;
  provenanceLabelVi?: string;
  sourceReference?: string;
  whyItMatters?: string;
  objectives: string[];
  registerComparison: {
    standard: string;
    casualOrKeigo: string;
    contextNote: string;
  };
  prerequisiteLesson?: {
    slug: string;
    title: string;
    completed: boolean;
  } | null;
}

const HAS_JAPANESE = /[ぁ-んァ-ン一-龯]/;

// ─────────────────────────── Shared pieces ───────────────────────────
export function SectionShell({
  id,
  icon,
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  id?: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-reveal
      className={`scroll-mt-24 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-sumi-900/80 sm:p-6 ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function SpeakButton({
  onClick,
  label = "Nghe phát âm",
  size = "md",
}: {
  onClick: () => void;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid shrink-0 place-items-center rounded-full bg-rose-50 text-red-600 transition-colors hover:bg-rose-100 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70 ${
        size === "sm" ? "h-11 w-11" : "h-12 w-12"
      }`}
    >
      <IconSpeaker width={size === "sm" ? 18 : 20} height={size === "sm" ? 18 : 20} />
    </button>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
      {children}
    </span>
  );
}

// ─────────────────────────── Thanh 4 bước + tiến độ ───────────────────────────
const STEPS = [
  { id: "lesson-vocab", label: "Từ vựng", short: "Từ" },
  { id: "lesson-grammar", label: "Ngữ pháp", short: "Ngữ" },
  { id: "lesson-dialogue", label: "Hội thoại", short: "Hội" },
  { id: "quick-practice", label: "Luyện tập", short: "Luy" },
];

export function LessonStepsBar() {
  const [active, setActive] = useState(0);
  const quizStarted = useRef(false);

  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.4;
      const isWide = window.matchMedia("(min-width: 1024px)").matches;
      let idx = 0;
      STEPS.forEach((step, i) => {
        if (i === 3 && isWide) return;
        const el = document.getElementById(step.id);
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      });
      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
      if (quizStarted.current || nearBottom) idx = 3;
      setActive(idx);
    };

    const onQuiz = () => {
      quizStarted.current = true;
      update();
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("nq:quiz-progress", onQuiz);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("nq:quiz-progress", onQuiz);
    };
  }, []);

  const percent = ((active + 1) / STEPS.length) * 100;

  return (
    <nav
      aria-label="Các phần của bài học"
      data-reveal
      className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-sumi-900/80 lg:flex-row lg:items-center lg:gap-8 lg:px-6"
    >
      <ol className="flex flex-1 items-center gap-2 sm:gap-3">
        {STEPS.map((step, i) => {
          const isActive = i === active;
          const isPast = i < active;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-1.5 last:flex-none sm:gap-3">
              <a
                href={`#${step.id}`}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Bước ${i + 1}: ${step.label}`}
                className="flex min-h-11 items-center gap-1.5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 sm:gap-2"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black transition-colors sm:h-10 sm:w-10 ${
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : isPast
                      ? "bg-rose-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                      : "bg-slate-100 text-slate-500 dark:bg-sumi-800 dark:text-slate-400"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-xs font-bold sm:text-sm ${
                    isActive ? "inline text-red-700 dark:text-red-300" : "hidden text-slate-500 dark:text-slate-400 sm:inline"
                  }`}
                >
                  <span className="sm:hidden">{step.short}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
              </a>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" aria-hidden />}
            </li>
          );
        })}
      </ol>

      <div className="lg:w-72">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Tiến độ bài học</span>
          <span className="font-black text-slate-800 dark:text-slate-100">
            {active + 1} / {STEPS.length} phần
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-rose-100 dark:bg-sumi-800">
          <div className="h-full rounded-full bg-red-600 transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────── 1. Từ vựng ───────────────────────────
const VOCAB_LIMIT = 8;

export function VocabSection({ words }: { words: VocabView[] }) {
  const { speak, speakAll } = useSoundAndTheme();
  const [expanded, setExpanded] = useState(false);
  const [showRomaji, setShowRomaji] = useState(true);

  const canonicalWords = useMemo(
    () =>
      words.map((w) => ({
        raw: w,
        canon: toCanonicalVocabularyItem({
          id: w.id,
          word: w.word,
          kana: w.kana,
          romaji: w.romaji,
          meaning: w.meaning,
          partOfSpeech: w.partOfSpeech || "noun",
          jlptLevel: w.jlptLevel || "N5",
          tags: w.tags || "",
        }),
      })),
    [words]
  );

  const visible = expanded ? canonicalWords : canonicalWords.slice(0, VOCAB_LIMIT);
  const remaining = canonicalWords.length - VOCAB_LIMIT;

  return (
    <SectionShell
      id="lesson-vocab"
      icon={<IconCube />}
      title="1. Từ vựng trọng tâm (Phát âm / Romaji | Chữ viết | Nghĩa)"
      subtitle="Trình bày nhất quán theo một đơn vị từ vựng chuẩn: Phát âm / Romaji → Chữ viết tiếng Nhật (kèm cách đọc Kana) → Nghĩa tiếng Việt."
      action={
        words.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={showRomaji}
              onClick={() => setShowRomaji((v) => !v)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                showRomaji
                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-sumi-900 dark:text-slate-300"
              }`}
            >
              <span>あ/A</span>
              <span>Romaji: {showRomaji ? "Bật" : "Tắt"}</span>
            </button>
            <button
              type="button"
              onClick={() => speakAll(canonicalWords.map((item) => item.canon.kanaReading || item.canon.writtenForm))}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-rose-100 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
            >
              <IconPlay width={14} height={14} />
              Nghe tất cả
            </button>
          </div>
        ) : null
      }
    >
      {words.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-sumi-800/60 dark:text-slate-400">
          Bài học này chưa có từ vựng riêng.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-sumi-900">
            <div className="hidden grid-cols-[minmax(130px,1.1fr)_minmax(160px,1.35fr)_minmax(170px,1.55fr)_52px] items-center gap-3 border-b border-slate-200/80 bg-slate-50/90 px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-sumi-950/80 dark:text-slate-400 sm:grid">
              <span>Phát âm / Romaji</span>
              <span>Chữ viết tiếng Nhật</span>
              <span>Nghĩa tiếng Việt</span>
              <span className="text-center">Nghe</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map(({ raw: w, canon }) => (
                <article
                  key={w.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 p-3.5 transition hover:bg-rose-50/30 dark:hover:bg-sumi-800/40 sm:grid-cols-[minmax(130px,1.1fr)_minmax(160px,1.35fr)_minmax(170px,1.55fr)_52px] sm:px-4"
                >
                  <div className="min-w-0 space-y-1.5 sm:contents">
                    {/* Cột 1: Phát âm / Romaji */}
                    <div className="min-w-0">
                      <span className="block break-words text-sm font-extrabold text-red-600 dark:text-red-400">
                        {showRomaji ? canon.displayRomaji : canon.kanaReading}
                      </span>
                      {showRomaji && canon.kanaReading && (
                        <span className="jp-text block break-words text-xs font-medium text-slate-500 dark:text-slate-400">
                          {canon.kanaReading}
                        </span>
                      )}
                    </div>

                    {/* Cột 2: Chữ viết tiếng Nhật */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="jp-text break-words text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                          {canon.displayWrittenWithReading}
                        </b>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-sumi-800 dark:text-slate-300">
                          {canon.scriptType}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {canon.partOfSpeechVi}
                        </span>
                      </div>
                    </div>

                    {/* Cột 3: Nghĩa tiếng Việt & Hán Việt tách biệt */}
                    <div className="min-w-0">
                      <span className="block break-words text-sm font-bold text-slate-800 dark:text-slate-100">
                        {canon.meaningVi}
                      </span>
                      {canon.hanVietNote && (
                        <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Hán Việt: {canon.hanVietNote}
                        </span>
                      )}
                      {canon.usageNote && (
                        <span className="mt-0.5 block text-[11px] text-amber-700 dark:text-amber-300">
                          {canon.usageNote}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end sm:justify-center">
                    <SpeakButton
                      onClick={() => speak(canon.kanaReading || canon.writtenForm)}
                      label={`Nghe từ ${canon.writtenForm}`}
                      size="sm"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>

          {remaining > 0 && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
            >
              {expanded ? (
                <>Thu gọn</>
              ) : (
                <>
                  <IconPlus width={16} height={16} />
                  Xem thêm từ vựng ({remaining} từ)
                </>
              )}
              <IconChevronDown width={16} height={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </>
      )}
    </SectionShell>
  );
}

// ─────────────────────────── 0. Mục tiêu bài học & Lưu ý sử dụng ───────────────────────────
export function LessonObjectivesSection({ info }: { info: LessonObjectiveNoteView }) {
  const prereqMissing = info.prerequisiteLesson && !info.prerequisiteLesson.completed;

  return (
    <div className="space-y-4">
      {prereqMissing && info.prerequisiteLesson && (
        <div
          role="region"
          aria-label="Kiến thức tiên quyết"
          className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm dark:border-amber-800/70 dark:bg-amber-950/40 sm:flex-row sm:items-center"
        >
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              ⚠️ Khuyến nghị học theo thứ tự tiên quyết
            </p>
            <p className="mt-1 text-sm font-medium text-amber-900 dark:text-amber-100">
              Bạn chưa hoàn thành bài trước đó:{" "}
              <b className="font-bold">「{info.prerequisiteLesson.title}」</b>. Hãy học theo trình tự để tránh hổng kiến thức, hoặc làm bài kiểm tra miễn học phần nếu bạn đã nắm vững.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={`/app/practice/${info.prerequisiteLesson.slug}`}
              className="inline-flex min-h-10 items-center rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
            >
              ← Học bài tiên quyết
            </a>
            <a
              href="/app/test"
              className="inline-flex min-h-10 items-center rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-sumi-900 dark:text-amber-200"
            >
              Kiểm tra miễn học phần
            </a>
          </div>
        </div>
      )}

      <section
        aria-label="Mục tiêu và lưu ý sử dụng"
        className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-sumi-900/85 md:grid-cols-2"
      >
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-sm font-black text-red-600 dark:bg-red-950/60 dark:text-red-300">
                🎯
              </span>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Mục tiêu & Nguồn giáo trình ({info.chapterLabel || `Unit ${info.unitLabel}`})
              </h2>
            </div>
            {info.provenanceLabelVi && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                ✓ {info.provenanceLabelVi}
              </span>
            )}
          </div>
          {info.sourceReference && (
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              📚 Nguồn tham chiếu: <span className="text-slate-700 dark:text-slate-200">{info.sourceReference}</span>
            </p>
          )}
          {info.whyItMatters && (
            <p className="rounded-xl bg-rose-50/70 px-3 py-2 text-xs font-medium text-slate-700 dark:bg-sumi-800/70 dark:text-slate-200">
              <b>Tại sao bài này quan trọng:</b> {info.whyItMatters}
            </p>
          )}
          <ul className="space-y-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
            {info.objectives.map((obj, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/25">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              💡 Lưu ý Ngữ vực: Chuẩn (標準語) vs. Thực tế
            </span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 shadow-sm dark:bg-sumi-900 dark:text-indigo-300">
              Định hướng JLPT {info.level}
            </span>
          </div>
          <div className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            <p>
              <b>Lịch sự / Chuẩn (丁寧語・標準語):</b>{" "}
              <span className="jp-text font-semibold text-slate-900 dark:text-white">{info.registerComparison.standard}</span>
            </p>
            <p>
              <b>Thân mật / Kính ngữ / Vùng miền:</b>{" "}
              <span className="jp-text font-semibold text-indigo-700 dark:text-indigo-300">{info.registerComparison.casualOrKeigo}</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              <b>Hoàn cảnh sử dụng:</b> {info.registerComparison.contextNote}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────── 2. Ngữ pháp ───────────────────────────
export function GrammarSection({ items }: { items: GrammarView[] }) {
  const { speak } = useSoundAndTheme();

  return (
    <SectionShell
      id="lesson-grammar"
      icon={<IconBook />}
      title="2. Ngữ pháp trọng tâm & Phân biệt cách dùng"
      subtitle="Các mẫu câu cốt lõi, công thức ghép câu và lưu ý tránh nhầm lẫn trong ngữ cảnh thực tế."
    >
      {items.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-sumi-800/60 dark:text-slate-400">
          Bài học này chưa có mẫu ngữ pháp riêng.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((g) => (
            <article
              key={g.id}
              className="grid gap-4 rounded-2xl bg-rose-50/60 p-4 dark:bg-sumi-800/50 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
            >
              <div className="min-w-0">
                <Chip>Mẫu câu & Giải thích</Chip>
                <div className="mt-2 flex items-start gap-3">
                  <h3 className="jp-text text-2xl font-black leading-tight text-red-700 dark:text-red-400">{g.title}</h3>
                  <SpeakButton onClick={() => speak(g.title)} label="Nghe mẫu câu" size="sm" />
                </div>
                {g.romaji && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{g.romaji}</p>}
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
                  <b>Ý nghĩa:</b> {g.meaning}
                </p>
                {g.usage && (
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                    <b>Cách dùng:</b> {g.usage}
                  </p>
                )}
                {g.commonMistakes && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                    <b>⚠️ Lưu ý sử dụng & Phân biệt:</b> {g.commonMistakes}
                  </div>
                )}
              </div>

              <div className="min-w-0 rounded-xl bg-white/80 p-4 dark:bg-sumi-900/60">
                <Chip>Công thức</Chip>
                <p className="jp-text mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">{g.structure}</p>
                {g.examples.length > 0 && (
                  <div className="mt-3 text-xs">
                    <p className="font-semibold text-slate-500 dark:text-slate-400">Ví dụ đúng ngữ cảnh:</p>
                    <ul className="mt-1.5 space-y-2">
                      {g.examples.map((ex, i) => (
                        <li key={i} className="flex gap-2 text-slate-700 dark:text-slate-200">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="jp-text block text-sm font-semibold">{ex.japanese}</span>
                            {ex.romaji && (
                              <span className="block text-[11px] italic text-slate-400 dark:text-slate-500">{ex.romaji}</span>
                            )}
                            {ex.translation && (
                              <span className="block text-slate-600 dark:text-slate-300">→ {ex.translation}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

// ─────────────────────────── 3. Hội thoại ───────────────────────────
export function DialogueSection({ lines }: { lines: DialogueLineView[] }) {
  const { speak } = useSoundAndTheme();

  return (
    <SectionShell
      id="lesson-dialogue"
      icon={<IconChat />}
      title="3. Hội thoại mẫu"
      subtitle="Xem và nghe cách kiến thức xuất hiện trong tình huống thực tế."
    >
      {lines.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-sumi-800/60 dark:text-slate-400">
          Bài học này chưa có hội thoại mẫu.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lines.map((line) => (
            <article
              key={line.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-sumi-900"
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl ${
                  line.side === "a" ? "bg-amber-100 dark:bg-amber-950/50" : "bg-rose-100 dark:bg-red-950/50"
                }`}
                aria-hidden
              >
                {line.side === "a" ? "🙋‍♂️" : "🙋‍♀️"}
              </span>
              {HAS_JAPANESE.test(line.japanese) && (
                <SpeakButton onClick={() => speak(line.japanese)} label="Nghe câu hội thoại" size="sm" />
              )}
              <div className="min-w-0 flex-1">
                <b className="jp-text block text-[15px] font-black leading-snug text-slate-900 dark:text-white">{line.japanese}</b>
                {line.romaji && <small className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{line.romaji}</small>}
                {line.translation && (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{line.translation}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
