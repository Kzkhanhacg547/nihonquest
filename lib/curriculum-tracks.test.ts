import { describe, it, expect } from "vitest";
import {
  CURRICULUM_TRACKS,
  GENKI_ARCHIVE_MAP,
  getLessonCurriculumMetadata,
  type CurriculumTrackId,
} from "./curriculum-tracks";

describe("Source-Aware Curriculum Hierarchy & Textbook Tracks", () => {
  describe("CURRICULUM_TRACKS Registry", () => {
    it("defines authentic tracks without merging distinct textbooks", () => {
      const trackIds: CurriculumTrackId[] = [
        "minna-shokyuu-1",
        "dekiru-fpt-jpd",
        "jlpt-n5-skills",
        "minna-shokyuu-2",
        "shinkanzen-n3",
        "genki-reference",
      ];

      for (const id of trackIds) {
        expect(CURRICULUM_TRACKS[id]).toBeDefined();
        expect(CURRICULUM_TRACKS[id].textbookTitle).toBeTruthy();
        expect(CURRICULUM_TRACKS[id].editionOrVolume).toBeTruthy();
      }
    });

    it("assigns TEXTBOOK_VERIFIED only to textbooks with verified source files", () => {
      expect(CURRICULUM_TRACKS["minna-shokyuu-1"].provenance).toBe("TEXTBOOK_VERIFIED");
      expect(CURRICULUM_TRACKS["dekiru-fpt-jpd"].provenance).toBe("TEXTBOOK_VERIFIED");
      expect(CURRICULUM_TRACKS["minna-shokyuu-2"].provenance).toBe("TEXTBOOK_VERIFIED");
    });

    it("marks Genki reference track honestly as UNVERIFIED due to AES-encrypted archive", () => {
      const genkiTrack = CURRICULUM_TRACKS["genki-reference"];
      expect(genkiTrack.provenance).toBe("UNVERIFIED");
      expect(genkiTrack.coverageStatus).toBe("LOCKED_ARCHIVE_STRUCTURE_ONLY");
      expect(genkiTrack.sourceFiles.some((f) => f.includes("Giao trinh Genki 1"))).toBe(true);
      expect(genkiTrack.sourceFiles.some((f) => f.includes("Giao trinh Genki 2"))).toBe(true);
    });

    it("assigns SUPPLEMENTARY_VERIFIED to skill-based and composite datasets", () => {
      expect(CURRICULUM_TRACKS["jlpt-n5-skills"].provenance).toBe("SUPPLEMENTARY_VERIFIED");
      expect(CURRICULUM_TRACKS["shinkanzen-n3"].provenance).toBe("SUPPLEMENTARY_VERIFIED");
    });
  });

  describe("GENKI_ARCHIVE_MAP (Cross-Reference Roadmap)", () => {
    it("indexes all 23 lessons across Genki I & II based on verified audio inventory", () => {
      expect(GENKI_ARCHIVE_MAP).toHaveLength(23);

      const genki1 = GENKI_ARCHIVE_MAP.filter((g) => g.volume.startsWith("Genki I "));
      const genki2 = GENKI_ARCHIVE_MAP.filter((g) => g.volume.startsWith("Genki II "));

      expect(genki1).toHaveLength(12); // Lessons 1-12
      expect(genki2).toHaveLength(11); // Lessons 13-23
    });

    it("preserves authentic audio codes from uncompressed mp3 archive inventory", () => {
      const lesson1 = GENKI_ARCHIVE_MAP.find((g) => g.genkiLessonNumber === 1);
      expect(lesson1).toBeDefined();
      expect(lesson1?.audioCode).toContain("K01");
      expect(lesson1?.readingWritingCode).toContain("Y01");
      expect(lesson1?.workbookCode).toContain("W01");

      const lesson23 = GENKI_ARCHIVE_MAP.find((g) => g.genkiLessonNumber === 23);
      expect(lesson23).toBeDefined();
      expect(lesson23?.audioCode).toContain("K23");
      expect(lesson23?.readingWritingCode).toContain("Y23");
      expect(lesson23?.workbookCode).toContain("W23");
    });

    it("faithfully reports archive status without fabricating text coverage", () => {
      for (const item of GENKI_ARCHIVE_MAP) {
        expect(item.provenance).toBe("UNVERIFIED");
        expect(item.archiveStatusVi).toContain("AES");
        expect(item.equivalentVerifiedLessonSlug).toBeTruthy();
      }
    });
  });

  describe("Lesson Curriculum Metadata Resolver (getLessonCurriculumMetadata)", () => {
    it("resolves Minna no Nihongo I lessons with chapter and provenance details", () => {
      const meta = getLessonCurriculumMetadata({
        slug: "self-introduction-grammar",
        title: "Bài 1: Giới thiệu bản thân",
        level: "N5",
        order: 9,
      });

      expect(meta.trackId).toBe("minna-shokyuu-1");
      expect(meta.textbookTitle).toContain("Minna no Nihongo Shokyū I");
      expect(meta.chapterLabel).toBe("Bài 1");
      expect(meta.provenance).toBe("TEXTBOOK_VERIFIED");
      expect(meta.learningObjectiveVi).toBeTruthy();
      expect(meta.whyItMattersVi).toBeTruthy();
    });

    it("resolves Dekiru Nihongo / FPT JPD curriculum lessons correctly", () => {
      const meta = getLessonCurriculumMetadata({
        slug: "fpt-jpd113-part-1",
        title: "FPT JPD113 — Part 1: Giao tiếp làm quen",
        level: "N5",
        order: 50,
      });

      expect(meta.trackId).toBe("dekiru-fpt-jpd");
      expect(meta.textbookTitle).toContain("Dekiru Nihongo");
      expect(meta.chapterLabel).toBe("Part 1 (第1課)");
      expect(meta.provenance).toBe("TEXTBOOK_VERIFIED");
    });

    it("resolves Minna no Nihongo II lessons (N4)", () => {
      const meta = getLessonCurriculumMetadata({
        slug: "n4-lesson-26",
        title: "Bài 26: Thể Thường + んです",
        level: "N4",
        order: 0,
      });

      expect(meta.trackId).toBe("minna-shokyuu-2");
      expect(meta.textbookTitle).toContain("Minna no Nihongo Shokyū II");
      expect(meta.chapterLabel).toBe("Bài 26");
      expect(meta.provenance).toBe("TEXTBOOK_VERIFIED");
      expect(meta.prerequisiteLabelVi).toContain("Minna no Nihongo I (Bài 1–25)");
    });

    it("resolves Shinkanzen Master & Mimikara N3 lessons", () => {
      const meta = getLessonCurriculumMetadata({
        slug: "n3-lesson-1",
        title: "Chuyên đề N3: Quan hệ nguyên nhân",
        level: "N3",
        order: 0,
      });

      expect(meta.trackId).toBe("shinkanzen-n3");
      expect(meta.textbookTitle).toContain("Shinkanzen Master");
      expect(meta.provenance).toBe("SUPPLEMENTARY_VERIFIED");
      expect(meta.prerequisiteLabelVi).toContain("Minna no Nihongo II (Bài 26–50)");
    });
  });
});

