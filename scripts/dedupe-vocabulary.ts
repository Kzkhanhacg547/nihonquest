/**
 * Safe, Idempotent Database Vocabulary Deduplication Script
 *
 * Rules:
 * 1. Groups by buildCanonicalVocabKey(word, kana), guaranteeing homonyms
 *    (e.g., 辛い::からい vs 辛い::つらい, 表::おもて vs 表::ひょう) are NEVER merged.
 * 2. Selects the canonical primary record (preferring the one with examples, richer tags, or earliest creation).
 * 3. Safely remaps any LessonItem, Exercise, and ReviewItem pointing to secondary IDs.
 *    - For ReviewItem, respects @@unique([userId, contentType, contentId]):
 *      if a user already has a review item for the primary ID, merge stats (keep higher interval/repetitions)
 *      and delete the duplicate review item.
 * 4. Remaps or cleans up VocabularyExample foreign keys.
 * 5. Deletes secondary duplicate records.
 * 6. Supports dry-run (--dry-run).
 */

import { prisma } from "../lib/prisma";
import { buildCanonicalVocabKey } from "../lib/canonical-vocab";

async function dedupeVocabulary(dryRun = false) {
  console.log(`=== Vocabulary Deduplication ${dryRun ? "(DRY RUN)" : "(LIVE EXECUTION)"} ===\n`);

  const allVocab = await prisma.vocabulary.findMany({
    include: {
      examples: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const groups = new Map<string, typeof allVocab>();
  for (const v of allVocab) {
    const key = buildCanonicalVocabKey(v.word, v.kana);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  }

  let duplicateGroupCount = 0;
  let excessRecordsCount = 0;
  let remappedLessonItems = 0;
  let remappedExercises = 0;
  let remappedReviewItems = 0;
  let deletedReviewItems = 0;
  let remappedExamples = 0;
  let deletedVocabRecords = 0;

  for (const [key, items] of groups.entries()) {
    if (items.length <= 1) continue;

    duplicateGroupCount++;
    excessRecordsCount += items.length - 1;

    // Pick best primary: the one with highest example count, or longest meaning, or first
    const sorted = [...items].sort((a, b) => {
      if (b.examples.length !== a.examples.length) {
        return b.examples.length - a.examples.length;
      }
      return b.meaning.length - a.meaning.length;
    });

    const primary = sorted[0];
    const secondaries = sorted.slice(1);
    const secondaryIds = secondaries.map((s) => s.id);

    if (duplicateGroupCount <= 5) {
      console.log(`[Group ${duplicateGroupCount}] Key: "${key}"`);
      console.log(`  -> Primary: ${primary.id} (Word: "${primary.word}", Kana: "${primary.kana}", Examples: ${primary.examples.length})`);
      console.log(`  -> Secondaries (${secondaries.length}): ${secondaryIds.join(", ")}`);
    }

    if (!dryRun) {
      // 1. Remap LessonItems
      const lItems = await prisma.lessonItem.findMany({
        where: {
          contentType: { in: ["VOCABULARY", "vocabulary"] },
          contentId: { in: secondaryIds },
        },
      });
      if (lItems.length > 0) {
        await prisma.lessonItem.updateMany({
          where: { id: { in: lItems.map((li) => li.id) } },
          data: { contentId: primary.id },
        });
        remappedLessonItems += lItems.length;
      }

      // 2. Remap Exercises
      const exItems = await prisma.exercise.findMany({
        where: {
          contentType: { in: ["VOCABULARY", "vocabulary"] },
          contentId: { in: secondaryIds },
        },
      });
      if (exItems.length > 0) {
        await prisma.exercise.updateMany({
          where: { id: { in: exItems.map((e) => e.id) } },
          data: { contentId: primary.id },
        });
        remappedExercises += exItems.length;
      }

      // 3. Remap ReviewItems carefully (handle @@unique([userId, contentType, contentId]))
      const revItems = await prisma.reviewItem.findMany({
        where: {
          contentType: { in: ["VOCABULARY", "vocabulary"] },
          contentId: { in: secondaryIds },
        },
      });

      for (const rev of revItems) {
        const existingPrimaryRev = await prisma.reviewItem.findUnique({
          where: {
            userId_contentType_contentId: {
              userId: rev.userId,
              contentType: rev.contentType,
              contentId: primary.id,
            },
          },
        });

        if (existingPrimaryRev) {
          // Keep the more progressed review item
          if (rev.repetitions > existingPrimaryRev.repetitions) {
            await prisma.reviewItem.update({
              where: { id: existingPrimaryRev.id },
              data: {
                repetitions: rev.repetitions,
                interval: rev.interval,
                ease: rev.ease,
                dueAt: rev.dueAt,
                lastReviewedAt: rev.lastReviewedAt,
              },
            });
          }
          // Delete redundant review item
          await prisma.reviewItem.delete({
            where: { id: rev.id },
          });
          deletedReviewItems++;
        } else {
          // Safe to remap to primary
          await prisma.reviewItem.update({
            where: { id: rev.id },
            data: { contentId: primary.id },
          });
          remappedReviewItems++;
        }
      }

      // 4. Migrate unique examples from secondary to primary
      const existingExamples = new Set(primary.examples.map((e) => e.japanese.trim()));
      for (const sec of secondaries) {
        for (const ex of sec.examples) {
          if (!existingExamples.has(ex.japanese.trim())) {
            await prisma.vocabularyExample.create({
              data: {
                vocabularyId: primary.id,
                japanese: ex.japanese,
                meaning: ex.meaning,
                romaji: ex.romaji,
              },
            });
            existingExamples.add(ex.japanese.trim());
            remappedExamples++;
          }
        }
      }

      // 5. Delete secondary Vocabulary rows (cascades to their examples)
      const deleteResult = await prisma.vocabulary.deleteMany({
        where: { id: { in: secondaryIds } },
      });
      deletedVocabRecords += deleteResult.count;
    }
  }

  console.log(`\n=== DEDUPLICATION REPORT ===`);
  console.log(`Total duplicate groups: ${duplicateGroupCount}`);
  console.log(`Total excess records identified: ${excessRecordsCount}`);
  if (!dryRun) {
    console.log(`Remapped LessonItems: ${remappedLessonItems}`);
    console.log(`Remapped Exercises: ${remappedExercises}`);
    console.log(`Remapped ReviewItems: ${remappedReviewItems}`);
    console.log(`Merged & Deleted redundant ReviewItems: ${deletedReviewItems}`);
    console.log(`Migrated unique Examples: ${remappedExamples}`);
    console.log(`Deleted duplicate Vocabulary rows: ${deletedVocabRecords}`);

    const remainingCount = await prisma.vocabulary.count();
    console.log(`Remaining canonical Vocabulary records in DB: ${remainingCount}`);
  }
}

const isDryRun = process.argv.includes("--dry-run");

dedupeVocabulary(isDryRun)
  .catch((e) => {
    console.error("Deduplication error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

