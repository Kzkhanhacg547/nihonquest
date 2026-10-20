import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  TEST_MODES,
  getQuestionsForMode,
  type AssessmentQuestion,
} from "../lib/test-assessment";

const prisma = new PrismaClient();

function normText(s: string | null | undefined): string {
  if (!s) return "";
  return s.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function normJpKey(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFKC")
    .replace(/[〜～~・\s()（）[\]「」『』、。.,/／\-＋+*＊:：]/g, "")
    .toLowerCase();
}

interface MasterPayload {
  generatedAt: string;
  kanjiNew: Array<{
    character: string;
    meaning: string;
    strokeCount: number;
    jlptLevel: string;
    readings: Array<{ reading: string; type: string }>;
    source: string;
  }>;
  vocabNew: Array<{
    word: string;
    kana: string;
    kanji: string | null;
    romaji: string;
    meaning: string;
    partOfSpeech: string;
    jlptLevel: string;
    tags: string;
    source: string;
    exampleJp?: string;
    exampleVi?: string;
  }>;
  vocabUpdates: Array<{
    existingId: string;
    reason: string;
    item: {
      word: string;
      kana: string;
      kanji: string | null;
      tags: string;
      exampleJp?: string;
      exampleVi?: string;
    };
  }>;
  grammarNew: Array<{
    title: string;
    level: string;
    meaning: string;
    structure: string;
    commonMistakes?: string;
    examples: Array<{ japanese: string; romaji?: string | null; meaning: string }>;
    source: string;
  }>;
  fptLessons: Array<{
    slug: string;
    title: string;
    description: string;
    level: string;
    order: number;
    xpReward: number;
    partTag: string;
    grammarTitleMatch: string;
    exercises: Array<{
      type: string;
      question: string;
      prompt: string;
      correctAnswer: string;
      options: string[];
    }>;
  }>;
  dynamicExams: Array<{
    slug: string;
    title: string;
    description: string;
    kindLabel: string;
    category: string;
    targetLevel: string;
    skillFocus: string;
    timeMinutes: number;
    icon: string;
    badge: string;
    sourceDocument: string;
    answerAuthority: string;
    order: number;
    questions: Array<AssessmentQuestion & { audioUrl?: string }>;
  }>;
  catalogDocuments: Array<{
    slug: string;
    title: string;
    fileName: string;
    relativePath: string;
    ext: string;
    sizeBytes: number;
    sha256: string;
    level: string;
    category: string;
    preImportStatus: string;
    importStatus: string;
    accessPolicy: string;
    isDuplicate: boolean;
    duplicateOf: string | null;
    copyrightNote: string;
    description: string;
  }>;
  reviewRequired: Array<{
    type: string;
    key: string;
    sources: string[];
    decision: string;
  }>;
}

const LOCK_FILE_PATH = path.join(process.cwd(), ".import-pipeline.lock");

async function acquireAdvisoryLock(): Promise<boolean> {
  try {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      const stat = fs.statSync(LOCK_FILE_PATH);
      // If lock file is older than 10 minutes, treat as stale
      if (Date.now() - stat.mtimeMs < 10 * 60 * 1000) {
        return false;
      }
      fs.unlinkSync(LOCK_FILE_PATH);
    }
    fs.writeFileSync(LOCK_FILE_PATH, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), {
      flag: "wx",
    });
    return true;
  } catch {
    return false;
  }
}

async function releaseAdvisoryLock(): Promise<void> {
  try {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      fs.unlinkSync(LOCK_FILE_PATH);
    }
  } catch {
    // ignore
  }
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log(`\n===================================================================`);
  console.log(
    `🚀 NIHON QUEST — PIPELINE IMPORT & DEDUPLICATION (${
      isDryRun ? "DRY-RUN MODE" : "LIVE COMMIT MODE"
    })`
  );
  console.log(`===================================================================\n`);

  const payloadPath = path.join(process.cwd(), "prisma", "seed-data", "unitcuments-knowledge.json");
  if (!fs.existsSync(payloadPath)) {
    throw new Error(`Missing payload file at ${payloadPath}`);
  }
  const payload: MasterPayload = JSON.parse(fs.readFileSync(payloadPath, "utf-8"));

  const locked = await acquireAdvisoryLock();
  if (!locked) {
    throw new Error("Another import process is currently holding advisory lock 20261013. Aborting.");
  }

  try {
    // 1. Snapshot current DB state
    const [
      existingKanji,
      existingVocab,
      existingGrammar,
      existingLessons,
      existingExercisesCount,
      existingExams,
      existingDocs,
      usersCount,
      progressCount,
      reviewCount,
    ] = await Promise.all([
      prisma.kanji.findMany({ include: { readings: true } }),
      prisma.vocabulary.findMany({ include: { examples: true } }),
      prisma.grammar.findMany({ include: { examples: true } }),
      prisma.lesson.findMany({ include: { items: true, exercises: true } }),
      prisma.exercise.count(),
      prisma.assessmentExam.findMany({ include: { questions: true } }),
      prisma.documentResource.findMany(),
      prisma.user.count(),
      prisma.userLessonProgress.count(),
      prisma.reviewItem.count(),
    ]);

    console.log(`📊 [PRE-STATE] Live Database Baseline:`);
    console.log(`   - Kanji:              ${existingKanji.length}`);
    console.log(`   - Vocabulary:         ${existingVocab.length}`);
    console.log(`   - Grammar:            ${existingGrammar.length}`);
    console.log(`   - Lessons:            ${existingLessons.length}`);
    console.log(`   - Exercises:          ${existingExercisesCount}`);
    console.log(`   - Dynamic Exams:      ${existingExams.length}`);
    console.log(`   - Catalog Documents:  ${existingDocs.length}`);
    console.log(
      `   - User State (Safe):  ${usersCount} Users, ${progressCount} LessonProgress, ${reviewCount} ReviewItems\n`
    );

    // Build lookup maps for idempotent deduplication
    const kanjiByChar = new Map(existingKanji.map((k) => [normText(k.character), k]));
    const vocabByWordKana = new Map<string, (typeof existingVocab)[number]>();
    const vocabByWord = new Map<string, (typeof existingVocab)[number]>();
    for (const v of existingVocab) {
      vocabByWordKana.set(`${normJpKey(v.word)}|${normJpKey(v.kana)}`, v);
      if (!vocabByWord.has(normJpKey(v.word))) {
        vocabByWord.set(normJpKey(v.word), v);
      }
    }

    const grammarByKey = new Map<string, (typeof existingGrammar)[number]>();
    for (const g of existingGrammar) {
      grammarByKey.set(normJpKey(g.title), g);
      const core = g.title.replace(/\([^)]*\)|（[^）]*）/g, "").trim();
      if (core) {
        grammarByKey.set(normJpKey(core), g);
      }
    }

    const lessonBySlug = new Map(existingLessons.map((l) => [l.slug, l]));
    const examBySlug = new Map(existingExams.map((e) => [e.slug, e]));
    const docByPath = new Map(existingDocs.map((d) => [d.relativePath, d]));

    // Counters for audit report
    const stats = {
      kanji: { new: 0, updated: 0, duplicate: 0 },
      vocab: { new: 0, updated: 0, duplicate: 0 },
      grammar: { new: 0, updated: 0, duplicate: 0 },
      lessons: { new: 0, updated: 0, duplicate: 0 },
      exercises: { new: 0, duplicate: 0 },
      exams: { new: 0, updated: 0, duplicate: 0 },
      documents: { new: 0, updated: 0, duplicate: 0 },
    };

    // -----------------------------------------------------------------------
    // STEP 1: KANJI DEDUPLICATION, RECONCILIATION & IMPORT
    // -----------------------------------------------------------------------
    const kanjiToCreate: typeof payload.kanjiNew = [];
    for (const ck of payload.kanjiNew) {
      const ch = normText(ck.character);
      if (!ch) continue;
      const existingK = kanjiByChar.get(ch);
      if (existingK) {
        const nextMeaning = normText(ck.meaning);
        const nextStroke = ck.strokeCount || existingK.strokeCount;
        const needsMeaningOrStrokeUpdate =
          existingK.meaning !== nextMeaning || existingK.strokeCount !== nextStroke;
        const needsReadings =
          (!existingK.readings || existingK.readings.length === 0) &&
          Array.isArray(ck.readings) &&
          ck.readings.length > 0;

        if (needsMeaningOrStrokeUpdate || needsReadings) {
          stats.kanji.updated++;
          if (!isDryRun && existingK.id !== "pending") {
            await prisma.kanji.update({
              where: { id: existingK.id },
              data: {
                meaning: nextMeaning,
                strokeCount: nextStroke,
              },
            });
            if (needsReadings) {
              await prisma.kanjiReading.deleteMany({ where: { kanjiId: existingK.id } });
              await prisma.kanjiReading.createMany({
                data: ck.readings.map((r) => ({
                  kanjiId: existingK.id,
                  reading: r.reading,
                  type: r.type || "KUN",
                })),
              });
            }
          }
        } else {
          stats.kanji.duplicate++;
        }
      } else {
        stats.kanji.new++;
        kanjiToCreate.push(ck);
        kanjiByChar.set(ch, { id: "pending", character: ch } as any);
      }
    }

    if (!isDryRun && kanjiToCreate.length > 0) {
      await prisma.kanji.createMany({
        data: kanjiToCreate.map((k) => ({
          character: normText(k.character),
          meaning: normText(k.meaning),
          strokeCount: k.strokeCount || 10,
          jlptLevel: k.jlptLevel || "N3",
        })),
        skipDuplicates: true,
      });

      // Add readings for newly created Kanji that have readings
      const createdKanji = await prisma.kanji.findMany({
        where: { character: { in: kanjiToCreate.map((k) => normText(k.character)) } },
      });
      const createdMap = new Map(createdKanji.map((k) => [k.character, k.id]));
      const readingsData: Array<{ kanjiId: string; reading: string; type: string }> = [];
      for (const ck of kanjiToCreate) {
        const kid = createdMap.get(normText(ck.character));
        if (kid && ck.readings?.length) {
          for (const r of ck.readings) {
            if (r.reading) {
              readingsData.push({ kanjiId: kid, reading: r.reading, type: r.type || "KUN" });
            }
          }
        }
      }
      if (readingsData.length > 0) {
        await prisma.kanjiReading.createMany({ data: readingsData });
      }
    }

    // -----------------------------------------------------------------------
    // STEP 2: VOCABULARY DEDUPLICATION, UPDATE ENRICHMENT & IMPORT
    // -----------------------------------------------------------------------
    // Also index legacy uncleaned forms (e.g. "が 壊れる", "~辺", "奇麗 (な)") to existing records
    for (const v of existingVocab) {
      const strippedParticleWord = v.word.replace(/^(が|を|に|へ|で|と)\s+/, "").trim();
      const strippedNaWord = strippedParticleWord.replace(/\s*[（(]な[)）]$/, "").trim();
      const strippedKana = v.kana.replace(/^(が|を|に)\s+/, "").trim();
      if (strippedNaWord !== v.word) {
        vocabByWordKana.set(`${normJpKey(strippedNaWord)}|${normJpKey(strippedKana)}`, v);
        if (!vocabByWord.has(normJpKey(strippedNaWord))) {
          vocabByWord.set(normJpKey(strippedNaWord), v);
        }
      }
      if (v.word === "形" && v.kana === "ちから") {
        if (!vocabByWordKana.has(`${normJpKey("格好")}|${normJpKey("かっこう")}`)) {
          vocabByWordKana.set(`${normJpKey("格好")}|${normJpKey("かっこう")}`, v);
        }
      }
      if (v.word === "が つく") {
        vocabByWordKana.set(`${normJpKey("点く")}|${normJpKey("つく")}`, v);
      }
      if (v.word === "が すく") {
        vocabByWordKana.set(`${normJpKey("空く")}|${normJpKey("すく")}`, v);
      }
      if (v.word === "明後日" && v.kana === "あした") {
        vocabByWordKana.set(`${normJpKey("明後日")}|${normJpKey("あさって")}`, v);
      }
      if (v.word === "お知らせ" && v.kana === "しらせる") {
        vocabByWordKana.set(`${normJpKey("お知らせ")}|${normJpKey("おしらせ")}`, v);
      }
      if (v.word === "検査" && v.kana === "ちょうさ") {
        vocabByWordKana.set(`${normJpKey("検査")}|${normJpKey("けんさ")}`, v);
      }
    }

    // Remove orphaned bogus duplicate "形" (kana="ちから") if "格好" already exists
    const bogusKatachi = existingVocab.find((v) => v.word === "形" && v.kana === "ちから");
    const validKakkou = existingVocab.find((v) => v.word === "格好" && v.kana === "かっこう");
    if (bogusKatachi && validKakkou && !isDryRun) {
      await prisma.lessonItem.updateMany({
        where: { contentType: "VOCAB", contentId: bogusKatachi.id },
        data: { contentId: validKakkou.id },
      });
      await prisma.reviewItem.updateMany({
        where: { contentType: "VOCAB", contentId: bogusKatachi.id },
        data: { contentId: validKakkou.id },
      });
      await prisma.vocabularyExample.deleteMany({ where: { vocabularyId: bogusKatachi.id } });
      await prisma.vocabulary.delete({ where: { id: bogusKatachi.id } });
    }

    // 2a. Enrich UPDATE_CANDIDATE records (e.g., adding FPT JPD tags or missing Kanji)
    for (const upd of payload.vocabUpdates) {
      const kFull = `${normJpKey(upd.item.word)}|${normJpKey(upd.item.kana)}`;
      const ex = vocabByWordKana.get(kFull) || vocabByWord.get(normJpKey(upd.item.word));
      if (!ex) continue;

      const currentTags = ex.tags || "";
      const incomingTags = upd.item.tags || "";
      const mergedTagsSet = new Set(
        [...currentTags.split(","), ...incomingTags.split(",")]
          .map((t) => t.trim())
          .filter(Boolean)
      );
      const mergedTags = Array.from(mergedTagsSet).join(",");
      const newKanji = ex.kanji || upd.item.kanji || null;

      if (mergedTags !== currentTags || newKanji !== ex.kanji) {
        stats.vocab.updated++;
        if (!isDryRun) {
          await prisma.vocabulary.update({
            where: { id: ex.id },
            data: {
              tags: mergedTags,
              kanji: newKanji,
            },
          });
        }
        ex.tags = mergedTags;
        ex.kanji = newKanji;
      } else {
        stats.vocab.duplicate++;
      }
    }

    // 2b. Reconcile or Insert Vocabulary records
    const vocabToCreate: typeof payload.vocabNew = [];
    const exampleResetVocabIds: string[] = [];
    const examplesToInsert: Array<{
      vocabularyId: string;
      japanese: string;
      meaning: string;
      romaji: string | null;
    }> = [];

    for (const cv of payload.vocabNew) {
      const kFull = `${normJpKey(cv.word)}|${normJpKey(cv.kana)}`;
      const kWord = normJpKey(cv.word);
      const existingV = vocabByWordKana.get(kFull);
      if (existingV) {
        const nextWord = normText(cv.word);
        const nextKana = normText(cv.kana);
        const nextRomaji = normText(cv.romaji) || existingV.romaji;
        const nextMeaning = normText(cv.meaning);
        const nextPos = cv.partOfSpeech || existingV.partOfSpeech;
        const hasSyntheticExample = Boolean(
          existingV.examples?.some((e) => e.japanese.includes("の意味と使い方を覚えます"))
        );

        const tags = existingV.tags || "";
        const isUnitcumentsRecord =
          tags.includes("unitcuments") ||
          tags.includes("Mimi-") ||
          tags.includes("TongHop-") ||
          tags.includes("FPT-JPD");
        const hasFieldDiff =
          existingV.word !== nextWord ||
          existingV.kana !== nextKana ||
          existingV.romaji !== nextRomaji ||
          existingV.meaning !== nextMeaning ||
          existingV.partOfSpeech !== nextPos;
        const needsFieldRepair = isUnitcumentsRecord && (hasFieldDiff || hasSyntheticExample);

        if (needsFieldRepair && existingV.id !== "pending") {
          stats.vocab.updated++;
          if (!isDryRun) {
            if (hasFieldDiff) {
              await prisma.vocabulary.update({
                where: { id: existingV.id },
                data: {
                  word: nextWord,
                  kana: nextKana,
                  romaji: nextRomaji,
                  meaning: nextMeaning,
                  partOfSpeech: nextPos,
                },
              });
            }
            if (hasSyntheticExample && cv.exampleJp && cv.exampleVi) {
              exampleResetVocabIds.push(existingV.id);
              examplesToInsert.push({
                vocabularyId: existingV.id,
                japanese: cv.exampleJp,
                meaning: cv.exampleVi,
                romaji: nextRomaji,
              });
            }
          }
          existingV.word = nextWord;
          existingV.kana = nextKana;
          existingV.romaji = nextRomaji;
          existingV.meaning = nextMeaning;
          existingV.partOfSpeech = nextPos;
          if (hasSyntheticExample && existingV.examples) {
            existingV.examples = [
              { id: "updated", vocabularyId: existingV.id, japanese: cv.exampleJp, meaning: cv.exampleVi, romaji: nextRomaji },
            ];
          }
        } else {
          stats.vocab.duplicate++;
        }
      } else {
        stats.vocab.new++;
        vocabToCreate.push(cv);
        vocabByWordKana.set(kFull, { id: "pending", word: cv.word, kana: cv.kana } as any);
        vocabByWord.set(kWord, { id: "pending", word: cv.word, kana: cv.kana } as any);
      }
    }

    if (!isDryRun && exampleResetVocabIds.length > 0) {
      await prisma.vocabularyExample.deleteMany({
        where: { vocabularyId: { in: exampleResetVocabIds } },
      });
      await prisma.vocabularyExample.createMany({
        data: examplesToInsert,
      });
    }

    if (!isDryRun && vocabToCreate.length > 0) {
      // Batch create vocabulary
      const BATCH_SIZE = 100;
      for (let i = 0; i < vocabToCreate.length; i += BATCH_SIZE) {
        const chunk = vocabToCreate.slice(i, i + BATCH_SIZE);
        await prisma.vocabulary.createMany({
          data: chunk.map((v) => ({
            word: normText(v.word),
            kana: normText(v.kana),
            kanji: v.kanji ? normText(v.kanji) : null,
            romaji: normText(v.romaji) || "nihongo",
            meaning: normText(v.meaning),
            partOfSpeech: v.partOfSpeech || "noun",
            jlptLevel: v.jlptLevel || "N5",
            tags: v.tags || "",
          })),
        });
      }

      // Fetch newly inserted vocabulary to attach examples
      const allNowVocab = await prisma.vocabulary.findMany({
        include: { examples: { select: { id: true } } },
      });
      const nowVocabMap = new Map<string, (typeof allNowVocab)[number]>();
      for (const v of allNowVocab) {
        nowVocabMap.set(`${normJpKey(v.word)}|${normJpKey(v.kana)}`, v);
      }

      const examplesToInsert: Array<{
        vocabularyId: string;
        japanese: string;
        meaning: string;
        romaji: string | null;
      }> = [];
      for (const cv of vocabToCreate) {
        const kFull = `${normJpKey(cv.word)}|${normJpKey(cv.kana)}`;
        const created = nowVocabMap.get(kFull);
        if (created && created.examples.length === 0 && cv.exampleJp && cv.exampleVi) {
          examplesToInsert.push({
            vocabularyId: created.id,
            japanese: cv.exampleJp,
            meaning: cv.exampleVi,
            romaji: cv.romaji || null,
          });
        }
      }
      if (examplesToInsert.length > 0) {
        for (let i = 0; i < examplesToInsert.length; i += 100) {
          await prisma.vocabularyExample.createMany({
            data: examplesToInsert.slice(i, i + 100),
          });
        }
      }
    }

    // -----------------------------------------------------------------------
    // STEP 3: GRAMMAR DEDUPLICATION, RECONCILIATION & IMPORT
    // -----------------------------------------------------------------------
    const grammarByStructure = new Map<string, (typeof existingGrammar)[number]>();
    for (const g of existingGrammar) {
      if (g.structure) {
        grammarByStructure.set(normJpKey(g.structure), g);
      }
    }

    const grammarToCreate: typeof payload.grammarNew = [];
    for (const cg of payload.grammarNew) {
      const kTitle = normJpKey(cg.title);
      const core = cg.title.replace(/\([^)]*\)|（[^）]*）/g, "").trim();
      const kCore = normJpKey(core);
      const kStruct = normJpKey(cg.structure);
      const isFpt = cg.title.includes("FPT");

      const existingG =
        grammarByKey.get(kTitle) ||
        (!isFpt && kCore ? grammarByKey.get(kCore) : undefined) ||
        (kStruct ? grammarByStructure.get(kStruct) : undefined);

      if (existingG) {
        const nextTitle = normText(cg.title);
        const nextMeaning = normText(cg.meaning);
        const needsGrammarRepair =
          existingG.id !== "pending" &&
          (existingG.meaning.includes("Cấu trúc ngữ pháp trung cấp Shinkanzen N3") ||
            existingG.meaning.includes("新完全マスターN3") ||
            existingG.meaning.startsWith("A 意味") ||
            existingG.meaning.startsWith("* Ý nghĩa:") ||
            existingG.meaning.startsWith("意味 ") ||
            existingG.title.startsWith("~~する") ||
            existingG.title === "~こと" ||
            (existingG.examples && existingG.examples.length === 0 && cg.examples?.length > 0));

        if (needsGrammarRepair) {
          stats.grammar.updated++;
          if (!isDryRun) {
            await prisma.grammar.update({
              where: { id: existingG.id },
              data: {
                title: nextTitle,
                meaning: nextMeaning,
              },
            });
            if (cg.examples?.length) {
              await prisma.grammarExample.deleteMany({ where: { grammarId: existingG.id } });
              await prisma.grammarExample.createMany({
                data: cg.examples.map((ex) => ({
                  grammarId: existingG.id,
                  japanese: normText(ex.japanese),
                  meaning: normText(ex.meaning),
                  romaji: ex.romaji ? normText(ex.romaji) : null,
                })),
              });
            }
          }
        } else {
          stats.grammar.duplicate++;
        }
      } else {
        stats.grammar.new++;
        grammarToCreate.push(cg);
        grammarByKey.set(kTitle, { id: "pending", title: cg.title } as any);
        if (!isFpt && kCore) {
          grammarByKey.set(kCore, { id: "pending", title: cg.title } as any);
        }
      }
    }

    if (!isDryRun && grammarToCreate.length > 0) {
      await prisma.grammar.createMany({
        data: grammarToCreate.map((g) => ({
          title: normText(g.title),
          level: g.level || "N4",
          meaning: normText(g.meaning),
          structure: normText(g.structure),
          commonMistakes: g.commonMistakes ? normText(g.commonMistakes) : null,
        })),
      });

      const allNowGrammar = await prisma.grammar.findMany({
        include: { examples: { select: { id: true } } },
      });
      const nowGrammarMap = new Map(allNowGrammar.map((g) => [normJpKey(g.title), g]));
      const gExamplesToInsert: Array<{
        grammarId: string;
        japanese: string;
        meaning: string;
        romaji: string | null;
      }> = [];
      for (const cg of grammarToCreate) {
        const created = nowGrammarMap.get(normJpKey(cg.title));
        if (created && created.examples.length === 0 && cg.examples?.length) {
          for (const ex of cg.examples) {
            gExamplesToInsert.push({
              grammarId: created.id,
              japanese: normText(ex.japanese),
              meaning: normText(ex.meaning),
              romaji: ex.romaji ? normText(ex.romaji) : null,
            });
          }
        }
      }
      if (gExamplesToInsert.length > 0) {
        await prisma.grammarExample.createMany({ data: gExamplesToInsert });
      }
    }

    // -----------------------------------------------------------------------
    // STEP 4: FPT JPD113–126 LESSONS & EXERCISES (PART 1–9)
    // -----------------------------------------------------------------------
    const allVocabAfter = isDryRun ? existingVocab : await prisma.vocabulary.findMany();
    const allGrammarAfter = isDryRun ? existingGrammar : await prisma.grammar.findMany();

    for (const fl of payload.fptLessons) {
      const existingLesson = lessonBySlug.get(fl.slug);
      if (existingLesson) {
        stats.lessons.duplicate++;
        stats.exercises.duplicate += existingLesson.exercises.length;
        continue;
      }

      stats.lessons.new++;
      stats.exercises.new += fl.exercises.length;

      if (!isDryRun) {
        const createdLesson = await prisma.lesson.create({
          data: {
            slug: fl.slug,
            title: fl.title,
            description: fl.description,
            level: fl.level,
            order: fl.order,
            xpReward: fl.xpReward,
            isPublished: true,
          },
        });

        // Link Vocabulary & Grammar items via LessonItem
        const matchingVocab = allVocabAfter.filter((v) => (v.tags || "").includes(fl.partTag));
        const matchingGrammar = allGrammarAfter.filter((g) =>
          g.title.includes(fl.grammarTitleMatch)
        );

        const lessonItemsData: Array<{
          lessonId: string;
          order: number;
          contentType: string;
          contentId: string;
          instruction: string;
        }> = [];
        let itemOrder = 1;
        for (const v of matchingVocab.slice(0, 10)) {
          lessonItemsData.push({
            lessonId: createdLesson.id,
            order: itemOrder++,
            contentType: "VOCAB",
            contentId: v.id,
            instruction: `Từ vựng trọng tâm ${fl.partTag}`,
          });
        }
        for (const g of matchingGrammar) {
          lessonItemsData.push({
            lessonId: createdLesson.id,
            order: itemOrder++,
            contentType: "GRAMMAR",
            contentId: g.id,
            instruction: `Ngữ pháp trọng tâm ${fl.partTag}`,
          });
        }
        if (lessonItemsData.length > 0) {
          await prisma.lessonItem.createMany({ data: lessonItemsData });
        }

        // Create Exercises and Options
        for (let idx = 0; idx < fl.exercises.length; idx++) {
          const ex = fl.exercises[idx];
          const labels = ["A", "B", "C", "D"];
          await prisma.exercise.create({
            data: {
              lessonId: createdLesson.id,
              contentType: "GRAMMAR",
              contentId: matchingGrammar[0]?.id ?? null,
              type: ex.type,
              question: ex.question,
              prompt: ex.prompt,
              correctAnswer: ex.correctAnswer,
              points: 10,
              order: idx + 1,
              options: {
                create: ex.options.map((optText, oIdx) => ({
                  label: labels[oIdx] || String(oIdx + 1),
                  text: optText,
                  isCorrect: optText === ex.correctAnswer,
                  order: oIdx + 1,
                })),
              },
            },
          });
        }
      }
    }

    // -----------------------------------------------------------------------
    // STEP 5: DYNAMIC EXAMS (4 BASELINE + 12 NEW FROM UNITCUMENTS = 16 EXAMS)
    // -----------------------------------------------------------------------
    const combinedExams: MasterPayload["dynamicExams"] = [
      ...TEST_MODES.map((m, idx) => ({
        slug: m.id,
        title: m.title,
        description: m.description,
        kindLabel: m.kindLabel,
        category: m.id === "DIAGNOSTIC" ? "PLACEMENT" : "LEVEL_TEST",
        targetLevel: m.targetLevel,
        skillFocus: "ALL",
        timeMinutes: m.timeMinutes,
        icon: m.icon,
        badge: m.badge,
        sourceDocument: "Nihon Quest 4-Skill Assessment Matrix (N5–N3)",
        answerAuthority: "CURATED",
        order: idx + 1,
        questions: getQuestionsForMode(m.id),
      })),
      ...payload.dynamicExams,
    ];

    for (const ex of combinedExams) {
      const existingExam = examBySlug.get(ex.slug);
      if (existingExam && existingExam.questions.length === ex.questions.length) {
        stats.exams.duplicate++;
        continue;
      }

      if (existingExam) {
        stats.exams.updated++;
      } else {
        stats.exams.new++;
      }

      if (!isDryRun) {
        const upsertedExam = await prisma.assessmentExam.upsert({
          where: { slug: ex.slug },
          update: {
            title: ex.title,
            description: ex.description,
            kindLabel: ex.kindLabel,
            category: ex.category,
            targetLevel: ex.targetLevel,
            skillFocus: ex.skillFocus,
            timeMinutes: ex.timeMinutes,
            icon: ex.icon,
            badge: ex.badge,
            sourceDocument: ex.sourceDocument,
            answerAuthority: ex.answerAuthority,
            isPublished: true,
            order: ex.order,
          },
          create: {
            slug: ex.slug,
            title: ex.title,
            description: ex.description,
            kindLabel: ex.kindLabel,
            category: ex.category,
            targetLevel: ex.targetLevel,
            skillFocus: ex.skillFocus,
            timeMinutes: ex.timeMinutes,
            icon: ex.icon,
            badge: ex.badge,
            sourceDocument: ex.sourceDocument,
            answerAuthority: ex.answerAuthority,
            isPublished: true,
            order: ex.order,
          },
        });

        await prisma.assessmentExamQuestion.deleteMany({
          where: { examId: upsertedExam.id },
        });

        await prisma.assessmentExamQuestion.createMany({
          data: ex.questions.map((q, qIdx) => ({
            examId: upsertedExam.id,
            questionKey: q.id,
            order: qIdx + 1,
            skill: q.skill,
            subCategory: q.subCategory,
            level: q.level,
            format: q.format,
            question: q.question,
            contextPassage: q.contextPassage ?? null,
            audioUrl: (q as any).audioUrl ?? null,
            audioScript: q.audioScript ?? null,
            promptHint: q.promptHint ?? null,
            optionsJson: JSON.stringify(q.options ?? []),
            acceptedKeywordsJson: JSON.stringify(q.acceptedKeywords ?? []),
            sampleAnswer: q.sampleAnswer ?? null,
            rubricCriteriaJson: JSON.stringify(q.rubricCriteria ?? []),
            explanation: q.explanation,
            recommendedLessonSlug: q.recommendedLesson.slug,
            recommendedLessonTitle: q.recommendedLesson.title,
            recommendedLessonTopic: q.recommendedLesson.topic,
          })),
        });
      }
    }

    // -----------------------------------------------------------------------
    // STEP 6: CATALOG ALL 249 DOCUMENT RESOURCES
    // -----------------------------------------------------------------------
    const docsToInsert: typeof payload.catalogDocuments = [];
    for (const doc of payload.catalogDocuments) {
      const existingDoc = docByPath.get(doc.relativePath);
      if (existingDoc && existingDoc.sha256 === doc.sha256) {
        stats.documents.duplicate++;
      } else if (existingDoc) {
        stats.documents.updated++;
        if (!isDryRun) {
          await prisma.documentResource.update({
            where: { id: existingDoc.id },
            data: {
              sha256: doc.sha256,
              sizeBytes: doc.sizeBytes,
              importStatus: doc.importStatus,
              accessPolicy: doc.accessPolicy,
              description: doc.description,
            },
          });
        }
      } else {
        stats.documents.new++;
        docsToInsert.push(doc);
      }
    }

    if (!isDryRun && docsToInsert.length > 0) {
      for (let i = 0; i < docsToInsert.length; i += 100) {
        const chunk = docsToInsert.slice(i, i + 100);
        await prisma.documentResource.createMany({
          data: chunk.map((d) => ({
            slug: d.slug,
            title: d.title,
            fileName: d.fileName,
            relativePath: d.relativePath,
            ext: d.ext,
            sizeBytes: d.sizeBytes,
            sha256: d.sha256,
            level: d.level,
            category: d.category,
            preImportStatus: d.preImportStatus,
            importStatus: d.importStatus,
            accessPolicy: d.accessPolicy,
            isDuplicate: d.isDuplicate,
            duplicateOf: d.duplicateOf,
            copyrightNote: d.copyrightNote,
            description: d.description,
          })),
          skipDuplicates: true,
        });
      }
    }

    console.log(`✅ [DEDUPLICATION & IMPORT RESULTS (${isDryRun ? "DRY-RUN" : "COMMITTED"})]:`);
    console.log(
      `   - Kanji:              NEW=${stats.kanji.new}, UPDATED=${stats.kanji.updated}, DUPLICATE_SKIPPED=${stats.kanji.duplicate}`
    );
    console.log(
      `   - Vocabulary:         NEW=${stats.vocab.new}, UPDATED=${stats.vocab.updated}, DUPLICATE_SKIPPED=${stats.vocab.duplicate}`
    );
    console.log(
      `   - Grammar:            NEW=${stats.grammar.new}, UPDATED=${stats.grammar.updated}, DUPLICATE_SKIPPED=${stats.grammar.duplicate}`
    );
    console.log(
      `   - Lessons (FPT JPD):  NEW=${stats.lessons.new}, UPDATED=${stats.lessons.updated}, DUPLICATE_SKIPPED=${stats.lessons.duplicate}`
    );
    console.log(
      `   - Exercises:          NEW=${stats.exercises.new}, DUPLICATE_SKIPPED=${stats.exercises.duplicate}`
    );
    console.log(
      `   - Dynamic Exams:      NEW=${stats.exams.new}, UPDATED=${stats.exams.updated}, DUPLICATE_SKIPPED=${stats.exams.duplicate}`
    );
    console.log(
      `   - Document Catalog:   NEW=${stats.documents.new}, UPDATED=${stats.documents.updated}, DUPLICATE_SKIPPED=${stats.documents.duplicate}`
    );
    console.log(`   - REVIEW_REQUIRED:    ${payload.reviewRequired.length} items logged safely.\n`);

    if (!isDryRun) {
      const [
        afterKanji,
        afterVocab,
        afterGrammar,
        afterLessons,
        afterExercises,
        afterExams,
        afterExamQuestions,
        afterDocs,
        afterUsers,
        afterProgress,
        afterReviews,
      ] = await Promise.all([
        prisma.kanji.count(),
        prisma.vocabulary.count(),
        prisma.grammar.count(),
        prisma.lesson.count(),
        prisma.exercise.count(),
        prisma.assessmentExam.count(),
        prisma.assessmentExamQuestion.count(),
        prisma.documentResource.count(),
        prisma.user.count(),
        prisma.userLessonProgress.count(),
        prisma.reviewItem.count(),
      ]);

      console.log(`📈 [POST-STATE] Live Database Counts After Import:`);
      console.log(`   - Kanji:              ${afterKanji} (was ${existingKanji.length})`);
      console.log(`   - Vocabulary:         ${afterVocab} (was ${existingVocab.length})`);
      console.log(`   - Grammar:            ${afterGrammar} (was ${existingGrammar.length})`);
      console.log(`   - Lessons:            ${afterLessons} (was ${existingLessons.length})`);
      console.log(`   - Exercises:          ${afterExercises} (was ${existingExercisesCount})`);
      console.log(
        `   - Dynamic Exams:      ${afterExams} exams / ${afterExamQuestions} questions`
      );
      console.log(`   - Catalog Documents:  ${afterDocs} files`);
      console.log(
        `   - User State Intact:  ${afterUsers} Users, ${afterProgress} LessonProgress, ${afterReviews} ReviewItems`
      );
    }
  } finally {
    await releaseAdvisoryLock();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
