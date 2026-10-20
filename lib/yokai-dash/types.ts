export type YokaiLevel = "KANA" | "N5" | "N4" | "N3" | "LISTENING";

export type ObstacleAction = "JUMP" | "SLIDE" | "SWITCH_LANE";

export type ObstacleType =
  // JUMP: Nhảy qua (Hố, đèn lồng thấp, hàng rào tre thấp)
  | "LANTERN_LOW"
  | "BAMBOO_HURDLE"
  | "VOID_PIT"
  // SLIDE: Trượt dưới (Dây thừng Shimenawa, xà gỗ chắn ngang, cổng thấp)
  | "SHIMENAWA_HIGH"
  | "WOODEN_BEAM"
  | "LOW_GATE"
  // SWITCH_LANE: Đổi làn (Tảng đá phong ấn, cây cổ thụ đổ, đường sập chắn lối)
  | "SEAL_ROCK"
  | "FALLEN_TREE"
  | "COLLAPSED_ROAD"
  | "FOX_FIRE_ORB"
  | "BAMBOO_BARRIER";

export type CollectibleType = "MAGATAMA_JEWEL" | "SPIRIT_ORB";

export interface SpawnedObstacleSpec {
  type: ObstacleType;
  action: ObstacleAction;
  lane: 0 | 1 | 2;
  z: number;
}

export interface SpawnedCollectibleSpec {
  type: CollectibleType;
  lane: 0 | 1 | 2;
  y: number;
  z: number;
  points: number;
}


export type YokaiQuestionMode =
  | "ALL"                 // Tất cả & Kết hợp (từ ↔ nghĩa, câu ↔ nghĩa, bài học)
  | "WORD_TO_MEANING"     // Từ vựng -> Nghĩa tiếng Việt
  | "MEANING_TO_WORD"     // Nghĩa tiếng Việt -> Từ vựng tiếng Nhật
  | "WORD_BOTH"           // Cả hai (Từ ↔ Nghĩa)
  | "SENTENCE_TO_MEANING" // Câu tiếng Nhật -> Nghĩa câu tiếng Việt
  | "MEANING_TO_SENTENCE" // Nghĩa tiếng Việt -> Chọn câu tiếng Nhật đúng
  | "SENTENCE_BOTH"       // Cả hai (Câu ↔ Nghĩa câu)
  | "LESSON_GRAMMAR";     // Bài học & Ngữ pháp ứng dụng

export type YokaiSpeedDifficulty = "EASY" | "MEDIUM" | "CUSTOM";

export interface YokaiGameSettings {
  questionMode: YokaiQuestionMode;
  speedDifficulty: YokaiSpeedDifficulty;
  customSpeed: number; // m/s, từ 8 đến 25
}

export interface YokaiQuestion {
  id: string;
  category: "KANA" | "VOCAB" | "KANJI" | "GRAMMAR" | "LISTENING" | "SENTENCE";
  prompt: string;         // Câu hỏi, ví dụ: "Chọn từ có nghĩa: 'Ăn'" hoặc Kanji "日"
  subPrompt?: string;      // Romaji hoặc gợi ý phụ
  audioText?: string;      // Văn bản để đọc phát âm (Web Speech Synthesis)
  targetLevel: YokaiLevel;
  correctAnswer: string;   // Đáp án đúng hiển thị trên cổng
  options: [string, string, string]; // 3 đáp án tương ứng 3 làn [Lane 0, Lane 1, Lane 2]
  correctLane: 0 | 1 | 2;  // 0: Trái, 1: Giữa, 2: Phải
  explanation: string;     // Giải thích chi tiết cho màn tổng kết ôn tập
  questionType?:
    | "WORD_TO_MEANING"
    | "MEANING_TO_WORD"
    | "SENTENCE_TO_MEANING"
    | "MEANING_TO_SENTENCE"
    | "GRAMMAR"
    | "LESSON_GRAMMAR"
    | "KANA";
}

export interface SpiritBeast {
  id: string;
  name: string;
  title: string;
  description: string;
  element: "FIRE" | "WIND" | "THUNDER" | "SPIRIT" | "WATER";
  color: string;
  glowColor: string;
  perk: string;
  bonusType: "COMBO_BONUS" | "EXTRA_TIME" | "XP_BOOST" | "SHIELD_ONE" | "MAGNET";
  unlockedByDefault: boolean;
  unlockRequirement: string;
  requiredXp?: number;
  avatarIcon: string;
}

export interface GameZone {
  id: string;
  slug: string;
  nameJa: string;
  nameVi: string;
  description: string;
  level: YokaiLevel;
  gateColor: string;
  ambientColor: string;
  fogColor: string;
  skyColor: string;
  bgmTone: string;
  requiredScore: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardXP: number;
  completed: boolean;
  icon: string;
}

export interface YokaiGameResult {
  zoneId: string;
  level: YokaiLevel;
  beastId: string;
  score: number;
  distance: number;
  maxCombo: number;
  correctCount: number;
  wrongCount: number;
  heartsRemaining: number;
  isVictory: boolean;
  isPractice: boolean;
  answeredQuestions: {
    question: YokaiQuestion;
    chosenLane: 0 | 1 | 2;
    isCorrect: boolean;
    timeMs: number;
  }[];
}

export interface YokaiPlayerProfile {
  stamina: number;         // 0..5
  maxStamina: number;      // 5
  nextStaminaReset: string; // ISO String
  selectedBeastId: string;
  unlockedBeastIds: string[];
  highScore: number;
  bestCombo: number;
  totalRuns: number;
  clearedZones: string[];
  practiceUnlocked: boolean;
}

