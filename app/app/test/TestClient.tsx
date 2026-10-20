"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSoundAndTheme } from "@/components/SoundAndThemeContext";
import { notifyProgressUpdated } from "@/components/UserProgressContext";
import {
  TEST_MODES,
  SKILL_META,
  getQuestionsForMode,
  evaluateFreeResponse,
  type AssessmentQuestion,
  type SkillKey,
  type DynamicExamDto,
} from "@/lib/test-assessment";
import { DocumentVaultModal } from "./DocumentVaultModal";

interface TestClientProps {
  userLevel: string;
  userXP: number;
  displayName: string;
  initialExams?: DynamicExamDto[];
  catalogDocCount?: number;
}

const EXAM_CATEGORY_TABS = [
  { id: "ALL", label: "Tất cả đề thi", icon: "🗂️" },
  { id: "PLACEMENT_LEVEL", label: "Đầu vào & Vượt cấp (4 kỹ năng)", icon: "🧭" },
  { id: "FPT_JPD", label: "Giáo trình FPT (JPD113–133)", icon: "🎓" },
  { id: "SKILL_TEST", label: "Từ vựng・Kanji・Ngữ pháp・Nghe・Đọc", icon: "🎯" },
  { id: "JLPT_MOCK", label: "Đề thi thử & Đề JLPT gốc", icon: "🏛️" },
] as const;

export function TestClient({
  userLevel,
  userXP: initialXP,
  displayName,
  initialExams,
  catalogDocCount = 249,
}: TestClientProps) {
  const { playClick, playCorrect, speak, speakingText, showToast } = useSoundAndTheme();
  const [selectedMode, setSelectedMode] = useState<string>("DIAGNOSTIC");
  const [currentStep, setCurrentStep] = useState<"SELECT" | "TESTING" | "RESULT">("SELECT");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("ALL");
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [mcAnswers, setMcAnswers] = useState<Record<string, number>>({});
  const [freeTextAnswers, setFreeTextAnswers] = useState<Record<string, string>>({});
  const [rubricChecks, setRubricChecks] = useState<Record<string, number[]>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);
  const [isClaimingXP, setIsClaimingXP] = useState(false);
  const [currentLevelState, setCurrentLevelState] = useState(userLevel);
  const [xpState, setXpState] = useState(initialXP);
  const [xpClaimed, setXpClaimed] = useState(false);
  const [levelUpdated, setLevelUpdated] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const examCatalog: DynamicExamDto[] = useMemo(() => {
    if (initialExams && initialExams.length > 0) {
      return initialExams;
    }
    return TEST_MODES.map((m) => ({
      id: m.id,
      slug: m.id,
      title: m.title,
      description: m.description,
      targetLevel: m.targetLevel,
      skillFocus: "ALL",
      category: m.id === "DIAGNOSTIC" ? "PLACEMENT" : "LEVEL_TEST",
      kindLabel: m.kindLabel,
      badge: m.badge,
      icon: m.icon,
      timeMinutes: m.timeMinutes,
      sourceDocument: "Nihon Quest 4-Skill Core Bank",
      answerAuthority: "CURATED",
      hasAudio: true,
      questions: getQuestionsForMode(m.id),
    }));
  }, [initialExams]);

  const filteredExams = useMemo(() => {
    return examCatalog.filter((exam) => {
      if (selectedCategory === "PLACEMENT_LEVEL" && exam.category !== "PLACEMENT" && exam.category !== "LEVEL_TEST") {
        return false;
      }
      if (selectedCategory === "FPT_JPD" && exam.category !== "FPT_JPD") {
        return false;
      }
      if (selectedCategory === "SKILL_TEST" && exam.category !== "SKILL_TEST") {
        return false;
      }
      if (selectedCategory === "JLPT_MOCK" && exam.category !== "JLPT_MOCK") {
        return false;
      }
      if (selectedLevelFilter !== "ALL" && exam.targetLevel !== selectedLevelFilter && exam.targetLevel !== "ALL") {
        return false;
      }
      return true;
    });
  }, [examCatalog, selectedCategory, selectedLevelFilter]);

  const activeExam = useMemo(
    () => examCatalog.find((e) => e.slug === selectedMode || e.id === selectedMode) ?? examCatalog[0],
    [examCatalog, selectedMode]
  );

  const questions: Array<AssessmentQuestion & { audioUrl?: string | null; answerAuthority?: string }> = useMemo(() => {
    if (activeExam && activeExam.questions.length > 0) {
      return activeExam.questions;
    }
    return getQuestionsForMode(selectedMode);
  }, [activeExam, selectedMode]);

  const currentQuestion = questions[questionIndex];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const w = window as any;
      if (w.SpeechRecognition || w.webkitSpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const finishTest = useCallback(() => {
    stopRecording();
    if (timerRef.current) clearInterval(timerRef.current);
    playCorrect();
    setCurrentStep("RESULT");
  }, [playCorrect, stopRecording]);

  // Countdown timer
  useEffect(() => {
    if (currentStep === "TESTING" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep, timeLeft, finishTest]);

  const startTest = (modeSlug: string) => {
    playClick();
    stopRecording();
    setSelectedMode(modeSlug);
    const exam = examCatalog.find((m) => m.slug === modeSlug || m.id === modeSlug);
    setTimeLeft((exam?.timeMinutes || 15) * 60);
    setQuestionIndex(0);
    setMcAnswers({});
    setFreeTextAnswers({});
    setRubricChecks({});
    setXpClaimed(false);
    setLevelUpdated(false);
    setShowReview(false);
    setCurrentStep("TESTING");
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    playClick();
    setMcAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleTextChange = (qId: string, value: string) => {
    setFreeTextAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleToggleRubric = (qId: string, idx: number) => {
    playClick();
    setRubricChecks((prev) => {
      const current = prev[qId] ?? [];
      const next = current.includes(idx) ? current.filter((i) => i !== idx) : [...current, idx];
      return { ...prev, [qId]: next };
    });
  };

  const handleStartSpeechRecognition = (qId: string) => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (typeof window === "undefined") return;
    const w = window as any;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast({
        title: "Trình duyệt chưa hỗ trợ nhận diện giọng nói trực tiếp",
        description: "Bạn có thể nói to rồi gõ lại câu vừa nói và tích chọn tiêu chí Rubric bên dưới.",
        type: "info",
      });
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "ja-JP";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || "";
        if (transcript) {
          setFreeTextAnswers((prev) => ({
            ...prev,
            [qId]: prev[qId] ? `${prev[qId]} ${transcript}` : transcript,
          }));
          showToast({
            title: "Đã thu nhận giọng nói tiếng Nhật!",
            description: transcript,
            type: "success",
          });
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      setIsRecording(true);
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const isQuestionAnswered = useCallback(
    (q: AssessmentQuestion) => {
      if (q.format === "MULTIPLE_CHOICE") {
        return mcAnswers[q.id] !== undefined;
      }
      const txt = (freeTextAnswers[q.id] ?? "").trim();
      const checks = rubricChecks[q.id] ?? [];
      return txt.length > 0 || checks.length > 0;
    },
    [mcAnswers, freeTextAnswers, rubricChecks]
  );

  const isQuestionCorrect = useCallback(
    (q: AssessmentQuestion): boolean => {
      if (q.format === "MULTIPLE_CHOICE") {
        const chosenIdx = mcAnswers[q.id];
        return chosenIdx !== undefined && Boolean(q.options?.[chosenIdx]?.isCorrect);
      }
      const txt = freeTextAnswers[q.id] ?? "";
      const checks = rubricChecks[q.id] ?? [];
      return evaluateFreeResponse(q, txt, checks).isPassing;
    },
    [mcAnswers, freeTextAnswers, rubricChecks]
  );

  const answeredCount = useMemo(
    () => questions.filter((q) => isQuestionAnswered(q)).length,
    [questions, isQuestionAnswered]
  );

  const correctCount = useMemo(
    () => questions.filter((q) => isQuestionCorrect(q)).length,
    [questions, isQuestionCorrect]
  );

  const scorePercent = Math.round((correctCount / Math.max(1, questions.length)) * 100);

  // Per-skill 4-Skill Matrix
  const skillStats = useMemo(() => {
    const base: Record<SkillKey, { total: number; correct: number; percent: number }> = {
      LISTENING: { total: 0, correct: 0, percent: 0 },
      SPEAKING: { total: 0, correct: 0, percent: 0 },
      READING: { total: 0, correct: 0, percent: 0 },
      WRITING: { total: 0, correct: 0, percent: 0 },
    };
    for (const q of questions) {
      base[q.skill].total += 1;
      if (isQuestionCorrect(q)) {
        base[q.skill].correct += 1;
      }
    }
    (Object.keys(base) as SkillKey[]).forEach((k) => {
      base[k].percent = base[k].total > 0 ? Math.round((base[k].correct / base[k].total) * 100) : 0;
    });
    return base;
  }, [questions, isQuestionCorrect]);

  const missedQuestions = useMemo(
    () => questions.filter((q) => !isQuestionCorrect(q)),
    [questions, isQuestionCorrect]
  );

  const weakSkills = useMemo(() => {
    return (Object.keys(skillStats) as SkillKey[]).filter(
      (k) => skillStats[k].total > 0 && skillStats[k].percent < 70
    );
  }, [skillStats]);

  const recommendedLessons = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ slug: string; title: string; topic: string; skill: SkillKey }> = [];
    for (const q of missedQuestions) {
      if (!seen.has(q.recommendedLesson.slug)) {
        seen.add(q.recommendedLesson.slug);
        list.push({ ...q.recommendedLesson, skill: q.skill });
      }
    }
    if (list.length === 0 && questions[0]) {
      list.push({
        ...questions[0].recommendedLesson,
        skill: questions[0].skill,
      });
    }
    return list.slice(0, 4);
  }, [missedQuestions, questions]);

  // Determine recommended level based on mode & score
  const determineRecommendedLevel = (): "N5" | "N4" | "N3" => {
    if (selectedMode === "N3_FULL") {
      return scorePercent >= 65 ? "N3" : "N4";
    }
    if (selectedMode === "N4_FULL") {
      return scorePercent >= 75 ? "N3" : scorePercent >= 55 ? "N4" : "N5";
    }
    if (selectedMode === "N5_FULL") {
      return scorePercent >= 75 ? "N4" : "N5";
    }
    // DIAGNOSTIC
    if (scorePercent >= 80) return "N3";
    if (scorePercent >= 55) return "N4";
    return "N5";
  };

  const recommendedLevel = determineRecommendedLevel();

  // Action: Update User Level in DB
  const handleUpdateLevel = async () => {
    setIsUpdatingLevel(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learningLevel: recommendedLevel }),
      });
      if (res.ok) {
        setCurrentLevelState(recommendedLevel);
        setLevelUpdated(true);
        notifyProgressUpdated();
        playCorrect();
        showToast({
          title: `Đã đồng bộ trình độ ${recommendedLevel} vào Hồ sơ & Lộ trình!`,
          type: "success",
        });
      } else {
        showToast({ title: "Không thể cập nhật trình độ. Vui lòng thử lại.", type: "error" });
      }
    } catch {
      showToast({ title: "Lỗi kết nối máy chủ.", type: "error" });
    } finally {
      setIsUpdatingLevel(false);
    }
  };

  // Action: Claim XP Reward
  const handleClaimXP = async () => {
    setIsClaimingXP(true);
    try {
      const dayKey = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "EXAM_COMPLETE", dayKey, examId: selectedMode }),
      });
      const data = await res.json();
      if (res.ok && data.xpAwarded > 0) {
        setXpClaimed(true);
        setXpState((prev) => prev + data.xpAwarded);
        notifyProgressUpdated();
        playCorrect();
        showToast({
          title: `🎉 Bạn nhận được +${data.xpAwarded} XP Thưởng Hoàn Thành Bài Đánh Giá 4 Kỹ Năng!`,
          type: "success",
        });
      } else {
        showToast({ title: data.error || "Đã nhận thưởng bài thi này trước đó.", type: "info" });
        setXpClaimed(true);
      }
    } catch {
      showToast({ title: "Lỗi kết nối máy chủ.", type: "error" });
    } finally {
      setIsClaimingXP(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      {/* STEP 1: MODE SELECTION & 4-SKILL MATRIX OVERVIEW */}
      {currentStep === "SELECT" && (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 dark:bg-sumi-900 dark:ring-slate-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Xin chào, {displayName}! 👋
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Trình độ hiện tại trong hồ sơ:{" "}
                <span className="font-extrabold text-red-600 dark:text-red-400">{currentLevelState}</span> · Tổng XP:{" "}
                <span className="font-extrabold text-amber-500">{xpState} XP</span> · Danh mục:{" "}
                <span className="font-extrabold text-slate-700 dark:text-slate-200">{examCatalog.length} bài thi động</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <span>🎯 Ma trận đánh giá đủ 4 kỹ năng: Nghe・Nói・Đọc・Viết</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsVaultOpen(true);
                }}
                data-testid="open-document-vault-btn"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition hover:border-red-300 hover:bg-rose-50 hover:text-red-700 dark:border-slate-700 dark:bg-sumi-800 dark:text-slate-200 dark:hover:border-red-700 dark:hover:text-red-300"
              >
                <span>📚 Kho tài liệu & Đề thi</span>
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-black text-slate-700 dark:bg-sumi-700 dark:text-slate-200">
                  {catalogDocCount}
                </span>
              </button>
            </div>
          </div>

          {/* 4-SKILL ASSESSMENT MATRIX EXPLANATION */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-sumi-900">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  📊 Ma Trận Đánh Giá 4 Kỹ Năng & Cam Kết Minh Bạch
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Không chỉ dừng ở 4 bài thi cố định — hệ thống hỗ trợ {examCatalog.length} bộ đề từ Đầu vào, Vượt cấp N5–N3, Giáo trình FPT (JPD113–133), Chuyên đề kỹ năng đến Đề thi JLPT gốc.
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                Hỗ trợ Thi vượt cấp / Miễn học phần
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(SKILL_META) as SkillKey[]).map((key) => {
                const m = SKILL_META[key];
                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-sumi-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{m.icon}</span>
                      <span className="jp-text rounded-md bg-white px-2 py-0.5 text-xs font-black text-red-600 shadow-sm dark:bg-sumi-900 dark:text-red-400">
                        {m.jpLabel}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-black text-slate-900 dark:text-white">{m.label}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{m.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <b>ℹ️ Minh bạch công nghệ chấm điểm & Nguồn đáp án:</b> Phần <b>Nghe</b> và <b>Đọc</b> được chấm tự động 100%. Phần <b>Viết</b> và <b>Nói</b> kết hợp nhận diện giọng nói trình duyệt (Web Speech API `ja-JP`), đối chiếu từ khóa/cấu trúc ngữ pháp cốt lõi và <b>Bảng tiêu chí Rubric 3 điểm</b> (có đáp án mẫu đối chiếu), tuyệt đối không giả lập điểm AI cảm tính. Mỗi đề thi đều phân biệt rõ <b>Đáp án chính thức từ đề gốc (OFFICIAL)</b> và <b>Đáp án biên soạn chuẩn hóa (CURATED)</b>.
            </div>
          </div>

          {/* DYNAMIC EXAM FILTER BAR */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-sumi-900 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-1.5">
              {EXAM_CATEGORY_TABS.map((tab) => {
                const active = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedCategory(tab.id);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                      active
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-sumi-800 dark:text-slate-300"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Cấp độ:</span>
              {(["ALL", "N5", "N4", "N3"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedLevelFilter(lvl);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
                    selectedLevelFilter === lvl
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-sumi-800 dark:text-slate-300"
                  }`}
                >
                  {lvl === "ALL" ? "Tất cả" : lvl}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC EXAM CARDS */}
          <div className="grid gap-5 sm:grid-cols-2">
            {filteredExams.map((mode) => {
              const modeQuestions = mode.questions ?? [];
              const presentSkills = Array.from(new Set(modeQuestions.map((q) => q.skill)));
              const isOfficial = mode.answerAuthority === "OFFICIAL";
              return (
                <div
                  key={mode.slug}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-md hover:ring-slate-300 dark:bg-sumi-900 dark:ring-slate-800 dark:hover:ring-slate-700"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-3xl">{mode.icon}</span>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:bg-red-950/50 dark:text-red-300">
                          {mode.kindLabel}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-sumi-800 dark:text-slate-300">
                          {mode.badge}
                        </span>
                      </div>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900 transition group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
                      {mode.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {mode.description}
                    </p>

                    {/* Authority & Source Metadata */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                          isOfficial
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                        }`}
                      >
                        {isOfficial ? "✅ Đáp án chính thức từ đề gốc" : "📘 Đáp án biên soạn & giải thích chi tiết"}
                      </span>
                      {mode.sourceDocument && (
                        <span className="truncate rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-sumi-800 dark:text-slate-400">
                          📄 Nguồn: {mode.sourceDocument}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {presentSkills.includes("LISTENING") && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-sumi-800 dark:text-slate-300">
                          🎧 Nghe {mode.hasAudio ? "(Audio)" : ""}
                        </span>
                      )}
                      {presentSkills.includes("READING") && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-sumi-800 dark:text-slate-300">
                          📖 Đọc / Từ vựng / Ngữ pháp
                        </span>
                      )}
                      {presentSkills.includes("WRITING") && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-sumi-800 dark:text-slate-300">
                          ✍️ Viết câu
                        </span>
                      )}
                      {presentSkills.includes("SPEAKING") && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-sumi-800 dark:text-slate-300">
                          🎙️ Nói phản xạ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>⏱️ {mode.timeMinutes} phút</span>
                      <span>•</span>
                      <span>
                        📝 {modeQuestions.length} nhiệm vụ ({presentSkills.length === 4 ? "4 kỹ năng" : `${presentSkills.length} kỹ năng`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startTest(mode.slug)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 text-xs font-extrabold text-white shadow transition hover:brightness-110 active:scale-95"
                    >
                      Bắt đầu đánh giá
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: ACTIVE 4-SKILL TEST RUNNER */}
      {currentStep === "TESTING" && currentQuestion && (
        <div className="space-y-6">
          {/* TOP BAR: TIMER & PROGRESS */}
          <div className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/95 px-6 py-4 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-sumi-900/95">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-red-100 px-3 py-1 text-xs font-black text-red-700 dark:bg-red-950/60 dark:text-red-300">
                Câu {questionIndex + 1} / {questions.length}
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-sumi-800 dark:text-slate-200">
                {SKILL_META[currentQuestion.skill].icon} {SKILL_META[currentQuestion.skill].label} · {currentQuestion.level}
              </span>
              {activeExam && (
                <span className="hidden rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 md:inline-block">
                  {activeExam.answerAuthority === "OFFICIAL" ? "✅ Đáp án chính thức" : "📘 Đáp án biên soạn"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 font-mono text-base font-extrabold text-slate-800 dark:text-white">
                <span className="text-red-500">⏱️</span>
                <span className={timeLeft < 180 ? "animate-pulse text-red-600" : ""}>
                  {formatTimer(timeLeft)}
                </span>
              </div>

              <button
                type="button"
                onClick={finishTest}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                Nộp Bài ({answeredCount}/{questions.length})
              </button>
            </div>
          </div>

          {/* QUESTION BOX */}
          <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 dark:bg-sumi-900 dark:ring-slate-800 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {SKILL_META[currentQuestion.skill].icon} Kỹ năng: {SKILL_META[currentQuestion.skill].label} ({currentQuestion.subCategory}) · Cấp độ {currentQuestion.level}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Đã hoàn thành {answeredCount}/{questions.length} câu
              </span>
            </div>

            {/* LISTENING AUDIO PLAYER (REAL MP3 + WEB SPEECH TTS) */}
            {currentQuestion.skill === "LISTENING" && (currentQuestion.audioScript || currentQuestion.audioUrl) && (
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      🎧 Phần Nghe Hiểu (Listening Audio)
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Bấm nút phát để nghe hội thoại tiếng Nhật (kịch bản chữ được ẩn trong lúc làm bài để đánh giá đúng kỹ năng nghe).
                    </p>
                  </div>
                  {currentQuestion.audioScript && (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speak(currentQuestion.audioScript!)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-indigo-700 active:scale-95"
                      >
                        <span>{speakingText === currentQuestion.audioScript ? "🔊 Đang phát..." : "▶️ Nghe Audio"}</span>
                      </button>
                    </div>
                  )}
                </div>
                {currentQuestion.audioUrl && (
                  <div className="rounded-xl border border-indigo-200/80 bg-white/90 p-3 dark:border-indigo-800 dark:bg-sumi-900">
                    <p className="mb-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                      🎵 File Audio Gốc Từ Đề Thi ({currentQuestion.level}):
                    </p>
                    <audio controls preload="metadata" src={currentQuestion.audioUrl} className="w-full" />
                  </div>
                )}
              </div>
            )}

            {/* READING PASSAGE / CONTEXT */}
            {currentQuestion.contextPassage && (
              <div className="rounded-2xl border-l-4 border-red-500 bg-slate-50 p-4 text-sm font-medium text-slate-800 dark:bg-sumi-800 dark:text-slate-100">
                <p className="jp-text whitespace-pre-line leading-relaxed">{currentQuestion.contextPassage}</p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="jp-text text-lg font-bold leading-relaxed text-slate-900 dark:text-white sm:text-xl">
                {currentQuestion.question}
              </h3>
              {currentQuestion.promptHint && (
                <p className="rounded-xl bg-amber-50/80 px-3.5 py-2 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  💡 {currentQuestion.promptHint}
                </p>
              )}
            </div>

            {/* FORMAT 1: MULTIPLE CHOICE (LISTENING / READING) */}
            {currentQuestion.format === "MULTIPLE_CHOICE" && currentQuestion.options && (
              <div className="grid gap-3 pt-2">
                {currentQuestion.options.map((opt, oIdx) => {
                  const isSelected = mcAnswers[currentQuestion.id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                      className={`flex items-start gap-4 rounded-2xl border p-4 text-left font-medium transition ${
                        isSelected
                          ? "border-red-600 bg-red-50/80 text-red-900 shadow-sm ring-2 ring-red-500/20 dark:border-red-500 dark:bg-red-950/40 dark:text-red-100"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-sumi-850 dark:text-slate-200 dark:hover:bg-sumi-800"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                          isSelected
                            ? "bg-red-600 text-white"
                            : "bg-slate-100 text-slate-600 dark:bg-sumi-750 dark:text-slate-300"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="jp-text flex-1 pt-0.5 text-base leading-snug">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* FORMAT 2 & 3: WRITING INPUT & SPEAKING PROMPT */}
            {(currentQuestion.format === "WRITING_INPUT" || currentQuestion.format === "SPEAKING_PROMPT") && (
              <div className="space-y-4 pt-2">
                {currentQuestion.format === "SPEAKING_PROMPT" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-red-700 dark:text-red-300">
                        🎙️ Thu âm phản xạ nói tiếng Nhật (Web Speech API)
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {speechSupported
                          ? "Bấm nút Ghi âm và nói bằng tiếng Nhật, hoặc tự đọc to rồi nhập lại câu trả lời của bạn vào ô bên dưới."
                          : "Trình duyệt hiện tại không bật SpeechRecognition tự động. Hãy nói to câu trả lời của bạn, nhập lại vào ô bên dưới và đối chiếu Rubric."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartSpeechRecognition(currentQuestion.id)}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow transition ${
                          isRecording
                            ? "animate-pulse bg-red-600"
                            : "bg-slate-900 hover:bg-slate-800 dark:bg-red-600 dark:hover:bg-red-700"
                        }`}
                      >
                        {isRecording ? "⏹️ Đang nghe... (Bấm để dừng)" : "🎙️ Bấm để nói (ja-JP)"}
                      </button>
                      {currentQuestion.sampleAnswer && (
                        <button
                          type="button"
                          onClick={() => speak(currentQuestion.sampleAnswer!)}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-rose-50 dark:border-red-800 dark:bg-sumi-900 dark:text-red-300"
                        >
                          🔊 Nghe ngữ điệu mẫu
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor={`response-${currentQuestion.id}`}
                    className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    {currentQuestion.format === "WRITING_INPUT"
                      ? "✍️ Nhập câu tiếng Nhật của bạn (Hiragana, Kanji hoặc Romaji):"
                      : "📝 Bản ghi câu nói của bạn (tự động điền khi nói hoặc nhập trực tiếp):"}
                  </label>
                  <textarea
                    id={`response-${currentQuestion.id}`}
                    rows={3}
                    value={freeTextAnswers[currentQuestion.id] ?? ""}
                    onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                    placeholder={
                      currentQuestion.format === "WRITING_INPUT"
                        ? "Ví dụ: 毎日、電車で学校へ行きます。"
                        : "Ví dụ: はじめまして。アンと申します。よろしくお願いします。"
                    }
                    className="jp-text w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-base text-slate-900 outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-sumi-800 dark:text-white"
                  />
                </div>

                {/* RUBRIC SELF-VERIFICATION CHECKLIST */}
                {currentQuestion.rubricCriteria && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-sumi-800/60">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      ✅ Tiêu chí tự kiểm tra & chấm điểm minh bạch (Rubric):
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Hãy kiểm tra xem câu trả lời của bạn đã đáp ứng các tiêu chí ngữ pháp & ngữ cảnh dưới đây chưa:
                    </p>
                    <div className="mt-2.5 space-y-2">
                      {currentQuestion.rubricCriteria.map((criterion, cIdx) => {
                        const checked = (rubricChecks[currentQuestion.id] ?? []).includes(cIdx);
                        return (
                          <label
                            key={cIdx}
                            className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-red-200 dark:border-slate-700 dark:bg-sumi-900 dark:text-slate-200"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleRubric(currentQuestion.id, cIdx)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                            />
                            <span>{criterion}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QUESTION NAV & ACTIONS */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
              <button
                type="button"
                disabled={questionIndex === 0}
                onClick={() => {
                  playClick();
                  stopRecording();
                  setQuestionIndex((prev) => Math.max(0, prev - 1));
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-sumi-800"
              >
                ← Câu trước
              </button>

              <div className="hidden max-w-md items-center gap-1.5 overflow-x-auto sm:flex">
                {questions.map((q, idx) => {
                  const isDone = isQuestionAnswered(q);
                  const isCurrent = idx === questionIndex;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        stopRecording();
                        setQuestionIndex(idx);
                      }}
                      title={`${SKILL_META[q.skill].label} (${q.level})`}
                      className={`h-7 w-7 rounded-lg text-xs font-extrabold transition ${
                        isCurrent
                          ? "bg-red-600 text-white ring-2 ring-red-400"
                          : isDone
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 dark:bg-sumi-800 dark:text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {questionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    stopRecording();
                    setQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Câu tiếp →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishTest}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow transition hover:brightness-110"
                >
                  Hoàn tất & Nộp bài 🎉
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: 4-SKILL RESULT DASHBOARD */}
      {currentStep === "RESULT" && (
        <div className="space-y-8 animate-fadeIn">
          {/* HERO SUMMARY */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sumi-900 to-red-950 p-8 text-white shadow-xl">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="space-y-3 text-center md:text-left">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur">
                  🏆 BÁO CÁO ĐÁNH GIÁ NĂNG LỰC 4 KỸ NĂNG
                </span>
                <h2 className="text-3xl font-black tracking-tight">
                  {scorePercent >= 80
                    ? "Xuất Sắc! Bạn Đạt Chuẩn Toàn Diện 4 Kỹ Năng 🎉"
                    : scorePercent >= 60
                    ? "Đạt Yêu Cầu! Nền Tảng Khá Vững Vàng 💪"
                    : "Cần Củng Cố Thêm Một Số Kỹ Năng Cốt Lõi 🌱"}
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-slate-300">
                  Bạn đạt <b className="text-white">{correctCount}</b> / {questions.length} nhiệm vụ qua 4 kỹ năng (Nghe・Nói・Đọc・Viết). Dưới đây là bảng điểm từng kỹ năng, điểm yếu cần ôn và bài học tiếp theo được cá nhân hóa cho bạn.
                </p>
              </div>

              {/* SCORE BADGE */}
              <div className="flex min-w-[180px] shrink-0 flex-col items-center justify-center rounded-3xl bg-white/10 p-6 text-center backdrop-blur ring-1 ring-white/20">
                <span className="text-xs font-bold text-slate-300">ĐIỂM TỔNG HỢP</span>
                <span className="mt-1 text-5xl font-black text-amber-400">{scorePercent}%</span>
                <span className="mt-2 rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-bold text-amber-300">
                  {scorePercent >= 85
                    ? "Hạng S (Đủ điều kiện vượt cấp)"
                    : scorePercent >= 65
                    ? "Hạng A (Đạt chuẩn)"
                    : scorePercent >= 50
                    ? "Hạng B (Cần ôn bổ trợ)"
                    : "Hạng C (Cần học lại nền tảng)"}
                </span>
              </div>
            </div>
          </div>

          {/* 4-SKILL BREAKDOWN MATRIX */}
          <div className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 dark:bg-sumi-900 dark:ring-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  📊 Điểm Số Theo Từng Kỹ Năng (Listening・Speaking・Reading・Writing)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phân tích độ vững vàng của từng kỹ năng để phân bổ thời gian học hợp lý.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(SKILL_META) as SkillKey[]).map((skillKey) => {
                const meta = SKILL_META[skillKey];
                const stat = skillStats[skillKey];
                const isWeak = stat.percent < 70;
                return (
                  <div
                    key={skillKey}
                    className={`flex flex-col justify-between rounded-2xl border p-4 ${
                      isWeak
                        ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
                        : "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{meta.icon}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                            isWeak
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {stat.percent >= 80 ? "Vững vàng" : stat.percent >= 65 ? "Đạt yêu cầu" : "Điểm yếu cần ôn"}
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-black text-slate-900 dark:text-white">{meta.label}</h4>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Đúng {stat.correct} / {stat.total} nhiệm vụ
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs font-extrabold">
                        <span className="text-slate-600 dark:text-slate-300">Mức độ hoàn thành</span>
                        <span className={isWeak ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}>
                          {stat.percent}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-sumi-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isWeak ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${stat.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WEAKNESSES & RECOMMENDED NEXT LESSONS */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* WEAKNESSES & TOPICS TO REVIEW */}
            <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 dark:bg-sumi-900 dark:ring-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  🩺
                </span>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Điểm Yếu & Kiến Thức Cần Ôn Tập</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chẩn đoán tự động từ các câu trả lời chưa chính xác của bạn
                  </p>
                </div>
              </div>

              {missedQuestions.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                  🎉 Tuyệt vời! Bạn không mắc lỗi nào trong bài đánh giá này. Bạn hoàn toàn đủ điều kiện chuyển sang cấp độ tiếp theo.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {missedQuestions.map((q) => (
                    <li
                      key={q.id}
                      className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs dark:border-red-900/40 dark:bg-red-950/20"
                    >
                      <div className="flex items-center justify-between font-bold text-red-700 dark:text-red-300">
                        <span>
                          {SKILL_META[q.skill].icon} {SKILL_META[q.skill].label} · {q.level}
                        </span>
                        <span>Cần ôn lại</span>
                      </div>
                      <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">
                        Chủ điểm: {q.recommendedLesson.topic}
                      </p>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-300">{q.explanation}</p>
                    </li>
                  ))}
                </ul>
              )}

              {weakSkills.length > 0 && (
                <div className="rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 dark:bg-sumi-800 dark:text-slate-300">
                  <b>Kỹ năng ưu tiên cải thiện:</b>{" "}
                  {weakSkills.map((k) => SKILL_META[k].label).join(", ")}.
                </div>
              )}
            </div>

            {/* RECOMMENDED NEXT LESSONS */}
            <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 dark:bg-sumi-900 dark:ring-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-xl text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  🧭
                </span>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Đề Xuất Bài Học Tiếp Theo</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bấm trực tiếp vào bài học để lấp lỗ hổng kiến thức ngay lập tức
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {recommendedLessons.map((rec) => (
                  <Link
                    key={rec.slug}
                    href={`/app/practice/${rec.slug}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-red-300 hover:bg-rose-50/60 dark:border-slate-800 dark:bg-sumi-800/60 dark:hover:border-red-800"
                  >
                    <div className="min-w-0">
                      <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400">
                        {SKILL_META[rec.skill].icon} Bổ trợ {SKILL_META[rec.skill].label} · {rec.topic}
                      </span>
                      <h4 className="mt-0.5 truncate text-sm font-black text-slate-900 dark:text-white">
                        {rec.title}
                      </h4>
                    </div>
                    <span className="shrink-0 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-extrabold text-white">
                      Học ngay →
                    </span>
                  </Link>
                ))}

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <Link
                    href="/app/path"
                    className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-sumi-800 dark:text-slate-200"
                  >
                    🗺️ Về Lộ trình cá nhân
                  </Link>
                  <Link
                    href="/app/review"
                    className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-sumi-800 dark:text-slate-200"
                  >
                    🔄 Ôn tập thẻ SRS
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION CARDS: RECOMMENDED LEVEL & XP REWARD */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* CARD 1: LEVEL RECOMMENDATION & EXEMPTION */}
            <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 dark:bg-sumi-900 dark:ring-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-xl text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  🎯
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Xác Nhận Trình Độ & Miễn Học Phần
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Đồng bộ kết quả đánh giá vào lộ trình học cá nhân của bạn
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Trình độ đề xuất:{" "}
                  <span className="text-lg font-black text-red-600 dark:text-red-400">
                    JLPT {recommendedLevel}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {recommendedLevel === "N3"
                    ? "Bạn đã vượt qua chuẩn N5 & N4 ở cả 4 kỹ năng. Bạn được miễn học phần sơ cấp và mở khóa thẳng lộ trình N3!"
                    : recommendedLevel === "N4"
                    ? "Bạn đã nắm vững nền tảng N5 và đủ điều kiện mở khóa lộ trình sơ trung cấp N4."
                    : "Lộ trình N5 sẽ giúp bạn xây chắc gốc từ vựng, ngữ pháp và phản xạ nghe nói."}
                </p>
              </div>

              <button
                type="button"
                disabled={isUpdatingLevel || levelUpdated}
                onClick={handleUpdateLevel}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-extrabold text-white shadow transition ${
                  levelUpdated
                    ? "bg-emerald-600"
                    : "bg-gradient-to-r from-red-600 to-rose-500 hover:brightness-110 active:scale-95"
                }`}
              >
                {isUpdatingLevel ? (
                  <span>Đang đồng bộ lộ trình...</span>
                ) : levelUpdated ? (
                  <span>✓ Đã cập nhật trình độ {recommendedLevel} vào Hồ sơ!</span>
                ) : (
                  <span>Áp dụng trình độ {recommendedLevel} cho Lộ trình của tôi →</span>
                )}
              </button>
            </div>

            {/* CARD 2: XP REWARD */}
            <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 dark:bg-sumi-900 dark:ring-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  ⭐
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Phần Thưởng Kinh Nghiệm</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Đồng bộ XP với tài khoản, Journey và Bảng xếp hạng
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Phần thưởng hoàn thành:{" "}
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">+100 XP</span>
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Cộng điểm trực tiếp vào tổng tích lũy và mở khóa các chặng trên bản đồ Journey.
                </p>
              </div>

              <button
                type="button"
                disabled={isClaimingXP || xpClaimed}
                onClick={handleClaimXP}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-extrabold text-white shadow transition ${
                  xpClaimed
                    ? "bg-emerald-600"
                    : "bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 active:scale-95"
                }`}
              >
                {isClaimingXP ? (
                  <span>Đang nhận thưởng...</span>
                ) : xpClaimed ? (
                  <span>✓ Đã nhận +100 XP Thưởng!</span>
                ) : (
                  <span>Nhận +100 XP Thưởng Hoàn Thành 🎁</span>
                )}
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS & ANSWER REVIEW TOGGLE */}
          <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setCurrentStep("SELECT")}
              className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-sumi-900 dark:text-slate-200 dark:hover:bg-sumi-800 sm:w-auto"
            >
              ← Chọn Bài Đánh Giá Khác
            </button>

            <button
              type="button"
              onClick={() => setShowReview((prev) => !prev)}
              className="w-full rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:w-auto"
            >
              {showReview ? "Ẩn Chi Tiết Đáp Án" : "Xem Chi Tiết Đáp Án, Kịch Bản Nghe & Câu Mẫu 📖"}
            </button>
          </div>

          {/* DETAILED ANSWER REVIEW */}
          {showReview && (
            <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 dark:bg-sumi-900 dark:ring-slate-800 animate-fadeIn">
              <h3 className="border-b border-slate-100 pb-3 font-bold text-slate-900 dark:border-slate-800 dark:text-white">
                Chi Tiết Đáp Án, Kịch Bản Audio & Giải Thích
              </h3>

              <div className="space-y-6 pt-2">
                {questions.map((q, idx) => {
                  const isCorrect = isQuestionCorrect(q);
                  const userChoice = mcAnswers[q.id];
                  const userText = freeTextAnswers[q.id] ?? "";

                  return (
                    <div
                      key={q.id}
                      className={`space-y-3 rounded-2xl border p-5 ${
                        isCorrect
                          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                          : "border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-400">
                          Câu {idx + 1} ({SKILL_META[q.skill].icon} {SKILL_META[q.skill].label} · {q.level})
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            isCorrect
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {isCorrect ? "✓ Đạt" : "✗ Cần cải thiện"}
                        </span>
                      </div>

                      {q.audioScript && (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-indigo-50/80 px-3.5 py-2 text-xs text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200">
                          <span className="jp-text font-semibold">🎧 Kịch bản Nghe: 「{q.audioScript}」</span>
                          <button
                            type="button"
                            onClick={() => speak(q.audioScript!)}
                            className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white"
                          >
                            🔊 Nghe lại
                          </button>
                        </div>
                      )}
                      {q.audioUrl && (
                        <div className="rounded-xl border border-indigo-200 bg-white/90 p-3 dark:border-indigo-900 dark:bg-sumi-900">
                          <audio controls preload="metadata" src={q.audioUrl} className="w-full" />
                        </div>
                      )}

                      <p className="jp-text text-base font-bold text-slate-900 dark:text-white">
                        {q.question}
                      </p>

                      {q.format === "MULTIPLE_CHOICE" && q.options ? (
                        <div className="grid gap-2 pt-1 text-sm">
                          {q.options.map((opt, oIdx) => {
                            const wasChosen = userChoice === oIdx;
                            return (
                              <div
                                key={oIdx}
                                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium ${
                                  opt.isCorrect
                                    ? "bg-emerald-200/60 font-bold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100"
                                    : wasChosen
                                    ? "bg-rose-200/60 font-bold text-rose-900 dark:bg-rose-900/60 dark:text-rose-100"
                                    : "bg-slate-100/60 text-slate-600 dark:bg-sumi-800 dark:text-slate-400"
                                }`}
                              >
                                <span>
                                  {opt.label}. {opt.text}
                                </span>
                                {opt.isCorrect && <span>Đáp án đúng</span>}
                                {wasChosen && !opt.isCorrect && <span>Lựa chọn của bạn</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2 rounded-xl bg-white/80 p-3 text-xs dark:bg-sumi-900/70">
                          <p>
                            <b>Câu trả lời của bạn:</b>{" "}
                            <span className="jp-text font-semibold text-slate-800 dark:text-slate-200">
                              {userText || "(Chưa nhập nội dung)"}
                            </span>
                          </p>
                          {q.sampleAnswer && (
                            <p>
                              <b>Câu trả lời mẫu chuẩn:</b>{" "}
                              <span className="jp-text font-bold text-emerald-700 dark:text-emerald-300">
                                {q.sampleAnswer}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      <div className="rounded-xl border-l-2 border-amber-400 bg-white/80 p-3 text-xs text-slate-600 dark:bg-sumi-950/60 dark:text-slate-300">
                        <b>💡 Giải thích:</b> {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOCUMENT & EXAM VAULT DRAWER / MODAL */}
      <DocumentVaultModal isOpen={isVaultOpen} onClose={() => setIsVaultOpen(false)} />
    </div>
  );
}
