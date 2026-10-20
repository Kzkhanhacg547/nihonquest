-- CreateIndex: Composite indexes for hot query paths
CREATE INDEX IF NOT EXISTS "Vocabulary_word_jlptLevel_idx" ON "Vocabulary"("word", "jlptLevel");
CREATE INDEX IF NOT EXISTS "ExerciseAttempt_userId_createdAt_idx" ON "ExerciseAttempt"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ExerciseAttempt_userId_lessonId_idx" ON "ExerciseAttempt"("userId", "lessonId");
CREATE INDEX IF NOT EXISTS "XpTransaction_userId_createdAt_idx" ON "XpTransaction"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "XpTransaction_userId_reason_referenceId_idx" ON "XpTransaction"("userId", "reason", "referenceId");
CREATE INDEX IF NOT EXISTS "ReviewHistory_userId_createdAt_idx" ON "ReviewHistory"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReviewHistory_userId_grade_idx" ON "ReviewHistory"("userId", "grade");

-- Data Migration: Deterministically synchronize learningLevel and levelChoice for existing users
-- Rule 1: Normalize learningLevel when empty/invalid using levelChoice if valid
UPDATE "User"
SET "learningLevel" = CASE
  WHEN UPPER(TRIM(COALESCE("learningLevel", ''))) IN ('N5', 'N4', 'N3') THEN UPPER(TRIM("learningLevel"))
  WHEN UPPER(TRIM(COALESCE("levelChoice", ''))) = 'N4' THEN 'N4'
  WHEN UPPER(TRIM(COALESCE("levelChoice", ''))) IN ('N3', 'N3+') THEN 'N3'
  ELSE 'N5'
END
WHERE UPPER(TRIM(COALESCE("learningLevel", ''))) NOT IN ('N5', 'N4', 'N3');

-- Rule 2: Synchronize levelChoice to match canonical learningLevel while preserving N5_BASE for N5 users who completed Kana
UPDATE "User"
SET "levelChoice" = CASE
  WHEN "learningLevel" = 'N4' THEN 'N4'
  WHEN "learningLevel" = 'N3' THEN 'N3+'
  WHEN "learningLevel" = 'N5' AND "levelChoice" = 'N5_BASE' THEN 'N5_BASE'
  ELSE 'BEGINNER'
END
WHERE "levelChoice" IS DISTINCT FROM (
  CASE
    WHEN "learningLevel" = 'N4' THEN 'N4'
    WHEN "learningLevel" = 'N3' THEN 'N3+'
    WHEN "learningLevel" = 'N5' AND "levelChoice" = 'N5_BASE' THEN 'N5_BASE'
    ELSE 'BEGINNER'
  END
);
