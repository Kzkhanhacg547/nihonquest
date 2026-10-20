/**
 * Canonical Learning Level & Pedagogical Access Control Policy
 *
 * Single source of truth for:
 * 1. Normalizing JLPT levels (`N5`, `N4`, `N3`) and onboarding track (`BEGINNER`).
 * 2. Resolving a user's canonical learning level across Settings, Dashboard, Path,
 *    Practice, Vocabulary, Grammar, Analytics, Stats, and Assessment Tests.
 * 3. Synchronizing `learningLevel` and `levelChoice` on all writes so they never drift.
 * 4. Enforcing pedagogical content access rules on both server and client:
 *    - Lower levels (< userLevel): fully unlocked in REVIEW mode.
 *    - Current level (=== userLevel): standard sequential unit progression.
 *    - Higher levels (> userLevel): locked by default (first 2 lessons available as PREVIEW),
 *      unlockable by completing >=80% of the current level or passing a placement exam.
 */

export const SUPPORTED_JLPT_LEVELS = ["N5", "N4", "N3"] as const;
export type JlptLevel = (typeof SUPPORTED_JLPT_LEVELS)[number];

export const LEVEL_CHOICES = ["BEGINNER", "N5", "N4", "N3"] as const;
export type LevelChoice = (typeof LEVEL_CHOICES)[number];

export const JLPT_LEVEL_RANK: Record<JlptLevel, number> = {
  N5: 1,
  N4: 2,
  N3: 3,
};

export const HIGHER_LEVEL_PREVIEW_LIMIT = 2;
export const PROGRESSION_UNLOCK_THRESHOLD = 0.8;

/**
 * Deterministically normalizes any raw level string into a supported curriculum JLPT level (`N5 | N4 | N3`).
 * - Legacy `N2` / `N1` values map to `N3` (highest supported curriculum) rather than resetting to `N5`.
 * - `BEGINNER`, `N5`, or unknown values map to `N5`.
 */
export function normalizeJlptLevel(raw?: string | null): JlptLevel {
  const clean = (raw ?? "").trim().toUpperCase();
  if (clean === "N3" || clean === "N2" || clean === "N1") return "N3";
  if (clean === "N4") return "N4";
  return "N5";
}

/**
 * Resolves the single canonical JLPT level (`N5 | N4 | N3`) for a user record.
 *
 * Migration / conflict-resolution rule for existing accounts:
 * - `learningLevel` is the primary canonical field updated by Settings, Profile, and Placement Tests.
 * - If `learningLevel` is missing or still at default `"N5"` while `levelChoice` was explicitly set
 *   to `"N4"` or `"N3"` during legacy onboarding, honor that higher `levelChoice`.
 */
export function resolveCanonicalUserLevel(user?: {
  learningLevel?: string | null;
  levelChoice?: string | null;
} | null): JlptLevel {
  if (!user) return "N5";
  const rawLearning = (user.learningLevel ?? "").trim().toUpperCase();
  const rawChoice = (user.levelChoice ?? "").trim().toUpperCase();

  if (rawLearning && rawLearning !== "N5") {
    return normalizeJlptLevel(rawLearning);
  }
  if (!rawLearning && (rawChoice === "N4" || rawChoice === "N3" || rawChoice === "N2" || rawChoice === "N1")) {
    return normalizeJlptLevel(rawChoice);
  }
  return normalizeJlptLevel(rawLearning || rawChoice || "N5");
}

/**
 * Resolves the personalization track (`BEGINNER | N5 | N4 | N3`) consumed by `lib/personalization.ts`.
 *
 * Crucial invariant:
 * - `"BEGINNER"` (Kana-first onboarding track) is ONLY active when the user's canonical JLPT level is `"N5"`
 *   AND `levelChoice === "BEGINNER"`.
 * - Once a user switches to `"N4"` or `"N3"` (via Settings, Profile, or Placement Test), their personalization
 *   track is `"N4"` or `"N3"`, never `"BEGINNER"`.
 */
export function resolvePersonalizationTrack(user?: {
  learningLevel?: string | null;
  levelChoice?: string | null;
} | null): LevelChoice {
  const canonical = resolveCanonicalUserLevel(user);
  const rawChoice = (user?.levelChoice ?? "").trim().toUpperCase();
  if (canonical === "N5" && rawChoice === "BEGINNER") {
    return "BEGINNER";
  }
  return canonical;
}

/**
 * Synchronizes `learningLevel` and `levelChoice` whenever either field is written
 * (Settings, Profile, Onboarding, Placement Test, Registration) so they cannot drift.
 */
export function synchronizeLevelFields(input: {
  learningLevel?: string | null;
  levelChoice?: string | null;
}): { learningLevel: JlptLevel; levelChoice: LevelChoice } {
  const hasLearning = input.learningLevel !== undefined && input.learningLevel !== null && input.learningLevel !== "";
  const hasChoice = input.levelChoice !== undefined && input.levelChoice !== null && input.levelChoice !== "";

  if (hasLearning && hasChoice) {
    const learningLevel = normalizeJlptLevel(input.learningLevel);
    const rawChoice = input.levelChoice!.trim().toUpperCase();
    const levelChoice: LevelChoice =
      learningLevel === "N5" && rawChoice === "BEGINNER" ? "BEGINNER" : learningLevel;
    return { learningLevel, levelChoice };
  }

  if (hasLearning) {
    const learningLevel = normalizeJlptLevel(input.learningLevel);
    return { learningLevel, levelChoice: learningLevel };
  }

  if (hasChoice) {
    const rawChoice = input.levelChoice!.trim().toUpperCase();
    const learningLevel = normalizeJlptLevel(rawChoice);
    const levelChoice: LevelChoice =
      learningLevel === "N5" && rawChoice === "BEGINNER" ? "BEGINNER" : learningLevel;
    return { learningLevel, levelChoice };
  }

  return { learningLevel: "N5", levelChoice: "N5" };
}

export type LevelAccessTier = "LOWER" | "CURRENT" | "HIGHER";
export type LevelAccessMode = "REVIEW" | "CURRENT" | "UNLOCKED_BY_PROGRESSION" | "PREVIEW_ONLY";

export interface LevelAccessEvaluation {
  userLevel: JlptLevel;
  targetLevel: JlptLevel;
  tier: LevelAccessTier;
  mode: LevelAccessMode;
  fullAccess: boolean;
  previewLimit: number;
  badgeLabel: string;
  explanation: string;
}

/**
 * Evaluates pedagogical access policy for a target JLPT level given the learner's current level.
 */
export function evaluateLevelAccess(params: {
  userLevel?: string | null;
  targetLevel?: string | null;
  currentLevelCompletionRatio?: number;
}): LevelAccessEvaluation {
  const userLevel = normalizeJlptLevel(params.userLevel);
  const targetLevel = normalizeJlptLevel(params.targetLevel);
  const userRank = JLPT_LEVEL_RANK[userLevel];
  const targetRank = JLPT_LEVEL_RANK[targetLevel];
  const completion = params.currentLevelCompletionRatio ?? 0;

  if (targetRank < userRank) {
    return {
      userLevel,
      targetLevel,
      tier: "LOWER",
      mode: "REVIEW",
      fullAccess: true,
      previewLimit: Number.POSITIVE_INFINITY,
      badgeLabel: `Ôn tập ${targetLevel}`,
      explanation: `Bạn đang học trình độ ${userLevel}. Toàn bộ bài học và kiến thức ${targetLevel} được mở hoàn toàn để bạn ôn tập củng cố.`,
    };
  }

  if (targetRank === userRank) {
    return {
      userLevel,
      targetLevel,
      tier: "CURRENT",
      mode: "CURRENT",
      fullAccess: true,
      previewLimit: Number.POSITIVE_INFINITY,
      badgeLabel: `Cấp độ chính (${targetLevel})`,
      explanation: `Lộ trình học chính thức theo cấp độ JLPT ${userLevel} hiện tại của bạn.`,
    };
  }

  // Next level unlocked automatically if learner completed >= 80% of their current level
  if (targetRank === userRank + 1 && completion >= PROGRESSION_UNLOCK_THRESHOLD) {
    return {
      userLevel,
      targetLevel,
      tier: "HIGHER",
      mode: "UNLOCKED_BY_PROGRESSION",
      fullAccess: true,
      previewLimit: Number.POSITIVE_INFINITY,
      badgeLabel: `Đã mở khóa ${targetLevel}`,
      explanation: `Bạn đã hoàn thành trên 80% lộ trình ${userLevel}, đủ điều kiện học tiếp lên ${targetLevel}.`,
    };
  }

  return {
    userLevel,
    targetLevel,
    tier: "HIGHER",
    mode: "PREVIEW_ONLY",
    fullAccess: false,
    previewLimit: HIGHER_LEVEL_PREVIEW_LIMIT,
    badgeLabel: `🔒 Khóa · Xem trước ${HIGHER_LEVEL_PREVIEW_LIMIT} bài đầu`,
    explanation: `Nội dung ${targetLevel} cao hơn cấp độ hiện tại của bạn (${userLevel}). Bạn có thể xem trước ${HIGHER_LEVEL_PREVIEW_LIMIT} bài mở đầu, hoặc mở khóa toàn bộ bằng cách hoàn thành ≥80% bài học ${userLevel} hoặc vượt Bài kiểm tra xếp lớp ${targetLevel}.`,
  };
}

export interface LessonAccessEvaluation {
  unlocked: boolean;
  isPreview: boolean;
  isReviewMode: boolean;
  lockReason: "NONE" | "PREREQUISITE" | "HIGHER_LEVEL";
  badgeText: string | null;
  lockMessage: string | null;
}

/**
 * Evaluates whether a specific lesson is unlocked for a learner.
 */
export function evaluateLessonAccess(params: {
  userLevel?: string | null;
  lessonLevel?: string | null;
  lessonIndexInLevel: number;
  isCompleted?: boolean;
  isInProgress?: boolean;
  prevLessonCompleted?: boolean;
  isFirstInUnit?: boolean;
  isFptSupplementary?: boolean;
  currentLevelCompletionRatio?: number;
}): LessonAccessEvaluation {
  const levelEval = evaluateLevelAccess({
    userLevel: params.userLevel,
    targetLevel: params.lessonLevel,
    currentLevelCompletionRatio: params.currentLevelCompletionRatio,
  });

  // Always preserve access to lessons the user has already completed or started
  if (params.isCompleted || params.isInProgress) {
    return {
      unlocked: true,
      isPreview: false,
      isReviewMode: levelEval.tier === "LOWER",
      lockReason: "NONE",
      badgeText: params.isCompleted ? "✓ Hoàn thành" : "Đang học",
      lockMessage: null,
    };
  }

  // Lower levels: all lessons unlocked for review without artificial sequential blocks
  if (levelEval.tier === "LOWER") {
    return {
      unlocked: true,
      isPreview: false,
      isReviewMode: true,
      lockReason: "NONE",
      badgeText: `Ôn tập ${levelEval.targetLevel}`,
      lockMessage: null,
    };
  }

  // Higher levels when not yet unlocked by progression/placement test
  if (levelEval.tier === "HIGHER" && !levelEval.fullAccess) {
    if (params.lessonIndexInLevel < levelEval.previewLimit) {
      return {
        unlocked: true,
        isPreview: true,
        isReviewMode: false,
        lockReason: "NONE",
        badgeText: "👁️ Xem trước",
        lockMessage: null,
      };
    }

    return {
      unlocked: false,
      isPreview: false,
      isReviewMode: false,
      lockReason: "HIGHER_LEVEL",
      badgeText: `🔒 Cấp ${levelEval.targetLevel}`,
      lockMessage: levelEval.explanation,
    };
  }

  // Current level (or unlocked next level): standard sequential progression within units
  const sequentiallyUnlocked =
    params.lessonIndexInLevel <= 0 ||
    Boolean(params.isFirstInUnit) ||
    Boolean(params.isFptSupplementary) ||
    Boolean(params.prevLessonCompleted);

  if (sequentiallyUnlocked) {
    return {
      unlocked: true,
      isPreview: false,
      isReviewMode: false,
      lockReason: "NONE",
      badgeText: null,
      lockMessage: null,
    };
  }

  return {
    unlocked: false,
    isPreview: false,
    isReviewMode: false,
    lockReason: "PREREQUISITE",
    badgeText: "🔒 Tiên quyết",
    lockMessage: "Hoàn thành bài học liền trước (đạt ≥60%) hoặc làm bài kiểm tra vượt cấp để mở khóa.",
  };
}

