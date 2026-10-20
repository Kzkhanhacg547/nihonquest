import { describe, it, expect } from "vitest";
import {
  normalizeJlptLevel,
  resolveCanonicalUserLevel,
  resolvePersonalizationTrack,
  synchronizeLevelFields,
  evaluateLevelAccess,
  evaluateLessonAccess,
} from "./learning-level";

describe("Canonical Learning Level & Synchronization", () => {
  it("normalizes JLPT levels deterministically and maps legacy N2/N1 to N3", () => {
    expect(normalizeJlptLevel("N5")).toBe("N5");
    expect(normalizeJlptLevel("n4")).toBe("N4");
    expect(normalizeJlptLevel("N3")).toBe("N3");
    expect(normalizeJlptLevel("N2")).toBe("N3");
    expect(normalizeJlptLevel("N1")).toBe("N3");
    expect(normalizeJlptLevel("BEGINNER")).toBe("N5");
    expect(normalizeJlptLevel("")).toBe("N5");
    expect(normalizeJlptLevel(null)).toBe("N5");
  });

  it("resolves conflicting learningLevel and levelChoice without getting stuck on BEGINNER/N5", () => {
    // User onboarded as BEGINNER, then changed learningLevel to N4 in Settings
    const upgradedUser = { learningLevel: "N4", levelChoice: "BEGINNER" };
    expect(resolveCanonicalUserLevel(upgradedUser)).toBe("N4");
    expect(resolvePersonalizationTrack(upgradedUser)).toBe("N4");

    // User onboarded as N5, then passed placement test for N3
    const testedOutUser = { learningLevel: "N3", levelChoice: "N5" };
    expect(resolveCanonicalUserLevel(testedOutUser)).toBe("N3");
    expect(resolvePersonalizationTrack(testedOutUser)).toBe("N3");

    // Genuine beginner still at N5 keeps BEGINNER track for Kana onboarding
    const freshBeginner = { learningLevel: "N5", levelChoice: "BEGINNER" };
    expect(resolveCanonicalUserLevel(freshBeginner)).toBe("N5");
    expect(resolvePersonalizationTrack(freshBeginner)).toBe("BEGINNER");
  });

  it("synchronizes both learningLevel and levelChoice on writes", () => {
    // Settings / Placement test updates only learningLevel
    expect(synchronizeLevelFields({ learningLevel: "N4" })).toEqual({
      learningLevel: "N4",
      levelChoice: "N4",
    });

    // Onboarding sets BEGINNER + N5
    expect(synchronizeLevelFields({ learningLevel: "N5", levelChoice: "BEGINNER" })).toEqual({
      learningLevel: "N5",
      levelChoice: "BEGINNER",
    });

    // Updating to N3 overrides stale BEGINNER choice
    expect(synchronizeLevelFields({ learningLevel: "N3", levelChoice: "BEGINNER" })).toEqual({
      learningLevel: "N3",
      levelChoice: "N3",
    });
  });
});

describe("Pedagogical Level Access & Content Locking Policy", () => {
  it("locks higher levels for N5 learners while allowing 2 preview lessons", () => {
    const n4Access = evaluateLevelAccess({ userLevel: "N5", targetLevel: "N4", currentLevelCompletionRatio: 0.2 });
    expect(n4Access.tier).toBe("HIGHER");
    expect(n4Access.fullAccess).toBe(false);
    expect(n4Access.previewLimit).toBe(2);

    // Lesson 0 and 1 in N4 are allowed as preview
    const previewLesson = evaluateLessonAccess({
      userLevel: "N5",
      lessonLevel: "N4",
      lessonIndexInLevel: 0,
    });
    expect(previewLesson.unlocked).toBe(true);
    expect(previewLesson.isPreview).toBe(true);

    // Lesson 2+ in N4 is locked even if it is the first lesson of a Unit
    const lockedHigherUnitStart = evaluateLessonAccess({
      userLevel: "N5",
      lessonLevel: "N4",
      lessonIndexInLevel: 5,
      isFirstInUnit: true,
    });
    expect(lockedHigherUnitStart.unlocked).toBe(false);
    expect(lockedHigherUnitStart.lockReason).toBe("HIGHER_LEVEL");
  });

  it("unlocks the next level when learner completes >= 80% of their current level", () => {
    const unlockedN4 = evaluateLevelAccess({
      userLevel: "N5",
      targetLevel: "N4",
      currentLevelCompletionRatio: 0.85,
    });
    expect(unlockedN4.fullAccess).toBe(true);
    expect(unlockedN4.mode).toBe("UNLOCKED_BY_PROGRESSION");
  });

  it("allows N3 learners to freely review all N4 and N5 material without sequential locks", () => {
    const reviewLesson = evaluateLessonAccess({
      userLevel: "N3",
      lessonLevel: "N5",
      lessonIndexInLevel: 17,
      prevLessonCompleted: false,
      isFirstInUnit: false,
    });
    expect(reviewLesson.unlocked).toBe(true);
    expect(reviewLesson.isReviewMode).toBe(true);
    expect(reviewLesson.lockReason).toBe("NONE");
  });
});

