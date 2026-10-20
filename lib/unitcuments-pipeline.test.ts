import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { resolveSafeUnitcumentsPath } from "./document-file-server";

const UNITCUMENTS_DIR = path.join(process.cwd(), "unitcuments");
const FIXTURE_FILES = [
  "JPD113-123-133-116 -126-GRAMMAR_PART 1-9.pdf",
  "JPD113-123-133-116 -126-VOCABULARY_PART 1-8.pdf",
  path.join("Đề thi N5_2017", "N5Q1.mp3"),
];

describe("Nihon Quest Document Vault, Multi-Level Deduplication & Dynamic Exam System", () => {
  const createdPaths: string[] = [];
  let createdRoot = false;

  beforeAll(() => {
    // `unitcuments/` is gitignored; create minimal fixture files when absent so
    // NFC/NFD resolution and path-traversal security tests run reliably in clean checkouts.
    if (!fs.existsSync(UNITCUMENTS_DIR)) {
      fs.mkdirSync(UNITCUMENTS_DIR, { recursive: true });
      createdRoot = true;
    }
    for (const rel of FIXTURE_FILES) {
      const full = path.join(UNITCUMENTS_DIR, rel);
      const dir = path.dirname(full);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        createdPaths.push(dir);
      }
      if (!fs.existsSync(full)) {
        fs.writeFileSync(full, "fixture");
        createdPaths.push(full);
      }
    }
  });

  afterAll(() => {
    for (const p of createdPaths.reverse()) {
      try {
        const stat = fs.statSync(p);
        if (stat.isFile()) fs.unlinkSync(p);
        else if (stat.isDirectory()) fs.rmdirSync(p);
      } catch {
        // ignore cleanup errors
      }
    }
    if (createdRoot) {
      try {
        fs.rmdirSync(UNITCUMENTS_DIR);
      } catch {
        // ignore if non-empty
      }
    }
  });

  it("blocks path traversal and safely resolves NFC/NFD files inside unitcuments/", () => {
    expect(resolveSafeUnitcumentsPath("../package.json")).toBeNull();
    expect(resolveSafeUnitcumentsPath("../../Windows/win.ini")).toBeNull();
    expect(resolveSafeUnitcumentsPath("unitcuments/../../package.json")).toBeNull();

    // Valid FPT Grammar PDF (both with and without leading unitcuments/ prefix)
    const fptGrammarPath = resolveSafeUnitcumentsPath(
      "unitcuments/JPD113-123-133-116 -126-GRAMMAR_PART 1-9.pdf"
    );
    expect(fptGrammarPath).not.toBeNull();
    expect(fs.existsSync(fptGrammarPath!)).toBe(true);

    const fptVocabDirect = resolveSafeUnitcumentsPath(
      "JPD113-123-133-116 -126-VOCABULARY_PART 1-8.pdf"
    );
    expect(fptVocabDirect).not.toBeNull();
    expect(fs.existsSync(fptVocabDirect!)).toBe(true);

    // Valid NFD/NFC accented audio path
    const n5AudioPath = resolveSafeUnitcumentsPath("Đề thi N5_2017/N5Q1.mp3");
    expect(n5AudioPath).not.toBeNull();
    expect(fs.existsSync(n5AudioPath!)).toBe(true);
  });

  it("validates unitcuments-knowledge.json payload structure, FPT JPD coverage, and access policies", () => {
    const payloadPath = path.join(process.cwd(), "prisma", "seed-data", "unitcuments-knowledge.json");
    expect(fs.existsSync(payloadPath)).toBe(true);

    const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));

    // 1. Catalog documents (all 249 files)
    expect(payload.catalogDocuments.length).toBe(249);
    for (const doc of payload.catalogDocuments) {
      expect(doc.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(["DOWNLOADABLE", "VIEW_ONLY", "AUDIO_STREAM", "METADATA_ONLY"]).toContain(
        doc.accessPolicy
      );
      expect(["IMPORTED", "PARTIALLY_IMPORTED", "DUPLICATE", "REFERENCED"]).toContain(
        doc.importStatus
      );
    }

    // 2. FPT JPD Part 1-9 lessons
    expect(payload.fptLessons.length).toBe(9);
    expect(payload.fptLessons[0].slug).toBe("fpt-jpd113-part-01-hajimemashite");
    expect(payload.fptLessons[8].slug).toBe("fpt-jpd133-part-09-watashi-no-shumi");

    // 3. Dynamic Exams (12 new exams + 4 core = 16 total in DB)
    expect(payload.dynamicExams.length).toBe(12);
    for (const exam of payload.dynamicExams) {
      expect(["OFFICIAL", "CURATED"]).toContain(exam.answerAuthority);
      expect(exam.questions.length).toBeGreaterThanOrEqual(2);
    }

    // 4. Explicit REVIEW_REQUIRED tracking
    expect(payload.reviewRequired.length).toBeGreaterThanOrEqual(5);
  });
});
