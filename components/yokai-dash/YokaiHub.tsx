"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  GameZone,
  SpiritBeast,
  DailyQuest,
  YokaiQuestionMode,
  YokaiSpeedDifficulty,
} from "@/lib/yokai-dash/types";
import { GAME_ZONES, SPIRIT_BEASTS } from "@/lib/yokai-dash/constants";
import { YokaiBeastShowcase } from "./YokaiBeastShowcase";
import { YokaiTutorialModal } from "./YokaiTutorialModal";
import { ZoneBanner } from "./ZoneBanner";
import {
  OrnateFrame,
  MagatamaIcon,
  OfudaBadge,
  SeigaihaDecor,
  JapaneseFanIcon,
  SakuraBranchDecor,
} from "./YokaiGameUI";
import { useBeastThumbnails } from "./hooks/useBeastThumbnails";
import { yokaiSound } from "@/lib/yokai-dash/sound";

interface YokaiHubProps {
  stamina: number;
  maxStamina: number;
  nextResetIso: string;
  selectedZone: GameZone;
  selectedBeast: SpiritBeast;
  unlockedBeastIds: string[];
  dailyQuests: DailyQuest[];
  highScore: number;
  bestCombo: number;
  clearedZones?: string[];
  isPractice: boolean;
  questionMode: YokaiQuestionMode;
  speedDifficulty: YokaiSpeedDifficulty;
  customSpeed: number;
  onChangeQuestionMode: (mode: YokaiQuestionMode) => void;
  onChangeSpeedDifficulty: (speed: YokaiSpeedDifficulty) => void;
  onChangeCustomSpeed: (speed: number) => void;
  onSelectZone: (zone: GameZone) => void;
  onSelectBeast: (beast: SpiritBeast) => void;
  onTogglePractice: (isPractice: boolean) => void;
  onStartGame: () => void;
  showGateHint?: boolean;
  onToggleGateHint?: (show: boolean) => void;
  isLoadingQuestions: boolean;
}

/** Silhouette cổng Torii dùng làm hoạ tiết nền thẻ màn chơi */
function ToriiSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden fill="currentColor">
      <path d="M4 14c18 3 34 4 56 4s38-1 56-4l-3 11c-17 2-33 3-53 3S24 27 7 25L4 14z" />
      <rect x="22" y="30" width="76" height="7" rx="2" />
      <rect x="28" y="28" width="9" height="62" rx="2" />
      <rect x="83" y="28" width="9" height="62" rx="2" />
      <rect x="56" y="18" width="8" height="12" />
    </svg>
  );
}

const ELEMENT_META: Record<
  SpiritBeast["element"],
  { label: string; rewardTag: string; badgeClass: string }
> = {
  FIRE: {
    label: "Hỏa Linh",
    rewardTag: "+15% Điểm Combo",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/50",
  },
  WIND: {
    label: "Phong Linh",
    rewardTag: "+0.8s Phản Xạ Cổng",
    badgeClass: "bg-teal-500/20 text-teal-200 border-teal-400/50",
  },
  SPIRIT: {
    label: "Mộc Linh",
    rewardTag: "+25% Thưởng XP",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/50",
  },
  THUNDER: {
    label: "Lôi Linh",
    rewardTag: "Khiên Chắn 1 Va Chạm",
    badgeClass: "bg-yellow-500/20 text-yellow-200 border-yellow-400/50",
  },
  WATER: {
    label: "Băng Linh",
    rewardTag: "Hút Ngọc & x2 Điểm Ngọc",
    badgeClass: "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/50",
  },
};

const VOCAB_QUESTION_MODES: {
  id: YokaiQuestionMode;
  icon: string;
  kanji: string;
  label: string;
  desc: string;
}[] = [
  {
    id: "ALL",
    icon: "🔮",
    kanji: "全",
    label: "Tất cả",
    desc: "Hỗn hợp tất cả dạng bài ôn luyện",
  },
  {
    id: "WORD_BOTH",
    icon: "🈳",
    kanji: "語",
    label: "Từ ⇄ Nghĩa",
    desc: "Từ vựng hai chiều (Nhật ⇄ Việt)",
  },
  {
    id: "WORD_TO_MEANING",
    icon: "📖",
    kanji: "訳",
    label: "Từ → Nghĩa",
    desc: "Nhìn từ tiếng Nhật chọn nghĩa tiếng Việt",
  },
  {
    id: "MEANING_TO_WORD",
    icon: "✍️",
    kanji: "字",
    label: "Nghĩa → Từ",
    desc: "Nhìn nghĩa / âm đọc chọn mặt chữ đúng",
  },
];

const SENTENCE_QUESTION_MODES: {
  id: YokaiQuestionMode;
  icon: string;
  kanji: string;
  label: string;
  desc: string;
}[] = [
  {
    id: "SENTENCE_BOTH",
    icon: "📜",
    kanji: "文",
    label: "Câu ⇄ Nghĩa",
    desc: "Mẫu câu văn hai chiều linh hoạt",
  },
  {
    id: "SENTENCE_TO_MEANING",
    icon: "💬",
    kanji: "解",
    label: "Câu → Nghĩa",
    desc: "Dịch nhanh câu văn tiếng Nhật",
  },
  {
    id: "MEANING_TO_SENTENCE",
    icon: "🎯",
    kanji: "選",
    label: "Nghĩa → Câu",
    desc: "Chọn mẫu câu tiếng Nhật tương ứng",
  },
  {
    id: "LESSON_GRAMMAR",
    icon: "⛩️",
    kanji: "法",
    label: "Ngữ pháp",
    desc: "Cấu trúc & ngữ pháp JLPT theo bài",
  },
];

const QUESTION_MODES = [...VOCAB_QUESTION_MODES, ...SENTENCE_QUESTION_MODES];

interface ModePreviewInfo {
  tag: string;
  desc: string;
  sampleQuestion: string;
  sampleSub: string;
  sampleOptions: [string, string, string];
  correctIndex: number;
}

function getModePreviewInfo(mode: YokaiQuestionMode, level: string): ModePreviewInfo {
  if (level === "KANA") {
    switch (mode) {
      case "MEANING_TO_WORD":
        return {
          tag: "Nhìn âm Romaji ➔ Chọn mặt chữ Kana",
          desc: "Đề bài hiện âm đọc Romaji. Hãy lái Linh thú lướt vào Cổng Torii mang mặt chữ Kana tương ứng!",
          sampleQuestion: "Chữ Hiragana nào phát âm là 'KA'?",
          sampleSub: "Cổng Torii sẽ hiển thị mặt chữ Hiragana / Katakana",
          sampleOptions: ["さ (SA)", "か (KA)", "た (TA)"],
          correctIndex: 1,
        };
      case "WORD_TO_MEANING":
        return {
          tag: "Nhìn mặt chữ Kana ➔ Chọn âm đọc Romaji",
          desc: "Đề bài hiện mặt chữ Kana. Hãy lướt vào Cổng Torii có phiên âm Romaji chính xác!",
          sampleQuestion: "Chữ Hiragana: 'き' phát âm là gì?",
          sampleSub: "Cổng Torii sẽ hiển thị phiên âm Romaji",
          sampleOptions: ["SA", "KI", "KU"],
          correctIndex: 1,
        };
      case "WORD_BOTH":
        return {
          tag: "Kana 2 chiều (Mặt chữ ⇄ Âm đọc)",
          desc: "Luyện phản xạ linh hoạt: xen kẽ giữa nhận diện mặt chữ Kana và chọn phiên âm Romaji.",
          sampleQuestion: "Chữ 'さ' đọc là gì? ⇄ 'SA' là chữ nào?",
          sampleSub: "Đổi qua lại giữa mặt chữ và phiên âm Romaji",
          sampleOptions: ["SA", "TA", "NA"],
          correctIndex: 0,
        };
      case "SENTENCE_TO_MEANING":
      case "SENTENCE_BOTH":
      case "MEANING_TO_SENTENCE":
      case "LESSON_GRAMMAR":
        return {
          tag: "Từ ghép Kana cơ bản",
          desc: "Áp dụng bảng chữ cái Kana vào nhận diện từ ghép thông dụng & đơn vị âm (Mora).",
          sampleQuestion: "Từ ghép 'さくら' đọc là gì và có nghĩa là gì?",
          sampleSub: "Ứng dụng ghép chữ Kana",
          sampleOptions: ["Sakura (Hoa anh đào)", "Neko (Con mèo)", "Inu (Con chó)"],
          correctIndex: 0,
        };
      case "ALL":
      default:
        return {
          tag: "Tổng hợp Bảng chữ cái Kana",
          desc: "Hỗn hợp tất cả câu hỏi nhận diện mặt chữ Kana, phiên âm Romaji và từ ghép cơ bản.",
          sampleQuestion: "Chữ Hiragana: 'あ' đọc là gì? / 'KA' viết thế nào?",
          sampleSub: "Hỗn hợp nhận diện chữ & phát âm",
          sampleOptions: ["A", "I", "U"],
          correctIndex: 0,
        };
    }
  }

  if (level === "LISTENING") {
    switch (mode) {
      case "SENTENCE_TO_MEANING":
      case "SENTENCE_BOTH":
      case "MEANING_TO_SENTENCE":
        return {
          tag: "Nghe câu đàm thoại",
          desc: "Lắng nghe câu chào, câu hỏi mua hàng, thông báo tàu điện ➔ Chọn ý nghĩa tiếng Việt đúng.",
          sampleQuestion: "Nghe câu: 'ありがとうございます' nghĩa là gì?",
          sampleSub: "Nhấn 🔊 để nghe lại âm thanh",
          sampleOptions: ["Xin lỗi", "Cảm ơn rất nhiều", "Tạm biệt"],
          correctIndex: 1,
        };
      default:
        return {
          tag: "Nghe từ vựng & âm thanh",
          desc: "Lắng nghe từ vựng và số đếm phát âm chuẩn Tokyo ➔ Chọn nghĩa tiếng Việt trên Cổng Torii.",
          sampleQuestion: "Nghe phát âm: 'さくら' có nghĩa là gì?",
          sampleSub: "Nhấn 🔊 để nghe lại âm thanh",
          sampleOptions: ["Hoa anh đào", "Con cá", "Rượu Sake"],
          correctIndex: 0,
        };
    }
  }

  // Cấp độ N5, N4, N3
  switch (mode) {
    case "WORD_TO_MEANING":
      return {
        tag: "Từ tiếng Nhật ➔ Nghĩa tiếng Việt",
        desc: "Đề bài hiện từ vựng / Hán tự tiếng Nhật. Lướt vào Cổng Torii mang nghĩa tiếng Việt chuẩn!",
        sampleQuestion: "Từ vựng 'たべる (食べる)' có nghĩa là gì?",
        sampleSub: "Cổng Torii sẽ hiển thị nghĩa tiếng Việt",
        sampleOptions: ["Ăn uống", "Đi lại", "Ngủ nghỉ"],
        correctIndex: 0,
      };
    case "MEANING_TO_WORD":
      return {
        tag: "Nghĩa tiếng Việt ➔ Từ tiếng Nhật",
        desc: "Đề bài hiện nghĩa tiếng Việt. Lướt vào Cổng Torii chứa từ vựng / Hán tự tiếng Nhật tương ứng!",
        sampleQuestion: "Từ tiếng Nhật nào có nghĩa là: 'Thời gian rảnh'?",
        sampleSub: "Cổng Torii sẽ hiển thị từ vựng / Kanji tiếng Nhật",
        sampleOptions: ["ひま (暇)", "いそがしい (忙しい)", "べんきょう (勉強)"],
        correctIndex: 0,
      };
    case "WORD_BOTH":
      return {
        tag: "Từ vựng 2 chiều (Nhật ⇄ Việt)",
        desc: "Đan xen linh hoạt: câu thì nhìn từ Nhật chọn nghĩa Việt, câu thì nhìn nghĩa Việt chọn từ Nhật.",
        sampleQuestion: "'たべる' nghĩa là gì? ⇄ 'Nước uống' là từ nào?",
        sampleSub: "Đổi qua lại giữa tiếng Nhật và tiếng Việt",
        sampleOptions: ["Ăn uống", "Mizu (水)", "Nemuru (眠る)"],
        correctIndex: 0,
      };
    case "SENTENCE_TO_MEANING":
      return {
        tag: "Câu tiếng Nhật ➔ Nghĩa tiếng Việt",
        desc: "Đề bài hiện câu văn tiếng Nhật. Lướt vào Cổng Torii chứa bản dịch tiếng Việt chuẩn xác!",
        sampleQuestion: "Câu '毎日 日本語を 勉強します' có nghĩa là gì?",
        sampleSub: "Cổng Torii sẽ hiển thị bản dịch tiếng Việt",
        sampleOptions: ["Mỗi ngày tôi học tiếng Nhật", "Hôm nay trời rất đẹp", "Tôi đi siêu thị mua đồ"],
        correctIndex: 0,
      };
    case "MEANING_TO_SENTENCE":
      return {
        tag: "Nghĩa tiếng Việt ➔ Mẫu câu Nhật",
        desc: "Đề bài hiện nghĩa câu tiếng Việt. Lướt vào Cổng Torii chứa câu văn tiếng Nhật tương ứng!",
        sampleQuestion: "Câu tiếng Nhật nào diễn đạt: 'Tôi đã mua táo ở siêu thị'?",
        sampleSub: "Cổng Torii sẽ hiển thị các câu tiếng Nhật",
        sampleOptions: [
          "スーパーで りんごを 買いました",
          "学校へ 行きます",
          "部屋で 本を 読みます",
        ],
        correctIndex: 0,
      };
    case "SENTENCE_BOTH":
      return {
        tag: "Mẫu câu 2 chiều (Dịch xuôi ⇄ Dịch ngược)",
        desc: "Luyện phản xạ giao tiếp: xen kẽ giữa dịch câu Nhật sang Việt và chọn câu Nhật tương ứng.",
        sampleQuestion: "Xen kẽ câu Nhật ➔ Dịch Việt và Việt ➔ Dịch Nhật",
        sampleSub: "Luyện tập ngữ cảnh thực tế",
        sampleOptions: ["Câu tiếng Nhật", "Nghĩa tiếng Việt", "Ngữ pháp áp dụng"],
        correctIndex: 0,
      };
    case "LESSON_GRAMMAR":
      return {
        tag: "Ngữ pháp JLPT",
        desc: "Đề bài hiện mẫu ngữ pháp. Lướt vào Cổng Torii giải thích đúng cấu trúc & cách dùng!",
        sampleQuestion: "Mẫu câu '〜てはいけません' dùng để diễn đạt điều gì?",
        sampleSub: "Cấu trúc V-て + はいけません",
        sampleOptions: [
          "Cấm đoán, không được phép làm",
          "Cho phép, có thể làm được",
          "Khuyên nhủ nên thực hiện ngay",
        ],
        correctIndex: 0,
      };
    case "ALL":
    default:
      return {
        tag: "Hỗn hợp toàn diện",
        desc: "Thử thách đỉnh cao: kết hợp ngẫu nhiên cả từ vựng, Hán tự, câu ví dụ và các cấu trúc ngữ pháp JLPT.",
        sampleQuestion: "Tổng hợp từ vựng, Kanji và ngữ pháp theo đề thi",
        sampleSub: "Mọi dạng bài xuất hiện bất ngờ",
        sampleOptions: ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C"],
        correctIndex: 0,
      };
  }
}

const SPEED_MODES: {
  id: YokaiSpeedDifficulty;
  icon: string;
  kanji: string;
  label: string;
  speedDesc: string;
  desc: string;
}[] = [
  {
    id: "EASY",
    icon: "🍃",
    kanji: "易",
    label: "Dễ",
    speedDesc: "10.5 m/s",
    desc: "Gia tốc êm ái, thích hợp vừa học vừa thư giãn",
  },
  {
    id: "MEDIUM",
    icon: "⚔️",
    kanji: "中",
    label: "Vừa sức",
    speedDesc: "14.0 m/s",
    desc: "Tốc độ chuẩn kích thích phản xạ lướt cổng",
  },
  {
    id: "CUSTOM",
    icon: "⚙️",
    kanji: "自",
    label: "Tự chọn",
    speedDesc: "Tuỳ chỉnh",
    desc: "Tự tay điều chỉnh vận tốc chạy theo ý muốn",
  },
];

export function YokaiHub({
  stamina,
  maxStamina,
  nextResetIso,
  selectedZone,
  selectedBeast,
  unlockedBeastIds,
  dailyQuests,
  highScore,
  bestCombo,
  clearedZones = [],
  isPractice,
  questionMode,
  speedDifficulty,
  customSpeed,
  onChangeQuestionMode,
  onChangeSpeedDifficulty,
  onChangeCustomSpeed,
  onSelectZone,
  onSelectBeast,
  onTogglePractice,
  onStartGame,
  showGateHint = true,
  onToggleGateHint,
  isLoadingQuestions,
}: YokaiHubProps) {
  const [activeTab, setActiveTab] = useState<"zones" | "beasts" | "quests">("zones");
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showLiveExample, setShowLiveExample] = useState<boolean>(false);

  const thumbs = useBeastThumbnails(SPIRIT_BEASTS);

  const formatTimeUntilReset = () => {
    try {
      const resetTime = new Date(nextResetIso).getTime();
      if (Number.isNaN(resetTime)) return "--";
      const diffMs = Math.max(0, resetTime - Date.now());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m`;
    } catch {
      return "--";
    }
  };

  const isSelectedBeastUnlocked = unlockedBeastIds.includes(selectedBeast.id);
  const canPlay = isPractice || stamina > 0;
  const doneQuests = useMemo(() => dailyQuests.filter((q) => q.completed).length, [dailyQuests]);

  const handleSelectBeastWithSound = (beast: SpiritBeast) => {
    onSelectBeast(beast);
    yokaiSound.playDash();
  };

  const handleSelectZoneWithSound = (zone: GameZone) => {
    onSelectZone(zone);
    yokaiSound.playHyoshigiClap();
  };

  const tabs = [
    { id: "zones" as const, icon: "⛩️", label: "Thế Giới Linh Giới", count: GAME_ZONES.length },
    {
      id: "beasts" as const,
      icon: "🦊",
      label: "Bộ Sưu Tập Linh Thú",
      count: `${unlockedBeastIds.length}/${SPIRIT_BEASTS.length}`,
    },
    {
      id: "quests" as const,
      icon: "📜",
      label: "Nhiệm Vụ Ngày",
      count: `${doneQuests}/${dailyQuests.length || 3}`,
    },
  ];

  const selectedElementMeta = ELEMENT_META[selectedBeast.element] || ELEMENT_META.FIRE;

  return (
    <div className="yk-ui w-full max-w-6xl mx-auto space-y-5 pb-24 sm:pb-12">
      {/* ================= HERO: KITSUNE 3D + COMPACT STATS & CTA ================= */}
      <OrnateFrame className="rounded-[1.6rem]">
        <section className="relative isolate overflow-hidden rounded-[1.6rem] border border-amber-400/30 text-white shadow-[0_26px_80px_-30px_rgba(190,24,93,0.65)] bg-[radial-gradient(ellipse_at_85%_85%,rgba(225,29,72,0.28),transparent_52%),radial-gradient(ellipse_at_15%_15%,rgba(20,184,166,0.16),transparent_45%),linear-gradient(135deg,#0d0722_0%,#1c0e32_52%,#341028_100%)] p-4 sm:p-6 lg:p-7">
          {/* Hoạ tiết nền Torii */}
          <ToriiSilhouette className="absolute -right-6 bottom-0 w-[20rem] text-rose-400/[0.07] pointer-events-none" />
          <div className="absolute -top-24 left-1/3 w-80 h-80 rounded-full bg-amber-500/10 blur-[90px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
            {/* LEFT: Sân khấu 3D Kitsune & Chọn nhanh Linh Thú */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="w-full max-w-md mx-auto">
                <YokaiBeastShowcase beast={selectedBeast} isUnlocked={isSelectedBeastUnlocked} />

                {/* Bộ chọn nhanh linh thú ngay dưới sân khấu 3D */}
                <div className="mt-2.5 flex items-center justify-between gap-2 bg-black/35 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="yk-display text-sm sm:text-base font-extrabold text-amber-200 truncate">
                        {selectedBeast.avatarIcon} {selectedBeast.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${selectedElementMeta.badgeClass}`}
                      >
                        {selectedElementMeta.rewardTag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">⚡ {selectedBeast.perk}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Đổi nhanh linh thú">
                    {SPIRIT_BEASTS.map((b) => {
                      const unlocked = unlockedBeastIds.includes(b.id);
                      const active = selectedBeast.id === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => unlocked && handleSelectBeastWithSound(b)}
                          disabled={!unlocked}
                          title={unlocked ? `Chọn ${b.name}` : `${b.name} (${b.unlockRequirement})`}
                          className={`w-8 h-8 rounded-xl text-sm flex items-center justify-center border transition ${
                            active
                              ? "bg-amber-400/25 border-amber-300 scale-105 shadow-[0_0_12px_rgba(251,191,36,.5)]"
                              : unlocked
                              ? "bg-white/5 border-white/15 hover:bg-white/15"
                              : "bg-black/40 border-white/5 opacity-40 cursor-not-allowed"
                          }`}
                        >
                          {b.avatarIcon}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Tiêu đề, Thanh Kỷ lục/Combo/Thể lực gọn & CTA */}
            <div className="lg:col-span-7 flex flex-col gap-4 justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <Link
                    href="/app"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-100 text-xs font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    ← Về Dashboard
                  </Link>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-600/25 border border-rose-400/50 text-rose-200 text-xs font-extrabold">
                    ⛩️ Nihon Quest 3D
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-200 text-xs font-bold">
                    ✨ Học & Phản Xạ JLPT
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTutorial(true)}
                    className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    📖 Luật Chơi
                  </button>
                </div>

                <h1 className="yk-display flex flex-wrap items-baseline gap-x-3 gap-y-1 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-[0_6px_24px_rgba(244,63,94,0.35)]">
                  Yōkai Dash
                  <span className="text-xl sm:text-2xl text-amber-300 font-semibold">妖怪ダッシュ</span>
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-xl">
                  Hoá thân thành linh thú Kitsune phi nước đại qua hàng ngàn cổng Torii đỏ son. Né chướng ngại vật
                  theo 3 làn và bức phá qua đúng cánh cổng đáp án tiếng Nhật!
                </p>
              </div>

              {/* Cụm thông tin Kỷ lục / Combo / Thể lực gọn gàng */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Thể lực */}
                <div className="col-span-2 rounded-2xl border border-amber-300/25 bg-black/40 backdrop-blur-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-amber-200 uppercase tracking-wider">
                        Thể lực
                      </span>
                      <span className="text-[10px] text-slate-300">• Hồi {formatTimeUntilReset()}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {Array.from({ length: maxStamina }).map((_, i) => (
                        <MagatamaIcon key={i} filled={i < stamina} size={24} />
                      ))}
                      <span className="ml-1 text-sm font-extrabold text-white tabular-nums">
                        {stamina}/{maxStamina}
                      </span>
                    </div>
                  </div>

                  <label
                    htmlFor="practice-toggle"
                    className="flex flex-col items-end gap-1 cursor-pointer select-none border-l border-white/10 pl-3"
                    title="Bật chế độ luyện tập miễn phí không tốn thể lực"
                  >
                    <span className="text-[10px] font-bold text-teal-300">🍃 Luyện tập</span>
                    <input
                      id="practice-toggle"
                      type="checkbox"
                      checked={isPractice}
                      onChange={(e) => onTogglePractice(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className="relative w-10 h-5 rounded-full bg-slate-700 peer-checked:bg-teal-500 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-amber-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
                    />
                  </label>
                </div>

                {/* Kỷ lục điểm */}
                <div className="rounded-2xl border border-white/10 bg-black/35 px-3.5 py-2.5 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-300 font-semibold">🏆 Kỷ lục điểm</span>
                  <span className="yk-display text-xl font-extrabold text-amber-300 tabular-nums mt-0.5">
                    {highScore.toLocaleString()}
                  </span>
                </div>

                {/* Chuỗi Combo */}
                <div className="rounded-2xl border border-white/10 bg-black/35 px-3.5 py-2.5 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-300 font-semibold">🔥 Combo cao nhất</span>
                  <span className="yk-display text-xl font-extrabold text-rose-300 tabular-nums mt-0.5">
                    x{bestCombo}
                  </span>
                </div>
              </div>

              {/* Phím xuất trận nhanh trên di động (không cần cuộn xuống đáy) */}
              <div className="flex sm:hidden items-center justify-between gap-2 p-2.5 rounded-2xl bg-black/45 border border-amber-300/35 backdrop-blur-md">
                <div className="min-w-0">
                  <div className="text-[10px] text-amber-300 font-extrabold uppercase truncate">
                    ⛩️ {selectedZone.nameVi} ({selectedZone.level})
                  </div>
                  <div className="text-[11px] text-slate-200 truncate font-semibold">
                    {selectedBeast.avatarIcon} {selectedBeast.name} • {isPractice ? "Luyện tập" : `${stamina}/${maxStamina} Thể lực`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onStartGame}
                  disabled={!canPlay || isLoadingQuestions}
                  className="yk-launch yk-display shrink-0 px-4 py-2 rounded-xl text-xs font-black text-white border border-amber-300/80 bg-[linear-gradient(180deg,#fb4a6b,#e11d48_45%,#9f1239)] shadow-md active:scale-95 transition disabled:opacity-50"
                >
                  {isLoadingQuestions ? "Đang tải…" : canPlay ? "⛩️ Vào Ngay" : "Hết lượt"}
                </button>
              </div>

              {/* ================= THIẾT LẬP CHIẾN THUẬT: LOẠI CÂU HỎI & TỐC ĐỘ DI CHUYỂN ================= */}
              <div className="relative overflow-hidden rounded-2xl border border-amber-300/30 bg-[linear-gradient(145deg,rgba(20,10,40,0.88),rgba(38,12,42,0.82))] p-3.5 sm:p-4 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl">
                <SeigaihaDecor className="opacity-15 pointer-events-none" />
                <SakuraBranchDecor className="absolute -top-3 -right-3 w-28 h-24 text-rose-300/30 pointer-events-none" />

                {/* Tiêu đề cụm thiết lập */}
                <div className="relative z-10 flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <JapaneseFanIcon className="w-5 h-4 text-amber-300" />
                    <span className="yk-display text-xs sm:text-sm font-extrabold text-amber-200 uppercase tracking-wider">
                      Tuỳ Chỉnh Lượt Chạy • 出陣設定
                    </span>
                  </div>
                  <OfudaBadge text="Phong Ấn" kanji="道" color="amber" className="scale-90" />
                </div>

                {/* 1. LOẠI CÂU HỎI & NỘI DUNG ÔN LUYỆN */}
                <div className="relative z-10 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-bold">
                    <span className="text-amber-300 flex items-center gap-1.5">
                      <span>📜 Thể thức câu hỏi:</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 border border-amber-400/40 font-bold">
                        {getModePreviewInfo(questionMode, selectedZone.level).tag}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Cõi: <strong className="text-amber-300 font-extrabold">{selectedZone.nameVi}</strong> ({selectedZone.level})
                    </span>
                  </div>

                  {/* NHÓM 1: TỪ VỰNG & BẢNG CHỮ CÁI KANA */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <span>🈳 Từ vựng & Ký tự {selectedZone.level === "KANA" ? "(Khuyên dùng cho cõi này)" : ""}</span>
                      <span className="text-[9px] text-amber-400/80 font-normal">4 thể thức cơ bản</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5" role="radiogroup" aria-label="Chọn thể thức từ vựng và ký tự">
                      {VOCAB_QUESTION_MODES.map((mode) => {
                        const active = questionMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              onChangeQuestionMode(mode.id);
                              yokaiSound.playClick();
                            }}
                            className={`group text-left px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                              active
                                ? "bg-[linear-gradient(135deg,#e11d48,#9f1239)] border-amber-300 text-white shadow-[0_0_14px_rgba(244,63,94,0.65)] ring-1 ring-amber-300/60"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
                            }`}
                          >
                            <span className="text-sm shrink-0">{mode.icon}</span>
                            <div className="min-w-0">
                              <div className="truncate text-[11px] sm:text-xs font-black">{mode.label}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* NHÓM 2: MẪU CÂU & NGỮ PHÁP */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <span>⛩️ Mẫu câu & Ngữ pháp {selectedZone.level === "KANA" ? "(Ứng dụng nâng cao)" : "(JLPT N5-N3)"}</span>
                      <span className="text-[9px] text-teal-400/80 font-normal">4 thể thức câu</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5" role="radiogroup" aria-label="Chọn thể thức mẫu câu và ngữ pháp">
                      {SENTENCE_QUESTION_MODES.map((mode) => {
                        const active = questionMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              onChangeQuestionMode(mode.id);
                              yokaiSound.playClick();
                            }}
                            className={`group text-left px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                              active
                                ? "bg-[linear-gradient(135deg,#e11d48,#9f1239)] border-amber-300 text-white shadow-[0_0_14px_rgba(244,63,94,0.65)] ring-1 ring-amber-300/60"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/15 hover:text-white"
                            }`}
                          >
                            <span className="text-sm shrink-0">{mode.icon}</span>
                            <div className="min-w-0">
                              <div className="truncate text-[11px] sm:text-xs font-black">{mode.label}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LIVE PREVIEW: MINH HỌA VÍ DỤ TRỰC QUAN CÂU HỎI VÀ 3 CỔNG TORII */}
                  {(() => {
                    const preview = getModePreviewInfo(questionMode, selectedZone.level);
                    return (
                      <div className="p-2.5 sm:p-3 rounded-xl bg-black/45 border border-amber-400/35 backdrop-blur-md space-y-2">
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs shrink-0">💡</span>
                            <span className="font-extrabold text-amber-300 shrink-0">
                              Ví dụ cách chơi:
                            </span>
                            <span className="text-[10px] text-slate-300 truncate">
                              {preview.desc}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowLiveExample((v) => !v)}
                            className="sm:hidden shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-300/30"
                          >
                            {showLiveExample ? "Thu gọn ▲" : "Xem mẫu cổng ▼"}
                          </button>
                        </div>

                        {/* Khung mô phỏng HUD khi chạy */}
                        <div className={`${showLiveExample ? "block" : "hidden sm:block"} rounded-lg bg-slate-950/80 border border-white/10 p-2 sm:p-2.5 space-y-2 animate-in fade-in duration-150`}>
                          {/* Bảng câu hỏi mô phỏng */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-900/90 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs shrink-0">📜 Đề bài:</span>
                              <span className="text-xs font-extrabold text-white truncate">
                                {preview.sampleQuestion}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-semibold self-start sm:self-auto shrink-0">
                              {preview.sampleSub}
                            </span>
                          </div>

                          {/* 3 Cổng Torii mô phỏng trước mắt */}
                          <div className="grid grid-cols-3 gap-1.5 text-center">
                            {preview.sampleOptions.map((opt, idx) => {
                              const isCorrect = idx === preview.correctIndex;
                              return (
                                <div
                                  key={idx}
                                  className={`rounded-lg p-1.5 sm:p-2 border transition flex flex-col items-center justify-center relative overflow-hidden ${
                                    isCorrect
                                      ? "bg-[linear-gradient(180deg,rgba(245,185,66,0.22),rgba(225,29,72,0.25))] border-amber-400 text-amber-100 ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(245,185,66,0.35)]"
                                      : "bg-black/30 border-white/10 text-slate-400 opacity-70"
                                  }`}
                                >
                                  <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                                    <span>⛩️ Cổng {idx + 1}</span>
                                    {isCorrect && (
                                      <span className="text-[9px] px-1 rounded bg-amber-400 text-slate-950 font-black">
                                        ĐÚNG
                                      </span>
                                    )}
                                  </div>
                                  <span className={`yk-display text-xs sm:text-sm font-extrabold ${isCorrect ? "text-amber-200" : "text-slate-300"}`}>
                                    {opt}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-[9px] text-amber-300/90 font-semibold mt-0.5 animate-pulse">
                                      ⚡ Lướt vào đây!
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. TỐC ĐỘ DI CHUYỂN (Chỉ Dễ, Vừa sức, Tự chọn - KHÔNG CÓ KHÓ) */}
                <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-teal-300 flex items-center gap-1">
                      <span>⚡ Tốc độ di chuyển:</span>
                      <span className="text-slate-300 font-normal">
                        {speedDifficulty === "EASY" && "10.5 m/s (Tăng dần êm ái)"}
                        {speedDifficulty === "MEDIUM" && "14.0 m/s (Bứt tốc kích thích)"}
                        {speedDifficulty === "CUSTOM" && `${customSpeed.toFixed(1)} m/s (Người chơi tự chỉnh)`}
                      </span>
                    </span>
                    <span className="text-[10px] text-amber-200/80 font-normal">🍃 Tự tăng tốc theo chuỗi né</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Chọn tốc độ chạy">
                    {SPEED_MODES.map((sm) => {
                      const active = speedDifficulty === sm.id;
                      return (
                        <button
                          key={sm.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => {
                            onChangeSpeedDifficulty(sm.id);
                            yokaiSound.playClick();
                          }}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 ${
                            active
                              ? "bg-teal-500/25 border-teal-300 text-teal-100 shadow-[0_0_12px_rgba(20,184,166,0.45)] ring-1 ring-teal-300/50"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{sm.icon}</span>
                            <span className="font-extrabold">{sm.label}</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                              active
                                ? "bg-black/35 text-teal-200 border-teal-300/50"
                                : "bg-black/20 text-slate-400 border-white/10"
                            }`}
                          >
                            {sm.id === "CUSTOM" ? `${customSpeed.toFixed(1)} m/s` : sm.speedDesc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Khi chọn TỰ CHỌN: Thanh trượt tốc độ m/s tương tác */}
                  {speedDifficulty === "CUSTOM" && (
                    <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-teal-400/30 backdrop-blur-md">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-teal-300 font-extrabold">⚙️ Tốc độ mong muốn:</span>
                          <span className="yk-display text-sm font-black text-amber-300 tabular-nums">
                            {customSpeed.toFixed(1)} m/s
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-300">
                          {customSpeed < 11.5
                            ? "🍃 Nhẹ nhàng, thư thả đọc chữ"
                            : customSpeed <= 16.5
                            ? "⚔️ Nhịp chuẩn, phản xạ tốt"
                            : "🌪️ Thần tốc, đòi hỏi tay lái lụa"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-bold shrink-0">8.0 m/s</span>
                        <input
                          type="range"
                          min="8"
                          max="24"
                          step="0.5"
                          value={customSpeed}
                          onChange={(e) => onChangeCustomSpeed(parseFloat(e.target.value))}
                          aria-label="Điều chỉnh tốc độ chạy tự chọn"
                          className="w-full accent-teal-400 cursor-pointer h-2 bg-slate-700/80 rounded-lg"
                        />
                        <span className="text-[11px] text-slate-400 font-bold shrink-0">24.0 m/s</span>
                      </div>

                      {/* Phím bấm chọn nhanh tốc độ */}
                      <div className="mt-2.5 flex items-center justify-end gap-1.5">
                        <span className="text-[10px] text-slate-400 mr-1">Chọn nhanh:</span>
                        {[
                          { label: "10 m/s", val: 10 },
                          { label: "14 m/s", val: 14 },
                          { label: "18 m/s", val: 18 },
                          { label: "22 m/s", val: 22 },
                        ].map((p) => (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => {
                              onChangeCustomSpeed(p.val);
                              yokaiSound.playClick();
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition ${
                              customSpeed === p.val
                                ? "bg-teal-400 text-slate-950 border-teal-300"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/15"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. VÒNG VÀNG GỢI Ý ĐÁP ÁN ĐÚNG (Bật / Tắt theo nhu cầu thử thách) */}
                  <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-amber-300 flex items-center gap-1">
                        <span>🔮 Gợi ý Cổng đáp án đúng:</span>
                        <span className="text-slate-300 font-normal">
                          {showGateHint ? "Vòng phát sáng vàng dẫn đường" : "Cả 3 cổng giống hệt nhau"}
                        </span>
                      </span>
                      <span className="text-[10px] text-amber-200/80 font-normal">
                        {showGateHint ? "🌟 Dễ làm quen" : "🎯 Thử thách JLPT"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Gợi ý vòng vàng đáp án đúng">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={showGateHint}
                        onClick={() => {
                          onToggleGateHint?.(true);
                          yokaiSound.playClick();
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                          showGateHint
                            ? "bg-amber-500/25 border-amber-300 text-amber-100 shadow-[0_0_12px_rgba(245,185,66,0.45)] ring-1 ring-amber-300/50"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>🌟</span>
                          <span className="font-extrabold">BẬT (Có vòng vàng)</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                            showGateHint
                              ? "bg-black/35 text-amber-200 border-amber-300/50"
                              : "bg-black/20 text-slate-400 border-white/10"
                          }`}
                        >
                          Mặc định
                        </span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={!showGateHint}
                        onClick={() => {
                          onToggleGateHint?.(false);
                          yokaiSound.playClick();
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${
                          !showGateHint
                            ? "bg-rose-500/25 border-rose-300 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.45)] ring-1 ring-rose-300/50"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>🎯</span>
                          <span className="font-extrabold">TẮT (Tự suy luận)</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                            !showGateHint
                              ? "bg-black/35 text-rose-200 border-rose-300/50"
                              : "bg-black/20 text-slate-400 border-white/10"
                          }`}
                        >
                          Thử thách
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thanh chọn màn hiện tại + Nút CTA Xuất Trận */}
              <div className="rounded-2xl border border-amber-300/30 bg-[linear-gradient(90deg,rgba(15,10,34,.85),rgba(46,12,36,.85))] p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-xs font-black text-white border border-amber-300/50 shadow-inner"
                    style={{ backgroundColor: selectedZone.gateColor }}
                  >
                    {selectedZone.level}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                      Cõi đang chọn • {isPractice ? "Chế độ Luyện tập (Miễn phí)" : "Chế độ Tính Điểm & XP"}
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white truncate">
                      {selectedZone.nameVi}{" "}
                      <span className="text-xs font-normal text-slate-300">({selectedZone.nameJa})</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onStartGame}
                  disabled={!canPlay || isLoadingQuestions}
                  className={`yk-launch yk-display shrink-0 w-full sm:w-auto px-7 py-3.5 rounded-xl text-base sm:text-lg font-extrabold tracking-wide border-2 transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                    canPlay
                      ? "text-white border-amber-300/90 bg-[linear-gradient(180deg,#fb4a6b_0%,#e11d48_48%,#9f1239_100%)] shadow-[0_12px_34px_-8px_rgba(225,29,72,0.9),inset_0_1px_0_rgba(255,255,255,.45)] hover:brightness-110"
                      : "text-rose-200/50 border-rose-400/20 bg-rose-900/30 cursor-not-allowed"
                  }`}
                >
                  {isLoadingQuestions
                    ? "Đang chuẩn bị…"
                    : canPlay
                    ? "⛩️ XUẤT TRẬN NGAY"
                    : "⚡ HẾT THỂ LỰC (BẬT LUYỆN TẬP)"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </OrnateFrame>

      {/* ================= TABS ================= */}
      <div
        role="tablist"
        aria-label="Danh mục Yōkai Dash"
        className="yk-scroll-none flex gap-2 overflow-x-auto border-b border-slate-300/60 dark:border-white/10 pb-2.5"
      >
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(t.id)}
              className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
                active
                  ? "text-white bg-[linear-gradient(180deg,#fb4a6b,#e11d48)] shadow-[0_10px_24px_-10px_rgba(225,29,72,.9)] border border-amber-300/60"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/10 border border-transparent"
              }`}
            >
              <span aria-hidden>{t.icon}</span>
              <span>{t.label}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  active ? "bg-black/25 text-amber-200" : "bg-slate-900/10 dark:bg-white/10"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: THẾ GIỚI LINH GIỚI ================= */}
      {activeTab === "zones" && (
        <div role="tabpanel" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAME_ZONES.map((z) => {
            const isSelected = selectedZone.id === z.id;
            const isCleared = clearedZones.includes(z.id);
            return (
              <div
                key={z.id}
                onClick={() => handleSelectZoneWithSound(z)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectZoneWithSound(z);
                  }
                }}
                aria-pressed={isSelected}
                className={`group cursor-pointer text-left rounded-[1.4rem] overflow-hidden border-2 transition duration-200 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-amber-400 shadow-[0_16px_42px_-16px_rgba(244,63,94,.75)] ring-1 ring-amber-300/50"
                    : "border-slate-200/80 dark:border-white/10 hover:border-rose-400/60 shadow-md"
                }`}
              >
                {/* Banner cảnh quan của màn chơi (vẽ riêng cho từng map) */}
                <div className="relative h-36 sm:h-40 overflow-hidden">
                  <ZoneBanner
                    zone={z}
                    className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/65 to-transparent" aria-hidden />
                  <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-black/65 text-amber-200 border border-amber-300/40 backdrop-blur">
                      Cấp {z.level}
                    </span>
                    {isCleared && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-200 border border-teal-400/40">
                        ✓ Đã chinh phục
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="absolute bottom-2 right-3 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-600 text-white border border-amber-200/60 shadow">
                      ✓ Đang chọn
                    </span>
                  )}
                </div>

                <div className="p-4 bg-white dark:bg-[#140d2b] flex-1 flex flex-col justify-between">
                  <div>
                    <div className="yk-display text-xs font-bold text-rose-500 dark:text-amber-300/90">{z.nameJa}</div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {z.nameVi}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300/80 mt-1.5 line-clamp-2">
                      {z.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">🎵 Âm hưởng: {z.bgmTone}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectZoneWithSound(z);
                        if (canPlay && !isLoadingQuestions) {
                          setTimeout(() => onStartGame(), 40);
                        }
                      }}
                      className="font-extrabold text-rose-600 dark:text-amber-300 hover:underline"
                    >
                      {isSelected ? "Chạy ngay →" : "Chọn cõi →"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TAB 2: BỘ SƯU TẬP LINH THÚ (CHUẨN HÓA THẺ) ================= */}
      {activeTab === "beasts" && (
        <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SPIRIT_BEASTS.map((beast) => {
            const isUnlocked = unlockedBeastIds.includes(beast.id);
            const isSelected = selectedBeast.id === beast.id;
            const thumb = thumbs[beast.id];
            const elMeta = ELEMENT_META[beast.element] || ELEMENT_META.FIRE;

            return (
              <div
                key={beast.id}
                onClick={() => isUnlocked && handleSelectBeastWithSound(beast)}
                role="button"
                tabIndex={isUnlocked ? 0 : -1}
                onKeyDown={(e) => {
                  if (isUnlocked && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleSelectBeastWithSound(beast);
                  }
                }}
                aria-pressed={isSelected}
                aria-disabled={!isUnlocked}
                className={`rounded-[1.4rem] border-2 overflow-hidden flex flex-col justify-between transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isUnlocked ? "cursor-pointer hover:-translate-y-0.5" : "opacity-90"
                } ${
                  isSelected
                    ? "border-amber-400 bg-[linear-gradient(145deg,#160d30,#2d102c)] text-white shadow-[0_18px_46px_-18px_rgba(244,63,94,.75)] ring-1 ring-amber-300/40"
                    : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#140d2b] text-slate-900 dark:text-white shadow-md"
                }`}
              >
                {/* Phần đầu thẻ: Khung 3D Thumbnail + Trạng thái mở khóa + Nguyên tố */}
                <div>
                  <div className="relative h-40 bg-[radial-gradient(ellipse_at_50%_70%,rgba(244,63,94,0.22),transparent_65%),linear-gradient(160deg,#0d0722,#1f1138)] flex items-center justify-center overflow-hidden border-b border-white/10">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={beast.name}
                        className={`h-36 w-auto object-contain transition-transform duration-300 ${
                          isUnlocked ? "hover:scale-105" : "brightness-[.35] grayscale"
                        }`}
                        draggable={false}
                      />
                    ) : (
                      <div className="text-6xl select-none">{beast.avatarIcon}</div>
                    )}

                    {/* Badge Nguyên tố góc trái trên */}
                    <span
                      className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${elMeta.badgeClass}`}
                    >
                      {beast.avatarIcon} {elMeta.label}
                    </span>

                    {/* Badge Trạng thái mở khóa góc phải trên */}
                    {isUnlocked ? (
                      <span
                        className={`absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isSelected
                            ? "bg-amber-400 text-slate-950 border-amber-200 shadow"
                            : "bg-teal-950/85 text-teal-200 border-teal-400/40"
                        }`}
                      >
                        {isSelected ? "✓ Đang đồng hành" : "Đã mở khóa"}
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-200 border border-rose-400/40">
                        🔒 Chưa mở khóa
                      </span>
                    )}

                    {/* Nhãn phần thưởng tóm tắt góc dưới phải */}
                    <span className="absolute bottom-2 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-black/65 text-amber-300 border border-amber-300/30">
                      🎁 {elMeta.rewardTag}
                    </span>
                  </div>

                  {/* Nội dung thông tin Linh Thú */}
                  <div className="p-4 pb-2">
                    <h3 className="yk-display text-lg font-extrabold leading-snug">{beast.name}</h3>
                    <div className="text-xs font-bold text-rose-500 dark:text-amber-300 mt-0.5">{beast.title}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300/85 mt-1.5 line-clamp-2">
                      {beast.description}
                    </p>

                    {/* Hộp Kỹ năng & Phần thưởng chuẩn hóa */}
                    <div
                      className={`mt-3 rounded-xl p-2.5 text-xs border ${
                        isSelected
                          ? "bg-black/30 border-amber-300/30 text-amber-100"
                          : "bg-slate-50 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-extrabold text-amber-600 dark:text-amber-300">⚡ Kỹ năng hộ mệnh</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-600 dark:text-teal-300">
                          {elMeta.rewardTag}
                        </span>
                      </div>
                      <div className="text-[11px] leading-relaxed opacity-95">{beast.perk}</div>
                    </div>
                  </div>
                </div>

                {/* Chân thẻ: Trạng thái / Điều kiện mở khóa */}
                <div className="px-4 py-3 mt-1 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  {isUnlocked ? (
                    <>
                      <span className="text-slate-400 text-[11px]">Sẵn sàng xuất trận</span>
                      <span
                        className={`font-extrabold ${
                          isSelected ? "text-teal-400" : "text-rose-500 dark:text-amber-300"
                        }`}
                      >
                        {isSelected ? "✓ Đang chọn" : "Chọn linh thú →"}
                      </span>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-rose-500 dark:text-rose-300 font-bold truncate">
                        🔒 {beast.unlockRequirement}
                      </span>
                      {beast.requiredXp && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-extrabold border border-amber-400/30">
                          {beast.requiredXp} XP
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TAB 3: NHIỆM VỤ NGÀY ================= */}
      {activeTab === "quests" && (
        <div role="tabpanel" className="space-y-3">
          {dailyQuests.length > 0 && (
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 px-1">
              <span>Đã hoàn thành {doneQuests}/{dailyQuests.length} nhiệm vụ hôm nay</span>
              <span className="text-amber-500 dark:text-amber-300">Tự động cộng thưởng XP khi hoàn thành màn</span>
            </div>
          )}
          {dailyQuests.map((q) => {
            const pct = Math.min(100, Math.round((q.current / Math.max(1, q.target)) * 100));
            return (
              <div
                key={q.id}
                className={`p-4 sm:p-5 rounded-[1.25rem] border-2 flex items-center gap-4 ${
                  q.completed
                    ? "bg-teal-50/90 dark:bg-teal-950/30 border-teal-400/50"
                    : "bg-white dark:bg-[#140d2b] border-slate-200 dark:border-white/10"
                }`}
              >
                <span className="text-2xl w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400/25 to-rose-500/20 border border-amber-300/30 flex items-center justify-center">
                  {q.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                    {q.title}
                    {q.completed && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500 text-white">
                        ✓ Đã nhận thưởng
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{q.description}</div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        q.completed ? "bg-teal-400" : "bg-gradient-to-r from-amber-400 to-rose-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-amber-500 dark:text-amber-300">+{q.rewardXP} XP</div>
                  <div className="text-xs text-slate-400 tabular-nums font-bold">
                    {q.current}/{q.target}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <YokaiTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onStartPlaying={() => {
          setShowTutorial(false);
          onStartGame();
        }}
      />

      {/* ================= THANH XUẤT TRẬN CỐ ĐỊNH DƯỚI ĐÁY TRÊN DI ĐỘNG ================= */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 p-2.5 bg-[#0d0722]/95 border-t border-amber-300/30 backdrop-blur-xl flex items-center justify-between gap-2 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black text-white border border-amber-300/40 shadow-inner"
            style={{ backgroundColor: selectedZone.gateColor }}
          >
            {selectedZone.level}
          </span>
          <div className="min-w-0">
            <div className="text-[11px] text-amber-300 font-extrabold truncate">
              {selectedZone.nameVi}
            </div>
            <div className="text-[10px] text-slate-300 truncate">
              {selectedBeast.avatarIcon} {selectedBeast.name} • {isPractice ? "Tập luyện" : `${stamina}/${maxStamina} Thể lực`}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartGame}
          disabled={!canPlay || isLoadingQuestions}
          className="yk-launch yk-display shrink-0 px-4 py-2 rounded-xl text-xs font-black text-white border border-amber-300/80 bg-[linear-gradient(180deg,#fb4a6b,#e11d48_45%,#9f1239)] shadow-md active:scale-95 transition disabled:opacity-50"
        >
          {isLoadingQuestions ? "Đang chuẩn bị…" : canPlay ? "⛩️ XUẤT TRẬN" : "HẾT THỂ LỰC"}
        </button>
      </div>
    </div>
  );
}