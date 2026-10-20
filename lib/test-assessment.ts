export type SkillKey = "LISTENING" | "SPEAKING" | "READING" | "WRITING";

export type QuestionFormat = "MULTIPLE_CHOICE" | "WRITING_INPUT" | "SPEAKING_PROMPT";

export interface AssessmentQuestion {
  id: string;
  skill: SkillKey;
  subCategory: "Nghe hội thoại" | "Đọc hiểu" | "Từ vựng・Hán tự" | "Ngữ pháp ngữ cảnh" | "Viết câu・Điền từ" | "Phản xạ nói";
  level: "N5" | "N4" | "N3";
  format: QuestionFormat;
  question: string;
  /** Đoạn văn đọc hiểu hoặc bối cảnh tình huống */
  contextPassage?: string;
  /** Kịch bản audio tiếng Nhật để phát qua Web Speech API (ẩn chữ khi đang làm bài Nghe) */
  audioScript?: string;
  /** Gợi ý tình huống hoặc yêu cầu ngữ pháp cho câu Viết / Nói */
  promptHint?: string;
  /** Dùng cho MULTIPLE_CHOICE */
  options?: { label: string; text: string; isCorrect: boolean }[];
  /** Dùng cho WRITING_INPUT & SPEAKING_PROMPT: các từ khóa / mẫu câu chuẩn chấp nhận (Kana/Kanji/Romaji) */
  acceptedKeywords?: string[];
  /** Câu trả lời mẫu chuẩn */
  sampleAnswer?: string;
  /** Tiêu chí chấm điểm minh bạch (Rubric 3 mức) cho Nói & Viết */
  rubricCriteria?: string[];
  /** Giải thích chi tiết sau khi nộp bài */
  explanation: string;
  /** Gợi ý bài học liên quan nếu làm sai */
  recommendedLesson: {
    slug: string;
    title: string;
    topic: string;
  };
}

export interface TestModeConfig {
  id: "DIAGNOSTIC" | "N5_FULL" | "N4_FULL" | "N3_FULL";
  kindLabel: "Đánh giá đầu vào" | "Kiểm tra từng chặng" | "Đánh giá tổng hợp";
  title: string;
  description: string;
  timeMinutes: number;
  targetLevel: "N5" | "N4" | "N3";
  icon: string;
  badge: string;
}

export interface DynamicExamDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  kindLabel: string;
  category: "PLACEMENT" | "LEVEL_TEST" | "SKILL_TEST" | "JLPT_MOCK" | "FPT_JPD" | string;
  targetLevel: "N5" | "N4" | "N3" | string;
  skillFocus: "ALL" | "VOCAB_KANJI" | "GRAMMAR" | "READING" | "LISTENING" | string;
  timeMinutes: number;
  icon: string;
  badge: string;
  sourceDocument: string | null;
  answerAuthority: "OFFICIAL" | "CURATED" | "INFERRED" | string;
  hasAudio?: boolean;
  questions: Array<AssessmentQuestion & { audioUrl?: string | null; answerAuthority?: string }>;
}

export const TEST_MODES: TestModeConfig[] = [
  {
    id: "DIAGNOSTIC",
    kindLabel: "Đánh giá đầu vào",
    title: "Bài Đánh Giá Đầu Vào 4 Kỹ Năng (Placement Test)",
    description:
      "Phân loại trình độ N5 → N3 qua đủ 4 kỹ năng: Nghe hội thoại, Đọc hiểu ngữ cảnh, Viết cấu tạo câu và Phản xạ Nói.",
    timeMinutes: 15,
    targetLevel: "N5",
    icon: "🧭",
    badge: "Đầu vào 4 kỹ năng",
  },
  {
    id: "N5_FULL",
    kindLabel: "Kiểm tra từng chặng",
    title: "Bài Kiểm Tra Năng Lực Chặng JLPT N5",
    description:
      "Kiểm tra điều kiện hoàn thành chặng N5 (hoặc miễn học phần N5): Nghe tại ga tàu/konbini, Đọc thông báo, Viết câu sơ cấp & Tự giới thiệu.",
    timeMinutes: 20,
    targetLevel: "N5",
    icon: "🌸",
    badge: "Chặng N5 (Miễn học phần)",
  },
  {
    id: "N4_FULL",
    kindLabel: "Kiểm tra từng chặng",
    title: "Bài Kiểm Tra Năng Lực Chặng JLPT N4",
    description:
      "Kiểm tra chặng sơ trung cấp N4: Nghe lịch hẹn/bệnh viện, Đọc email, Viết câu điều kiện/bị động & Nói xin phép lịch sự.",
    timeMinutes: 20,
    targetLevel: "N4",
    icon: "⛩️",
    badge: "Chặng N4 (Miễn học phần)",
  },
  {
    id: "N3_FULL",
    kindLabel: "Đánh giá tổng hợp",
    title: "Bài Đánh Giá Tổng Hợp JLPT N3 (4 Kỹ Năng)",
    description:
      "Đánh giá tổng hợp trung cấp N3: Nghe thảo luận công sở, Đọc hiểu văn bản dài, Viết giải trình & Nói kính ngữ (Sonkeigo/Kenjōgo).",
    timeMinutes: 25,
    targetLevel: "N3",
    icon: "🗼",
    badge: "Tổng hợp N3",
  },
];

export const SKILL_META: Record<
  SkillKey,
  { label: string; jpLabel: string; icon: string; desc: string }
> = {
  LISTENING: {
    label: "Nghe hiểu (Listening)",
    jpLabel: "聴解",
    icon: "🎧",
    desc: "Nghe hội thoại, thông báo và nắm bắt thông tin chi tiết",
  },
  READING: {
    label: "Đọc hiểu & Ngôn ngữ (Reading)",
    jpLabel: "読解・言語知識",
    icon: "📖",
    desc: "Đọc đoạn văn, email, biển báo cùng từ vựng/ngữ pháp trong ngữ cảnh",
  },
  WRITING: {
    label: "Viết & Cấu tạo câu (Writing)",
    jpLabel: "作文・記述",
    icon: "✍️",
    desc: "Viết câu tiếng Nhật đúng trợ từ, chia thể và từ vựng theo tình huống",
  },
  SPEAKING: {
    label: "Nói & Phản xạ (Speaking)",
    jpLabel: "会話・発話",
    icon: "🎙️",
    desc: "Phản xạ nói theo ngữ cảnh thực tế (kết hợp nhận diện giọng nói & tiêu chí Rubric)",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. BỘ CÂU HỎI ĐÁNH GIÁ ĐẦU VÀO (DIAGNOSTIC - 12 CÂU ĐỦ 4 KỸ NĂNG N5 -> N3)
// ─────────────────────────────────────────────────────────────────────────────
const DIAGNOSTIC_BANK: AssessmentQuestion[] = [
  // LISTENING (3 câu: N5, N4, N3)
  {
    id: "diag-l1",
    skill: "LISTENING",
    subCategory: "Nghe hội thoại",
    level: "N5",
    format: "MULTIPLE_CHOICE",
    audioScript: "すみません、この赤い傘はいくらですか。千五百円です。じゃ、これをください。",
    question: "Nghe đoạn hội thoại tại cửa hàng: Khách hàng quyết định mua vật gì và giá bao nhiêu?",
    options: [
      { label: "A", text: "Chiếc ô màu đỏ giá 1.500 yên", isCorrect: true },
      { label: "B", text: "Chiếc ô màu xanh giá 500 yên", isCorrect: false },
      { label: "C", text: "Chiếc cặp màu đỏ giá 15.000 yên", isCorrect: false },
      { label: "D", text: "Khách chỉ hỏi giá chứ không mua", isCorrect: false },
    ],
    explanation: "Audio: 「すみません、この赤い傘はいくらですか。千五百円です。じゃ、これをください。」(Chiếc ô màu đỏ 1.500 yên).",
    recommendedLesson: {
      slug: "minna-lesson-02-kore-sore-are",
      title: "Đại từ chỉ thị & Mua sắm cơ bản",
      topic: "Nghe hiểu giá tiền & mua sắm N5",
    },
  },
  {
    id: "diag-l2",
    skill: "LISTENING",
    subCategory: "Nghe hội thoại",
    level: "N4",
    format: "MULTIPLE_CHOICE",
    audioScript: "田中さん、明日の会議ですが、十時から十一時半に変更になりました。会議室は三階のままです。",
    question: "Nghe thông báo: Thông tin nào về cuộc họp ngày mai đã thay đổi?",
    options: [
      { label: "A", text: "Thời gian họp đổi sang 10:00 (phòng họp vẫn ở tầng 3)", isCorrect: true },
      { label: "B", text: "Phòng họp đổi sang tầng 10", isCorrect: false },
      { label: "C", text: "Cuộc họp bị hủy bỏ hoàn toàn", isCorrect: false },
      { label: "D", text: "Chuyển sang ngày kia lúc 11:30", isCorrect: false },
    ],
    explanation: "Audio: 「明日の会議ですが、十時から十一時半に変更になりました。会議室は三階のままです。」",
    recommendedLesson: {
      slug: "n4-office-reporting",
      title: "Báo cáo công việc với cấp trên (Horenso)",
      topic: "Nghe thông báo thay đổi lịch trình N4",
    },
  },
  {
    id: "diag-l3",
    skill: "LISTENING",
    subCategory: "Nghe hội thoại",
    level: "N3",
    format: "MULTIPLE_CHOICE",
    audioScript: "お客様、恐れ入りますが、本日は予約で満席となっております。三十分ほどお待ちいただければ、お席をご案内できますが、いかがなさいますか。",
    question: "Nghe nhân viên nhà hàng nói (Kính ngữ N3): Tình trạng hiện tại của nhà hàng là gì?",
    options: [
      { label: "A", text: "Hiện đã kín bàn đặt trước, nhưng nếu đợi khoảng 30 phút sẽ có chỗ", isCorrect: true },
      { label: "B", text: "Nhà hàng hôm nay đóng cửa nghỉ lễ", isCorrect: false },
      { label: "C", text: "Chỉ nhận khách đi từ 30 người trở lên", isCorrect: false },
      { label: "D", text: "Còn nhiều bàn trống ở tầng 2", isCorrect: false },
    ],
    explanation: "Audio: 「本日は予約で満席となっております。三十分ほどお待ちいただければ、お席をご案内できます…」",
    recommendedLesson: {
      slug: "n3-lesson-10-grammar-keigo",
      title: "Kính ngữ N3 nâng cao trong dịch vụ & công sở",
      topic: "Nghe kính ngữ (満席・ご案内) N3",
    },
  },

  // READING (4 câu: N5, N4, N3)
  {
    id: "diag-r1",
    skill: "READING",
    subCategory: "Đọc hiểu",
    level: "N5",
    format: "MULTIPLE_CHOICE",
    contextPassage:
      "【さくら図書館のお知らせ】\n開館時間：午前9時〜午後7時（月曜日〜金曜日）\n※土曜日・日曜日は午後5時までです。館内で食べ物を食べないでください。",
    question: "Theo thông báo của Thư viện Sakura, vào Chủ nhật thư viện mở cửa đến mấy giờ và có lưu ý gì?",
    options: [
      { label: "A", text: "Mở đến 5 giờ chiều (17:00) và không được ăn trong thư viện", isCorrect: true },
      { label: "B", text: "Mở đến 7 giờ tối (19:00) và được phép ăn nhẹ", isCorrect: false },
      { label: "C", text: "Đóng cửa hoàn toàn vào Thứ Bảy và Chủ nhật", isCorrect: false },
      { label: "D", text: "Mở cửa từ 5 giờ chiều đến 9 giờ tối", isCorrect: false },
    ],
    explanation: "Thông báo ghi rõ: 土曜日・日曜日は午後5時までです (Thứ Bảy, Chủ nhật đến 5 giờ chiều) và 食べ物を食べないでください.",
    recommendedLesson: {
      slug: "n5-reading-notices-signs",
      title: "Đọc hiểu: bảng tin, thông báo & thực đơn",
      topic: "Đọc thông báo công cộng N5",
    },
  },
  {
    id: "diag-r2",
    skill: "READING",
    subCategory: "Ngữ pháp ngữ cảnh",
    level: "N4",
    format: "MULTIPLE_CHOICE",
    contextPassage: "「昨日、電車の中に傘を忘れて＿＿＿、駅員さんに相談しました。」",
    question: "Chọn mẫu ngữ pháp phù hợp nhất để điền vào chỗ trống:",
    options: [
      { label: "A", text: "しまったので (Vì lỡ quên mất nên...)", isCorrect: true },
      { label: "B", text: "みるために (Để thử quên...)", isCorrect: false },
      { label: "C", text: "あげるから (Vì làm ơn quên cho...)", isCorrect: false },
      { label: "D", text: "ながら (Vừa quên vừa...)", isCorrect: false },
    ],
    explanation: "〜てしまった diễn tả sự tiếc nuối khi lỡ làm việc gì; kết hợp 〜ので chỉ nguyên nhân lịch sự.",
    recommendedLesson: {
      slug: "n4-lesson-39-node-te-causes",
      title: "Nguyên nhân 〜ので & thể lỡ lời 〜てしまう",
      topic: "Ngữ pháp 〜てしまう và 〜ので N4",
    },
  },
  {
    id: "diag-r3",
    skill: "READING",
    subCategory: "Đọc hiểu",
    level: "N3",
    format: "MULTIPLE_CHOICE",
    contextPassage:
      "「近年、地方の空き家をカフェやゲストハウスとして再生する取り組みが注目されている。古い建物の魅力を残しつつ、地域の新しい交流の場を作ることで、若い世代の移住にもつながっているという。」",
    question: "Theo đoạn văn, việc cải tạo những ngôi nhà bỏ trống ở địa phương mang lại hiệu quả gì?",
    options: [
      { label: "A", text: "Giữ được nét đẹp kiến trúc cũ, tạo không gian giao lưu mới và thu hút giới trẻ chuyển đến", isCorrect: true },
      { label: "B", text: "Phá bỏ hoàn toàn nhà cũ để xây chung cư cao tầng", isCorrect: false },
      { label: "C", text: "Khiến người trẻ rời bỏ vùng quê lên thành phố nhiều hơn", isCorrect: false },
      { label: "D", text: "Chỉ dành riêng cho khách du lịch nước ngoài thuê ngắn hạn", isCorrect: false },
    ],
    explanation: "Đoạn văn nêu: 古い建物の魅力を残しつつ (vừa giữ nét hấp dẫn của tòa nhà cũ)、地域の新しい交流の場を作る、若い世代の移住にもつながっている.",
    recommendedLesson: {
      slug: "n3-lesson-19-reading-emails-notices",
      title: "Đọc hiểu N3 — Văn bản & Thông báo",
      topic: "Đọc hiểu văn bản xã hội N3",
    },
  },
  {
    id: "diag-r4",
    skill: "READING",
    subCategory: "Từ vựng・Hán tự",
    level: "N4",
    format: "MULTIPLE_CHOICE",
    contextPassage: "Trong giao tiếp vùng Kansai (Osaka/Kyoto), người bán hàng thường nói:「まいど、おおきに！」",
    question: "Từ phương ngữ「おおきに」trong câu trên tương ứng với từ tiếng Nhật chuẩn (標準語) nào?",
    options: [
      { label: "A", text: "ありがとうございます (Cảm ơn rất nhiều)", isCorrect: true },
      { label: "B", text: "すみません (Xin lỗi)", isCorrect: false },
      { label: "C", text: "さようなら (Tạm biệt)", isCorrect: false },
      { label: "D", text: "おやすみなさい (Chúc ngủ ngon)", isCorrect: false },
    ],
    explanation: "「おおきに」là phương ngữ vùng Kansai (関西弁) mang nghĩa「ありがとう / ありがとうございます」.",
    recommendedLesson: {
      slug: "daily-greetings-culture",
      title: "Chào hỏi hàng ngày & Văn hóa vùng miền",
      topic: "Phương ngữ Kansai vs. Tiếng Nhật chuẩn",
    },
  },

  // WRITING (3 câu: N5, N4, N3)
  {
    id: "diag-w1",
    skill: "WRITING",
    subCategory: "Viết câu・Điền từ",
    level: "N5",
    format: "WRITING_INPUT",
    question: "Hãy viết câu tiếng Nhật (Hiragana/Kanji hoặc Romaji): «Mỗi ngày tôi đi đến trường bằng tàu điện.»",
    promptHint: "Gợi ý từ vựng: 毎日 (まいにち / mainichi), 電車で (でんしゃで / densha de), 学校へ / 学校に (がっこうへ / gakkou e), 行きます (いきます / ikimasu).",
    acceptedKeywords: ["でんしゃ", "電車", "densha", "いき", "行", "iki"],
    sampleAnswer: "毎日、電車で学校へ行きます。",
    rubricCriteria: [
      "Dùng đúng trợ từ chỉ phương tiện「で」sau 電車 (電車で)",
      "Dùng đúng trợ từ hướng di chuyển「へ」hoặc「に」sau 学校",
      "Chia động từ 行く ở thể lịch sự「行きます」(ikimasu)",
    ],
    explanation: "Cấu trúc chuẩn N5: [Phương tiện] + で + [Địa điểm] + へ/に + 行きます → 毎日、電車で学校へ行きます。",
    recommendedLesson: {
      slug: "minna-lesson-05-movement-verbs",
      title: "Di chuyển & đi lại (行きます・来ます・帰ります)",
      topic: "Viết câu di chuyển & trợ từ で/へ N5",
    },
  },
  {
    id: "diag-w2",
    skill: "WRITING",
    subCategory: "Viết câu・Điền từ",
    level: "N4",
    format: "WRITING_INPUT",
    question: "Viết câu xin phép lịch sự (N4) khi muốn chụp ảnh trong bảo tàng: «Tôi chụp ảnh ở đây có được không ạ?»",
    promptHint: "Sử dụng mẫu câu xin phép: [Động từ thể て] + もいいですか (写真を撮る → 写真を撮ってもいいですか).",
    acceptedKeywords: ["とって", "撮って", "totte", "いいですか", "iidesuka"],
    sampleAnswer: "ここで写真を撮ってもいいですか。",
    rubricCriteria: [
      "Chia đúng động từ 撮る (toru) sang thể て là 撮って (totte)",
      "Kết hợp đúng mẫu câu xin phép 〜てもいいですか",
      "Đặt đúng trợ từ nơi diễn ra hành động ここで (koko de)",
    ],
    explanation: "Mẫu câu xin phép chuẩn: ここで写真を撮ってもいいですか (Koko de shashin wo totte mo ii desu ka).",
    recommendedLesson: {
      slug: "minna-lesson-14-requests-and-progressive",
      title: "Yêu cầu lịch sự (〜てください) & Xin phép (〜てもいいですか)",
      topic: "Chia thể Te & mẫu câu xin phép",
    },
  },

  // SPEAKING (2 câu: N5, N3)
  {
    id: "diag-s1",
    skill: "SPEAKING",
    subCategory: "Phản xạ nói",
    level: "N5",
    format: "SPEAKING_PROMPT",
    question: "Tình huống Nói (Sơ cấp): Bạn lần đầu gặp đồng nghiệp người Nhật. Hãy nói câu chào hỏi và giới thiệu tên của bạn kèm câu kết lịch sự.",
    promptHint: "Hãy bấm Ghi âm (hoặc nhập bản ghi lời nói) có chứa: はじめまして (Hajimemashite) + [Tên] です / と申します + よろしくお願いします (Yoroshiku onegaishimasu).",
    acceptedKeywords: ["はじめまして", "hajimemashite", "よろしく", "yoroshiku"],
    sampleAnswer: "はじめまして。アンと申します。どうぞよろしくお願いいたします。",
    rubricCriteria: [
      "Mở đầu bằng lời chào lần đầu gặp mặt「はじめまして」",
      "Xưng tên rõ ràng với「〜です」hoặc khiêm nhường ngữ「〜と申します」",
      "Kết thúc bằng câu xã giao chuẩn mực「どうぞよろしくお願いします」",
    ],
    explanation: "Bộ 3 câu tự giới thiệu chuẩn văn hóa Nhật: はじめまして → [Tên]です/と申します → よろしくお願いします。",
    recommendedLesson: {
      slug: "self-introduction-grammar",
      title: "Giới thiệu bản thân (です・じゃありません)",
      topic: "Kỹ năng tự giới thiệu & giao tiếp N5",
    },
  },
  {
    id: "diag-s2",
    skill: "SPEAKING",
    subCategory: "Phản xạ nói",
    level: "N3",
    format: "SPEAKING_PROMPT",
    question: "Tình huống Nói (Trung cấp N3): Bạn đến muộn cuộc họp 10 phút vì tàu điện bị trễ. Hãy nói lời xin lỗi và giải thích lý do một cách lịch sự với cấp trên.",
    promptHint: "Sử dụng từ đệm xin lỗi (申し訳ありません / すみません) + lý do khách quan (電車が遅れたので) + thông báo đến muộn (遅れました / 遅刻します).",
    acceptedKeywords: ["でんしゃ", "電車", "densha", "おく", "遅", "okure", "すみません", "申し訳", "moushiwake", "sumimasen"],
    sampleAnswer: "申し訳ありません。電車が遅れたので、10分ほど遅れてしまいました。",
    rubricCriteria: [
      "Mở đầu bằng lời xin lỗi trang trọng「申し訳ありません」hoặc「すみません」",
      "Dùng「〜ので」để nêu nguyên nhân khách quan nhẹ nhàng (電車が遅れたので)",
      "Diễn đạt sự việc ngoài ý muốn bằng「〜てしまいました」",
    ],
    explanation: "Trong môi trường công sở Nhật, dùng 申し訳ありません + 電車が遅れたので giúp trình bày lý do lịch sự, không mang sắc thái đổ lỗi.",
    recommendedLesson: {
      slug: "n3-workplace-reporting",
      title: "Báo cáo tiến độ & giao tiếp công sở Nhật (Horenso)",
      topic: "Kính ngữ & xin lỗi nơi công sở N3",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. BỘ CÂU HỎI CHẶNG N5 (N5_FULL - ĐỦ 4 KỸ NĂNG)
// ─────────────────────────────────────────────────────────────────────────────
const N5_FULL_BANK: AssessmentQuestion[] = [
  {
    id: "n5-l1",
    skill: "LISTENING",
    subCategory: "Nghe hội thoại",
    level: "N5",
    format: "MULTIPLE_CHOICE",
    audioScript: "すみません、東京駅へはどう行きますか。あそこにある白いバスに乗ってください。一番のバスですよ。ありがとうございます。",
    question: "Nghe chỉ đường: Người hỏi cần bắt xe buýt số mấy và màu gì để đi tới ga Tokyo?",
    options: [
      { label: "A", text: "Xe buýt màu trắng số 1", isCorrect: true },
      { label: "B", text: "Xe buýt màu đỏ số 2", isCorrect: false },
      { label: "C", text: "Đi bộ thẳng 10 phút", isCorrect: false },
      { label: "D", text: "Tàu điện ngầm tuyến số 1", isCorrect: false },
    ],
    explanation: "Audio: 「あそこにある白いバスに乗ってください。一番のバスですよ。」(Xe buýt màu trắng số 1).",
    recommendedLesson: {
      slug: "minna-lesson-05-movement-verbs",
      title: "Di chuyển & Phương tiện đi lại",
      topic: "Nghe chỉ đường & phương tiện N5",
    },
  },
  {
    id: "n5-l2",
    skill: "LISTENING",
    subCategory: "Nghe hội thoại",
    level: "N5",
    format: "MULTIPLE_CHOICE",
    audioScript: "いらっしゃいませ。何名様ですか。三人です。では、こちらのテーブルへどうぞ。お水をお持ちしますね。",
    question: "Nghe đoạn hội thoại tại quán ăn: Nhóm khách đi mấy người?",
    options: [
      { label: "A", text: "3 người (三人 - sannin)", isCorrect: true },
      { label: "B", text: "2 người (二人 - futari)", isCorrect: false },
      { label: "C", text: "4 người (四人 - yonin)", isCorrect: false },
      { label: "D", text: "1 người (一人 - hitori)", isCorrect: false },
    ],
    explanation: "Nhân viên hỏi「何名様ですか」(Quý khách đi mấy người ạ?) và khách đáp「三人です」(3 người).",
    recommendedLesson: {
      slug: "minna-lesson-11-counters-quantifiers",
      title: "Lượng từ & Đơn vị đếm (ひとり・ふたり・〜人)",
      topic: "Lượng từ đếm người N5",
    },
  },
  {
    id: "n5-r1",
    skill: "READING",
    subCategory: "Từ vựng・Hán tự",
    level: "N5",
    format: "MULTIPLE_CHOICE",
    contextPassage: "「先週の日曜日に、母とデパートへ買い物に行きました。」",
    question: "Cách đọc đúng của cụm chữ Hán「先週の日曜日」là gì?",
    options: [
      { label: "A", text: "せんしゅうのにちようび", isCorrect: true },
      { label: "B", text: "らいしゅうのげつようび", isCorrect: false },
      { label: "C", text: "こんしゅうのどようび", isCorrect: false },
      { label: "D", text: "せんげつのにちようび", isCorrect: false },
    ],
    explanation: "先週 (せんしゅう - tuần trước) + 日曜日 (にちようび - Chủ nhật).",
    recommendedLesson: {
      slug: "n5-kanji-numbers-nature",
      title: "Kanji N5: Số đếm, Lịch & Tự nhiên",
      topic: "Kanji thời gian & ngày tháng N5",
    },
  },
  {
    id: "n5-r2",
    skill: "READING",
    subCategory: "Ngữ pháp ngữ cảnh",
    level: "N5",
    format: "MULTIPLE_CHOICE",
    contextPassage: "A: 「だれ＿＿＿このケーキを作りましたか。」\nB: 「山田さんが作りましたよ。」",
    question: "Chọn trợ từ chính xác nhất điền vào chỗ trống sau từ để hỏi「だれ」:",
    options: [
      { label: "A", text: "が (Nhấn mạnh chủ ngữ là từ để hỏi)", isCorrect: true },
      { label: "B", text: "は (Chủ đề đã xác định)", isCorrect: false },
      { label: "C", text: "を (Tân ngữ trực tiếp)", isCorrect: false },
      { label: "D", text: "へ (Phương hướng)", isCorrect: false },
    ],
    explanation: "Khi từ để hỏi (だれ、なに、どれ) đóng vai trò làm chủ ngữ trong câu, bắt buộc dùng trợ từ「が」chứ không dùng「は」.",
    recommendedLesson: {
      slug: "n5-grammar-10-core-particles",
      title: "10 trợ từ cốt lõi (Phân biệt は và が)",
      topic: "Trợ từ は vs が N5",
    },
  },
  {
    id: "n5-r3",
    skill: "READING",
    subCategory: "Đọc hiểu",
    level: "N5",
    format: "MULTIPLE_CHOICE",
    contextPassage:
      "「アンさんへ\n今日の午後6時から、駅の前のラーメン屋で晩ご飯を食べませんか。キムさんも来ます。もし来られたら、5時までに連絡してください。\n田中より」",
    question: "Theo tin nhắn của Tanaka, An cần làm gì nếu có thể tham gia bữa tối?",
    options: [
      { label: "A", text: "Liên lạc lại trước 5 giờ chiều (5時までに)", isCorrect: true },
      { label: "B", text: "Đến quán ramen lúc 5 giờ sáng", isCorrect: false },
      { label: "C", text: "Gọi điện cho bạn Kim lúc 6 giờ tối", isCorrect: false },
      { label: "D", text: "Nấu bữa tối tại nhà Tanaka", isCorrect: false },
    ],
    explanation: "Tin nhắn ghi: 「もし来られたら、5時までに連絡してください」(Nếu đến được, hãy liên lạc trước 5 giờ).",
    recommendedLesson: {
      slug: "n5-reading-emails-messages",
      title: "Đọc hiểu: email, tin nhắn & nhật ký",
      topic: "Đọc hiểu tin nhắn hẹn giờ N5",
    },
  },
  {
    id: "n5-w1",
    skill: "WRITING",
    subCategory: "Viết câu・Điền từ",
    level: "N5",
    format: "WRITING_INPUT",
    question: "Hãy viết câu mời lịch sự bằng tiếng Nhật: «Cuối tuần này cùng đi xem phim nhé/không?»",
    promptHint: "Sử dụng từ: 週末 (しゅうまつ) / 今週末 + 映画 (えいが - eiga) + 見に行きませんか / 見ましょう.",
    acceptedKeywords: ["えいが", "映画", "eiga", "み", "見", "mi", "ませんか", "ましょう", "masenka", "mashou"],
    sampleAnswer: "今週末、一緒に映画を見に行きませんか。",
    rubricCriteria: [
      "Có danh từ 映画 (えいが) kèm trợ từ を",
      "Chia đúng mẫu câu rủ rê lịch sự 〜ませんか hoặc 〜ましょう",
      "Diễn đạt tự nhiên thời gian hoặc từ 一緒に (cùng nhau)",
    ],
    explanation: "Mẫu lời mời lịch sự N5: 今週末、一緒に映画を見に行きませんか。(Cuối tuần này cùng đi xem phim không?).",
    recommendedLesson: {
      slug: "minna-lesson-06-invitations",
      title: "Lời mời lịch sự (〜ませんか・〜ましょう)",
      topic: "Viết câu mời & rủ rê N5",
    },
  },
  {
    id: "n5-s1",
    skill: "SPEAKING",
    subCategory: "Phản xạ nói",
    level: "N5",
    format: "SPEAKING_PROMPT",
    question: "Tình huống Nói N5: Bạn vào cửa hàng tiện lợi (Konbini) mua 1 cơm nắm (Onigiri) và muốn nhờ nhân viên hâm nóng giúp. Bạn sẽ nói như thế nào?",
    promptHint: "Sử dụng: これをお願いします (Cho tôi lấy cái này) + 温めてください (Atatamete kudasai - Làm ơn hâm nóng giúp).",
    acceptedKeywords: ["おねがい", "お願い", "onegai", "ください", "kudasai", "あたた", "温", "atatame"],
    sampleAnswer: "すみません、このおにぎりをお願いします。温めてください。",
    rubricCriteria: [
      "Gọi món lịch sự với「〜をお願いします」hoặc「〜をください」",
      "Dùng đúng mẫu câu yêu cầu lịch sự「〜てください」(温めてください)",
      "Giọng điệu rõ ràng, lịch sự",
    ],
    explanation: "Khi mua đồ ăn ở Konbini, nhân viên thường hỏi「温めますか」, bạn có thể chủ động nhờ「温めてください」.",
    recommendedLesson: {
      slug: "n5-listening-conversations",
      title: "Nghe hiểu & Giao tiếp tại Konbini, ga tàu",
      topic: "Phản xạ giao tiếp Konbini N5",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. BỘ CÂU HỎI CHẶNG N4 (N4_FULL - ĐỦ 4 KỸ NĂNG)
// ─────────────────────────────────────────────────────────────────────────────
const N4_FULL_BANK: AssessmentQuestion[] = [
  {
    id: "n4-l1",
    skill: "LISTENING",
    subCategory: "Nghe hội thoại",
    level: "N4",
    format: "MULTIPLE_CHOICE",
    audioScript: "どうしたんですか。昨日から喉が痛くて、少し熱もあるんです。それはいけませんね。今日は早く帰って、病院へ行った方がいいですよ。",
    question: "Nghe đoạn hội thoại: Người trả lời đang gặp vấn đề sức khỏe gì và được khuyên làm gì?",
    options: [
      { label: "A", text: "Đau họng, hơi sốt từ hôm qua; được khuyên về sớm và đi bệnh viện", isCorrect: true },
      { label: "B", text: "Đau bụng do ăn hải sản; được khuyên uống thuốc ngay", isCorrect: false },
      { label: "C", text: "Mất ngủ nhiều ngày; được khuyên tập thể dục", isCorrect: false },
      { label: "D", text: "Bị trật chân khi chạy bộ; được khuyên nghỉ 1 tuần", isCorrect: false },
    ],
    explanation: "Audio: 「昨日から喉が痛くて、少し熱もあるんです」→「早く帰って、病院へ行った方がいいですよ」.",
    recommendedLesson: {
      slug: "n4-hospital-visit",
      title: "Khám bệnh tại bệnh viện Nhật Bản",
      topic: "Nghe mô tả triệu chứng & lời khuyên N4",
    },
  },
  {
    id: "n4-l2",
    skill: "LISTENING",
    subCategory: "Nghe hội thoại",
    level: "N4",
    format: "MULTIPLE_CHOICE",
    audioScript: "今度の土曜日、京都へ紅葉を見に行くんですが、リンさんも一緒に行きませんか。いいですね！でも、土曜日は午前中アルバイトがあるので、午後からでもいいですか。",
    question: "Nghe hội thoại: Tại sao Linh hỏi có thể tham gia từ buổi chiều thứ Bảy không?",
    options: [
      { label: "A", text: "Vì buổi sáng thứ Bảy Linh có ca làm thêm (Baito)", isCorrect: true },
      { label: "B", text: "Vì tàu đi Kyoto chỉ chạy vào buổi chiều", isCorrect: false },
      { label: "C", text: "Vì buổi sáng Linh phải thi ở trường", isCorrect: false },
      { label: "D", text: "Vì buổi sáng trời mưa to", isCorrect: false },
    ],
    explanation: "Audio: 「土曜日は午前中アルバイトがあるので、午後からでもいいですか。」",
    recommendedLesson: {
      slug: "n4-lesson-26-ndesu",
      title: "Giải thích hoàn cảnh 〜んです & nhờ vả 〜んですが",
      topic: "Nghe hội thoại hẹn lịch N4",
    },
  },
  {
    id: "n4-r1",
    skill: "READING",
    subCategory: "Ngữ pháp ngữ cảnh",
    level: "N4",
    format: "MULTIPLE_CHOICE",
    contextPassage: "「私が困っていたとき、親切な日本人の友だちが荷物を運んで＿＿＿。」",
    question: "Chọn động từ Cho–Nhận đúng hướng ân huệ trong câu trên:",
    options: [
      { label: "A", text: "くれました (Người khác chủ động làm giúp tôi)", isCorrect: true },
      { label: "B", text: "あげました (Tôi làm giúp người khác)", isCorrect: false },
      { label: "C", text: "やりました (Làm cho cấp dưới/thú cưng)", isCorrect: false },
      { label: "D", text: "いきました (Đi mất)", isCorrect: false },
    ],
    explanation: "Chủ ngữ là「友だちが」(bạn làm giúp tôi) nên phải dùng「〜てくれました」.",
    recommendedLesson: {
      slug: "n4-lesson-41-giving-receiving-keigo",
      title: "Cho–nhận hành động & kính ngữ",
      topic: "Phân biệt 〜てあげる・〜てくれる・〜てもらう N4",
    },
  },
  {
    id: "n4-r2",
    skill: "READING",
    subCategory: "Đọc hiểu",
    level: "N4",
    format: "MULTIPLE_CHOICE",
    contextPassage:
      "【マンションのゴミ出しルール】\n・燃えるゴミは火曜日と金曜日の朝8時までに指定の袋に入れて出してください。\n・ペットボトルや空き缶は水曜日に資源ゴミとして出してください。夜のうちに出すのは禁止です。",
    question: "Theo quy định của tòa chung cư, điều nào sau đây là ĐÚNG?",
    options: [
      { label: "A", text: "Rác cháy được bỏ vào túi quy định trước 8h sáng Thứ Ba & Thứ Sáu; cấm vứt rác từ đêm hôm trước", isCorrect: true },
      { label: "B", text: "Chai nhựa được vứt vào mọi ngày trong tuần", isCorrect: false },
      { label: "C", text: "Có thể mang rác ra để từ tối hôm trước cho tiện", isCorrect: false },
      { label: "D", text: "Không cần dùng túi rác theo quy định", isCorrect: false },
    ],
    explanation: "Quy định nêu rõ: 火曜日と金曜日の朝8時までに指定の袋に入れて... 夜のうちに出すのは禁止です.",
    recommendedLesson: {
      slug: "n4-apartment-leasing",
      title: "Thuê nhà trọ & Quy tắc sinh hoạt tại Nhật",
      topic: "Đọc hiểu nội quy chung cư N4",
    },
  },
  {
    id: "n4-w1",
    skill: "WRITING",
    subCategory: "Viết câu・Điền từ",
    level: "N4",
    format: "WRITING_INPUT",
    question: "Hãy viết câu lời khuyên bằng tiếng Nhật (N4): «Vì ngày mai có bài kiểm tra nên hôm nay bạn nên đi ngủ sớm.»",
    promptHint: "Sử dụng mẫu: 明日テストがあるので / から + 早く寝たほうがいいです (hayaku neta hou ga ii desu).",
    acceptedKeywords: ["はや", "早", "hayaku", "ねた", "寝た", "neta", "ほうがいい", "hougaii", "方が"],
    sampleAnswer: "明日はテストがあるので、今日は早く寝たほうがいいですよ。",
    rubricCriteria: [
      "Chia đúng động từ 寝る sang thể た (寝た) trước ほうがいい",
      "Sử dụng liên từ chỉ nguyên nhân ので hoặc から",
      "Câu văn mạch lạc, đúng ngữ vực lịch sự",
    ],
    explanation: "Khi khuyên ai nên làm việc gì ở hiện tại/tương lai, tiếng Nhật dùng Vた + ほうがいいです (寝たほうがいいです).",
    recommendedLesson: {
      slug: "n4-lesson-32-advice-prediction",
      title: "Lời khuyên 〜ほうがいい & dự đoán 〜でしょう",
      topic: "Viết câu khuyên bảo N4",
    },
  },
  {
    id: "n4-s1",
    skill: "SPEAKING",
    subCategory: "Phản xạ nói",
    level: "N4",
    format: "SPEAKING_PROMPT",
    question: "Tình huống Nói N4 (Phỏng vấn Baito): Người quản lý hỏi bạn「どうしてこのアルバイトに応募しましたか」(Tại sao bạn ứng tuyển công việc làm thêm này?). Hãy trả lời lịch sự.",
    promptHint: "Nêu lý do bằng 〜からです hoặc 〜たいと思ったからです (Ví dụ: 日本語を使って接客の仕事をしたいからです).",
    acceptedKeywords: ["にほんご", "日本語", "nihongo", "たい", "tai", "から", "kara", "ので", "node", "好き", "すき", "suki"],
    sampleAnswer: "日本語を使って接客の仕事をしたいと思ったからです。よろしくお願いいたします。",
    rubricCriteria: [
      "Trả lời đúng trọng tâm câu hỏi lý do (dùng 〜からです hoặc 〜ためです)",
      "Diễn đạt nguyện vọng tích cực (〜たいです / 〜たいと思いました)",
      "Giữ thái độ lịch sự (丁寧語) phù hợp phỏng vấn",
    ],
    explanation: "Trong phỏng vấn Baito, câu trả lời rõ ràng với 〜たいと思ったからです tạo ấn tượng rất tốt.",
    recommendedLesson: {
      slug: "n4-baito-interview",
      title: "Phỏng vấn xin việc làm thêm (Baito)",
      topic: "Phản xạ phỏng vấn Baito N4",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. BỘ CÂU HỎI ĐÁNH GIÁ TỔNG HỢP N3 (N3_FULL - ĐỦ 4 KỸ NĂNG)
// ─────────────────────────────────────────────────────────────────────────────
const N3_FULL_BANK: AssessmentQuestion[] = [
  {
    id: "n3-l1",
    skill: "LISTENING",
    subCategory: "Nghe hội thoại",
    level: "N3",
    format: "MULTIPLE_CHOICE",
    audioScript: "課長、新製品のパンフレットですが、印刷会社から連絡がありまして、明日の午前中に届くことになりました。届き次第、会議室へ運んでおきます。",
    question: "Nghe báo cáo công việc: Nhân viên sẽ làm gì ngay sau khi tờ rơi sản phẩm mới được giao đến?",
    options: [
      { label: "A", text: "Ngay khi nhận được (届き次第) sẽ chuyển sẵn vào phòng họp", isCorrect: true },
      { label: "B", text: "Gửi trả lại cho công ty in ấn", isCorrect: false },
      { label: "C", text: "Đợi đến tuần sau mới mở ra kiểm tra", isCorrect: false },
      { label: "D", text: "Mang trực tiếp đến nhà khách hàng", isCorrect: false },
    ],
    explanation: "Audio dùng cấu trúc N3「届き次第、会議室へ運んでおきます」(Ngay sau khi hàng tới sẽ chuyển sẵn vào phòng họp).",
    recommendedLesson: {
      slug: "n3-lesson-22-listening-workplace-dialogue",
      title: "Nghe hiểu N3 — Trao đổi ý kiến & Báo cáo công ty",
      topic: "Nghe hiểu công sở & cấu trúc 〜次第 N3",
    },
  },
  {
    id: "n3-r1",
    skill: "READING",
    subCategory: "Ngữ pháp ngữ cảnh",
    level: "N3",
    format: "MULTIPLE_CHOICE",
    contextPassage: "「お送りいただいた企画書を＿＿＿いたしました。非常に素晴らしい内容だと思います。」",
    question: "Chọn Khiêm nhường ngữ (謙譲語) đúng chuẩn để điền vào chỗ trống (người nói đọc tài liệu của đối tác):",
    options: [
      { label: "A", text: "拝見 (haiken - Khiêm nhường ngữ của 見る/読む)", isCorrect: true },
      { label: "B", text: "ご覧 (goran - Tôn kính ngữ của 見る)", isCorrect: false },
      { label: "C", text: "おっしゃり (Tôn kính ngữ của 言う)", isCorrect: false },
      { label: "D", text: "召し上がり (Tôn kính ngữ của 食べる)", isCorrect: false },
    ],
    explanation: "Hành động xem/đọc của bản thân đối với tài liệu của khách hàng phải dùng Khiêm nhường ngữ「拝見いたします」.",
    recommendedLesson: {
      slug: "n3-lesson-10-grammar-keigo",
      title: "Kính ngữ N3 nâng cao (Tôn kính vs. Khiêm nhường)",
      topic: "Phân biệt 拝見する và ご覧になる N3",
    },
  },
  {
    id: "n3-r2",
    skill: "READING",
    subCategory: "Đọc hiểu",
    level: "N3",
    format: "MULTIPLE_CHOICE",
    contextPassage:
      "「言葉は時代とともに変化する。例えば、若者がよく使う『やばい』という言葉は、もともと江戸時代には『危険だ・都合が悪い』という否定的な意味で使われていた。しかし現在では、『すごく美味しい』『最高だ』といった肯定的な意味でも広く使われるようになっている。」",
    question: "Nội dung chính của đoạn văn trên nói về hiện tượng gì?",
    options: [
      { label: "A", text: "Sự biến đổi ý nghĩa của từ ngữ theo thời đại (ví dụ từ 『やばい』 từ nghĩa tiêu cực thời Edo sang cả nghĩa tích cực hiện nay)", isCorrect: true },
      { label: "B", text: "Giới trẻ Nhật Bản không còn sử dụng từ 『やばい』 nữa", isCorrect: false },
      { label: "C", text: "Từ 『やばい』 được mượn từ tiếng Anh vào thời Minh Trị", isCorrect: false },
      { label: "D", text: "Tất cả tiếng lóng đều được đưa vào văn bản pháp luật", isCorrect: false },
    ],
    explanation: "Đoạn văn phân tích sự thay đổi ngôn ngữ theo thời gian qua ví dụ từ『やばい』.",
    recommendedLesson: {
      slug: "n3-lesson-19-reading-emails-notices",
      title: "Đọc hiểu N3 — Ngôn ngữ & Xã hội",
      topic: "Đọc hiểu nghị luận ngắn N3",
    },
  },
  {
    id: "n3-r3",
    skill: "READING",
    subCategory: "Từ vựng・Hán tự",
    level: "N3",
    format: "MULTIPLE_CHOICE",
    contextPassage: "「年末は仕事が忙しくて、猫の手も借りたいほどだ。」",
    question: "Quán dụng ngữ「猫の手も借りたい」trong câu trên có ý nghĩa là gì?",
    options: [
      { label: "A", text: "Bận rộn đến mức muốn nhờ bất kỳ sự trợ giúp nào (muốn mượn cả tay mèo)", isCorrect: true },
      { label: "B", text: "Muốn nuôi thêm mèo để giảm căng thẳng khi làm việc", isCorrect: false },
      { label: "C", text: "Làm việc thong thả, nhàn nhã như mèo", isCorrect: false },
      { label: "D", text: "Cẩn thận khéo léo trong từng chi tiết", isCorrect: false },
    ],
    explanation: "「猫の手も借りたい」là thành ngữ/quán dụng ngữ chỉ tình trạng cực kỳ bận rộn.",
    recommendedLesson: {
      slug: "n3-lesson-16-vocab-frequent-verbs",
      title: "Từ vựng & Quán dụng ngữ N3 tần suất cao",
      topic: "Thành ngữ & Quán dụng ngữ N3",
    },
  },
  {
    id: "n3-w1",
    skill: "WRITING",
    subCategory: "Viết câu・Điền từ",
    level: "N3",
    format: "WRITING_INPUT",
    question: "Hãy chuyển câu hội thoại thân mật sau sang tiếng Nhật lịch sự chuẩn công sở (標準語・敬語): 「宿題、忘れちゃった！」(Tớ lỡ quên bài tập mất rồi!)",
    promptHint: "Chuyển rút gọn 〜ちゃった về dạng đầy đủ lịch sự: 〜てしまいました (宿題を忘れてしまいました).",
    acceptedKeywords: ["わすれてしまいました", "忘れてしまいました", "wasureteshimaimashita"],
    sampleAnswer: "すみません、宿題を忘れてしまいました。",
    rubricCriteria: [
      "Chuyển đúng khẩu ngữ 〜ちゃった thành thể lịch sự chuẩn 〜てしまいました",
      "Khôi phục đầy đủ trợ từ を (宿題を)",
      "Không dùng từ lóng trong câu viết chuẩn",
    ],
    explanation: "Khẩu ngữ「忘れちゃった」là dạng rút gọn của「忘れてしまった」. Khi nói lịch sự chuẩn phải dùng「忘れてしまいました」.",
    recommendedLesson: {
      slug: "n3-lesson-1-grammar-foundations",
      title: "Cấu trúc N3 cốt lõi & Phân biệt Văn nói / Văn viết",
      topic: "Chuyển đổi khẩu ngữ sang ngôn ngữ chuẩn N3",
    },
  },
  {
    id: "n3-s1",
    skill: "SPEAKING",
    subCategory: "Phản xạ nói",
    level: "N3",
    format: "SPEAKING_PROMPT",
    question: "Tình huống Nói N3 (Kính ngữ công sở): Khách hàng đến công ty. Hãy mời khách ngồi và nói rằng Trưởng phòng sẽ đến ngay bây giờ.",
    promptHint: "Sử dụng từ đệm / tôn kính ngữ (どうぞおかけください) + khiêm nhường ngữ cho người trong công ty (部長がすぐ参ります / まいります).",
    acceptedKeywords: ["まいり", "参り", "mairi", "かけ", "kake", "お待ち", "おまち", "omachi", "どうぞ", "douzo"],
    sampleAnswer: "どうぞこちらにおかけください。ただいま部長が参りますので、少々お待ちください。",
    rubricCriteria: [
      "Mời khách bằng tôn kính ngữ「どうぞおかけください」hoặc「お待ちください」",
      "Dùng khiêm nhường ngữ「参ります」(mairimasu) cho Trưởng phòng của công ty mình khi nói với khách ngoài (Uchi/Soto)",
      "Ngữ điệu trang trọng, đúng chuẩn商务 (Business Japanese)",
    ],
    explanation: "Theo quy tắc Uchi-Soto (Trong-Ngoài), khi nói với khách hàng bên ngoài, hành động của cấp trên trong công ty mình phải dùng Khiêm nhường ngữ (部長が参ります).",
    recommendedLesson: {
      slug: "n3-lesson-10-grammar-keigo",
      title: "Kính ngữ N3 nâng cao (Tôn kính & Khiêm nhường Uchi-Soto)",
      topic: "Kính ngữ tiếp khách công sở N3",
    },
  },
];

export function getQuestionsForMode(modeId: string): AssessmentQuestion[] {
  switch (modeId) {
    case "N5_FULL":
      return N5_FULL_BANK;
    case "N4_FULL":
      return N4_FULL_BANK;
    case "N3_FULL":
      return N3_FULL_BANK;
    case "DIAGNOSTIC":
    default:
      return DIAGNOSTIC_BANK;
  }
}

export function evaluateFreeResponse(
  question: AssessmentQuestion,
  textResponse: string,
  checkedRubrics: number[]
): { isPassing: boolean; scoreRatio: number; matchedKeywords: string[] } {
  const clean = textResponse.trim().toLowerCase();
  const keywords = question.acceptedKeywords ?? [];
  const matched = keywords.filter((kw) => clean.includes(kw.toLowerCase()));

  const keywordRatio = keywords.length > 0 ? Math.min(1, matched.length / Math.max(1, Math.ceil(keywords.length / 2))) : 0;
  const totalRubrics = question.rubricCriteria?.length || 3;
  const rubricRatio = Math.min(1, checkedRubrics.length / totalRubrics);

  // Kết hợp kiểm tra từ khóa/mẫu câu thực tế (60%) và tiêu chí tự đối chiếu Rubric (40%)
  const hasText = clean.length >= 2;
  const scoreRatio = hasText ? Math.round((keywordRatio * 0.65 + rubricRatio * 0.35) * 100) / 100 : rubricRatio * 0.5;
  return {
    isPassing: scoreRatio >= 0.55,
    scoreRatio,
    matchedKeywords: matched,
  };
}

