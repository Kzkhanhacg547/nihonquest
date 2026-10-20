"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { YokaiHub } from "./YokaiHub";
import { YokaiGameCanvas } from "./YokaiGameCanvas";
import { YokaiResultModal } from "./YokaiResultModal";
import { YokaiLoadingScreen } from "./YokaiLoadingScreen";
import { YokaiStyles } from "./YokaiGameUI";
import {
  GameZone,
  SpiritBeast,
  DailyQuest,
  YokaiQuestion,
  YokaiGameResult,
  YokaiQuestionMode,
  YokaiSpeedDifficulty,
} from "@/lib/yokai-dash/types";
import { GAME_ZONES, SPIRIT_BEASTS } from "@/lib/yokai-dash/constants";
import { useSoundAndTheme } from "@/components/SoundAndThemeContext";
import { notifyProgressUpdated } from "@/components/UserProgressContext";

export function YokaiDashClient() {
  const { showToast } = useSoundAndTheme();

  // Mode: "HUB" | "PLAYING" | "LOADING"
  const [gameState, setGameState] = useState<"HUB" | "PLAYING" | "LOADING">("HUB");
  // Unique session ID to enforce clean remount & zero state bleed across runs
  const [gameSessionId, setGameSessionId] = useState<number>(1);

  // Selection
  const [selectedZone, setSelectedZone] = useState<GameZone>(GAME_ZONES[0]);
  const [selectedBeast, setSelectedBeast] = useState<SpiritBeast>(SPIRIT_BEASTS[0]);
  const [isPractice, setIsPractice] = useState<boolean>(false);

  // Game Settings: Question Mode, Speed Difficulty (EASY, MEDIUM, CUSTOM), Custom Speed
  const [questionMode, setQuestionMode] = useState<YokaiQuestionMode>("ALL");
  const [speedDifficulty, setSpeedDifficulty] = useState<YokaiSpeedDifficulty>("MEDIUM");
  const [customSpeed, setCustomSpeed] = useState<number>(14.0);
  const [showGateHint, setShowGateHint] = useState<boolean>(true);

  // Module Entrance Loading (màn loading chuyển cảnh khi mới vào module)
  const [isModuleEntranceLoading, setIsModuleEntranceLoading] = useState<boolean>(true);

  // Player State
  const [stamina, setStamina] = useState<number>(5);
  const [maxStamina, setMaxStamina] = useState<number>(5);
  const [nextResetIso, setNextResetIso] = useState<string>("");
  const [unlockedBeastIds, setUnlockedBeastIds] = useState<string[]>(["kitsune", "neko_samurai"]);
  const [clearedZones, setClearedZones] = useState<string[]>(["torii_path", "sakura_grove"]);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [highScore, setHighScore] = useState<number>(1250);
  const [bestCombo, setBestCombo] = useState<number>(8);

  // Active Questions for Run
  const [questions, setQuestions] = useState<YokaiQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  // Báo cho màn loading biết dữ liệu đã sẵn sàng để thanh tiến trình chạy nốt tới 100%
  const [loadReady, setLoadReady] = useState<boolean>(false);

  // External pause synchronization with URL
  const [isPausedExternal, setIsPausedExternal] = useState<boolean>(false);

  // Game Result Modal
  const [activeResult, setActiveResult] = useState<YokaiGameResult | null>(null);
  const [earnedXP, setEarnedXP] = useState<number>(0);
  const [newTotalXP, setNewTotalXP] = useState<number | undefined>(undefined);
  const [newLevel, setNewLevel] = useState<number | undefined>(undefined);
  const [leveledUp, setLeveledUp] = useState<boolean>(false);

  // Keep latest refs to avoid closure stale issues in event handlers
  const selectedZoneRef = useRef(selectedZone);
  selectedZoneRef.current = selectedZone;
  const selectedBeastRef = useRef(selectedBeast);
  selectedBeastRef.current = selectedBeast;
  const isPracticeRef = useRef(isPractice);
  isPracticeRef.current = isPractice;
  const questionModeRef = useRef(questionMode);
  questionModeRef.current = questionMode;
  const speedDifficultyRef = useRef(speedDifficulty);
  speedDifficultyRef.current = speedDifficulty;
  const customSpeedRef = useRef(customSpeed);
  customSpeedRef.current = customSpeed;

  // Sync URL query cleanly without triggering Next.js full remount of Three.js canvas
  const updateUrlState = useCallback(
    (opts: {
      action: "HUB" | "PLAY" | "PAUSED" | "RESULT";
      zoneId?: string;
      beastId?: string;
      practice?: boolean;
      replace?: boolean;
    }) => {
      if (typeof window === "undefined") return;

      const base = window.location.pathname;
      let nextUrl = base;

      if (opts.action === "PLAY") {
        const params = new URLSearchParams();
        params.set("play", opts.zoneId || selectedZoneRef.current.id);
        const beast = opts.beastId || selectedBeastRef.current.id;
        if (beast && beast !== SPIRIT_BEASTS[0].id) params.set("beast", beast);
        if (opts.practice ?? isPracticeRef.current) params.set("mode", "practice");
        nextUrl = `${base}?${params.toString()}`;
      } else if (opts.action === "PAUSED") {
        const params = new URLSearchParams();
        params.set("play", opts.zoneId || selectedZoneRef.current.id);
        const beast = opts.beastId || selectedBeastRef.current.id;
        if (beast && beast !== SPIRIT_BEASTS[0].id) params.set("beast", beast);
        if (opts.practice ?? isPracticeRef.current) params.set("mode", "practice");
        params.set("state", "paused");
        nextUrl = `${base}?${params.toString()}`;
      } else if (opts.action === "RESULT") {
        const params = new URLSearchParams();
        params.set("play", opts.zoneId || selectedZoneRef.current.id);
        if (opts.practice ?? isPracticeRef.current) params.set("mode", "practice");
        params.set("state", "result");
        nextUrl = `${base}?${params.toString()}`;
      } else {
        // HUB
        nextUrl = base;
      }

      const current = window.location.pathname + window.location.search;
      if (current !== nextUrl) {
        if (opts.replace) {
          window.history.replaceState({ action: opts.action }, "", nextUrl);
        } else {
          window.history.pushState({ action: opts.action }, "", nextUrl);
        }
      }
    },
    []
  );

  // Fetch Player State on load
  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/yokai-dash/state", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStamina(data.stamina);
        setMaxStamina(data.maxStamina);
        setNextResetIso(data.nextStaminaReset);
        setUnlockedBeastIds(data.unlockedBeastIds || ["kitsune", "neko_samurai"]);
        if (Array.isArray(data.clearedZones)) setClearedZones(data.clearedZones);
        setDailyQuests(data.dailyQuests || []);
        if (data.highScore) setHighScore(data.highScore);
        if (data.bestCombo) setBestCombo(data.bestCombo);
      }
    } catch (err) {
      console.error("Failed to load Yokai Dash state:", err);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Khôi phục thiết lập từ localStorage & đếm ngược màn entrance loading
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedMode = localStorage.getItem("yokai_question_mode") as YokaiQuestionMode | null;
      if (savedMode) setQuestionMode(savedMode);

      const savedDiff = localStorage.getItem("yokai_speed_difficulty") as YokaiSpeedDifficulty | null;
      if (savedDiff === "EASY" || savedDiff === "MEDIUM" || savedDiff === "CUSTOM") {
        setSpeedDifficulty(savedDiff);
      }

      const savedSpeed = parseFloat(localStorage.getItem("yokai_custom_speed") || "");
      if (!Number.isNaN(savedSpeed) && savedSpeed >= 8 && savedSpeed <= 24) {
        setCustomSpeed(savedSpeed);
      }

      const savedHint = localStorage.getItem("yokai_show_gate_hint");
      if (savedHint !== null) {
        setShowGateHint(savedHint !== "false");
      }
    } catch {
      // ignore
    }

    // Thời lượng màn chuyển cảnh mở cổng linh giới khi mới vào module
    const timer = setTimeout(() => {
      setIsModuleEntranceLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleQuestionModeChange = useCallback((mode: YokaiQuestionMode) => {
    setQuestionMode(mode);
    try {
      localStorage.setItem("yokai_question_mode", mode);
    } catch {}
  }, []);

  const handleSpeedDifficultyChange = useCallback((diff: YokaiSpeedDifficulty) => {
    setSpeedDifficulty(diff);
    try {
      localStorage.setItem("yokai_speed_difficulty", diff);
    } catch {}
  }, []);

  const handleCustomSpeedChange = useCallback((speed: number) => {
    setCustomSpeed(speed);
    try {
      localStorage.setItem("yokai_custom_speed", String(speed));
    } catch {}
  }, []);

  const handleToggleGateHint = useCallback((hint: boolean) => {
    setShowGateHint(hint);
    try {
      localStorage.setItem("yokai_show_gate_hint", String(hint));
    } catch {}
  }, []);

  // Start Game handler with specific target zone/beast/practice overrides
  const handleStartGame = useCallback(
    async (overrideZone?: GameZone, overridePractice?: boolean, initialPause = false) => {
      const zoneToPlay = overrideZone || selectedZoneRef.current;
      const practiceMode = overridePractice ?? isPracticeRef.current;

      if (!practiceMode && stamina <= 0) {
        showToast({
          title: "Hết lượt chạy hôm nay!",
          description: "Hãy bật Chế độ Luyện tập để chơi miễn phí không giới hạn nhé.",
          type: "error",
        });
        return;
      }

      setIsLoadingQuestions(true);
      setLoadReady(false);
      setGameState("LOADING");
      const loadStartedAt = Date.now();

      try {
        const modeQuery = questionModeRef.current;
        const res = await fetch(
          `/api/yokai-dash/questions?level=${zoneToPlay.level}&count=8&mode=${modeQuery}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            setLoadReady(true);
            // Giữ màn loading tối thiểu ~2s để thanh tiến trình và ảnh nền kịp hiển thị
            const MIN_LOADING_MS = 2000;
            await new Promise((r) => setTimeout(r, Math.max(300, MIN_LOADING_MS - (Date.now() - loadStartedAt))));
            setQuestions(data.questions);
            setGameSessionId((prev) => prev + 1);
            setIsPausedExternal(initialPause);

            updateUrlState({
              action: initialPause ? "PAUSED" : "PLAY",
              zoneId: zoneToPlay.id,
              beastId: selectedBeastRef.current.id,
              practice: practiceMode,
            });

            setGameState("PLAYING");
          } else {
            setGameState("HUB");
            updateUrlState({ action: "HUB", replace: true });
            showToast({
              title: "Không thể tải câu hỏi",
              description: "Vui lòng thử lại sau giây lát.",
              type: "error",
            });
          }
        } else {
          setGameState("HUB");
          updateUrlState({ action: "HUB", replace: true });
        }
      } catch {
        setGameState("HUB");
        updateUrlState({ action: "HUB", replace: true });
        showToast({
          title: "Lỗi kết nối",
          description: "Vui lòng kiểm tra đường truyền.",
          type: "error",
        });
      } finally {
        setIsLoadingQuestions(false);
      }
    },
    [stamina, showToast, updateUrlState]
  );

  // Handle direct access / URL refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const playParam = params.get("play");
    const stateParam = params.get("state");
    const beastParam = params.get("beast");
    const modeParam = params.get("mode");

    if (beastParam) {
      const foundBeast = SPIRIT_BEASTS.find((b) => b.id === beastParam);
      if (foundBeast) setSelectedBeast(foundBeast);
    }

    const practiceFlag = modeParam === "practice";
    if (practiceFlag) {
      setIsPractice(true);
    }

    if (playParam) {
      const foundZone = GAME_ZONES.find((z) => z.id === playParam);
      if (!foundZone) {
        showToast({
          title: "Màn chơi không tồn tại",
          description: `Màn chơi "${playParam}" không tồn tại. Đã chuyển về Sảnh chính.`,
          type: "error",
        });
        updateUrlState({ action: "HUB", replace: true });
        return;
      }

      setSelectedZone(foundZone);

      if (stateParam === "result") {
        showToast({
          title: "Chào mừng đến với Yōkai Dash",
          description: "Mời bạn chọn linh thú và xuất trận tại Sảnh.",
          type: "info",
        });
        updateUrlState({ action: "HUB", replace: true });
        return;
      }

      handleStartGame(foundZone, practiceFlag, stateParam === "paused");
    }
  }, [handleStartGame, showToast, updateUrlState]);

  // Handle Browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const playParam = params.get("play");
      const stateParam = params.get("state");

      if (!playParam) {
        // Navigated back to Hub
        setActiveResult(null);
        setIsPausedExternal(false);
        setGameState("HUB");
        return;
      }

      const zone = GAME_ZONES.find((z) => z.id === playParam);
      if (zone) {
        setSelectedZone(zone);
      }

      if (stateParam === "paused") {
        setIsPausedExternal(true);
      } else if (stateParam === "result") {
        // Keep result state if activeResult is present
      } else {
        setIsPausedExternal(false);
        if (gameState !== "PLAYING") {
          handleStartGame(zone, params.get("mode") === "practice");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [gameState, handleStartGame]);

  // Canvas Pause event handler
  const handlePauseChange = useCallback(
    (paused: boolean) => {
      setIsPausedExternal(paused);
      if (paused) {
        updateUrlState({ action: "PAUSED" });
      } else {
        updateUrlState({ action: "PLAY" });
      }
    },
    [updateUrlState]
  );

  const highScoreRef = useRef(highScore);
  highScoreRef.current = highScore;
  const bestComboRef = useRef(bestCombo);
  bestComboRef.current = bestCombo;

  // Finish Game handler
  const handleFinishGame = useCallback(
    async (result: YokaiGameResult) => {
      setActiveResult(result);
      updateUrlState({ action: "RESULT" });

      try {
        const res = await fetch("/api/yokai-dash/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });

        if (res.ok) {
          const data = await res.json();
          setEarnedXP(data.earnedXP);
          setNewTotalXP(data.newTotalXP);
          setNewLevel(data.newLevel);
          setLeveledUp(data.leveledUp);
          setStamina(data.stamina);
          if (Array.isArray(data.unlockedBeastIds)) setUnlockedBeastIds(data.unlockedBeastIds);
          if (Array.isArray(data.dailyQuests)) setDailyQuests(data.dailyQuests);
          if (result.isVictory) {
            setClearedZones((prev) => (prev.includes(result.zoneId) ? prev : [...prev, result.zoneId]));
          }

          if (result.score > highScoreRef.current || (data.highScore && data.highScore > highScoreRef.current)) {
            setHighScore(Math.max(result.score, data.highScore || 0));
          }
          if (result.maxCombo > bestComboRef.current || (data.bestCombo && data.bestCombo > bestComboRef.current)) {
            setBestCombo(Math.max(result.maxCombo, data.bestCombo || 0));
          }

          // Refresh global XP & Streak header
          notifyProgressUpdated();

          showToast({
            title: result.isVictory ? "Chiến thắng rực rỡ!" : "Hoàn thành lượt chạy",
            description: `Bạn nhận được +${data.earnedXP} XP vào tài khoản Nihon Quest!`,
            type: "xp",
            xp: data.earnedXP,
          });
        }
      } catch (err) {
        console.error("Failed to submit Yokai Dash results:", err);
      }
    },
    [showToast, updateUrlState]
  );

  // Play Again handler
  const handlePlayAgain = () => {
    if (!isPractice && stamina <= 0) {
      showToast({
        title: "Hết lượt chạy hôm nay!",
        description: "Hãy bật Chế độ Luyện tập để chơi miễn phí không giới hạn nhé.",
        type: "error",
      });
      return;
    }
    setActiveResult(null);
    setIsPausedExternal(false);
    handleStartGame();
  };

  // Back to Hub handler
  const handleBackToHub = () => {
    setActiveResult(null);
    setIsPausedExternal(false);
    setGameState("HUB");
    updateUrlState({ action: "HUB" });
    loadState();
  };

  // Hide mobile bottom tabbar during active gameplay so virtual controls are unobstructed
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (gameState === "PLAYING" || gameState === "LOADING" || isModuleEntranceLoading || activeResult) {
      document.body.classList.add("yokai-playing");
    } else {
      document.body.classList.remove("yokai-playing");
    }
    return () => {
      document.body.classList.remove("yokai-playing");
    };
  }, [gameState, isModuleEntranceLoading, activeResult]);

  return (
    <div className="w-full">
      <YokaiStyles />

      {/* GAME HUB */}
      {gameState === "HUB" && (
        <YokaiHub
          stamina={stamina}
          maxStamina={maxStamina}
          nextResetIso={nextResetIso}
          selectedZone={selectedZone}
          selectedBeast={selectedBeast}
          unlockedBeastIds={unlockedBeastIds}
          dailyQuests={dailyQuests}
          highScore={highScore}
          bestCombo={bestCombo}
          clearedZones={clearedZones}
          isPractice={isPractice}
          questionMode={questionMode}
          speedDifficulty={speedDifficulty}
          customSpeed={customSpeed}
          onChangeQuestionMode={handleQuestionModeChange}
          onChangeSpeedDifficulty={handleSpeedDifficultyChange}
          onChangeCustomSpeed={handleCustomSpeedChange}
          onSelectZone={setSelectedZone}
          onSelectBeast={setSelectedBeast}
          onTogglePractice={setIsPractice}
          showGateHint={showGateHint}
          onToggleGateHint={handleToggleGateHint}
          onStartGame={() => handleStartGame()}
          isLoadingQuestions={isLoadingQuestions}
        />
      )}

      {/* ENTRANCE LOADING: Chuyển cảnh khi mới bấm vào module Yōkai Dash */}
      {isModuleEntranceLoading && gameState === "HUB" && (
        <YokaiLoadingScreen
          beast={selectedBeast}
          title="Yōkai Dash • 妖怪ダッシュ"
          subtitle="Đang mở cổng Linh Giới Nihon Quest..."
          ready={false}
        />
      )}

      {/* LOADING: ảnh nền toàn màn hình + thanh tiến trình khi xuất trận */}
      {gameState === "LOADING" && (
        <YokaiLoadingScreen beast={selectedBeast} ready={loadReady} />
      )}

      {/* 3D GAMEPLAY CANVAS (Toàn màn hình nhập vai, không bị co kéo hay che khuất giao diện) */}
      {gameState === "PLAYING" && !activeResult && (
        <div className="fixed inset-0 z-30 bg-[#070b17] flex flex-col overflow-hidden">
          <YokaiGameCanvas
            key={`yokai-session-${gameSessionId}`}
            zone={selectedZone}
            beast={selectedBeast}
            questions={questions}
            isPractice={isPractice}
            speedDifficulty={speedDifficulty}
            customSpeed={customSpeed}
            questionMode={questionMode}
            showGateHint={showGateHint}
            onToggleGateHint={handleToggleGateHint}
            isPausedExternal={isPausedExternal}
            onPauseChange={handlePauseChange}
            onFinishGame={handleFinishGame}
            onExitGame={handleBackToHub}
          />
        </div>
      )}

      {/* RESULT MODAL */}
      {activeResult && (
        <YokaiResultModal
          result={activeResult}
          earnedXP={earnedXP}
          newTotalXP={newTotalXP}
          newLevel={newLevel}
          leveledUp={leveledUp}
          stamina={stamina}
          onPlayAgain={handlePlayAgain}
          onBackToHub={handleBackToHub}
        />
      )}
    </div>
  );
}