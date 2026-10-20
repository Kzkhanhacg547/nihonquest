import { prisma } from "../lib/prisma";
import { DAKUTEN } from "../prisma/seed-data/dakuten";
import { EXPANDED_KANJI, EXPANDED_VOCABULARY, EXPANDED_GRAMMAR, EXPANDED_SCENARIOS } from "../prisma/seed-data/expanded-curriculum";

async function syncExpandedCurriculum() {
  console.log("=== Syncing Expanded Curriculum to Neon DB ===");

  // 1. Sync Katakana Combo Kana
  const katakanaCombos = DAKUTEN.filter((k) => k.script === "KATAKANA" && k.kind === "COMBO");
  let kanaCount = 0;
  for (const k of katakanaCombos) {
    await prisma.kana.upsert({
      where: { character_script: { character: k.character, script: k.script } },
      update: { romaji: k.romaji, ipa: k.ipa, row: k.row, column: k.column, kind: k.kind },
      create: { character: k.character, script: k.script, romaji: k.romaji, ipa: k.ipa, row: k.row, column: k.column, kind: k.kind },
    });
    kanaCount++;
  }
  console.log(`✓ Synced ${kanaCount} Katakana COMBO characters.`);

  // 2. Sync Expanded Kanji
  let kanjiCount = 0;
  for (const k of EXPANDED_KANJI) {
    const kanji = await prisma.kanji.upsert({
      where: { character: k.character },
      update: { meaning: k.meaning, strokeCount: k.strokeCount, jlptLevel: k.jlptLevel },
      create: { character: k.character, meaning: k.meaning, strokeCount: k.strokeCount, jlptLevel: k.jlptLevel },
    });
    await prisma.kanjiReading.deleteMany({ where: { kanjiId: kanji.id } });
    for (const r of k.readings) {
      await prisma.kanjiReading.create({
        data: { kanjiId: kanji.id, reading: r.reading, type: r.type },
      });
    }
    kanjiCount++;
  }
  console.log(`✓ Synced ${kanjiCount} Expanded Kanji characters.`);

  // 3. Sync Expanded Vocabulary
  let vocabCount = 0;
  for (const v of EXPANDED_VOCABULARY) {
    const existing = await prisma.vocabulary.findFirst({
      where: { word: v.word, jlptLevel: v.jlptLevel },
    });

    if (existing) {
      await prisma.vocabulary.update({
        where: { id: existing.id },
        data: {
          kana: v.kana,
          kanji: v.kanji,
          romaji: v.romaji,
          meaning: v.meaning,
          partOfSpeech: v.partOfSpeech ?? "expression",
          tags: v.tags ?? "",
        },
      });
      if (v.exampleJapanese) {
        await prisma.vocabularyExample.deleteMany({ where: { vocabularyId: existing.id } });
        await prisma.vocabularyExample.create({
          data: {
            vocabularyId: existing.id,
            japanese: v.exampleJapanese,
            romaji: v.exampleRomaji,
            meaning: v.exampleMeaning ?? "",
          },
        });
      }
    } else {
      await prisma.vocabulary.create({
        data: {
          word: v.word,
          kana: v.kana,
          kanji: v.kanji,
          romaji: v.romaji,
          meaning: v.meaning,
          partOfSpeech: v.partOfSpeech ?? "expression",
          jlptLevel: v.jlptLevel,
          tags: v.tags ?? "",
          examples: v.exampleJapanese
            ? {
                create: [
                  {
                    japanese: v.exampleJapanese,
                    romaji: v.exampleRomaji,
                    meaning: v.exampleMeaning ?? "",
                  },
                ],
              }
            : undefined,
        },
      });
    }
    vocabCount++;
  }
  console.log(`✓ Synced ${vocabCount} Expanded Vocabulary items (Keigo, Idioms, Slang, Dialects, Situational).`);

  // 4. Sync Expanded Grammar
  let grammarCount = 0;
  for (const g of EXPANDED_GRAMMAR) {
    const existing = await prisma.grammar.findFirst({ where: { title: g.title } });
    const grammar = existing
      ? await prisma.grammar.update({
          where: { id: existing.id },
          data: { level: g.level, meaning: g.meaning, structure: g.structure, commonMistakes: g.commonMistakes },
        })
      : await prisma.grammar.create({
          data: { title: g.title, level: g.level, meaning: g.meaning, structure: g.structure, commonMistakes: g.commonMistakes },
        });

    await prisma.grammarExample.deleteMany({ where: { grammarId: grammar.id } });
    for (const ex of g.examples ?? []) {
      await prisma.grammarExample.create({
        data: { grammarId: grammar.id, japanese: ex.japanese, romaji: ex.romaji, meaning: ex.meaning },
      });
    }
    grammarCount++;
  }
  console.log(`✓ Synced ${grammarCount} Expanded Grammar items.`);

  // 5. Sync Expanded Scenarios
  let scenarioCount = 0;
  for (const s of EXPANDED_SCENARIOS) {
    const scenario = await prisma.scenario.upsert({
      where: { slug: s.slug },
      update: { title: s.title, description: s.description, level: s.level, xpReward: s.xpReward, isPublished: true },
      create: { slug: s.slug, title: s.title, description: s.description, level: s.level, xpReward: s.xpReward, isPublished: true },
    });
    await prisma.scenarioMessage.deleteMany({ where: { scenarioId: scenario.id } });
    await prisma.scenarioChoice.deleteMany({ where: { scenarioId: scenario.id } });
    for (const msg of s.messages) {
      await prisma.scenarioMessage.create({
        data: {
          scenarioId: scenario.id,
          order: msg.order,
          speaker: msg.speaker,
          japanese: msg.japanese,
          romaji: msg.romaji,
          meaning: msg.meaning,
        },
      });
    }
    for (const ch of s.choices) {
      await prisma.scenarioChoice.create({
        data: {
          scenarioId: scenario.id,
          optionText: ch.optionText,
          isIdeal: ch.isIdeal,
          xpReward: ch.xpReward,
        },
      });
    }
    scenarioCount++;
  }
  console.log(`✓ Synced ${scenarioCount} Expanded Survival Scenarios.`);

  const [totalKana, totalKanji, totalVocab, totalGrammar, totalScenarios] = await Promise.all([
    prisma.kana.count(),
    prisma.kanji.count(),
    prisma.vocabulary.count(),
    prisma.grammar.count(),
    prisma.scenario.count({ where: { isPublished: true } }),
  ]);
  console.log(`\nUpdated Live DB Totals -> Kana: ${totalKana}, Kanji: ${totalKanji}, Vocabulary: ${totalVocab}, Grammar: ${totalGrammar}, Scenarios: ${totalScenarios}`);
}

syncExpandedCurriculum()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to sync expanded curriculum:", err);
    process.exit(1);
  });
