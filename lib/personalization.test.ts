import { describe, expect, it } from "vitest";
import { buildLearningPath, buildRemediationPlan, LEARNING_LIFECYCLE_STAGES } from "./personalization";
import { getQuestionsForMode } from "./test-assessment";

describe("buildLearningPath & buildRemediationPlan", () => {
  it("builds a complete 8-stage scientific lifecycle and personalized curriculum path", () => {
    expect(LEARNING_LIFECYCLE_STAGES).toHaveLength(8);
    const path = buildLearningPath({
      level: "BEGINNER",
      goal: "JLPT",
      dailyGoalMinutes: 30,
      focusSkill: "BALANCED",
      learningStyle: "STRUCTURED",
    });
    expect(path.modules.length).toBeGreaterThan(5);
    expect(path.modules[0]?.kind).toBe("KANA");
  });

  it("prioritizes higher-level modules when user tests out into N4 or N3", () => {
    const n4Path = buildLearningPath({
      level: "N4",
      goal: "CONVERSATION",
      dailyGoalMinutes: 30,
      focusSkill: "SPEAKING",
      learningStyle: "PRACTICAL",
    });
    expect(n4Path.answers.levelLabel).toBe("N4");
    expect(n4Path.modules.some((m) => m.slug?.startsWith("n4-"))).toBe(true);
  });

  it("builds a remediation plan when overdue/weak SRS items or low lesson scores exist", () => {
    const items = buildRemediationPlan({
      dueSrsCount: 6,
      weakSrsCount: 3,
      lowScoreLessons: [{ slug: "n5-1", title: "Bài 1 N5", score: 55 }],
    });
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0]?.type).toBe("WEAK_SRS");
    expect(items[0]?.href).toBe("/app/review");
    expect(items[1]?.type).toBe("LOW_SCORE_LESSON");
    expect(items[1]?.href).toBe("/app/practice/n5-1");
  });
});

describe("4-Skill Proficiency Assessment (test-assessment)", () => {
  it("covers all 4 skills (LISTENING, SPEAKING, READING, WRITING) in every mode", () => {
    for (const mode of ["DIAGNOSTIC", "N5_FULL", "N4_FULL", "N3_FULL"] as const) {
      const questions = getQuestionsForMode(mode);
      const skills = new Set(questions.map((q) => q.skill));
      expect(skills.has("LISTENING")).toBe(true);
      expect(skills.has("SPEAKING")).toBe(true);
      expect(skills.has("READING")).toBe(true);
      expect(skills.has("WRITING")).toBe(true);
    }
  });
});
