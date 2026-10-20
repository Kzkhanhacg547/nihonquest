/**
 * Source-Aware Curriculum Hierarchy & Textbook Track Registry
 *
 * Represents distinct Japanese textbooks and learning tracks based on the actual
 * research materials in `D:\Projects\nihonquest\research` and curated seed datasets,
 * without forcing separate textbooks into an artificial shared chapter sequence or
 * fabricating chapters from encrypted archives.
 */

import type { ContentProvenanceType } from "./canonical-vocab";

export type CurriculumTrackId =
  | "minna-shokyuu-1"
  | "dekiru-fpt-jpd"
  | "minna-shokyuu-2"
  | "shinkanzen-n3"
  | "jlpt-n5-skills"
  | "genki-reference";

export interface TextbookSourceMetadata {
  trackId: CurriculumTrackId;
  textbookTitle: string;
  shortTitle: string;
  editionOrVolume: string;
  targetJlptGuidance: "N5" | "N4" | "N3" | "N5–N4";
  provenance: ContentProvenanceType;
  provenanceBadgeVi: string;
  sourceFiles: string[];
  coverageStatus: "COMPLETE" | "PARTIAL" | "LOCKED_ARCHIVE_STRUCTURE_ONLY";
  coverageSummaryVi: string;
  pedagogicalFocusVi: string;
}

export interface LessonCurriculumMetadata {
  slug: string;
  trackId: CurriculumTrackId;
  textbookTitle: string;
  shortTrackLabel: string;
  volumeLabel: string;
  chapterLabel: string;
  provenance: ContentProvenanceType;
  provenanceLabelVi: string;
  sourceFile: string;
  learningObjectiveVi: string;
  whyItMattersVi: string;
  prerequisiteLabelVi: string | null;
  relatedGenkiLesson?: string;
}

export interface GenkiArchiveLessonMap {
  genkiLessonNumber: number;
  volume: "Genki I (2nd Ed., 2011)" | "Genki II (2nd Ed., 2011)";
  audioCode: string;
  readingWritingCode: string;
  workbookCode: string;
  provenance: ContentProvenanceType;
  archiveStatusVi: string;
  equivalentVerifiedLessonSlug: string;
  equivalentTopicVi: string;
}

export const CURRICULUM_TRACKS: Record<CurriculumTrackId, TextbookSourceMetadata> = {
  "minna-shokyuu-1": {
    trackId: "minna-shokyuu-1",
    textbookTitle: "Minna no Nihongo Shokyū I (みんなの日本語 初級I)",
    shortTitle: "Minna no Nihongo I",
    editionOrVolume: "Shokyū I — Bảng chữ cái & Bài 1–25",
    targetJlptGuidance: "N5",
    provenance: "TEXTBOOK_VERIFIED",
    provenanceBadgeVi: "TEXTBOOK_VERIFIED • Giáo trình chuẩn",
    sourceFiles: [
      "research/Mina (Bản dịch N5).pdf",
      "research/[studyjapanese.net]_Minna_No_Nihongo_I-Honsatsu-full.pdf",
      "research/Minna no Nihongo I&II - Honsatsu (Books+AudioCDs)-20261018T183336Z-1-001.zip",
    ],
    coverageStatus: "COMPLETE",
    coverageSummaryVi: "Đầy đủ 8 bài nền tảng Kana + 25 bài Minna no Nihongo I (31 học phần ngữ pháp & giao tiếp).",
    pedagogicalFocusVi:
      "Xây dựng nền tảng chữ viết Hiragana/Katakana, mẫu câu lịch sự (Desu/Masu), trợ từ cơ bản và các thể động từ cốt lõi (Te, Nai, Jisho, Ta, Futsuu).",
  },
  "dekiru-fpt-jpd": {
    trackId: "dekiru-fpt-jpd",
    textbookTitle: "Dekiru Nihongo Shokyū — FPT University (JPD113 • JPD123 • JPD133)",
    shortTitle: "Dekiru Nihongo (FPT JPD)",
    editionOrVolume: "Học phần JPD113, JPD123, JPD133/126 — Part 1–9 (第1課〜第9課)",
    targetJlptGuidance: "N5",
    provenance: "TEXTBOOK_VERIFIED",
    provenanceBadgeVi: "TEXTBOOK_VERIFIED • Giáo trình ĐH FPT",
    sourceFiles: [
      "prisma/seed-data/jpd-curriculum-expansion.json",
      "prisma/seed-data/unitcuments-knowledge.json",
    ],
    coverageStatus: "COMPLETE",
    coverageSummaryVi: "Đầy đủ 9 học phần giao tiếp theo tình huống (Part 1–9) của chương trình tiếng Nhật Đại học FPT.",
    pedagogicalFocusVi:
      "Thực hành tiếng Nhật theo chủ đề giao tiếp thực tế (Tự giới thiệu, Mua sắm, Lịch trình, Quê hương, Ngày nghỉ, Rủ rê, Chỉ đường, Gia đình, Sở thích).",
  },
  "jlpt-n5-skills": {
    trackId: "jlpt-n5-skills",
    textbookTitle: "Chuyên đề Kỹ năng & Đề thi thử N5 (Kanji • Ngữ pháp • Đọc • Nghe)",
    shortTitle: "Kỹ năng & Ôn tập N5",
    editionOrVolume: "10 chuyên đề tổng hợp & Mock Test N5",
    targetJlptGuidance: "N5",
    provenance: "SUPPLEMENTARY_VERIFIED",
    provenanceBadgeVi: "SUPPLEMENTARY_VERIFIED • Tài liệu bổ trợ",
    sourceFiles: [
      "prisma/seed-data/lessons/n5.ts",
      "prisma/seed-data/unitcuments-knowledge.json",
    ],
    coverageStatus: "COMPLETE",
    coverageSummaryVi: "10 học phần chuyên sâu về Kanji N5 theo chủ đề, tổng hợp trợ từ, chia động từ, đọc hiểu bảng tin/email và nghe hiểu.",
    pedagogicalFocusVi:
      "Hệ thống hóa chữ Hán, trợ từ và kỹ năng giải đề đọc hiểu / nghe hiểu sau khi hoàn thành giáo trình sơ cấp.",
  },
  "minna-shokyuu-2": {
    trackId: "minna-shokyuu-2",
    textbookTitle: "Minna no Nihongo Shokyū II (みんなの日本語 初級II)",
    shortTitle: "Minna no Nihongo II",
    editionOrVolume: "Shokyū II — Bài 26–50",
    targetJlptGuidance: "N4",
    provenance: "TEXTBOOK_VERIFIED",
    provenanceBadgeVi: "TEXTBOOK_VERIFIED • Giáo trình chuẩn",
    sourceFiles: [
      "research/[studyjapanese.net]_Minna_No_Nihongo_II-Honsatsu-full.pdf",
      "research/Minna no Nihongo I&II - Honsatsu (Books+AudioCDs)-20261018T183336Z-1-001.zip",
    ],
    coverageStatus: "COMPLETE",
    coverageSummaryVi: "Đầy đủ 25 bài Minna no Nihongo II (Bài 26 đến Bài 50) tương ứng định hướng N4.",
    pedagogicalFocusVi:
      "Làm chủ thể Khả năng, Ý định, Mệnh lệnh, Điều kiện (〜ば/〜なら), Tự/Tha động từ, Bị động (受身), Sai khiến (使役) và Kính ngữ (尊敬語・謙譲語).",
  },
  "shinkanzen-n3": {
    trackId: "shinkanzen-n3",
    textbookTitle: "Shinkanzen Master & Mimikara Oboeru N3 (新完全マスター・耳から覚える N3)",
    shortTitle: "Shinkanzen & Mimikara N3",
    editionOrVolume: "Trung cấp N3 — 25 chuyên đề Ngữ pháp, Kanji, Từ vựng, Đọc & Nghe",
    targetJlptGuidance: "N3",
    provenance: "SUPPLEMENTARY_VERIFIED",
    provenanceBadgeVi: "SUPPLEMENTARY_VERIFIED • Tài liệu luyện thi N3",
    sourceFiles: [
      "prisma/seed-data/unitcuments-knowledge.json (ngu-phap-shinkanzen-n3. Tieng Viet.pdf, Tong-hop-tu-vung-N3.pdf)",
      "prisma/seed-data/n3-data.ts",
    ],
    coverageStatus: "COMPLETE",
    coverageSummaryVi: "25 chuyên đề trung cấp N3: 10 bài ngữ pháp Shinkanzen, 5 bài Kanji, 3 bài từ vựng, 4 bài đọc/nghe và 3 đề thi thử.",
    pedagogicalFocusVi:
      "Nâng cấp khả năng lập luận, văn phong báo chí/công sở, đọc hiểu email công việc và phản xạ nghe hiểu trung cấp.",
  },
  "genki-reference": {
    trackId: "genki-reference",
    textbookTitle: "Genki I & II: An Integrated Course in Elementary Japanese (2nd Edition, 2011)",
    shortTitle: "Genki I & II (Đối chiếu nguồn)",
    editionOrVolume: "2nd Edition (2011) — Vol. I (Lessons 1–12) & Vol. II (Lessons 13–23)",
    targetJlptGuidance: "N5–N4",
    provenance: "UNVERIFIED",
    provenanceBadgeVi: "UNVERIFIED • File PDF khóa mật khẩu AES",
    sourceFiles: [
      "research/Giao trinh Genki 1 - SBT - Audio.zip (WinZip AES-encrypted, 250 entries)",
      "research/Giao trinh Genki 2 - SBT - PDF - Audio.zip (WinZip AES-encrypted, 227 entries)",
    ],
    coverageStatus: "LOCKED_ARCHIVE_STRUCTURE_ONLY",
    coverageSummaryVi:
      "Cấu trúc 23 bài (K01–K23 Kaiwa/Bunpō, Y01–Y23 Yomikaki, W01–W23 Workbook) được xác thực từ danh mục file nén; nội dung trang PDF đang khóa mật khẩu AES nên hệ thống giữ nguyên trạng thái UNVERIFIED và đối chiếu sang bài Minna tương đương thay vì tự bịa nội dung.",
    pedagogicalFocusVi:
      "Bảng đối chiếu minh bạch giữa cấu trúc 23 bài Genki I & II và các bài học đã xác thực trong Minna no Nihongo I & II.",
  },
};

/**
 * Verified structure of Genki I (Lessons 1–12) and Genki II (Lessons 13–23) extracted
 * from the central directory of the two research ZIP archives, mapped to verified lessons.
 */
export const GENKI_ARCHIVE_MAP: GenkiArchiveLessonMap[] = [
  {
    genkiLessonNumber: 1,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K01_01..K01_19.mp3",
    readingWritingCode: "Y01_01..Y01_06.mp3",
    workbookCode: "W01_01..W01_04.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L1",
    equivalentVerifiedLessonSlug: "self-introduction-grammar",
    equivalentTopicVi: "Chào hỏi, tự giới thiệu (X は Y です), hỏi giờ & số đếm",
  },
  {
    genkiLessonNumber: 2,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K02_01..K02_17.mp3",
    readingWritingCode: "Y02_01..Y02_06.mp3",
    workbookCode: "W02_01..W02_04.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L2",
    equivalentVerifiedLessonSlug: "minna-lesson-02-kore-sore-are",
    equivalentTopicVi: "Chỉ thị từ これ・それ・あれ・ここ・そこ・あそこ & mua sắm",
  },
  {
    genkiLessonNumber: 3,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K03_01..K03_18.mp3",
    readingWritingCode: "Y03_01..Y03_02.mp3",
    workbookCode: "W03_01..W03_04.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L3",
    equivalentVerifiedLessonSlug: "minna-lesson-06-invitations",
    equivalentTopicVi: "Chia động từ thể ます, trợ từ に/で/を/へ & lời mời 〜ませんか",
  },
  {
    genkiLessonNumber: 4,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K04_01..K04_17.mp3",
    readingWritingCode: "Y04_01..Y04_02.mp3",
    workbookCode: "W04_01..W04_04.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L4",
    equivalentVerifiedLessonSlug: "minna-lesson-10-arimasu-imasu",
    equivalentTopicVi: "Sự tồn tại あります・います, vị trí và thì quá khứ",
  },
  {
    genkiLessonNumber: 5,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K05_01..K05_18.mp3",
    readingWritingCode: "Y05_01..Y05_03.mp3",
    workbookCode: "W05_01..W05_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L5",
    equivalentVerifiedLessonSlug: "minna-lesson-08-i-adjectives",
    equivalentTopicVi: "Tính từ đuôi い / đuôi な (hiện tại & quá khứ), すき・きらい",
  },
  {
    genkiLessonNumber: 6,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K06_01..K06_18.mp3",
    readingWritingCode: "Y06_01..Y06_02.mp3",
    workbookCode: "W06_01..W06_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L6",
    equivalentVerifiedLessonSlug: "minna-lesson-14-te-form-rules",
    equivalentTopicVi: "Thể Te (て形), yêu cầu 〜てください, xin phép 〜てもいいです",
  },
  {
    genkiLessonNumber: 7,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K07_01..K07_17.mp3",
    readingWritingCode: "Y07_01..Y07_02.mp3",
    workbookCode: "W07_01..W07_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L7",
    equivalentVerifiedLessonSlug: "minna-lesson-16-te-kara-body",
    equivalentTopicVi: "Đang diễn ra 〜ています, miêu tả ngoại hình & đếm người",
  },
  {
    genkiLessonNumber: 8,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K08_01..K08_19.mp3",
    readingWritingCode: "Y08_01..Y08_02.mp3",
    workbookCode: "W08_01..W08_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L8",
    equivalentVerifiedLessonSlug: "minna-lesson-20-plain-form",
    equivalentTopicVi: "Thể ngắn / thông thường (普通形), 〜と思います, 〜と言っていました",
  },
  {
    genkiLessonNumber: 9,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K09_01..K09_17.mp3",
    readingWritingCode: "Y09_01..Y09_02.mp3",
    workbookCode: "W09_01..W09_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L9",
    equivalentVerifiedLessonSlug: "minna-lesson-22-noun-modification",
    equivalentTopicVi: "Thể ngắn quá khứ, định ngữ bổ nghĩa danh từ, まだ〜ていません",
  },
  {
    genkiLessonNumber: 10,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K10_01..K10_18.mp3",
    readingWritingCode: "Y10_01..Y10_02.mp3",
    workbookCode: "W10_01..W10_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L10",
    equivalentVerifiedLessonSlug: "minna-lesson-12-comparisons",
    equivalentTopicVi: "So sánh hơn/nhất (より・いちばん), dự định 〜つもりだ, biến đổi 〜くなる",
  },
  {
    genkiLessonNumber: 11,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K11_01..K11_16.mp3",
    readingWritingCode: "Y11_01..Y11_02.mp3",
    workbookCode: "W11_01..W11_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L11",
    equivalentVerifiedLessonSlug: "minna-lesson-19-ta-form-experience",
    equivalentTopicVi: "Mong muốn 〜たい, liệt kê 〜たり〜たりする, kinh nghiệm 〜たことがある",
  },
  {
    genkiLessonNumber: 12,
    volume: "Genki I (2nd Ed., 2011)",
    audioCode: "K12_01..K12_18.mp3",
    readingWritingCode: "Y12_01..Y12_02.mp3",
    workbookCode: "W12_01..W12_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L12",
    equivalentVerifiedLessonSlug: "n4-lesson-26-ndesu",
    equivalentTopicVi: "Giải thích 〜んです, quá mức 〜すぎる, lời khuyên 〜ほうがいいです",
  },
  {
    genkiLessonNumber: 13,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K13_01..K13_18.mp3",
    readingWritingCode: "Y13_01..Y13_02.mp3",
    workbookCode: "W13_01..W13_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L13",
    equivalentVerifiedLessonSlug: "n4-lesson-27-potential",
    equivalentTopicVi: "Động từ khả năng (可能形), nêu nhiều lý do 〜し, dự đoán 〜そうです",
  },
  {
    genkiLessonNumber: 14,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K14_01..K14_17.mp3",
    readingWritingCode: "Y14_01..Y14_02.mp3",
    workbookCode: "W14_01..W14_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L14",
    equivalentVerifiedLessonSlug: "minna-lesson-07-tools-and-giving",
    equivalentTopicVi: "Mong muốn đồ vật ほしい, khả năng 〜かもしれません, tặng nhận あげる・くれる・もらう",
  },
  {
    genkiLessonNumber: 15,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K15_01..K15_16.mp3",
    readingWritingCode: "Y15_01..Y15_02.mp3",
    workbookCode: "W15_01..W15_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L15",
    equivalentVerifiedLessonSlug: "n4-lesson-31-volitional",
    equivalentTopicVi: "Thể ý định (意向形), 〜と思っています, chuẩn bị sẵn 〜ておく",
  },
  {
    genkiLessonNumber: 16,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K16_01..K16_18.mp3",
    readingWritingCode: "Y16_01..Y16_02.mp3",
    workbookCode: "W16_01..W16_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L16",
    equivalentVerifiedLessonSlug: "n4-lesson-41-giving-receiving-keigo",
    equivalentTopicVi: "Làm giúp 〜てあげる・〜てくれる・〜てもらう, xin lỗi 〜てすみませんでした",
  },
  {
    genkiLessonNumber: 17,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K17_01..K17_17.mp3",
    readingWritingCode: "Y17_01..Y17_02.mp3",
    workbookCode: "W17_01..W17_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L17",
    equivalentVerifiedLessonSlug: "n4-lesson-47-souda-youdai-hearsay",
    equivalentTopicVi: "Nghe nói 〜そうです / 〜って, giả định 〜たら, không cần 〜なくてもいいです",
  },
  {
    genkiLessonNumber: 18,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K18_01..K18_18.mp3",
    readingWritingCode: "Y18_01..Y18_02.mp3",
    workbookCode: "W18_01..W18_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L18",
    equivalentVerifiedLessonSlug: "n4-lesson-29-intransitive",
    equivalentTopicVi: "Tự động từ & Tha động từ, hoàn tất/nuối tiếc 〜てしまう, hành động song song 〜ながら",
  },
  {
    genkiLessonNumber: 19,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K19_01..K19_17.mp3",
    readingWritingCode: "Y19_01..Y19_02.mp3",
    workbookCode: "W19_01..W19_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L19",
    equivalentVerifiedLessonSlug: "n4-lesson-49-respectful-sonkeigo",
    equivalentTopicVi: "Kính ngữ tôn kính (尊敬語), lời khuyên lịch sự お〜ください, biết ơn 〜てよかったです",
  },
  {
    genkiLessonNumber: 20,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K20_01..K20_17.mp3",
    readingWritingCode: "Y20_01..Y20_02.mp3",
    workbookCode: "W20_01..W20_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L20",
    equivalentVerifiedLessonSlug: "n4-lesson-50-humble-kenjougo",
    equivalentTopicVi: "Khiêm nhường ngữ (謙譲語), không làm 〜ないで, câu hỏi lồng 〜か / 〜かどうか",
  },
  {
    genkiLessonNumber: 21,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K21_01..K21_17.mp3",
    readingWritingCode: "Y21_01..Y21_02.mp3",
    workbookCode: "W21_01..W21_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L21",
    equivalentVerifiedLessonSlug: "n4-lesson-37-passive-ukemi",
    equivalentTopicVi: "Thể bị động (受身形), trạng thái chuẩn bị 〜てある, trong khi 〜間に",
  },
  {
    genkiLessonNumber: 22,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K22_01..K22_17.mp3",
    readingWritingCode: "Y22_01..Y22_02.mp3",
    workbookCode: "W22_01..W22_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L22",
    equivalentVerifiedLessonSlug: "n4-lesson-48-causative-shieki",
    equivalentTopicVi: "Thể sai khiến (使役形), mệnh lệnh 〜なさい, điều kiện 〜ば",
  },
  {
    genkiLessonNumber: 23,
    volume: "Genki II (2nd Ed., 2011)",
    audioCode: "K23_01..K23_16.mp3",
    readingWritingCode: "Y23_01..Y23_02.mp3",
    workbookCode: "W23_01..W23_03.mp3",
    provenance: "UNVERIFIED",
    archiveStatusVi: "PDF khóa mật khẩu AES • Đã xác thực cấu trúc Audio L23",
    equivalentVerifiedLessonSlug: "n4-lesson-45-baai-noni",
    equivalentTopicVi: "Thể bị động sai khiến (使役受身), dù cho 〜ても, quyết định 〜ことにする",
  },
];

/**
 * Classifies any lesson into its authentic textbook track, chapter label,
 * provenance status, and prerequisite context.
 */
export function getLessonCurriculumMetadata(lesson: {
  slug: string;
  title: string;
  description?: string | null;
  level: string;
  order: number;
}): LessonCurriculumMetadata {
  const { slug, title, level, order } = lesson;

  // 1. FPT University / Dekiru Nihongo Shokyū (Parts 1–9)
  if (slug.startsWith("fpt-jpd")) {
    const partMatch = slug.match(/part-0?(\d+)/i);
    const partNum = partMatch ? Number(partMatch[1]) : order - 50;
    const courseMatch = slug.match(/jpd(\d{3})/i);
    const courseCode = courseMatch ? `JPD${courseMatch[1]}` : "JPD113–133";

    return {
      slug,
      trackId: "dekiru-fpt-jpd",
      textbookTitle: "Dekiru Nihongo Shokyū (FPT University)",
      shortTrackLabel: `Dekiru / FPT ${courseCode}`,
      volumeLabel: `Giáo trình FPT ${courseCode}`,
      chapterLabel: `Part ${partNum} (第${partNum}課)`,
      provenance: "TEXTBOOK_VERIFIED",
      provenanceLabelVi: `TEXTBOOK_VERIFIED • Giáo trình FPT ${courseCode} Part ${partNum}`,
      sourceFile: "prisma/seed-data/jpd-curriculum-expansion.json",
      learningObjectiveVi:
        lesson.description ||
        `Thực hành hội thoại và mẫu câu trọng tâm của học phần ${courseCode} Part ${partNum}.`,
      whyItMattersVi:
        "Giúp áp dụng ngay mẫu câu vào tình huống giao tiếp thực tế tại trường học và đời sống Nhật Bản.",
      prerequisiteLabelVi:
        partNum <= 1
          ? "Yêu cầu: Bảng chữ cái Hiragana & Katakana"
          : `Yêu cầu trước: FPT Part ${partNum - 1} (第${partNum - 1}課)`,
    };
  }

  // 2. N5 Kana Foundations & Greetings (orders 0–8)
  if (
    level === "N5" &&
    (order <= 8 ||
      slug.startsWith("hiragana-") ||
      slug.startsWith("katakana-") ||
      slug.startsWith("dakuten-") ||
      slug.startsWith("yoon-") ||
      slug === "daily-greetings-culture")
  ) {
    return {
      slug,
      trackId: "minna-shokyuu-1",
      textbookTitle: "Minna no Nihongo Shokyū I — Nhập môn Chữ viết & Phát âm",
      shortTrackLabel: "Minna I • Nhập môn Kana",
      volumeLabel: "Nhập môn Bảng chữ cái Gojūon",
      chapterLabel: `Nhập môn #${order + 1}`,
      provenance: "APP_AUTHORED",
      provenanceLabelVi: "APP_AUTHORED • Chuẩn ngữ âm Gojūon (五十音図)",
      sourceFile: "prisma/seed-data/hiragana.ts, katakana.ts, dakuten.ts",
      learningObjectiveVi:
        lesson.description || `Nhận diện mặt chữ, quy tắc phát âm và ghép âm chuẩn của ${title}.`,
      whyItMattersVi:
        "Đọc thông viết thạo Hiragana và Katakana là điều kiện bắt buộc để đọc từ vựng và ngữ pháp không phụ thuộc vào Romaji.",
      prerequisiteLabelVi:
        order === 0 ? "Không yêu cầu kiến thức nền (Bắt đầu từ số 0)" : `Hoàn thành bài Nhập môn #${order}`,
    };
  }

  // 3. Minna no Nihongo Shokyū I (Lessons 1–25)
  if (
    level === "N5" &&
    (slug === "self-introduction-grammar" || slug.startsWith("minna-lesson-"))
  ) {
    const lessonMatch = slug.match(/minna-lesson-(\d+(?:-\d+)?)/);
    const minnaChapter =
      slug === "self-introduction-grammar"
        ? "Bài 1"
        : lessonMatch
        ? `Bài ${lessonMatch[1].replace(/^0/, "").replace("-0", "–")}`
        : `Bài ${order - 8}`;

    const genkiRef = GENKI_ARCHIVE_MAP.find(
      (g) => g.equivalentVerifiedLessonSlug === slug
    );

    return {
      slug,
      trackId: "minna-shokyuu-1",
      textbookTitle: "Minna no Nihongo Shokyū I (みんなの日本語 初級I)",
      shortTrackLabel: `Minna I • ${minnaChapter}`,
      volumeLabel: "Minna no Nihongo Shokyū I",
      chapterLabel: minnaChapter,
      provenance: "TEXTBOOK_VERIFIED",
      provenanceLabelVi: `TEXTBOOK_VERIFIED • Minna no Nihongo I (${minnaChapter})`,
      sourceFile: "research/Mina (Bản dịch N5).pdf & Minna_No_Nihongo_I-Honsatsu-full.pdf",
      learningObjectiveVi:
        lesson.description || `Làm chủ từ vựng, cấu trúc câu và hội thoại của ${minnaChapter}.`,
      whyItMattersVi:
        "Nền tảng cốt lõi của trình độ sơ cấp N5, xuất hiện xuyên suốt trong hội thoại đời sống và các bài đọc sơ cấp.",
      prerequisiteLabelVi:
        slug === "self-introduction-grammar"
          ? "Yêu cầu: Đọc được Hiragana & Katakana"
          : `Yêu cầu trước: Các mẫu câu trước ${minnaChapter} trong Minna no Nihongo I`,
      relatedGenkiLesson: genkiRef
        ? `Đối chiếu: ${genkiRef.volume} — Lesson ${genkiRef.genkiLessonNumber}`
        : undefined,
    };
  }

  // 4. N5 Skill Modules (Kanji, Particles, Verb Conjugation, Reading, Listening, Mock Test)
  if (level === "N5") {
    return {
      slug,
      trackId: "jlpt-n5-skills",
      textbookTitle: "Chuyên đề Kỹ năng & Tổng ôn JLPT N5",
      shortTrackLabel: "Chuyên đề N5",
      volumeLabel: "Kỹ năng & Đề thi thử N5",
      chapterLabel: `Chuyên đề #${order - 39}`,
      provenance: "SUPPLEMENTARY_VERIFIED",
      provenanceLabelVi: "SUPPLEMENTARY_VERIFIED • Chuyên đề kỹ năng N5",
      sourceFile: "prisma/seed-data/lessons/n5.ts",
      learningObjectiveVi:
        lesson.description || `Rèn luyện chuyên sâu kỹ năng ${title} phục vụ định hướng N5.`,
      whyItMattersVi:
        "Kết nối kiến thức rời rạc từ các bài học thành kỹ năng đọc hiểu, nghe hiểu và phản xạ làm bài hoàn chỉnh.",
      prerequisiteLabelVi: "Khuyến nghị: Đã học qua Minna no Nihongo I (Bài 1–25) hoặc FPT JPD Part 1–9",
    };
  }

  // 5. Minna no Nihongo Shokyū II (N4, Lessons 26–50)
  if (level === "N4") {
    const lessonMatch = slug.match(/n4-lesson-(\d+)/);
    const minnaNum = lessonMatch ? Number(lessonMatch[1]) : order + 26;
    const genkiRef = GENKI_ARCHIVE_MAP.find(
      (g) => g.equivalentVerifiedLessonSlug === slug
    );

    return {
      slug,
      trackId: "minna-shokyuu-2",
      textbookTitle: "Minna no Nihongo Shokyū II (みんなの日本語 初級II)",
      shortTrackLabel: `Minna II • Bài ${minnaNum}`,
      volumeLabel: "Minna no Nihongo Shokyū II",
      chapterLabel: `Bài ${minnaNum}`,
      provenance: "TEXTBOOK_VERIFIED",
      provenanceLabelVi: `TEXTBOOK_VERIFIED • Minna no Nihongo II (Bài ${minnaNum})`,
      sourceFile: "research/[studyjapanese.net]_Minna_No_Nihongo_II-Honsatsu-full.pdf",
      learningObjectiveVi:
        lesson.description || `Làm chủ mẫu câu ngữ pháp, từ vựng và tình huống hội thoại Bài ${minnaNum}.`,
      whyItMattersVi:
        "Mở rộng khả năng diễn đạt nguyên nhân, giả định, bị động, sai khiến và kính ngữ trong môi trường làm việc Nhật Bản.",
      prerequisiteLabelVi:
        minnaNum === 26
          ? "Yêu cầu: Hoàn thành Minna no Nihongo I (Bài 1–25)"
          : `Yêu cầu trước: Minna no Nihongo II — Bài ${minnaNum - 1}`,
      relatedGenkiLesson: genkiRef
        ? `Đối chiếu: ${genkiRef.volume} — Lesson ${genkiRef.genkiLessonNumber}`
        : undefined,
    };
  }

  // 6. Shinkanzen Master & Mimikara Oboeru N3
  return {
    slug,
    trackId: "shinkanzen-n3",
    textbookTitle: "Shinkanzen Master & Mimikara Oboeru N3",
    shortTrackLabel: `Shinkanzen N3 • Bài ${order + 1}`,
    volumeLabel: "Trung cấp N3 (Shinkanzen & Mimikara)",
    chapterLabel: `Chuyên đề N3 #${order + 1}`,
    provenance: "SUPPLEMENTARY_VERIFIED",
    provenanceLabelVi: "SUPPLEMENTARY_VERIFIED • Shinkanzen Master & Mimikara N3",
    sourceFile: "prisma/seed-data/unitcuments-knowledge.json & n3-data.ts",
    learningObjectiveVi:
      lesson.description || `Nắm vững cấu trúc trung cấp và từ vựng học thuật của ${title}.`,
    whyItMattersVi:
      "Cầu nối từ tiếng Nhật sơ cấp sang tiếng Nhật trung cấp dùng trong công sở, báo chí và kỳ thi JLPT N3.",
    prerequisiteLabelVi:
      order === 0
        ? "Yêu cầu: Nền tảng Minna no Nihongo II (Bài 26–50)"
        : `Yêu cầu trước: Chuyên đề N3 #${order}`,
  };
}

