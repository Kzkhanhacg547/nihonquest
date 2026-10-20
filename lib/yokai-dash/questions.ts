import { prisma } from "@/lib/prisma";
import {
  extractHanVietFromMeaning,
  formatJapaneseWithReading,
  normalizeJapaneseWord,
  parseKanjiMeaningAndHanViet,
} from "@/lib/canonical-vocab";
import { YokaiLevel, YokaiQuestion, YokaiQuestionMode } from "./types";

function shuffleArray<T>(arr: T[]): T[] {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

export function matchesMode(q: YokaiQuestion, mode: YokaiQuestionMode): boolean {
  if (mode === "ALL") return true;
  if (mode === "WORD_TO_MEANING") {
    return q.questionType === "WORD_TO_MEANING";
  }
  if (mode === "MEANING_TO_WORD") {
    return q.questionType === "MEANING_TO_WORD";
  }
  if (mode === "WORD_BOTH") {
    return q.questionType === "WORD_TO_MEANING" || q.questionType === "MEANING_TO_WORD";
  }
  if (mode === "SENTENCE_TO_MEANING") {
    return q.questionType === "SENTENCE_TO_MEANING";
  }
  if (mode === "MEANING_TO_SENTENCE") {
    return q.questionType === "MEANING_TO_SENTENCE";
  }
  if (mode === "SENTENCE_BOTH") {
    return q.questionType === "SENTENCE_TO_MEANING" || q.questionType === "MEANING_TO_SENTENCE";
  }
  if (mode === "LESSON_GRAMMAR") {
    return q.questionType === "LESSON_GRAMMAR";
  }
  return true;
}

function buildThreeOptions(correct: string, distractors: string[], fallbackA: string, fallbackB: string): {
  options: [string, string, string];
  correctLane: 0 | 1 | 2;
} {
  const correctLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
  const options: [string, string, string] = ["", "", ""];
  options[correctLane] = correct;

  const uniqueDistractors = Array.from(new Set(distractors.filter((d) => d && d !== correct)));
  let distIdx = 0;
  for (let l = 0; l < 3; l++) {
    if (l !== correctLane) {
      const candidate = uniqueDistractors[distIdx] || (distIdx === 0 ? fallbackA : fallbackB);
      options[l] = candidate === correct ? `${candidate} (khác)` : candidate;
      distIdx++;
    }
  }
  return { options, correctLane };
}

// Curated question bank across all 5 realms (52 high-quality questions with detailed explanations)
export const CURATED_QUESTIONS: Record<YokaiLevel, YokaiQuestion[]> = {
  KANA: [
    {
      id: "cur_kana_1",
      category: "KANA",
      questionType: "WORD_TO_MEANING",
      prompt: "Chữ cái Hiragana: 'あ' đọc là gì?",
      subPrompt: "Nguyên âm cơ bản hàng A",
      audioText: "あ",
      targetLevel: "KANA",
      correctAnswer: "A",
      options: ["I", "A", "U"],
      correctLane: 1,
      explanation: "Chữ 'あ' (A) là chữ cái mở đầu bảng Hiragana (5 nguyên âm: あ a, い i, う u, え e, お o).",
    },
    {
      id: "cur_kana_2",
      category: "KANA",
      questionType: "WORD_TO_MEANING",
      prompt: "Chữ cái Katakana: 'カ' đọc là gì?",
      subPrompt: "Âm hàng Ka",
      audioText: "カ",
      targetLevel: "KANA",
      correctAnswer: "KA",
      options: ["KA", "KI", "KU"],
      correctLane: 0,
      explanation: "Chữ 'カ' là chữ KA trong bảng Katakana (viết gọn từ bộ Lực 力).",
    },
    {
      id: "cur_kana_3",
      category: "KANA",
      questionType: "MEANING_TO_WORD",
      prompt: "Chữ Hiragana nào sau đây đọc là 'SHI'?",
      subPrompt: "Chọn chữ Hiragana đúng",
      audioText: "し",
      targetLevel: "KANA",
      correctAnswer: "し",
      options: ["つ", "く", "し"],
      correctLane: 2,
      explanation: "Chữ 'し' có hình dáng giống lưỡi câu, phát âm là 'SHI'. 'つ' là TSU, 'く' là KU.",
    },
    {
      id: "cur_kana_4",
      category: "KANA",
      questionType: "WORD_TO_MEANING",
      prompt: "Chữ Hiragana: 'ね' đọc là gì?",
      subPrompt: "Dễ nhầm với れ và わ",
      audioText: "ね",
      targetLevel: "KANA",
      correctAnswer: "NE",
      options: ["RE", "NE", "WA"],
      correctLane: 1,
      explanation: "Chữ 'ね' (NE) có vòng xoắn tròn ở đuôi; 'れ' (RE) hất cong ra ngoài; 'わ' (WA) cong tròn không xoắn.",
    },
    {
      id: "cur_kana_5",
      category: "KANA",
      questionType: "MEANING_TO_WORD",
      prompt: "Chữ Katakana nào đọc là 'SHI'?",
      subPrompt: "Nhận diện nét chấm ngang hất lên",
      audioText: "シ",
      targetLevel: "KANA",
      correctAnswer: "シ",
      options: ["ソ", "ツ", "シ"],
      correctLane: 2,
      explanation: "Chữ 'シ' (SHI) có 2 nét chấm xếp ngang và nét cong vuốt từ dưới lên. 'ツ' (TSU) xếp dọc vuốt từ trên xuống.",
    },
    {
      id: "cur_kana_6",
      category: "KANA",
      questionType: "WORD_TO_MEANING",
      prompt: "Từ ghép 'ねこ' (Con mèo) đọc Romaji là gì?",
      subPrompt: "Ghép chữ cơ bản",
      audioText: "ねこ",
      targetLevel: "KANA",
      correctAnswer: "Neko",
      options: ["Neko", "Inu", "Tori"],
      correctLane: 0,
      explanation: "'ね' (NE) + 'こ' (KO) = Neko (con mèo). Inu (いぬ) là chó, Tori (とり) là chim.",
    },
    {
      id: "cur_kana_7",
      category: "KANA",
      questionType: "MEANING_TO_WORD",
      prompt: "Từ Hiragana nào có nghĩa là: 'Hoa anh đào' (Sakura)?",
      subPrompt: "Chọn chữ Hiragana đúng",
      audioText: "さくら",
      targetLevel: "KANA",
      correctAnswer: "さくら",
      options: ["うめ", "さくら", "もも"],
      correctLane: 1,
      explanation: "'さくら' (Sakura) là hoa anh đào. 'うめ' là hoa mơ, 'もも' là hoa đào/quả đào.",
    },
    {
      id: "cur_kana_8",
      category: "KANA",
      questionType: "WORD_TO_MEANING",
      prompt: "Biến âm Handakuten (maru ゜): Chữ 'ぱ' đọc là gì?",
      subPrompt: "Hàng Ha thêm dấu tròn ゜",
      audioText: "ぱ",
      targetLevel: "KANA",
      correctAnswer: "PA",
      options: ["BA", "PA", "HA"],
      correctLane: 1,
      explanation: "Chữ 'は' (HA) khi thêm dấu tròn nhỏ (Handakuten ゜) thành 'ぱ' (PA); nếu thêm dấu phẩy đôi (Dakuten ゛) thành 'ば' (BA).",
    },
    {
      id: "cur_kana_9",
      category: "KANA",
      questionType: "WORD_TO_MEANING",
      prompt: "Âm ghép Yōon (拗音): 'きゃ' được phát âm là gì?",
      subPrompt: "Ghép き (ki) + ゃ (ya nhỏ)",
      audioText: "きゃ",
      targetLevel: "KANA",
      correctAnswer: "KYA (1 phách)",
      options: ["KIYA (2 phách)", "KYA (1 phách)", "KA"],
      correctLane: 1,
      explanation: "Khi chữ cột I ('き') ghép với 'ゃ' nhỏ, ta đọc lướt thành 1 âm tiết duy nhất là 'KYA' (khác với 'きや' kiya 2 âm).",
    },
    {
      id: "cur_kana_10",
      category: "KANA",
      questionType: "WORD_TO_MEANING",
      prompt: "Âm ghép Katakana: 'シュ' trong 'シャワー / シュート' đọc là gì?",
      subPrompt: "Ghép シ (shi) + ュ (yu nhỏ)",
      audioText: "シュ",
      targetLevel: "KANA",
      correctAnswer: "SHU",
      options: ["SHU", "TSU", "SO"],
      correctLane: 0,
      explanation: "'シ' (SHI) + 'ュ' nhỏ = 'シュ' (SHU), rất hay gặp trong các từ ngoại lai tiếng Anh.",
    },
    {
      id: "cur_kana_11",
      category: "KANA",
      questionType: "MEANING_TO_WORD",
      prompt: "Chữ Katakana nào đọc là 'RO'?",
      subPrompt: "Hình hộp chữ nhật dễ nhầm với KO コ",
      audioText: "ロ",
      targetLevel: "KANA",
      correctAnswer: "ロ",
      options: ["コ", "ロ", "ユ"],
      correctLane: 1,
      explanation: "Chữ 'ロ' là RO trong Katakana. 'コ' là KO, 'ユ' là YU.",
    },
    {
      id: "cur_kana_12",
      category: "KANA",
      questionType: "MEANING_TO_WORD",
      prompt: "Từ Hiragana nào có nghĩa là: 'Con mèo' (Neko)?",
      subPrompt: "Chọn từ Hiragana đúng",
      audioText: "ねこ",
      targetLevel: "KANA",
      correctAnswer: "ねこ",
      options: ["いぬ", "ねこ", "とり"],
      correctLane: 1,
      explanation: "'ねこ' (Neko) là con mèo. 'いぬ' là con chó, 'とり' là con chim.",
    },
    {
      id: "cur_kana_13",
      category: "KANA",
      questionType: "MEANING_TO_WORD",
      prompt: "Chữ Hiragana nào phát âm là 'A'?",
      subPrompt: "Nguyên âm mở đầu bảng Hiragana",
      audioText: "あ",
      targetLevel: "KANA",
      correctAnswer: "あ",
      options: ["い", "あ", "う"],
      correctLane: 1,
      explanation: "Chữ 'あ' là chữ A trong Hiragana. 'い' là I, 'う' là U.",
    },
    {
      id: "cur_kana_14",
      category: "KANA",
      questionType: "MEANING_TO_WORD",
      prompt: "Chữ Hiragana nào phát âm là 'KA'?",
      subPrompt: "Hàng Ka trong bảng Hiragana",
      audioText: "か",
      targetLevel: "KANA",
      correctAnswer: "か",
      options: ["き", "か", "く"],
      correctLane: 1,
      explanation: "Chữ 'か' là KA. 'き' là KI, 'く' là KU.",
    },
    {
      id: "cur_kana_15",
      category: "KANA",
      questionType: "MEANING_TO_WORD",
      prompt: "Chữ Katakana nào phát âm là 'A'?",
      subPrompt: "Bảng chữ cái Katakana",
      audioText: "ア",
      targetLevel: "KANA",
      correctAnswer: "ア",
      options: ["イ", "ア", "ウ"],
      correctLane: 1,
      explanation: "Chữ 'ア' là A trong bảng Katakana. 'イ' là I, 'ウ' là U.",
    },
    {
      id: "cur_kana_16",
      category: "KANA",
      questionType: "MEANING_TO_WORD",
      prompt: "Từ Katakana nào có nghĩa là: 'Cà phê' (Kōhī)?",
      subPrompt: "Từ mượn tiếng nước ngoài",
      audioText: "コーヒー",
      targetLevel: "KANA",
      correctAnswer: "コーヒー",
      options: ["ジュース", "コーヒー", "ミルク"],
      correctLane: 1,
      explanation: "'コーヒー' (Koohii) là cà phê. 'ジュース' là nước ngọt, 'ミルク' là sữa bò.",
    },
    {
      id: "cur_kana_17",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Tôi là học sinh.'?",
      subPrompt: "Chọn câu Hiragana tương ứng",
      audioText: "わたしはがくせいです",
      targetLevel: "KANA",
      correctAnswer: "わたしは がくせい です。",
      options: [
        "わたしは いしゃ です。",
        "わたしは がくせい です。",
        "わたしは せんせい です。",
      ],
      correctLane: 1,
      explanation: "'わたしは がくせい です。' = Tôi là học sinh. (いしゃ = bác sĩ, せんせい = giáo viên).",
    },
    {
      id: "cur_kana_18",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'これは ねこ です。' có nghĩa là gì?",
      subPrompt: "Mẫu câu khẳng định cơ bản",
      audioText: "これはねこです",
      targetLevel: "KANA",
      correctAnswer: "Đây là con mèo.",
      options: ["Đây là con chó.", "Đây là con mèo.", "Đây là con chim."],
      correctLane: 1,
      explanation: "'これ' (cái này) + 'は' (trợ từ) + 'ねこ' (con mèo) + 'です' = Đây là con mèo.",
    },
    {
      id: "cur_kana_19",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ chủ ngữ trong câu Hiragana: わたし [ ? ] がくせい です。",
      subPrompt: "Trợ từ chỉ chủ đề câu (đọc là WA)",
      audioText: "わたしはがくせいです",
      targetLevel: "KANA",
      correctAnswer: "は (wa)",
      options: ["は (wa)", "に (ni)", "で (de)"],
      correctLane: 0,
      explanation: "Trợ từ 'は' (viết là HA nhưng phát âm là WA) dùng để đánh dấu chủ ngữ / chủ đề câu.",
    },
    {
      id: "cur_kana_20",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ sở hữu: わたし [ ? ] ほん (Sách của tôi)",
      subPrompt: "Trợ từ nối 2 danh từ chỉ quan hệ sở hữu",
      audioText: "わたしのほん",
      targetLevel: "KANA",
      correctAnswer: "の (no)",
      options: ["の (no)", "は (wa)", "を (wo)"],
      correctLane: 0,
      explanation: "Trợ từ 'の' (no) dùng để nối hai danh từ (N1 の N2) biểu thị sở hữu hoặc thuộc tính: わたし の ほん = sách của tôi.",
    },
    {
      id: "cur_kana_21",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ tân ngữ: ごはん [ ? ] たべます (Ăn cơm)",
      subPrompt: "Trợ từ đứng trước động từ chỉ đối tượng của hành động",
      audioText: "ごはんをたべます",
      targetLevel: "KANA",
      correctAnswer: "を (wo)",
      options: ["に (ni)", "を (wo)", "で (de)"],
      correctLane: 1,
      explanation: "Trợ từ 'を' (viết wo, đọc o) chỉ tân ngữ trực tiếp chịu tác động của hành động: ごはん を たべます = ăn cơm.",
    },
    {
      id: "cur_kana_22",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ phương hướng: とうきょう [ ? ] いきます (Đi Tokyo)",
      subPrompt: "Trợ từ chỉ hướng đi (viết là he, đọc là e)",
      audioText: "とうきょうへいきます",
      targetLevel: "KANA",
      correctAnswer: "へ (e)",
      options: ["へ (e)", "を (wo)", "の (no)"],
      correctLane: 0,
      explanation: "Trợ từ 'へ' (viết he, đọc e) chỉ hướng di chuyển tới địa điểm: とうきょう へ いきます = đi đến Tokyo.",
    },
    {
      id: "cur_kana_23",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ thời gian: 7じ [ ? ] おきます (Thức dậy lúc 7 giờ)",
      subPrompt: "Trợ từ đứng sau mốc thời gian cụ thể có con số",
      audioText: "しちじにおきます",
      targetLevel: "KANA",
      correctAnswer: "に (ni)",
      options: ["で (de)", "に (ni)", "へ (e)"],
      correctLane: 1,
      explanation: "Trợ từ 'に' (ni) đi sau mốc thời gian cụ thể (giờ, ngày, tháng) biểu thị thời điểm diễn ra hành động.",
    },
    {
      id: "cur_kana_24",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ phương tiện: ばす [ ? ] いきます (Đi bằng xe buýt)",
      subPrompt: "Trợ từ chỉ phương tiện hoặc công cụ thực hiện",
      audioText: "ばすでいきます",
      targetLevel: "KANA",
      correctAnswer: "で (de)",
      options: ["で (de)", "に (ni)", "を (wo)"],
      correctLane: 0,
      explanation: "Trợ từ 'で' (de) đi sau danh từ phương tiện (xe buýt, tàu điện, máy bay) để chỉ cách thức di chuyển: ばす で = bằng xe buýt.",
    },
    {
      id: "cur_kana_25",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ cũng: たなかさん [ ? ] がくせい です (Anh Tanaka cũng là học sinh)",
      subPrompt: "Trợ từ biểu thị ý đồng nhất 'cũng'",
      audioText: "たなかさんもがくせいです",
      targetLevel: "KANA",
      correctAnswer: "も (mo)",
      options: ["は (wa)", "も (mo)", "の (no)"],
      correctLane: 1,
      explanation: "Trợ từ 'も' (mo) mang nghĩa 'cũng', thay thế cho 'は' khi thông tin đồng nhất với vế trước.",
    },
    {
      id: "cur_kana_26",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ nối danh từ (và): りんご [ ? ] みかん (Táo và quýt)",
      subPrompt: "Trợ từ liệt kê toàn bộ giữa các danh từ",
      audioText: "りんごとみかん",
      targetLevel: "KANA",
      correctAnswer: "と (to)",
      options: ["と (to)", "や (ya)", "も (mo)"],
      correctLane: 0,
      explanation: "Trợ từ 'と' (to) dùng để nối hai hay nhiều danh từ với ý nghĩa 'và' (liệt kê trọn vẹn).",
    },
    {
      id: "cur_kana_27",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ nghi vấn kết thúc câu: これ は ぺん です [ ? ] (Đây là cái bút phải không?)",
      subPrompt: "Trợ từ đặt ở cuối câu để tạo câu hỏi",
      audioText: "これはぺんですか",
      targetLevel: "KANA",
      correctAnswer: "か (ka)",
      options: ["ね (ne)", "か (ka)", "よ (yo)"],
      correctLane: 1,
      explanation: "Trợ từ 'か' (ka) đặt ở cuối câu khẳng định biến câu thành câu hỏi trong tiếng Nhật: ... ですか？",
    },
    {
      id: "cur_kana_28",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Chọn đuôi phủ định lịch sự: わたし は いしゃ [ ? ] (Tôi không phải bác sĩ)",
      subPrompt: "Dạng phủ định lịch sự của 'です'",
      audioText: "わたしはいしゃじゃありません",
      targetLevel: "KANA",
      correctAnswer: "じゃ ありません",
      options: ["じゃ ありません", "です", "でした"],
      correctLane: 0,
      explanation: "'〜じゃ ありません' (hoặc '〜では ありません') là dạng phủ định thì hiện tại/tương lai của '〜です'.",
    },
    {
      id: "cur_kana_29",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Mẫu câu rủ rê lịch sự: いっしょに ごはん を [ ? ] (Cùng ăn cơm nhé?)",
      subPrompt: "Đuôi động từ dùng để rủ rê đối phương",
      audioText: "いっしょにごはんをたべませんか",
      targetLevel: "KANA",
      correctAnswer: "たべませんか",
      options: ["たべます", "たべませんか", "たべました"],
      correctLane: 1,
      explanation: "Mẫu câu 'V-ませんか' (masenka) dùng để rủ rê, mời mọc ai đó cùng làm việc gì một cách lịch sự.",
    },
    {
      id: "cur_kana_30",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Mẫu câu đề nghị cùng làm: すこし [ ? ] (Chúng ta cùng nghỉ một chút nào)",
      subPrompt: "Đuôi động từ hô hào, đồng lòng thực hiện",
      audioText: "すこしやすみましょう",
      targetLevel: "KANA",
      correctAnswer: "やすみましょう",
      options: ["やすみましょう", "やすみません", "やすみました"],
      correctLane: 0,
      explanation: "Mẫu câu 'V-ましょう' (mashou) dùng để đề nghị hoặc đồng ý cùng nhau làm một việc: やすみましょう = Hãy nghỉ ngơi nào.",
    },
    {
      id: "cur_kana_31",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Đại từ chỉ thị: Từ nào chỉ đồ vật ở gần người nói (cái này)?",
      subPrompt: "Hệ thống chỉ thị Ko-So-A-Do",
      audioText: "これ",
      targetLevel: "KANA",
      correctAnswer: "これ (kore)",
      options: ["これ (kore)", "それ (sore)", "あれ (are)"],
      correctLane: 0,
      explanation: "'これ' (kore) = cái này (gần người nói); 'それ' (sore) = cái đó (gần người nghe); 'あれ' (are) = cái kia (xa cả hai).",
    },
    {
      id: "cur_kana_32",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Đại từ chỉ thị: Từ nào chỉ đồ vật ở gần người nghe (cái đó)?",
      subPrompt: "Hệ thống chỉ thị Ko-So-A-Do",
      audioText: "それ",
      targetLevel: "KANA",
      correctAnswer: "それ (sore)",
      options: ["これ (kore)", "それ (sore)", "あれ (are)"],
      correctLane: 1,
      explanation: "'それ' (sore) chỉ vật ở gần người nghe nhưng xa người nói.",
    },
    {
      id: "cur_kana_33",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Đại từ chỉ thị: Từ nào chỉ đồ vật ở xa cả người nói và người nghe (cái kia)?",
      subPrompt: "Hệ thống chỉ thị Ko-So-A-Do",
      audioText: "あれ",
      targetLevel: "KANA",
      correctAnswer: "あれ (are)",
      options: ["これ (kore)", "それ (sore)", "あれ (are)"],
      correctLane: 2,
      explanation: "'あれ' (are) chỉ vật ở xa cả người nói lẫn người nghe: あれ = cái kia.",
    },
    {
      id: "cur_kana_34",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Từ nghi vấn: Từ Hiragana nào dùng để hỏi 'Người nào / Ai'?",
      subPrompt: "Từ để hỏi danh tính người",
      audioText: "だれ",
      targetLevel: "KANA",
      correctAnswer: "だれ (dare)",
      options: ["だれ (dare)", "どこ (doko)", "なに (nani)"],
      correctLane: 0,
      explanation: "'だれ' (dare) = ai / người nào. 'どこ' = ở đâu, 'なに' = cái gì.",
    },
    {
      id: "cur_kana_35",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Từ nghi vấn: Từ Hiragana nào dùng để hỏi 'Cái gì'?",
      subPrompt: "Từ để hỏi đồ vật hoặc sự việc",
      audioText: "なに",
      targetLevel: "KANA",
      correctAnswer: "なに (nani)",
      options: ["なに (nani)", "だれ (dare)", "いつ (itsu)"],
      correctLane: 0,
      explanation: "'なに' (hoặc なん) = cái gì. 'だれ' = ai, 'いつ' = khi nào.",
    },
    {
      id: "cur_kana_36",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Từ nghi vấn: Từ Hiragana nào dùng để hỏi 'Ở đâu / Chỗ nào'?",
      subPrompt: "Từ để hỏi địa điểm nơi chốn",
      audioText: "どこ",
      targetLevel: "KANA",
      correctAnswer: "どこ (doko)",
      options: ["どこ (doko)", "いくら (ikura)", "だれ (dare)"],
      correctLane: 0,
      explanation: "'どこ' (doko) = ở đâu / nơi nào. 'いくら' = bao nhiêu tiền.",
    },
    {
      id: "cur_kana_37",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ điểm bắt đầu: 9じ [ ? ] はじまります (Bắt đầu từ 9 giờ)",
      subPrompt: "Trợ từ chỉ mốc khởi đầu thời gian hoặc không gian",
      audioText: "くじからはじまります",
      targetLevel: "KANA",
      correctAnswer: "から (kara)",
      options: ["から (kara)", "まで (made)", "より (yori)"],
      correctLane: 0,
      explanation: "Trợ từ 'から' (kara) có nghĩa là 'từ', chỉ điểm khởi đầu của thời gian hoặc không gian.",
    },
    {
      id: "cur_kana_38",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ điểm kết thúc: 5じ [ ? ] はたらきます (Làm việc đến 5 giờ)",
      subPrompt: "Trợ từ chỉ giới hạn kết thúc thời gian hoặc không gian",
      audioText: "ごじまではたらきます",
      targetLevel: "KANA",
      correctAnswer: "まで (made)",
      options: ["まで (made)", "から (kara)", "へ (e)"],
      correctLane: 0,
      explanation: "Trợ từ 'まで' (made) có nghĩa là 'đến / cho tới', chỉ giới hạn cuối của thời gian hoặc không gian.",
    },
    {
      id: "cur_kana_39",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Trợ từ cảm thán xác nhận đồng tình cuối câu: きょう は あつい です [ ? ] (Hôm nay nóng nhỉ)",
      subPrompt: "Trợ từ tìm kiếm sự đồng cảm 'nhỉ/nhé'",
      audioText: "きょうはあついですね",
      targetLevel: "KANA",
      correctAnswer: "ね (ne)",
      options: ["ね (ne)", "よ (yo)", "か (ka)"],
      correctLane: 0,
      explanation: "Trợ từ 'ね' (ne) đặt ở cuối câu để tìm kiếm sự đồng thuận, đồng cảm từ người nghe (tương đương 'nhỉ/nhé' trong tiếng Việt).",
    },
    {
      id: "cur_kana_40",
      category: "KANA",
      questionType: "LESSON_GRAMMAR",
      prompt: "Trợ từ nhấn mạnh thông tin mới cho người nghe: これ は おいしい です [ ? ] (Cái này ngon đấy nhé)",
      subPrompt: "Trợ từ cung cấp tin tức mới 'đấy/nhé'",
      audioText: "これはおいしいですよ",
      targetLevel: "KANA",
      correctAnswer: "よ (yo)",
      options: ["よ (yo)", "ね (ne)", "わ (wa)"],
      correctLane: 0,
      explanation: "Trợ từ 'よ' (yo) đặt ở cuối câu để nhấn mạnh một thông tin mà người nói nghĩ là người nghe chưa biết (tương đương 'đấy/đấy nhé').",
    },
    {
      id: "cur_kana_41",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'これ は ほん です。' có nghĩa là gì?",
      subPrompt: "Mẫu câu khẳng định cơ bản",
      audioText: "これはほんです",
      targetLevel: "KANA",
      correctAnswer: "Đây là quyển sách.",
      options: ["Đây là quyển sách.", "Đây là cuốn vở.", "Đây là cái bút."],
      correctLane: 0,
      explanation: "'これ' = cái này, 'ほん' = quyển sách, 'です' = là. 'これ は ほん です。' = Đây là quyển sách.",
    },
    {
      id: "cur_kana_42",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Đây là quyển sách.'?",
      subPrompt: "Chọn câu Hiragana đúng",
      audioText: "これはほんです",
      targetLevel: "KANA",
      correctAnswer: "これ は ほん です。",
      options: ["これ は ほん です。", "それ は じしょ です。", "あれ は かばん です。"],
      correctLane: 0,
      explanation: "Nghĩa 'Đây là quyển sách' tương ứng với câu Hiragana: 'これ は ほん です。'.",
    },
    {
      id: "cur_kana_43",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'いま なんじ ですか。' có nghĩa là gì?",
      subPrompt: "Câu hỏi giờ giấc thông dụng",
      audioText: "いまなんじですか",
      targetLevel: "KANA",
      correctAnswer: "Bây giờ là mấy giờ?",
      options: ["Hôm nay là thứ mấy?", "Bây giờ là mấy giờ?", "Khi nào bạn đi học?"],
      correctLane: 1,
      explanation: "'いま' = bây giờ, 'なんじ' = mấy giờ. 'いま なんじ ですか。' = Bây giờ là mấy giờ?",
    },
    {
      id: "cur_kana_44",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Bây giờ là mấy giờ?'?",
      subPrompt: "Chọn câu hỏi giờ giấc tiếng Nhật",
      audioText: "いまなんじですか",
      targetLevel: "KANA",
      correctAnswer: "いま なんじ ですか。",
      options: ["いま なんじ ですか。", "きょう は なんようび ですか。", "いくら ですか。"],
      correctLane: 0,
      explanation: "Hỏi 'Bây giờ là mấy giờ' bằng Hiragana: 'いま なんじ ですか。'.",
    },
    {
      id: "cur_kana_45",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'きょう は いい てんき です。' có nghĩa là gì?",
      subPrompt: "Mô tả thời tiết trong ngày",
      audioText: "きょうはいいてんきです",
      targetLevel: "KANA",
      correctAnswer: "Hôm nay thời tiết đẹp.",
      options: ["Hôm nay trời mưa to.", "Hôm nay thời tiết đẹp.", "Hôm nay trời rất lạnh."],
      correctLane: 1,
      explanation: "'きょう' = hôm nay, 'いい てんき' = thời tiết đẹp. 'きょう は いい てんき です。' = Hôm nay thời tiết đẹp.",
    },
    {
      id: "cur_kana_46",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Hôm nay thời tiết đẹp.'?",
      subPrompt: "Chọn cách nói mô tả thời tiết",
      audioText: "きょうはいいてんきです",
      targetLevel: "KANA",
      correctAnswer: "きょう は いい てんき です。",
      options: ["きょう は いい てんき です。", "きのう は あめ でした。", "あした は ゆき です。"],
      correctLane: 0,
      explanation: "'きょう は いい てんき です。' diễn đạt ý 'Hôm nay thời tiết đẹp.'.",
    },
    {
      id: "cur_kana_47",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'としょかん で べんきょう します。' có nghĩa là gì?",
      subPrompt: "Hành động tại địa điểm",
      audioText: "としょかんでべんきょうします",
      targetLevel: "KANA",
      correctAnswer: "Tôi học bài ở thư viện.",
      options: ["Tôi đọc sách ở nhà.", "Tôi học bài ở thư viện.", "Tôi mượn sách ở trường."],
      correctLane: 1,
      explanation: "'としょかん' = thư viện, 'で' = tại/ở, 'べんきょう します' = học. 'としょかん で べんきょう します。' = Tôi học bài ở thư viện.",
    },
    {
      id: "cur_kana_48",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Tôi học bài ở thư viện.'?",
      subPrompt: "Chọn câu Hiragana biểu thị học ở thư viện",
      audioText: "としょかんでべんきょうします",
      targetLevel: "KANA",
      correctAnswer: "としょかん で べんきょう します。",
      options: ["としょかん で べんきょう します。", "きょうしつ で はなします。", "へや で やすみます。"],
      correctLane: 0,
      explanation: "Nói 'Tôi học bài ở thư viện' bằng Hiragana: 'としょかん で べんきょう します。'.",
    },
    {
      id: "cur_kana_49",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'くるま で がっこう へ いきます。' có nghĩa là gì?",
      subPrompt: "Phương tiện di chuyển đến trường",
      audioText: "くるまでがっこうへいきます",
      targetLevel: "KANA",
      correctAnswer: "Tôi đi đến trường bằng ô tô.",
      options: ["Tôi đi bộ đến trường.", "Tôi đi đến trường bằng xe buýt.", "Tôi đi đến trường bằng ô tô."],
      correctLane: 2,
      explanation: "'くるま' = ô tô, 'がっこう' = trường học. 'くるま で がっこう へ いきます。' = Tôi đi đến trường bằng ô tô.",
    },
    {
      id: "cur_kana_50",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Tôi đi đến trường bằng ô tô.'?",
      subPrompt: "Chọn câu Hiragana đúng",
      audioText: "くるまでがっこうへいきます",
      targetLevel: "KANA",
      correctAnswer: "くるま で がっこう へ いきます。",
      options: ["くるま で がっこう へ いきます。", "でんしゃ で かいしゃ へ いきます。", "あるいて えき へ いきます。"],
      correctLane: 0,
      explanation: "'くるま で がっこう へ いきます。' = Tôi đi đến trường bằng ô tô.",
    },
    {
      id: "cur_kana_51",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'みず を のみます。' có nghĩa là gì?",
      subPrompt: "Hành động uống nước",
      audioText: "みずをのみます",
      targetLevel: "KANA",
      correctAnswer: "Tôi uống nước.",
      options: ["Tôi uống nước.", "Tôi uống trà.", "Tôi uống sữa."],
      correctLane: 0,
      explanation: "'みず' = nước, 'のみます' = uống. 'みず を のみます。' = Tôi uống nước.",
    },
    {
      id: "cur_kana_52",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Tôi uống nước.'?",
      subPrompt: "Chọn câu Hiragana tương ứng",
      audioText: "みずをのみます",
      targetLevel: "KANA",
      correctAnswer: "みず を のみます。",
      options: ["みず を のみます。", "おちゃ を のみます。", "じゅーす を かいます。"],
      correctLane: 0,
      explanation: "'みず を のみます。' diễn đạt ý 'Tôi uống nước.'.",
    },
    {
      id: "cur_kana_53",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'にほんご は おもしろい です。' có nghĩa là gì?",
      subPrompt: "Cảm nhận về tiếng Nhật",
      audioText: "にほんごはおもしろいです",
      targetLevel: "KANA",
      correctAnswer: "Tiếng Nhật rất thú vị.",
      options: ["Tiếng Nhật rất khó.", "Tiếng Nhật rất thú vị.", "Tiếng Nhật rất dễ."],
      correctLane: 1,
      explanation: "'にほんご' = tiếng Nhật, 'おもしろい' = thú vị. 'にほんご は おもしろい です。' = Tiếng Nhật rất thú vị.",
    },
    {
      id: "cur_kana_54",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Tiếng Nhật rất thú vị.'?",
      subPrompt: "Chọn cách nói tiếng Nhật thú vị",
      audioText: "にほんごはおもしろいです",
      targetLevel: "KANA",
      correctAnswer: "にほんご は おもしろい です。",
      options: ["にほんご は おもしろい です。", "にほんご は むずかしい です。", "えいご は たのしい です。"],
      correctLane: 0,
      explanation: "'にほんご は おもしろい です。' có nghĩa là 'Tiếng Nhật rất thú vị.'.",
    },
    {
      id: "cur_kana_55",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'きのう えいが を みました。' có nghĩa là gì?",
      subPrompt: "Hành động đã diễn ra trong quá khứ",
      audioText: "きのうえいがをみました",
      targetLevel: "KANA",
      correctAnswer: "Hôm qua tôi đã xem phim.",
      options: ["Hôm qua tôi đã xem phim.", "Ngày mai tôi sẽ xem kịch.", "Hôm nay tôi nghe nhạc."],
      correctLane: 0,
      explanation: "'きのう' = hôm qua, 'えいが' = phim, 'みました' = đã xem (quá khứ của みます). 'きのう えいが を みました。' = Hôm qua tôi đã xem phim.",
    },
    {
      id: "cur_kana_56",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Hôm qua tôi đã xem phim.'?",
      subPrompt: "Chọn câu ở thì quá khứ",
      audioText: "きのうえいがをみました",
      targetLevel: "KANA",
      correctAnswer: "きのう えいが を みました。",
      options: ["きのう えいが を みました。", "きょう おんがく を ききます。", "あした えいが を みます。"],
      correctLane: 0,
      explanation: "'きのう えいが を みました。' biểu thị hành động đã xem phim ngày hôm qua.",
    },
    {
      id: "cur_kana_57",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'あした ともだち に あいます。' có nghĩa là gì?",
      subPrompt: "Kế hoạch ngày mai",
      audioText: "あしたともだちにあいます",
      targetLevel: "KANA",
      correctAnswer: "Ngày mai tôi gặp bạn bè.",
      options: ["Ngày mai tôi đi làm.", "Ngày mai tôi gặp bạn bè.", "Hôm qua tôi gặp thầy giáo."],
      correctLane: 1,
      explanation: "'あした' = ngày mai, 'ともだち' = bạn bè, 'あいます' = gặp (đi với trợ từ に). 'あした ともだち に あいます。' = Ngày mai tôi gặp bạn bè.",
    },
    {
      id: "cur_kana_58",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Ngày mai tôi gặp bạn bè.'?",
      subPrompt: "Chọn câu Hiragana đúng",
      audioText: "あしたともだちにあいます",
      targetLevel: "KANA",
      correctAnswer: "あした ともだち に あいます。",
      options: ["あした ともだち に あいます。", "きのう せんせい に あいました。", "きょう かぞく と はなします。"],
      correctLane: 0,
      explanation: "'あした ともだち に あいます。' = Ngày mai tôi gặp bạn bè.",
    },
    {
      id: "cur_kana_59",
      category: "KANA",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu Hiragana: 'あさ 6じ に おきます。' có nghĩa là gì?",
      subPrompt: "Thói quen giờ giấc buổi sáng",
      audioText: "あさろくじにおきます",
      targetLevel: "KANA",
      correctAnswer: "Tôi thức dậy lúc 6 giờ sáng.",
      options: ["Tôi đi ngủ lúc 6 giờ tối.", "Tôi thức dậy lúc 6 giờ sáng.", "Tôi ăn sáng lúc 7 giờ."],
      correctLane: 1,
      explanation: "'あさ' = buổi sáng, '6じ' = 6 giờ, 'おきます' = thức dậy. 'あさ 6じ に おきます。' = Tôi thức dậy lúc 6 giờ sáng.",
    },
    {
      id: "cur_kana_60",
      category: "KANA",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu Hiragana nào có nghĩa: 'Tôi thức dậy lúc 6 giờ sáng.'?",
      subPrompt: "Chọn câu thức dậy lúc 6 giờ",
      audioText: "あさろくじにおきます",
      targetLevel: "KANA",
      correctAnswer: "あさ 6じ に おきます。",
      options: ["あさ 6じ に おきます。", "よる 11じ に ねます。", "あさ 7じ に ごはん を たべます。"],
      correctLane: 0,
      explanation: "'あさ 6じ に おきます。' có nghĩa là 'Tôi thức dậy lúc 6 giờ sáng.'.",
    },
  ],
  N5: [
    {
      id: "cur_n5_1",
      category: "KANJI",
      questionType: "WORD_TO_MEANING",
      prompt: "Hán tự '日' trong '日曜日' có nghĩa là gì?",
      subPrompt: "Bộ Nhật - Mặt trời / Ngày",
      audioText: "にちようび",
      targetLevel: "N5",
      correctAnswer: "Ngày / Mặt trời",
      options: ["Mặt trăng", "Ngày / Mặt trời", "Ngọn lửa"],
      correctLane: 1,
      explanation: "Chữ '日' (NHẬT) nghĩa là Mặt trời hoặc Ngày (日曜日 = Chủ nhật). '月' là NGUYỆT, '火' là HỎA.",
    },
    {
      id: "cur_n5_2",
      category: "VOCAB",
      questionType: "MEANING_TO_WORD",
      prompt: "Từ nào có nghĩa là 'Học sinh / Sinh viên'?",
      subPrompt: "Gakusei (がくせい)",
      audioText: "がくせい",
      targetLevel: "N5",
      correctAnswer: "学生 (Gakusei)",
      options: ["先生 (Sensei)", "学生 (Gakusei)", "会社員 (Kaishain)"],
      correctLane: 1,
      explanation: "学生 (Gakusei) là Học sinh/Sinh viên. 先生 (Sensei) là Giáo viên; 会社員 (Kaishain) là Nhân viên công ty.",
    },
    {
      id: "cur_n5_3",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ: ごはん [ ? ] たべます。(Ăn cơm)",
      subPrompt: "Trợ từ chỉ tân ngữ trực tiếp",
      audioText: "ごはんをたべます",
      targetLevel: "N5",
      correctAnswer: "を (wo)",
      options: ["に (ni)", "で (de)", "を (wo)"],
      correctLane: 2,
      explanation: "Trợ từ 'を' (wo) đứng sau danh từ làm tân ngữ trực tiếp chịu tác động của tha động từ (ごはんを食べます).",
    },
    {
      id: "cur_n5_4",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "'おはようございます' dùng vào thời điểm nào?",
      subPrompt: "Lời chào lịch sự",
      audioText: "おはようございます",
      targetLevel: "N5",
      correctAnswer: "Chào buổi sáng",
      options: ["Chào buổi sáng", "Chào buổi trưa", "Chúc ngủ ngon"],
      correctLane: 0,
      explanation: "'おはようございます' (Ohayou gozaimasu) là câu chào lịch sự vào buổi sáng (thân mật: おはよう).",
    },
    {
      id: "cur_n5_5",
      category: "KANJI",
      questionType: "WORD_TO_MEANING",
      prompt: "Chữ Hán '水' đọc là gì khi đứng một mình?",
      subPrompt: "Hán Việt: THỦY - Nước",
      audioText: "みず",
      targetLevel: "N5",
      correctAnswer: "みず (Mizu)",
      options: ["ひ (Hi)", "き (Ki)", "みず (Mizu)"],
      correctLane: 2,
      explanation: "Chữ '水' (THỦY) có âm Kunyomi là 'みず' (mizu) nghĩa là nước, âm Onyomi là 'スイ' (Sui - trong 水曜日).",
    },
    {
      id: "cur_n5_6",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Thể て (Te-form) của động từ 'いきます' (Đi) là gì?",
      subPrompt: "Động từ nhóm 1 bất quy tắc âm xúc",
      audioText: "いって",
      targetLevel: "N5",
      correctAnswer: "いって (Itte)",
      options: ["いいて (Iite)", "いきって", "いって (Itte)"],
      correctLane: 2,
      explanation: "Mặc dù kết thúc bằng 'き', động từ 行きます (Ikimasu) chia sang thể Te đặc biệt là '行って' (itte), không phải いいて.",
    },
    {
      id: "cur_n5_7",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Điền trợ từ chỉ phương tiện: 毎日、電車 [ ? ] 学校へ行きます。",
      subPrompt: "Đi học bằng tàu điện",
      audioText: "まいにち、でんしゃでがっこうへいきます",
      targetLevel: "N5",
      correctAnswer: "で (de)",
      options: ["に (ni)", "で (de)", "を (wo)"],
      correctLane: 1,
      explanation: "Trợ từ 'で' (de) đi sau danh từ chỉ phương tiện giao thông hoặc công cụ thực hiện hành động (電車で行きます).",
    },
    {
      id: "cur_n5_8",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "Trước khi bắt đầu dùng bữa, người Nhật nói câu gì?",
      subPrompt: "Nghi thức văn hóa bàn ăn",
      audioText: "いただきます",
      targetLevel: "N5",
      correctAnswer: "いただきます (Itadakimasu)",
      options: ["ごちそうさまでした", "いただきます (Itadakimasu)", "ただいま"],
      correctLane: 1,
      explanation: "'いただきます' dùng trước khi ăn để bày tỏ lòng biết ơn; 'ごちそうさまでした' dùng sau khi ăn xong.",
    },
    {
      id: "cur_n5_9",
      category: "KANJI",
      questionType: "WORD_TO_MEANING",
      prompt: "Từ '先生' (Tiên Sinh - Giáo viên) đọc bằng Hiragana là gì?",
      subPrompt: "Chú ý trường âm cột E",
      audioText: "せんせい",
      targetLevel: "N5",
      correctAnswer: "せんせい (Sensei)",
      options: ["せんせい (Sensei)", "せんせえ (Sensee)", "しんせい (Shinsei)"],
      correctLane: 0,
      explanation: "先生 được viết bằng Hiragana là 'せんせい' (chữ い kéo dài trường âm cho cột え).",
    },
    {
      id: "cur_n5_10",
      category: "GRAMMAR",
      prompt: "Muốn rủ bạn lịch sự: 'Cùng uống cà phê nhé?' ta chọn đuôi câu nào?",
      subPrompt: "一緒にコーヒーを [ ? ]",
      audioText: "いっしょにコーヒーをのみませんか",
      targetLevel: "N5",
      correctAnswer: "飲みませんか (Nomimasen ka)",
      options: ["飲みましたか", "飲みませんか (Nomimasen ka)", "飲んでいません"],
      correctLane: 1,
      explanation: "Mẫu câu 'V-ませんか' dùng để lời mời lịch sự tôn trọng ý kiến người nghe (Cùng uống nhé?).",
      questionType: "LESSON_GRAMMAR",
    },
    {
      id: "cur_n5_11",
      category: "SENTENCE",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu '毎朝 7時に 起きます' có nghĩa là gì?",
      subPrompt: "Diễn đạt thói quen hàng ngày",
      audioText: "まいあさしちじにおきます",
      targetLevel: "N5",
      correctAnswer: "Mỗi sáng tôi thức dậy lúc 7 giờ",
      options: [
        "Mỗi tối tôi đi ngủ lúc 11 giờ",
        "Mỗi sáng tôi thức dậy lúc 7 giờ",
        "Mỗi ngày tôi ăn sáng lúc 7 giờ",
      ],
      correctLane: 1,
      explanation: "'毎朝' (Maiasa: mỗi sáng) + '7時に' (shichiji ni: lúc 7 giờ) + '起きます' (okimasu: thức dậy).",
    },
    {
      id: "cur_n5_12",
      category: "SENTENCE",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu '図書館で 日本語の本を 読みます' có nghĩa là gì?",
      subPrompt: "Địa điểm + で + Tân ngữ + を + Động từ",
      audioText: "としょかんでにほんごのほんをよみます",
      targetLevel: "N5",
      correctAnswer: "Tôi đọc sách tiếng Nhật ở thư viện",
      options: [
        "Tôi đọc sách tiếng Nhật ở thư viện",
        "Tôi mua từ điển tiếng Nhật ở hiệu sách",
        "Tôi mượn truyện tranh ở trường học",
      ],
      correctLane: 0,
      explanation: "'図書館で' (ở thư viện) + '日本語の本を' (sách tiếng Nhật) + '読みます' (đọc).",
    },
    {
      id: "cur_n5_13",
      category: "SENTENCE",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu tiếng Nhật nào diễn đạt: 'Tôi thích ăn Ramen nhất'?",
      subPrompt: "Cấu trúc so sánh bậc nhất 〜が 一番 好きです",
      audioText: "ラーメンがいちばんすきです",
      targetLevel: "N5",
      correctAnswer: "ラーメンが 一番 好きです",
      options: [
        "ラーメンを 食べませんでした",
        "ラーメンが 一番 好きです",
        "ラーメンは あまり 好きじゃないです",
      ],
      correctLane: 1,
      explanation: "'〜が 一番 好きです' (~ ga ichiban suki desu) dùng để nói thích cái gì nhất trong một nhóm.",
    },
    {
      id: "cur_n5_14",
      category: "SENTENCE",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu tiếng Nhật nào diễn đạt: 'Ngày mai tôi sẽ đi Tokyo bằng tàu Shinkansen'?",
      subPrompt: "Phương tiện + で + Điểm đến + へ + 行きます",
      audioText: "あしたしんかんせんでとうきょうへいきます",
      targetLevel: "N5",
      correctAnswer: "明日 新幹線で 東京へ 行きます",
      options: [
        "昨日 新幹線で 東京へ 行きました",
        "明日 飛行機で 大阪へ 行きます",
        "明日 新幹線で 東京へ 行きます",
      ],
      correctLane: 2,
      explanation: "'明日' (ngày mai) + '新幹線で' (bằng tàu Shinkansen) + '東京へ 行きます' (đi đến Tokyo).",
    },
    {
      id: "cur_n5_15",
      category: "VOCAB",
      questionType: "MEANING_TO_WORD",
      prompt: "Từ tiếng Nhật nào có nghĩa là: 'Thư viện'?",
      subPrompt: "Nơi mượn và đọc sách",
      audioText: "としょかん",
      targetLevel: "N5",
      correctAnswer: "としょかん (図書館)",
      options: [
        "びょういん (病院 - Bệnh viện)",
        "としょかん (図書館)",
        "ぎんこう (銀行 - Ngân hàng)",
      ],
      correctLane: 1,
      explanation: "図書館 (としょかん - Toshokan) nghĩa là thư viện. 病院 là bệnh viện, 銀行 là ngân hàng.",
    },
    {
      id: "cur_n5_16",
      category: "VOCAB",
      questionType: "MEANING_TO_WORD",
      prompt: "Từ tiếng Nhật nào có nghĩa là: 'Bạn bè'?",
      subPrompt: "Danh từ quen thuộc trong bài 1-5",
      audioText: "ともだち",
      targetLevel: "N5",
      correctAnswer: "ともだち (友達)",
      options: [
        "ともだち (友達)",
        "かぞく (家族 - Gia đình)",
        "せんせい (先生 - Thầy cô)",
      ],
      correctLane: 0,
      explanation: "友達 (ともだち - Tomodachi) là bạn bè. 家族 là gia đình, 先生 là thầy cô.",
    },
    {
      id: "cur_n5_17",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "Từ vựng 'あさごはん' (朝ご飯) có nghĩa là gì?",
      subPrompt: "Bữa ăn đầu tiên trong ngày",
      audioText: "あさごはん",
      targetLevel: "N5",
      correctAnswer: "Bữa ăn sáng",
      options: ["Bữa ăn trưa", "Bữa ăn sáng", "Bữa ăn tối"],
      correctLane: 1,
      explanation: "朝 (sáng) + ご飯 (cơm) = Bữa ăn sáng. Bữa trưa là 昼ご飯 (Hirugohan), bữa tối là 晩ご飯 (Bangohan).",
    },
    {
      id: "cur_n5_18",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Mẫu câu bài học '〜てください' dùng trong ngữ cảnh nào?",
      subPrompt: "Thể て + ください",
      audioText: "ちょっとまってください",
      targetLevel: "N5",
      correctAnswer: "Nhờ vả / Yêu cầu lịch sự (Xin hãy...)",
      options: [
        "Nhờ vả / Yêu cầu lịch sự (Xin hãy...)",
        "Cấm đoán tuyệt đối không được làm",
        "Nói về mong muốn của bản thân",
      ],
      correctLane: 0,
      explanation: "V-てください (V-te kudasai) dùng để yêu cầu, nhờ ai làm gì một cách lịch sự: 'ちょっと待ってください' (Xin vui lòng chờ một chút).",
    },
  ],
  N4: [
    {
      id: "cur_n4_1",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Mẫu câu '〜てはいけません' dùng để diễn đạt điều gì?",
      subPrompt: "Cấm đoán / Quy định",
      audioText: "ここでしゃしんをとってはいけません",
      targetLevel: "N4",
      correctAnswer: "Cấm, không được phép làm",
      options: ["Cấm, không được phép làm", "Không cần làm cũng được", "Nên làm ngay"],
      correctLane: 0,
      explanation: "V-てはいけません dùng để cấm đoán hoặc nhắc nhở quy định không được làm (Ngược lại: 〜なくてもいいです = không cần làm).",
    },
    {
      id: "cur_n4_2",
      category: "KANJI",
      questionType: "WORD_TO_MEANING",
      prompt: "Từ '案内' (Án Nội) có nghĩa và cách đọc là gì?",
      subPrompt: "Dùng nhiều ở nhà ga, du lịch",
      audioText: "あんない",
      targetLevel: "N4",
      correctAnswer: "あんない (Hướng dẫn / Chỉ dẫn)",
      options: ["あんしん (An tâm)", "あんない (Hướng dẫn / Chỉ dẫn)", "いけん (Ý kiến)"],
      correctLane: 1,
      explanation: "案内 (あんない - Annai) mang nghĩa là hướng dẫn, dẫn đường hoặc quầy thông tin (案内所).",
    },
    {
      id: "cur_n4_3",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Nhìn bầu trời đen kịt, bạn nói: 'Trời sắp mưa rồi!' (雨が...)",
      subPrompt: "Phỏng đoán qua thị giác 〜そうです",
      audioText: "あめがふりそうです",
      targetLevel: "N4",
      correctAnswer: "降りそうです (Furisou desu)",
      options: ["降るそうです (Nghe nói sẽ mưa)", "降りそうです (Furisou desu)", "降ったそうです"],
      correctLane: 1,
      explanation: "V-ます (bỏ ます) + そうです diễn tả dự đoán trực quan qua mắt thấy (Sắp mưa = 降りそうです). V-る + そうです là nghe truyền đạt lại.",
    },
    {
      id: "cur_n4_4",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "Động từ 'あきらめる' (諦める) có nghĩa là gì?",
      subPrompt: "Từ vựng N4 trọng tâm",
      audioText: "あきらめる",
      targetLevel: "N4",
      correctAnswer: "Từ bỏ / Bỏ cuộc",
      options: ["Từ bỏ / Bỏ cuộc", "Cố gắng hết sức", "Chuẩn bị bài trước"],
      correctLane: 0,
      explanation: "'あきらめる' (諦める) nghĩa là từ bỏ, bỏ cuộc (Ví dụ: 最後まであきらめないで = Đừng bỏ cuộc đến phút cuối!).",
    },
    {
      id: "cur_n4_5",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Mẫu câu '〜なければなりません' có nghĩa là gì?",
      subPrompt: "Nghĩa vụ / Bắt buộc",
      audioText: "くすりをのまなければなりません",
      targetLevel: "N4",
      correctAnswer: "Phải làm V (Bắt buộc)",
      options: ["Không nên làm V", "Phải làm V (Bắt buộc)", "Có thể làm V"],
      correctLane: 1,
      explanation: "V-ない (bỏ い) + ければなりません mang ý nghĩa 'phải làm' một nghĩa vụ hoặc việc cần thiết.",
    },
    {
      id: "cur_n4_6",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Khiêm nhường ngữ (謙譲語) của '行きます / 来ます' khi nói với cấp trên là:",
      subPrompt: "Kính ngữ N4 chuẩn mực",
      audioText: "まいります",
      targetLevel: "N4",
      correctAnswer: "参ります (Mairimasu)",
      options: ["いらっしゃいます", "参ります (Mairimasu)", "おっしゃいます"],
      correctLane: 1,
      explanation: "'参ります' (Mairimasu) là Khiêm nhường ngữ hạ mình của 行きます/来ます. Còn 'いらっしゃいます' là Tôn kính ngữ nâng người nghe.",
    },
    {
      id: "cur_n4_7",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "Sự khác nhau giữa '予習' (Yoshū) và '復習' (Fukushū) là gì?",
      subPrompt: "Cặp từ vựng học tập N4",
      audioText: "よしゅうとふくしゅう",
      targetLevel: "N4",
      correctAnswer: "予習: Chuẩn bị bài mới / 復習: Ôn bài cũ",
      options: [
        "予習: Ôn bài cũ / 復習: Chuẩn bị bài mới",
        "予習: Chuẩn bị bài mới / 復習: Ôn bài cũ",
        "Cả hai đều là thi cử",
      ],
      correctLane: 1,
      explanation: "Chữ 予 (DỰ - trước) trong 予習 là soạn bài trước khi lên lớp; chữ 復 (PHỤC - lặp lại) trong 復習 là ôn lại bài đã học.",
    },
    {
      id: "cur_n4_8",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Khuyên bạn đang bị sốt: 'Bạn nên đi bệnh viện thì hơn' (病院へ...)",
      subPrompt: "Mẫu lời khuyên 〜ほうがいい",
      audioText: "びょういんへいったほうがいいですよ",
      targetLevel: "N4",
      correctAnswer: "行ったほうがいい (Itta hou ga ii)",
      options: ["行くほうがいい", "行ったほうがいい (Itta hou ga ii)", "行ってほうがいい"],
      correctLane: 1,
      explanation: "Khi khuyên ai NÊN làm gì ở thể khẳng định, ngữ pháp chuẩn chia ở thể Та: 'V-た + ほうがいいです'.",
    },
    {
      id: "cur_n4_9",
      category: "KANJI",
      questionType: "WORD_TO_MEANING",
      prompt: "Từ Hán tự '経験' (Kinh Nghiệm) được đọc là gì?",
      subPrompt: "Dùng khi phỏng vấn Baito / Xin việc",
      audioText: "けいけん",
      targetLevel: "N4",
      correctAnswer: "けいけん (Keiken)",
      options: ["けいけん (Keiken)", "しけん (Shiken)", "けんきゅう (Kenkyū)"],
      correctLane: 0,
      explanation: "経験 (けいけん - Keiken) là kinh nghiệm; 試験 (しけん) là kỳ thi; 研究 (けんきゅう) là nghiên cứu.",
    },
    {
      id: "cur_n4_10",
      category: "GRAMMAR",
      prompt: "Phân biệt: 'ドアが開いています' nghĩa là gì?",
      subPrompt: "Tự động từ 開く (Aku) + ています",
      audioText: "ドアがあいています",
      targetLevel: "N4",
      correctAnswer: "Cánh cửa đang mở (Trạng thái)",
      options: ["Ai đó đang mở cửa", "Cánh cửa đang mở (Trạng thái)", "Cánh cửa đã đóng"],
      correctLane: 1,
      explanation: "Tự động từ (開く aku) + ています diễn tả trạng thái kết quả đang tiếp diễn: 'Cửa đang ở trạng thái mở'.",
      questionType: "LESSON_GRAMMAR",
    },
    {
      id: "cur_n4_11",
      category: "SENTENCE",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu '日本へ 行った ことがありますか' có nghĩa là gì?",
      subPrompt: "Mẫu kinh nghiệm V-た ことがあります",
      audioText: "にほんへいったことがありますか",
      targetLevel: "N4",
      correctAnswer: "Bạn đã từng đi Nhật Bản bao giờ chưa?",
      options: [
        "Bạn có muốn đi Nhật Bản không?",
        "Bạn đã từng đi Nhật Bản bao giờ chưa?",
        "Bạn sẽ đi Nhật Bản vào tuần tới à?",
      ],
      correctLane: 1,
      explanation: "V-た ことがあります dùng để hỏi hoặc nói về trải nghiệm/kinh nghiệm từng làm trong quá khứ.",
    },
    {
      id: "cur_n4_12",
      category: "SENTENCE",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu '薬を 飲んだので、もう 熱が 下がりました' có nghĩa là gì?",
      subPrompt: "Nguyên nhân 〜ので + kết quả",
      audioText: "くすりをのんだのでもうねつがさがりました",
      targetLevel: "N4",
      correctAnswer: "Vì đã uống thuốc nên tôi đã hạ sốt rồi",
      options: [
        "Vì đã uống thuốc nên tôi đã hạ sốt rồi",
        "Chưa uống thuốc nên người vẫn sốt cao",
        "Uống thuốc xong tôi lại bị đau đầu",
      ],
      correctLane: 0,
      explanation: "'〜ので' (bởi vì) + '熱が下がりました' (nhiệt độ/sốt đã hạ xuống).",
    },
    {
      id: "cur_n4_13",
      category: "SENTENCE",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu tiếng Nhật nào diễn đạt: 'Ở đây cấm chụp ảnh'?",
      subPrompt: "Cấm chỉ V-てはいけません",
      audioText: "ここでしゃしんをとってはいけません",
      targetLevel: "N4",
      correctAnswer: "ここで 写真を 撮ってはいけません",
      options: [
        "ここで 写真を 撮ってください",
        "ここで 写真を 撮ってはいけません",
        "写真を 撮らなくても いいですよ",
      ],
      correctLane: 1,
      explanation: "V-てはいけません là cấu trúc cấm đoán mang tính quy định trong bài học N4.",
    },
    {
      id: "cur_n4_14",
      category: "SENTENCE",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu tiếng Nhật nào diễn đạt: 'Tôi định sang năm sẽ đi du học Nhật'?",
      subPrompt: "Ý định V-る / V-ない + つもりです",
      audioText: "らいねんにほんへりゅうがくするつもりです",
      targetLevel: "N4",
      correctAnswer: "来年 日本へ 留学する つもりです",
      options: [
        "去年 日本へ 留学しました",
        "来年 日本へ 留学する つもりです",
        "日本へ 留学したくありません",
      ],
      correctLane: 1,
      explanation: "V-る + つもりです diễn tả kế hoạch/dự định chắc chắn của người nói.",
    },
    {
      id: "cur_n4_15",
      category: "VOCAB",
      questionType: "MEANING_TO_WORD",
      prompt: "Từ tiếng Nhật nào có nghĩa là: 'Cuộc hẹn / Lời hứa'?",
      subPrompt: "Yakusoku",
      audioText: "やくそく",
      targetLevel: "N4",
      correctAnswer: "やくそく (約束)",
      options: [
        "よてい (予定 - Dự định)",
        "やくそく (約束)",
        "しゅくだい (宿題 - Bài tập)",
      ],
      correctLane: 1,
      explanation: "約束 (やくそく - Yakusoku) là cuộc hẹn hoặc lời hứa. 予定 là dự định lịch trình.",
    },
    {
      id: "cur_n4_16",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Mẫu câu 'V-なくても いいです' trong bài học mang ý nghĩa gì?",
      subPrompt: "Ngược nghĩa với 〜なければなりません",
      audioText: "あしたはこなくてもいいですよ",
      targetLevel: "N4",
      correctAnswer: "Không làm cũng được (không bắt buộc)",
      options: [
        "Không làm cũng được (không bắt buộc)",
        "Tuyệt đối cấm không được làm",
        "Bắt buộc phải làm ngay lập tức",
      ],
      correctLane: 0,
      explanation: "V-なくてもいいです biểu thị sự không bắt buộc, người nghe không cần phải thực hiện hành động đó.",
    },
  ],
  N3: [
    {
      id: "cur_n3_1",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Mẫu câu '〜わけではない' diễn tả sắc thái ngữ pháp nào?",
      subPrompt: "Phủ định một phần (Partial negation)",
      audioText: "あまいものがきらいなわけではない",
      targetLevel: "N3",
      correctAnswer: "Không hẳn là / Không có nghĩa là...",
      options: ["Tuyệt đối không bao giờ", "Không hẳn là / Không có nghĩa là...", "Chắc chắn là vì..."],
      correctLane: 1,
      explanation: "〜わけではない dùng để phủ định một phần kết luận cực đoan: 'Không hẳn là tôi ghét đồ ngọt (chỉ là đang ăn kiêng thôi)'.",
    },
    {
      id: "cur_n3_2",
      category: "KANJI",
      questionType: "WORD_TO_MEANING",
      prompt: "Từ Hán tự '緊張' (Khẩn Trương) đọc là gì và nghĩa là gì?",
      subPrompt: "Cảm xúc trước kỳ thi hoặc thuyết trình",
      audioText: "きんちょう",
      targetLevel: "N3",
      correctAnswer: "きんちょう (Hồi hộp, căng thẳng)",
      options: ["きんちょう (Hồi hộp, căng thẳng)", "こんらん (Hỗn loạn)", "けいかい (Cảnh giác)"],
      correctLane: 0,
      explanation: "緊張 (きんちょう - Kinchou) nghĩa là hồi hộp, căng thẳng (không phải 'khẩn trương/nhanh lên' như tiếng Việt!).",
    },
    {
      id: "cur_n3_3",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Mẫu câu '〜にしたがって' mang ý nghĩa gì?",
      subPrompt: "Sự biến đổi tỷ lệ thuận",
      audioText: "たかくなるにしたがって",
      targetLevel: "N3",
      correctAnswer: "Càng... thì càng / Cùng với sự thay đổi...",
      options: ["Mặc dù...", "Càng... thì càng / Cùng với sự thay đổi...", "Thay vì làm..."],
      correctLane: 1,
      explanation: "〜にしたがって (hoặc 〜につれて) diễn tả 2 sự việc biến đổi song hành cùng nhau.",
    },
    {
      id: "cur_n3_4",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "Quán ngữ '足を引っ張る' (Ashi wo hipparu) có nghĩa bóng là gì?",
      subPrompt: "Nghĩa đen: Kéo chân ai đó",
      audioText: "あしをひっぱる",
      targetLevel: "N3",
      correctAnswer: "Làm vướng chân / Cản trở đồng đội",
      options: ["Giúp đỡ nhiệt tình", "Làm vướng chân / Cản trở đồng đội", "Đi bộ đường dài"],
      correctLane: 1,
      explanation: "'足を引っ張る' nghĩa bóng là gây cản trở, kéo lùi thành tích chung của cả nhóm.",
    },
    {
      id: "cur_n3_5",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "Trong phương ngữ Kansai (関西弁), từ 'めっちゃ' và 'おおきに' nghĩa là gì?",
      subPrompt: "Phương ngữ vùng Osaka - Kyoto",
      audioText: "めっちゃおおきに",
      targetLevel: "N3",
      correctAnswer: "Cực kỳ (とても) & Cảm ơn (ありがとう)",
      options: [
        "Cực kỳ (とても) & Cảm ơn (ありがとう)",
        "Tạm biệt & Xin lỗi",
        "Đắt quá & Ngon quá",
      ],
      correctLane: 0,
      explanation: "Trong Kansai-ben: 'めっちゃ' = とても (rất/cực kỳ), còn 'おおきに' = ありがとう (cảm ơn nhiều!).",
    },
    {
      id: "cur_n3_6",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "Thành ngữ 4 chữ '一期一会' (Ichigo Ichie - Nhất kỳ nhất hội) khuyên ta điều gì?",
      subPrompt: "Triết lý Trà đạo Nhật Bản",
      audioText: "いちごいちえ",
      targetLevel: "N3",
      correctAnswer: "Trân trọng từng cuộc gặp gỡ duy nhất trong đời",
      options: [
        "Thất bại 7 lần đứng dậy 8 lần",
        "Trân trọng từng cuộc gặp gỡ duy nhất trong đời",
        "Học một biết mười",
      ],
      correctLane: 1,
      explanation: "'一期一会' (Ichigo Ichie) bắt nguồn từ Trà đạo: mỗi cuộc hội ngộ trong đời chỉ có một lần, hãy đối đãi bằng cả tấm lòng.",
    },
    {
      id: "cur_n3_7",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Phân biệt '〜おかげで' và '〜せいで': Khi nào dùng '〜せいで'?",
      subPrompt: "Nguyên nhân dẫn đến kết quả",
      audioText: "あめのせいで試合が中止になった",
      targetLevel: "N3",
      correctAnswer: "Khi kết quả mang tính tiêu cực, đổ lỗi (Tại vì...)",
      options: [
        "Khi biết ơn kết quả tốt đẹp (Nhờ có...)",
        "Khi kết quả mang tính tiêu cực, đổ lỗi (Tại vì...)",
        "Khi nêu mục đích tương lai",
      ],
      correctLane: 1,
      explanation: "'〜せいで' dùng khi nguyên nhân dẫn đến kết quả xấu (Tại vì mưa mà hủy trận); '〜おかげで' dùng khi kết quả tốt (Nhờ có...).",
    },
    {
      id: "cur_n3_8",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "Cụm từ đệm công sở (クッション言葉) '恐れ入りますが...' dùng khi nào?",
      subPrompt: "Giao tiếp thương mại N3",
      audioText: "おそれいりますが",
      targetLevel: "N3",
      correctAnswer: "Mở đầu lời nhờ vả hoặc hỏi thông tin khách hàng thật lịch sự",
      options: [
        "Dùng để mắng cấp dưới",
        "Mở đầu lời nhờ vả hoặc hỏi thông tin khách hàng thật lịch sự",
        "Dùng khi chào bạn thân",
      ],
      correctLane: 1,
      explanation: "'恐れ入りますが' (Osoreirimasu ga - Xin thứ lỗi vì làm phiền nhưng...) là Cushion Word trang trọng hơn すみませんが.",
    },
    {
      id: "cur_n3_9",
      category: "VOCAB",
      questionType: "WORD_TO_MEANING",
      prompt: "Trong tiếng lóng giới trẻ (若者言葉), từ 'ガチ' (Gachi) tương đương với từ chuẩn nào?",
      subPrompt: "Ví dụ: ガチでやばい！",
      audioText: "ガチ",
      targetLevel: "N3",
      correctAnswer: "本気・本当 (Thật sự / Nghiêm túc 100%)",
      options: [
        "本気・本当 (Thật sự / Nghiêm túc 100%)",
        "嘘 (Nói dối)",
        "少し (Một chút)",
      ],
      correctLane: 0,
      explanation: "'ガチ' xuất phát từ ガチンコ trong môn đấu Sumo, giới trẻ dùng với nghĩa 'thật sự, nghiêm túc' (chỉ dùng thân mật!).",
    },
    {
      id: "cur_n3_10",
      category: "GRAMMAR",
      prompt: "Mẫu câu '〜ついでに' diễn tả hành động như thế nào?",
      subPrompt: "散歩のついでにハガキを出す",
      audioText: "さんぽのついでにハガキをだす",
      targetLevel: "N3",
      correctAnswer: "Nhân tiện làm việc chính thì làm luôn việc phụ",
      options: [
        "Nhân tiện làm việc chính thì làm luôn việc phụ",
        "Bỏ việc chính để làm việc khác",
        "Mặc dù bận vẫn cố làm",
      ],
      correctLane: 0,
      explanation: "V-る/V-た/Nの + ついでに: Nhân tiện có một hành động chính (đi dạo) thì tranh thủ làm thêm việc phụ (gửi bưu thiếp).",
      questionType: "LESSON_GRAMMAR",
    },
    {
      id: "cur_n3_11",
      category: "SENTENCE",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu '雨が 降っている わりに、あまり 寒くない' có nghĩa là gì?",
      subPrompt: "Cấu trúc 〜わりに (ngược với dự tính/tỷ lệ)",
      audioText: "あめがふっているわりにはあまりさむくない",
      targetLevel: "N3",
      correctAnswer: "Dù trời đang mưa nhưng lại không lạnh lắm",
      options: [
        "Vì trời mưa to nên nhiệt độ hạ rất thấp",
        "Dù trời đang mưa nhưng lại không lạnh lắm",
        "Trời tạnh mưa nên không khí ấm áp hẳn",
      ],
      correctLane: 1,
      explanation: "〜わりに (Warini) diễn tả sự tương phản so với mức độ/tiêu chuẩn thông thường (mưa mà không lạnh).",
    },
    {
      id: "cur_n3_12",
      category: "SENTENCE",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Câu '先生のおかげで、JLPTに 合格することが できました' có nghĩa là gì?",
      subPrompt: "Nhờ có 〜おかげで",
      audioText: "せんせいのおかげでにほんごのしけんにごうかくできました",
      targetLevel: "N3",
      correctAnswer: "Nhờ có thầy cô mà tôi đã đỗ kỳ thi JLPT",
      options: [
        "Nhờ có thầy cô mà tôi đã đỗ kỳ thi JLPT",
        "Tại vì thầy cô mà tôi làm bài không tốt",
        "Dù có thầy cô giúp tôi vẫn không đỗ",
      ],
      correctLane: 0,
      explanation: "〜おかげで biểu thị lòng biết ơn vì một sự giúp đỡ mang lại kết quả tốt đẹp.",
    },
    {
      id: "cur_n3_13",
      category: "SENTENCE",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu nào diễn đạt: 'Tôi lỡ để quên ví ở trên tàu điện mất rồi'?",
      subPrompt: "Hối tiếc / lỡ làm V-てしまいました",
      audioText: "でんしゃにさいふをわすれてしまいました",
      targetLevel: "N3",
      correctAnswer: "電車に 財布を 忘れてしまいました",
      options: [
        "電車に 財布を 忘れてしまいました",
        "電車で 財布を 拾いました",
        "財布を 新しく 買い換えました",
      ],
      correctLane: 0,
      explanation: "V-てしまいました diễn tả hành động lỡ xảy ra ngoài ý muốn gây tiếc nuối.",
    },
    {
      id: "cur_n3_14",
      category: "SENTENCE",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Câu nào diễn đạt: 'Càng học tiếng Nhật tôi càng thấy thú vị'?",
      subPrompt: "Càng... càng... 〜ば〜ほど",
      audioText: "にほんごはべんきょうすればするほどおもしろくなります",
      targetLevel: "N3",
      correctAnswer: "日本語は 勉強すればするほど 面白くなります",
      options: [
        "日本語の勉強は もう 諦めました",
        "日本語は 勉強すればするほど 面白くなります",
        "日本語は 難しすぎて 嫌いになりました",
      ],
      correctLane: 1,
      explanation: "Cấu trúc '〜ば〜ほど' (Ba... hodo) diễn tả mối quan hệ tỷ lệ thuận 'càng... càng...'.",
    },
    {
      id: "cur_n3_15",
      category: "VOCAB",
      questionType: "MEANING_TO_WORD",
      prompt: "Từ tiếng Nhật nào có nghĩa là: 'Mối quan hệ'?",
      subPrompt: "Kankei",
      audioText: "かんけい",
      targetLevel: "N3",
      correctAnswer: "かんけい (関係)",
      options: [
        "かんけい (関係)",
        "けいやく (契約 - Hợp đồng)",
        "じょうほう (情報 - Thông tin)",
      ],
      correctLane: 0,
      explanation: "関係 (かんけい - Kankei) là mối quan hệ/liên quan. 契約 là hợp đồng, 情報 là thông tin.",
    },
    {
      id: "cur_n3_16",
      category: "GRAMMAR",
      questionType: "LESSON_GRAMMAR",
      prompt: "Mẫu câu '〜に違いない' (~ Ni chigainai) dùng để diễn đạt điều gì?",
      subPrompt: "Khẳng định phán đoán chắc chắn",
      audioText: "かれがはんにんにちがいない",
      targetLevel: "N3",
      correctAnswer: "Chắc chắn là... (không sai vào đâu được)",
      options: [
        "Chắc chắn là... (không sai vào đâu được)",
        "Có lẽ là không phải",
        "Nghe người khác nói lại",
      ],
      correctLane: 0,
      explanation: "〜に違いない thể hiện sự phán đoán có căn cứ xác thực cao của người nói: 'Chắc chắn là...'.",
    },
  ],
  LISTENING: [
    {
      id: "cur_lis_1",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe phát âm: Chọn nghĩa chính xác của câu vừa nghe!",
      subPrompt: "Nhấn nút loa 🔊 để nghe lại",
      audioText: "ありがとうございます",
      targetLevel: "LISTENING",
      correctAnswer: "Cảm ơn rất nhiều",
      options: ["Xin lỗi vì đã làm phiền", "Cảm ơn rất nhiều", "Hẹn gặp lại ngày mai"],
      correctLane: 1,
      explanation: "Câu vừa nghe là 'ありがとうございます' (Arigatou gozaimasu) = Cảm ơn rất nhiều.",
    },
    {
      id: "cur_lis_2",
      category: "LISTENING",
      questionType: "WORD_TO_MEANING",
      prompt: "Nghe phát âm: Chọn từ vựng tương ứng với âm thanh!",
      subPrompt: "Lắng nghe kỹ âm sắc",
      audioText: "さくら",
      targetLevel: "LISTENING",
      correctAnswer: "桜 (Sakura - Hoa anh đào)",
      options: ["桜 (Sakura - Hoa anh đào)", "魚 (Sakana - Con cá)", "酒 (Sake - Rượu)"],
      correctLane: 0,
      explanation: "Âm thanh phát ra là 'さくら' (Sakura), tức hoa anh đào.",
    },
    {
      id: "cur_lis_3",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe câu nhân viên quán ăn hỏi: Họ đang hỏi bạn điều gì?",
      subPrompt: "Tình huống nhà hàng Nhật",
      audioText: "いらっしゃいませ。なんめいさまですか",
      targetLevel: "LISTENING",
      correctAnswer: "Quý khách đi mấy người ạ?",
      options: ["Quý khách dùng món gì ạ?", "Quý khách đi mấy người ạ?", "Quý khách thanh toán bằng gì ạ?"],
      correctLane: 1,
      explanation: "'いらっしゃいませ。何名様（なんめいさま）ですか？' = Kính chào quý khách, đoàn mình đi mấy người ạ?",
    },
    {
      id: "cur_lis_4",
      category: "LISTENING",
      questionType: "WORD_TO_MEANING",
      prompt: "Nghe phát âm số đếm thuần Nhật: Từ này mang ý nghĩa gì?",
      subPrompt: "Đếm đồ vật thông dụng",
      audioText: "ひとつ",
      targetLevel: "LISTENING",
      correctAnswer: "Một cái (Hitotsu)",
      options: ["Hai cái (Futatsu)", "Một người (Hitori)", "Một cái (Hitotsu)"],
      correctLane: 2,
      explanation: "'ひとつ' (Hitotsu) là cách đếm đồ vật thuần Nhật = 1 cái ('ふたつ' = 2 cái, 'ひとり' = 1 người).",
    },
    {
      id: "cur_lis_5",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe thông báo nhà ga: Tàu đang chuẩn bị làm gì?",
      subPrompt: "Chú ý từ khóa まもなく",
      audioText: "まもなく、いちばんせんにでんしゃがまいります",
      targetLevel: "LISTENING",
      correctAnswer: "Sắp có tàu tiến vào đường ray số 1",
      options: [
        "Tàu ở đường ray số 1 bị hoãn",
        "Sắp có tàu tiến vào đường ray số 1",
        "Chuyến tàu cuối cùng đã rời ga",
      ],
      correctLane: 1,
      explanation: "'まもなく、1番線に電車が参ります' = Chỉ ít phút nữa tàu sẽ tiến vào sân ga số 1.",
    },
    {
      id: "cur_lis_6",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe thu ngân Konbini hỏi: Họ đang hỏi bạn về cái gì?",
      subPrompt: "Tình huống cửa hàng tiện lợi",
      audioText: "おべんとうはあたためますか",
      targetLevel: "LISTENING",
      correctAnswer: "Bạn có cần hâm nóng hộp cơm Bento không?",
      options: [
        "Bạn có lấy túi nilon không?",
        "Bạn có cần hâm nóng hộp cơm Bento không?",
        "Bạn có thẻ tích điểm không?",
      ],
      correctLane: 1,
      explanation: "'お弁当は温めますか (Obentou wa atatamemasu ka)?' = Quý khách có hâm nóng cơm hộp không ạ?",
    },
    {
      id: "cur_lis_7",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe câu hỏi đường: Người nói đang tìm địa điểm nào?",
      subPrompt: "Lắng nghe danh từ đầu câu",
      audioText: "すみません、びょういんはどこですか",
      targetLevel: "LISTENING",
      correctAnswer: "Bệnh viện (病院 - Byouin)",
      options: [
        "Thẩm mỹ viện (美容院 - Biyouin)",
        "Bệnh viện (病院 - Byouin)",
        "Bưu điện (郵便局 - Yuubinkyoku)",
      ],
      correctLane: 1,
      explanation: "'びょういん' (Byouin - có âm ghép và trường âm) là Bệnh viện; còn 'びよういん' (Biyouin) mới là Thẩm mỹ viện/Tiệm làm tóc.",
    },
    {
      id: "cur_lis_8",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe câu kính ngữ công sở: Câu này dùng trong hoàn cảnh nào?",
      subPrompt: "Chào đồng nghiệp sau giờ làm",
      audioText: "おさきにしつれいします",
      targetLevel: "LISTENING",
      correctAnswer: "Xin phép về trước khi tan ca (お先に失礼します)",
      options: [
        "Chào buổi sáng khi mới đến công ty",
        "Xin phép về trước khi tan ca (お先に失礼します)",
        "Chúc mừng năm mới",
      ],
      correctLane: 1,
      explanation: "'お先に失礼します' (Osaki ni shitsurei shimasu) là câu chào lịch sự khi bạn rời văn phòng trước đồng nghiệp.",
    },
    {
      id: "cur_lis_9",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe câu phương ngữ Kyoto/Osaka: Người bán hàng đang nói gì?",
      subPrompt: "Phương ngữ vùng Kansai",
      audioText: "まいどおおきに",
      targetLevel: "LISTENING",
      correctAnswer: "Cảm ơn quý khách đã luôn ủng hộ! (毎度おおきに)",
      options: [
        "Cửa hàng hôm nay đóng cửa",
        "Cảm ơn quý khách đã luôn ủng hộ! (毎度おおきに)",
        "Xin vui lòng xếp hàng",
      ],
      correctLane: 1,
      explanation: "'毎度おおきに' (Maido ookini) là lời cảm ơn thân tình đặc trưng của các tiểu thương vùng Osaka/Kyoto.",
    },
    {
      id: "cur_lis_10",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe bác sĩ dặn dò: Khi nào bạn cần uống thuốc?",
      subPrompt: "Chú ý từ chỉ thời điểm",
      audioText: "しょくごにのんでください",
      targetLevel: "LISTENING",
      correctAnswer: "Uống sau bữa ăn (食後 - Shokugo)",
      options: [
        "Uống trước bữa ăn (食前 - Shokuzen)",
        "Uống sau bữa ăn (食後 - Shokugo)",
        "Uống trước khi đi ngủ (寝る前)",
      ],
      correctLane: 1,
      explanation: "'食後に飲んでください' (Shokugo ni nonde kudasai) = Hãy uống thuốc sau bữa ăn.",
    },
    {
      id: "cur_lis_11",
      category: "LISTENING",
      questionType: "MEANING_TO_WORD",
      prompt: "Nghe phát âm: Chọn từ vựng tiếng Nhật viết đúng!",
      subPrompt: "Nhấn 🔊 để nghe phát âm",
      audioText: "せんせい",
      targetLevel: "LISTENING",
      correctAnswer: "先生 (せんせい)",
      options: ["先生 (せんせい)", "学生 (がくせい)", "医者 (いしゃ)"],
      correctLane: 0,
      explanation: "Âm thanh vừa phát là 'せんせい' (Sensei) = Giáo viên / Thầy cô.",
    },
    {
      id: "cur_lis_12",
      category: "LISTENING",
      questionType: "MEANING_TO_WORD",
      prompt: "Nghe phát âm: Chọn từ Hiragana tương ứng!",
      subPrompt: "Lắng nghe rõ âm tiết",
      audioText: "ありがとう",
      targetLevel: "LISTENING",
      correctAnswer: "ありがとう",
      options: ["ありがとう", "おはよう", "さようなら"],
      correctLane: 0,
      explanation: "Từ phát âm là 'ありがとう' (Arigatou) = Cảm ơn.",
    },
    {
      id: "cur_lis_13",
      category: "LISTENING",
      questionType: "MEANING_TO_WORD",
      prompt: "Nghe phát âm: Chọn mặt chữ Hán tương ứng!",
      subPrompt: "Tên quốc gia",
      audioText: "にほん",
      targetLevel: "LISTENING",
      correctAnswer: "日本 (にほん)",
      options: ["日本 (にほん)", "本日 (ほんじつ)", "毎日 (まいにち)"],
      correctLane: 0,
      explanation: "'にほん' (Nihon) được viết bằng chữ Hán là '日本' (Nhật Bản).",
    },
    {
      id: "cur_lis_14",
      category: "LISTENING",
      questionType: "MEANING_TO_WORD",
      prompt: "Nghe phát âm: Chọn từ Katakana đúng!",
      subPrompt: "Từ mượn thức uống",
      audioText: "コーヒー",
      targetLevel: "LISTENING",
      correctAnswer: "コーヒー",
      options: ["コーヒー", "コーラ", "ケーキ"],
      correctLane: 0,
      explanation: "'コーヒー' (Koohii) = Cà phê.",
    },
    {
      id: "cur_lis_15",
      category: "LISTENING",
      questionType: "WORD_TO_MEANING",
      prompt: "Nghe phát âm: Từ vựng này mang ý nghĩa gì?",
      subPrompt: "Từ chỉ quan hệ con người",
      audioText: "ともだち",
      targetLevel: "LISTENING",
      correctAnswer: "Bạn bè (Tomodachi)",
      options: ["Gia đình", "Bạn bè (Tomodachi)", "Thầy cô"],
      correctLane: 1,
      explanation: "'ともだち' (Tomodachi) = Bạn bè.",
    },
    {
      id: "cur_lis_16",
      category: "LISTENING",
      questionType: "WORD_TO_MEANING",
      prompt: "Nghe phát âm: Từ vựng này có nghĩa là gì?",
      subPrompt: "Bữa ăn trong ngày",
      audioText: "あさごはん",
      targetLevel: "LISTENING",
      correctAnswer: "Bữa ăn sáng (Asagohan)",
      options: ["Bữa ăn sáng (Asagohan)", "Bữa ăn trưa", "Bữa ăn tối"],
      correctLane: 0,
      explanation: "'あさごはん' (Asagohan) = Bữa ăn sáng.",
    },
    {
      id: "cur_lis_17",
      category: "LISTENING",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Nghe câu chào lần đầu gặp mặt: Chọn câu chữ Nhật đúng!",
      subPrompt: "Chào hỏi làm quen",
      audioText: "はじめましてどうぞよろしく",
      targetLevel: "LISTENING",
      correctAnswer: "初めまして、どうぞ よろしく。",
      options: ["初めまして、どうぞ よろしく。", "お名前は 何ですか。", "失礼ですが、どちら様ですか。"],
      correctLane: 0,
      explanation: "'初めまして、どうぞ よろしく' = Rất vui được gặp bạn, xin hãy giúp đỡ tôi.",
    },
    {
      id: "cur_lis_18",
      category: "LISTENING",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Nghe câu chúc ngủ ngon: Chọn câu tiếng Nhật đúng!",
      subPrompt: "Chào buổi tối trước khi ngủ",
      audioText: "おやすみなさい",
      targetLevel: "LISTENING",
      correctAnswer: "おやすみなさい",
      options: ["おやすみなさい", "おはようございます", "こんにちは"],
      correctLane: 0,
      explanation: "'おやすみなさい' (Oyasuminasai) = Chúc ngủ ngon.",
    },
    {
      id: "cur_lis_19",
      category: "LISTENING",
      questionType: "LESSON_GRAMMAR",
      prompt: "Nghe mẫu ngữ pháp: Người nói đang dùng cấu trúc nào?",
      subPrompt: "Động từ chia thể ý chí",
      audioText: "いっしょにいこう",
      targetLevel: "LISTENING",
      correctAnswer: "Thể ý chí (Ý định / Rủ rê thân mật)",
      options: ["Thể ý chí (Ý định / Rủ rê thân mật)", "Thể bị động", "Thể sai khiến"],
      correctLane: 0,
      explanation: "'行こう' (Ikou) là thể ý chí (Volitional form) của 行く, dùng để rủ rê thân mật: Cùng đi nào!",
    },
    {
      id: "cur_lis_20",
      category: "LISTENING",
      questionType: "LESSON_GRAMMAR",
      prompt: "Nghe mẫu ngữ pháp: Câu này dùng để biểu đạt ý gì?",
      subPrompt: "Chú ý đuôi そうです",
      audioText: "あめがふりそうです",
      targetLevel: "LISTENING",
      correctAnswer: "〜そうです (Phỏng đoán sắp xảy ra: Trời sắp mưa)",
      options: ["〜そうです (Phỏng đoán sắp xảy ra: Trời sắp mưa)", "〜そうです (Truyền đạt lại tin đồn)", "〜ようです (Giống như)"],
      correctLane: 0,
      explanation: "V(bỏ masu) + そうです biểu thị điềm báo, phỏng đoán sự việc sắp sửa xảy ra: 雨が降りそうです = Trời trông có vẻ sắp mưa.",
    },
    {
      id: "cur_lis_21",
      category: "LISTENING",
      questionType: "LESSON_GRAMMAR",
      prompt: "Nghe mẫu ngữ pháp: Câu này thể hiện ý nghĩa gì?",
      subPrompt: "Cấm đoán hành động",
      audioText: "たべてはいけません",
      targetLevel: "LISTENING",
      correctAnswer: "〜てはいけません (Cấm đoán không được làm)",
      options: ["〜てはいけません (Cấm đoán không được làm)", "〜てください (Hãy làm)", "〜てもいいです (Được phép làm)"],
      correctLane: 0,
      explanation: "'〜てはいけません' là cấu trúc biểu thị sự cấm đoán: Không được phép làm gì.",
    },
    {
      id: "cur_lis_22",
      category: "LISTENING",
      questionType: "LESSON_GRAMMAR",
      prompt: "Nghe mẫu ngữ pháp: Mẫu câu này biểu đạt điều gì?",
      subPrompt: "Nói về trải nghiệm",
      audioText: "にほんへいったことがあります",
      targetLevel: "LISTENING",
      correctAnswer: "〜たことがあります (Đã từng trải qua / Kinh nghiệm)",
      options: ["〜たことがあります (Đã từng trải qua / Kinh nghiệm)", "〜たいです (Muốn làm)", "〜たほうがいいです (Nên làm)"],
      correctLane: 0,
      explanation: "'V-た ことがあります' diễn tả trải nghiệm trong quá khứ: Tôi đã từng đi Nhật Bản.",
    },
    {
      id: "cur_lis_23",
      category: "LISTENING",
      questionType: "LESSON_GRAMMAR",
      prompt: "Nghe câu trợ từ: Trợ từ trong câu biểu thị điều gì?",
      subPrompt: "がっこうへいきます",
      audioText: "がっこうへいきます",
      targetLevel: "LISTENING",
      correctAnswer: "へ (Chỉ phương hướng di chuyển)",
      options: ["へ (Chỉ phương hướng di chuyển)", "で (Chỉ phương tiện)", "を (Chỉ tân ngữ)"],
      correctLane: 0,
      explanation: "Trợ từ 'へ' (đọc là e) trong '学校へ行きます' chỉ phương hướng hướng tới trường học.",
    },
    {
      id: "cur_lis_24",
      category: "LISTENING",
      questionType: "LESSON_GRAMMAR",
      prompt: "Nghe câu điều kiện: Cấu trúc nào vừa được sử dụng?",
      subPrompt: "あめがふったら",
      audioText: "あめがふったら",
      targetLevel: "LISTENING",
      correctAnswer: "〜たら (Nếu trời mưa / Sau khi)",
      options: ["〜たら (Nếu trời mưa / Sau khi)", "〜なら (Nếu là)", "〜ば (Nếu)"],
      correctLane: 0,
      explanation: "'〜たら' là cấu trúc điều kiện giả định phổ biến: 雨が降ったら = Nếu trời mưa...",
    },
    {
      id: "cur_lis_25",
      category: "LISTENING",
      questionType: "MEANING_TO_WORD",
      prompt: "Nghe số đếm: Chọn số tương ứng!",
      subPrompt: "Sanzen roppyaku",
      audioText: "さんぜんろっぴゃく",
      targetLevel: "LISTENING",
      correctAnswer: "3600 (Sanzen roppyaku)",
      options: ["3600 (Sanzen roppyaku)", "3060", "6300"],
      correctLane: 0,
      explanation: "'さんぜん' (3000) + 'ろっぴゃく' (600) = 3600.",
    },
    {
      id: "cur_lis_26",
      category: "LISTENING",
      questionType: "WORD_TO_MEANING",
      prompt: "Nghe tính từ: Từ này diễn tả tính chất gì?",
      subPrompt: "Tính từ đuôi い",
      audioText: "あたたかい",
      targetLevel: "LISTENING",
      correctAnswer: "Ấm áp (Thời tiết / Cảm giác)",
      options: ["Ấm áp (Thời tiết / Cảm giác)", "Nóng bức", "Lạnh lẽo"],
      correctLane: 0,
      explanation: "'あたたかい' (Atatakai) = Ấm áp.",
    },
    {
      id: "cur_lis_27",
      category: "LISTENING",
      questionType: "WORD_TO_MEANING",
      prompt: "Nghe động từ: Động từ này có nghĩa là gì?",
      subPrompt: "Hành động của giáo viên",
      audioText: "おしえます",
      targetLevel: "LISTENING",
      correctAnswer: "Dạy dỗ / Chỉ bảo (Oshiemasu)",
      options: ["Học tập", "Dạy dỗ / Chỉ bảo (Oshiemasu)", "Nhớ lại"],
      correctLane: 1,
      explanation: "'おしえます' (Oshiemasu) = Dạy học / Chỉ dẫn.",
    },
    {
      id: "cur_lis_28",
      category: "LISTENING",
      questionType: "MEANING_TO_SENTENCE",
      prompt: "Nghe câu nói trong lớp học: Chọn câu tiếng Nhật đúng!",
      subPrompt: "Học sinh muốn hỏi",
      audioText: "しつもんがあります",
      targetLevel: "LISTENING",
      correctAnswer: "質問が あります。(Tôi có câu hỏi.)",
      options: ["質問が あります。(Tôi có câu hỏi.)", "試験が あります。(Có bài thi.)", "宿題を 忘れました。(Quên bài tập.)"],
      correctLane: 0,
      explanation: "'質問があります' (Shitsumon ga arimasu) = Em/Tôi có câu hỏi.",
    },
    {
      id: "cur_lis_29",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe lời cảm thán: Người nói đang cảm thán điều gì?",
      subPrompt: "Khen ngợi",
      audioText: "すごいですね",
      targetLevel: "LISTENING",
      correctAnswer: "Tuyệt vời quá nhỉ! (Ngợi khen, khâm phục)",
      options: ["Nguy hiểm quá!", "Tuyệt vời quá nhỉ! (Ngợi khen, khâm phục)", "Buồn ngủ quá!"],
      correctLane: 1,
      explanation: "'すごいですね' (Sugoi desu ne) = Tuyệt vời quá nhỉ!",
    },
    {
      id: "cur_lis_30",
      category: "LISTENING",
      questionType: "SENTENCE_TO_MEANING",
      prompt: "Nghe câu chào khi ra ngoài: 'いってきます' nghĩa là gì?",
      subPrompt: "Lời chào trước khi rời nhà",
      audioText: "いってきます",
      targetLevel: "LISTENING",
      correctAnswer: "Tôi đi đây / Con đi học đây! (Người đi nói)",
      options: ["Tôi đi đây / Con đi học đây! (Người đi nói)", "Bạn đi nhé (Người ở nhà nói)", "Chào mừng bạn về nhà"],
      correctLane: 0,
      explanation: "'いってきます' (Ittekimasu) = Tôi đi rồi sẽ về nhé (người rời khỏi nhà nói).",
    },
  ],
};

export async function fetchYokaiQuestions(
  level: YokaiLevel,
  count: number = 8,
  mode: YokaiQuestionMode = "ALL"
): Promise<YokaiQuestion[]> {
  try {
    const dbQuestions: YokaiQuestion[] = [];

    if (level === "KANA") {
      const kanaList = await prisma.kana.findMany({
        take: 160,
        select: { id: true, character: true, romaji: true, script: true, kind: true },
      });

      if (kanaList.length >= 6) {
        const shuffled = shuffleArray(kanaList);
        const takeCount = Math.min(Math.max(40, count * 3), shuffled.length);
        for (let i = 0; i < takeCount; i++) {
          const target = shuffled[i];
          const sameGroup = shuffled.filter((k) => k.id !== target.id && k.script === target.script);
          const pool = sameGroup.length >= 2 ? sameGroup : shuffled.filter((k) => k.id !== target.id);
          const distractors = shuffleArray(pool)
            .slice(0, 4)
            .map((d) => d.romaji.toUpperCase());

          const { options, correctLane } = buildThreeOptions(
            target.romaji.toUpperCase(),
            distractors,
            "KA",
            "SHI"
          );

          const scriptLabel = target.script === "KATAKANA" ? "Katakana" : "Hiragana";
          const kindLabel =
            target.kind === "COMBO"
              ? "Âm ghép Yōon"
              : target.kind === "DAKUTEN" || target.kind === "HANDAKUTEN"
              ? "Biến âm"
              : "Cơ bản";

          // Romaji -> Kana (WORD_TO_MEANING)
          dbQuestions.push({
            id: `db_kana_${target.id}`,
            category: "KANA",
            questionType: "WORD_TO_MEANING",
            prompt: `Chữ ${scriptLabel} (${kindLabel}): '${target.character}' đọc là gì?`,
            subPrompt: `Nhận diện chữ ${target.character} (${scriptLabel})`,
            audioText: target.character,
            targetLevel: "KANA",
            correctAnswer: target.romaji.toUpperCase(),
            options,
            correctLane,
            explanation: `Chữ '${target.character}' (${scriptLabel} - ${kindLabel}) phát âm chuẩn là '${target.romaji.toUpperCase()}'.`,
          });

          // Kana -> Romaji inverse question (MEANING_TO_WORD)
          const charDistractors = shuffleArray(pool)
            .slice(0, 4)
            .map((d) => d.character);
          const { options: charOptions, correctLane: charLane } = buildThreeOptions(
            target.character,
            charDistractors,
            "あ",
            "か"
          );
          dbQuestions.push({
            id: `db_kana_rev_${target.id}`,
            category: "KANA",
            questionType: "MEANING_TO_WORD",
            prompt: `Chữ ${scriptLabel} nào phát âm là '${target.romaji.toUpperCase()}'?`,
            subPrompt: `Chọn mặt chữ đúng`,
            audioText: target.character,
            targetLevel: "KANA",
            correctAnswer: target.character,
            options: charOptions,
            correctLane: charLane,
            explanation: `'${target.romaji.toUpperCase()}' được viết bằng chữ ${scriptLabel} là '${target.character}'.`,
          });
        }
      }

      // If user selected grammar or sentence modes on KANA realm, borrow beginner N5 grammar & sentences from DB
      if (mode === "LESSON_GRAMMAR" || mode.startsWith("SENTENCE") || mode === "ALL") {
        const n5GrammarList = await prisma.grammar.findMany({
          where: { level: "N5" },
          take: 30,
          select: {
            id: true,
            title: true,
            meaning: true,
            structure: true,
            commonMistakes: true,
            examples: { take: 2, select: { japanese: true, meaning: true } },
          },
        });

        if (n5GrammarList.length >= 4) {
          const shuffledGrammar = shuffleArray(n5GrammarList);
          for (let i = 0; i < Math.min(20, shuffledGrammar.length); i++) {
            const target = shuffledGrammar[i];
            const distractors = shuffleArray(shuffledGrammar.filter((g) => g.id !== target.id))
              .slice(0, 4)
              .map((g) => g.meaning);
            const { options, correctLane } = buildThreeOptions(
              target.meaning,
              distractors,
              "Diễn tả hành động",
              "Chỉ nơi chốn"
            );

            dbQuestions.push({
              id: `db_kana_g_${target.id}`,
              category: "GRAMMAR",
              questionType: "LESSON_GRAMMAR",
              prompt: `Mẫu ngữ pháp căn bản '${target.title}' có nghĩa là gì?`,
              subPrompt: `Cấu trúc: ${target.structure}`,
              audioText: target.title.replace(/[〜～()（）]/g, ""),
              targetLevel: "KANA",
              correctAnswer: target.meaning,
              options,
              correctLane,
              explanation: `Mẫu '${target.title}' (${target.structure}) mang nghĩa: ${target.meaning}.`,
            });

            if (target.examples && target.examples[0]) {
              const gEx = target.examples[0];
              const distractorMeanings = shuffleArray(
                shuffledGrammar
                  .filter((g) => g.id !== target.id && g.examples[0]?.meaning)
                  .map((g) => g.examples[0]!.meaning)
              ).slice(0, 4);

              const { options: gmOptions, correctLane: gmLane } = buildThreeOptions(
                gEx.meaning,
                distractorMeanings,
                "Xin hãy chờ tôi một chút",
                "Tôi học bài ở nhà"
              );

              dbQuestions.push({
                id: `db_kana_g_sent_${target.id}`,
                category: "SENTENCE",
                questionType: "SENTENCE_TO_MEANING",
                prompt: `Câu tiếng Nhật '${gEx.japanese}' có nghĩa là gì?`,
                subPrompt: `Mẫu câu: ${target.title}`,
                audioText: gEx.japanese,
                targetLevel: "KANA",
                correctAnswer: gEx.meaning,
                options: gmOptions,
                correctLane: gmLane,
                explanation: `Câu '${gEx.japanese}' (${target.title}) nghĩa là: ${gEx.meaning}.`,
              });

              const distractorJpSentences = shuffleArray(
                shuffledGrammar
                  .filter((g) => g.id !== target.id && g.examples[0]?.japanese)
                  .map((g) => g.examples[0]!.japanese)
              ).slice(0, 4);

              const { options: gmsOptions, correctLane: gmsLane } = buildThreeOptions(
                gEx.japanese,
                distractorJpSentences,
                "毎日 日本語を 勉強します",
                "今日は いい 天気です"
              );

              dbQuestions.push({
                id: `db_kana_g_sent_rev_${target.id}`,
                category: "SENTENCE",
                questionType: "MEANING_TO_SENTENCE",
                prompt: `Câu tiếng Nhật nào diễn đạt: '${gEx.meaning}'?`,
                subPrompt: `Cấu trúc: ${target.title}`,
                audioText: gEx.japanese,
                targetLevel: "KANA",
                correctAnswer: gEx.japanese,
                options: gmsOptions,
                correctLane: gmsLane,
                explanation: `'${gEx.meaning}' được diễn đạt bằng: '${gEx.japanese}'.`,
              });
            }
          }
        }
      }
    } else if (level === "N5" || level === "N4" || level === "N3") {
      const [vocabList, kanjiList, grammarList] = await Promise.all([
        prisma.vocabulary.findMany({
          where: { jlptLevel: level },
          take: 100,
          select: {
            id: true,
            word: true,
            kana: true,
            meaning: true,
            romaji: true,
            examples: { take: 2, select: { japanese: true, meaning: true } },
          },
        }),
        prisma.kanji.findMany({
          where: { jlptLevel: level },
          take: 50,
          include: { readings: true },
        }),
        prisma.grammar.findMany({
          where: { level },
          take: 60,
          select: {
            id: true,
            title: true,
            meaning: true,
            structure: true,
            commonMistakes: true,
            examples: { take: 2, select: { japanese: true, meaning: true } },
          },
        }),
      ]);

      // 1. Generate VOCAB questions
      if (vocabList.length >= 4) {
        const cleanedVocab = vocabList.map((v) => {
          const { japanese } = normalizeJapaneseWord(v.word);
          const { meaningVi, hanVietNote } = extractHanVietFromMeaning(v.meaning);
          const formatted = formatJapaneseWithReading(japanese, v.kana);
          return {
            ...v,
            cleanWord: japanese,
            cleanMeaning: meaningVi,
            hanViet: hanVietNote,
            displayWord: formatted,
          };
        });

        const shuffledVocab = shuffleArray(cleanedVocab);
        for (let i = 0; i < Math.min(40, shuffledVocab.length); i++) {
          const target = shuffledVocab[i];
          const distractors = shuffleArray(shuffledVocab.filter((v) => v.id !== target.id))
            .slice(0, 4)
            .map((v) => v.cleanMeaning);
          const { options, correctLane } = buildThreeOptions(
            target.cleanMeaning,
            distractors,
            "Thời gian rảnh",
            "Chuẩn bị trước"
          );
          const firstExample = target.examples[0]?.japanese;

          // Từ -> Nghĩa
          dbQuestions.push({
            id: `db_vocab_wm_${target.id}`,
            category: "VOCAB",
            questionType: "WORD_TO_MEANING",
            prompt: `Từ vựng '${target.cleanWord}' (${target.kana}) có nghĩa là gì?`,
            subPrompt: target.romaji,
            audioText: target.kana || target.cleanWord,
            targetLevel: level,
            correctAnswer: target.cleanMeaning,
            options,
            correctLane,
            explanation: `'${target.cleanWord}' (${target.kana} - ${target.romaji}) nghĩa là: ${target.cleanMeaning}.${
              target.hanViet ? ` Hán Việt: ${target.hanViet}.` : ""
            }${firstExample ? ` Ví dụ: ${firstExample}` : ""}`,
          });

          // Nghĩa -> Từ
          const distractorWords = shuffleArray(shuffledVocab.filter((v) => v.id !== target.id))
            .slice(0, 4)
            .map((v) => v.displayWord);
          const { options: wordOptions, correctLane: wordLane } = buildThreeOptions(
            target.displayWord,
            distractorWords,
            "たべる (食べる)",
            "いく (行く)"
          );
          dbQuestions.push({
            id: `db_vocab_mw_${target.id}`,
            category: "VOCAB",
            questionType: "MEANING_TO_WORD",
            prompt: `Từ tiếng Nhật nào có nghĩa: '${target.cleanMeaning}'?`,
            subPrompt: `Chọn từ vựng đúng`,
            audioText: target.kana || target.cleanWord,
            targetLevel: level,
            correctAnswer: target.displayWord,
            options: wordOptions,
            correctLane: wordLane,
            explanation: `Nghĩa '${target.cleanMeaning}' trong tiếng Nhật là '${target.displayWord}' (${target.romaji}).${
              target.hanViet ? ` Hán Việt: ${target.hanViet}.` : ""
            }`,
          });

          // Câu ví dụ của từ vựng (Sentence to meaning & Meaning to sentence)
          if (target.examples && target.examples[0]) {
            const ex = target.examples[0];
            const distractorSentences = shuffleArray(
              shuffledVocab
                .filter((v) => v.id !== target.id && v.examples[0]?.meaning)
                .map((v) => v.examples[0]!.meaning)
            ).slice(0, 4);

            const { options: smOptions, correctLane: smLane } = buildThreeOptions(
              ex.meaning,
              distractorSentences,
              "Mỗi ngày tôi học tiếng Nhật",
              "Hôm nay trời rất đẹp"
            );

            dbQuestions.push({
              id: `db_sentence_sm_${target.id}`,
              category: "SENTENCE",
              questionType: "SENTENCE_TO_MEANING",
              prompt: `Câu ví dụ '${ex.japanese}' có nghĩa là gì?`,
              subPrompt: `Chứa từ vựng '${target.cleanWord}' (${target.cleanMeaning})`,
              audioText: ex.japanese,
              targetLevel: level,
              correctAnswer: ex.meaning,
              options: smOptions,
              correctLane: smLane,
              explanation: `Câu '${ex.japanese}' có nghĩa: '${ex.meaning}' (từ khóa: ${target.cleanWord}).`,
            });

            // Nghĩa -> Câu Nhật
            const distractorJpSentences = shuffleArray(
              shuffledVocab
                .filter((v) => v.id !== target.id && v.examples[0]?.japanese)
                .map((v) => v.examples[0]!.japanese)
            ).slice(0, 4);

            const { options: msOptions, correctLane: msLane } = buildThreeOptions(
              ex.japanese,
              distractorJpSentences,
              "毎日 日本語を 勉強します",
              "今日は 天気が いいです"
            );

            dbQuestions.push({
              id: `db_sentence_ms_${target.id}`,
              category: "SENTENCE",
              questionType: "MEANING_TO_SENTENCE",
              prompt: `Câu tiếng Nhật nào diễn đạt: '${ex.meaning}'?`,
              subPrompt: `Ứng dụng từ '${target.cleanWord}'`,
              audioText: ex.japanese,
              targetLevel: level,
              correctAnswer: ex.japanese,
              options: msOptions,
              correctLane: msLane,
              explanation: `Diễn đạt ý '${ex.meaning}' bằng tiếng Nhật: '${ex.japanese}'.`,
            });
          }
        }
      }

      // 2. Generate KANJI questions
      if (kanjiList.length >= 4) {
        const cleanedKanjiList = kanjiList.map((k) => {
          const parsed = parseKanjiMeaningAndHanViet(k.meaning);
          return {
            ...k,
            cleanMeaning: parsed.meaningVi,
            hanViet: parsed.hanViet,
          };
        });
        const shuffledKanji = shuffleArray(cleanedKanjiList);
        for (let i = 0; i < Math.min(30, shuffledKanji.length); i++) {
          const target = shuffledKanji[i];
          const distractors = shuffleArray(shuffledKanji.filter((k) => k.id !== target.id))
            .slice(0, 4)
            .map((k) => k.cleanMeaning);
          const { options, correctLane } = buildThreeOptions(
            target.cleanMeaning,
            distractors,
            "Sự chuyển động",
            "Phương hướng"
          );

          const readingSummary = target.readings
            .slice(0, 3)
            .map((r) => r.reading)
            .join(" / ");

          // Từ -> Nghĩa (WORD_TO_MEANING)
          dbQuestions.push({
            id: `db_kanji_${target.id}`,
            category: "KANJI",
            questionType: "WORD_TO_MEANING",
            prompt: `Hán tự '${target.character}' (${level}) mang ý nghĩa gì?`,
            subPrompt: readingSummary ? `Cách đọc: ${readingSummary}` : `Số nét: ${target.strokeCount}`,
            audioText: target.character,
            targetLevel: level,
            correctAnswer: target.cleanMeaning,
            options,
            correctLane,
            explanation: `Hán tự '${target.character}' nghĩa là '${target.cleanMeaning}'${
              target.hanViet ? ` (Hán Việt: ${target.hanViet})` : ""
            }${readingSummary ? ` (Âm đọc: ${readingSummary})` : ""}.`,
          });

          // Nghĩa -> Hán tự (MEANING_TO_WORD)
          const charDistractors = shuffleArray(shuffledKanji.filter((k) => k.id !== target.id))
            .slice(0, 4)
            .map((k) => k.character);
          const { options: charOptions, correctLane: charLane } = buildThreeOptions(
            target.character,
            charDistractors,
            "日",
            "本"
          );
          dbQuestions.push({
            id: `db_kanji_mw_${target.id}`,
            category: "KANJI",
            questionType: "MEANING_TO_WORD",
            prompt: `Hán tự nào mang ý nghĩa: '${target.cleanMeaning}'?`,
            subPrompt: readingSummary ? `Gợi ý âm đọc: ${readingSummary}` : `Cấp độ ${level}`,
            audioText: target.character,
            targetLevel: level,
            correctAnswer: target.character,
            options: charOptions,
            correctLane: charLane,
            explanation: `Ý nghĩa '${target.cleanMeaning}' được viết bằng chữ Hán '${target.character}'${
              target.hanViet ? ` (Hán Việt: ${target.hanViet})` : ""
            }${readingSummary ? ` (Âm đọc: ${readingSummary})` : ""}.`,
          });
        }
      }

      // 3. Generate GRAMMAR questions (Bidirectional & examples tagged with category GRAMMAR)
      if (grammarList.length >= 4) {
        const shuffledGrammar = shuffleArray(grammarList);
        for (let i = 0; i < Math.min(40, shuffledGrammar.length); i++) {
          const target = shuffledGrammar[i];
          const distractors = shuffleArray(shuffledGrammar.filter((g) => g.id !== target.id))
            .slice(0, 4)
            .map((g) => g.meaning);
          const { options, correctLane } = buildThreeOptions(
            target.meaning,
            distractors,
            "Diễn tả giả định",
            "Nêu nguyên nhân"
          );

          // 3a. Mẫu ngữ pháp -> Nghĩa
          dbQuestions.push({
            id: `db_grammar_${target.id}`,
            category: "GRAMMAR",
            questionType: "LESSON_GRAMMAR",
            prompt: `Mẫu ngữ pháp '${target.title}' dùng để diễn đạt ý nào?`,
            subPrompt: `Cấu trúc: ${target.structure}`,
            audioText: target.title.replace(/[〜～()（）]/g, ""),
            targetLevel: level,
            correctAnswer: target.meaning,
            options,
            correctLane,
            explanation: `Mẫu '${target.title}' (${target.structure}): ${target.meaning}${
              target.commonMistakes ? ` | Lưu ý: ${target.commonMistakes}` : ""
            }`,
          });

          // 3b. Nghĩa -> Mẫu ngữ pháp (Reverse)
          const distractorTitles = shuffleArray(shuffledGrammar.filter((g) => g.id !== target.id))
            .slice(0, 4)
            .map((g) => g.title);
          const { options: titleOptions, correctLane: titleLane } = buildThreeOptions(
            target.title,
            distractorTitles,
            "〜てください",
            "〜てもいいです"
          );

          dbQuestions.push({
            id: `db_grammar_rev_${target.id}`,
            category: "GRAMMAR",
            questionType: "LESSON_GRAMMAR",
            prompt: `Ý nghĩa '${target.meaning}' tương ứng với mẫu ngữ pháp nào?`,
            subPrompt: `Cấu trúc: ${target.structure}`,
            audioText: target.title.replace(/[〜～()（）]/g, ""),
            targetLevel: level,
            correctAnswer: target.title,
            options: titleOptions,
            correctLane: titleLane,
            explanation: `Để diễn đạt ý '${target.meaning}', dùng mẫu '${target.title}' (${target.structure}).`,
          });

          // 3c. Grammar sentence examples (Tagged as category GRAMMAR so LESSON_GRAMMAR and SENTENCE_* both match!)
          if (target.examples && target.examples.length > 0) {
            for (let exIdx = 0; exIdx < Math.min(2, target.examples.length); exIdx++) {
              const gEx = target.examples[exIdx];
              const distractorMeanings = shuffleArray(
                shuffledGrammar
                  .filter((g) => g.id !== target.id && g.examples[exIdx]?.meaning)
                  .map((g) => g.examples[exIdx]!.meaning)
              ).slice(0, 4);

              const { options: gmOptions, correctLane: gmLane } = buildThreeOptions(
                gEx.meaning,
                distractorMeanings,
                "Xin hãy chờ tôi một chút",
                "Vì trời mưa nên tôi ở nhà"
              );

              dbQuestions.push({
                id: `db_g_sentence_${target.id}_${exIdx}`,
                category: "SENTENCE",
                questionType: "SENTENCE_TO_MEANING",
                prompt: `Câu ngữ pháp '${gEx.japanese}' có nghĩa là gì?`,
                subPrompt: `Mẫu câu: ${target.title}`,
                audioText: gEx.japanese,
                targetLevel: level,
                correctAnswer: gEx.meaning,
                options: gmOptions,
                correctLane: gmLane,
                explanation: `Câu '${gEx.japanese}' (${target.title}) nghĩa là: ${gEx.meaning}.`,
              });

              // Nghĩa -> Câu ví dụ ngữ pháp (MEANING_TO_SENTENCE)
              const distractorJpSentences = shuffleArray(
                shuffledGrammar
                  .filter((g) => g.id !== target.id && g.examples[exIdx]?.japanese)
                  .map((g) => g.examples[exIdx]!.japanese)
              ).slice(0, 4);
              const { options: gmsOptions, correctLane: gmsLane } = buildThreeOptions(
                gEx.japanese,
                distractorJpSentences,
                "先生、質問があります",
                "日本語の勉強を続けます"
              );
              dbQuestions.push({
                id: `db_g_sentence_ms_${target.id}_${exIdx}`,
                category: "SENTENCE",
                questionType: "MEANING_TO_SENTENCE",
                prompt: `Câu tiếng Nhật nào diễn đạt: '${gEx.meaning}'?`,
                subPrompt: `Sử dụng cấu trúc: ${target.title}`,
                audioText: gEx.japanese,
                targetLevel: level,
                correctAnswer: gEx.japanese,
                options: gmsOptions,
                correctLane: gmsLane,
                explanation: `Diễn đạt ý '${gEx.meaning}' (${target.title}) bằng tiếng Nhật: '${gEx.japanese}'.`,
              });
            }
          }
        }
      }
    } else if (level === "LISTENING") {
      const [vocabList, grammarList] = await Promise.all([
        prisma.vocabulary.findMany({
          where: { jlptLevel: { in: ["N5", "N4"] } },
          take: 60,
          select: { id: true, word: true, kana: true, meaning: true, romaji: true },
        }),
        prisma.grammar.findMany({
          where: { level: { in: ["N5", "N4"] } },
          take: 30,
          select: {
            id: true,
            title: true,
            meaning: true,
            structure: true,
            examples: { take: 2, select: { japanese: true, meaning: true } },
          },
        }),
      ]);

      if (vocabList.length >= 6) {
        const shuffled = shuffleArray(vocabList);
        const takeCount = Math.min(Math.max(30, count * 3), shuffled.length);
        for (let i = 0; i < takeCount; i++) {
          const target = shuffled[i];
          const distractors = shuffleArray(shuffled.filter((v) => v.id !== target.id))
            .slice(0, 4)
            .map((v) => v.meaning);
          const { options, correctLane } = buildThreeOptions(
            target.meaning,
            distractors,
            "Hẹn gặp lại",
            "Cảm ơn nhiều"
          );

          dbQuestions.push({
            id: `db_lis_wm_${target.id}`,
            category: "LISTENING",
            questionType: "WORD_TO_MEANING",
            prompt: `Nghe phát âm (${target.romaji}): Từ bạn vừa nghe có nghĩa là gì?`,
            subPrompt: "Nhấn 🔊 để nghe lại phát âm chuẩn",
            audioText: target.kana || target.word,
            targetLevel: "LISTENING",
            correctAnswer: target.meaning,
            options,
            correctLane,
            explanation: `Âm thanh vừa phát là '${target.word}' (${target.kana} - ${target.romaji}), nghĩa là: ${target.meaning}.`,
          });

          // Nghe -> Chọn chữ viết (MEANING_TO_WORD)
          const distractorWords = shuffleArray(shuffled.filter((v) => v.id !== target.id))
            .slice(0, 4)
            .map((v) => `${v.word} (${v.kana})`);
          const { options: wOptions, correctLane: wLane } = buildThreeOptions(
            `${target.word} (${target.kana})`,
            distractorWords,
            "ともだち (友達)",
            "がくせい (学生)"
          );
          dbQuestions.push({
            id: `db_lis_mw_${target.id}`,
            category: "LISTENING",
            questionType: "MEANING_TO_WORD",
            prompt: `Nghe phát âm: Từ nào mang ý nghĩa '${target.meaning}'?`,
            subPrompt: "Nhấn 🔊 để nghe lại",
            audioText: target.kana || target.word,
            targetLevel: "LISTENING",
            correctAnswer: `${target.word} (${target.kana})`,
            options: wOptions,
            correctLane: wLane,
            explanation: `Phát âm '${target.kana}' tương ứng với chữ: '${target.word}' (${target.meaning}).`,
          });
        }
      }

      // Generate listening questions from grammar examples
      if (grammarList.length >= 4) {
        const shuffledG = shuffleArray(grammarList);
        for (let i = 0; i < Math.min(20, shuffledG.length); i++) {
          const target = shuffledG[i];
          if (target.examples && target.examples[0]) {
            const ex = target.examples[0];
            const distractorMeanings = shuffleArray(
              shuffledG
                .filter((g) => g.id !== target.id && g.examples[0]?.meaning)
                .map((g) => g.examples[0]!.meaning)
            ).slice(0, 4);

            const { options: gmOptions, correctLane: gmLane } = buildThreeOptions(
              ex.meaning,
              distractorMeanings,
              "Xin hãy chờ tôi một chút",
              "Hôm nay trời rất đẹp"
            );

            dbQuestions.push({
              id: `db_lis_g_sm_${target.id}`,
              category: "LISTENING",
              questionType: "SENTENCE_TO_MEANING",
              prompt: `Nghe câu thoại (${target.title}): Câu vừa nghe có nghĩa là gì?`,
              subPrompt: `Mẫu ngữ pháp: ${target.title}`,
              audioText: ex.japanese,
              targetLevel: "LISTENING",
              correctAnswer: ex.meaning,
              options: gmOptions,
              correctLane: gmLane,
              explanation: `Câu vừa nghe: '${ex.japanese}' mang nghĩa '${ex.meaning}'.`,
            });

            dbQuestions.push({
              id: `db_lis_grammar_${target.id}`,
              category: "LISTENING",
              questionType: "LESSON_GRAMMAR",
              prompt: `Nghe cấu trúc '${target.title}': Mẫu câu này diễn đạt ý gì?`,
              subPrompt: `Nhấn 🔊 để nghe cấu trúc`,
              audioText: ex.japanese,
              targetLevel: "LISTENING",
              correctAnswer: target.meaning,
              options: gmOptions,
              correctLane: gmLane,
              explanation: `Câu '${ex.japanese}' ứng dụng mẫu '${target.title}': ${target.meaning}.`,
            });
          }
        }
      }
    }

    // Blend DB questions with curated questions
    const curated = CURATED_QUESTIONS[level] || CURATED_QUESTIONS.N5;

    // Filter by requested question mode
    const filteredDb = dbQuestions.filter((q) => matchesMode(q, mode));
    const filteredCurated = curated.filter((q) => matchesMode(q, mode));

    let pool = shuffleArray([...filteredDb, ...filteredCurated]);

    // Anti-Repetition & Smart Borrowing:
    // If pool has fewer items than requested count for this specific mode:
    // Borrow matching questions from adjacent levels (SAME MODE!) to guarantee variety without mode contamination!
    if (pool.length < count) {
      const fallbackLevels: YokaiLevel[] =
        level === "KANA"
          ? ["N5", "N4"]
          : level === "LISTENING"
          ? ["N5", "N4", "N3"]
          : level === "N5"
          ? ["KANA", "N4"]
          : level === "N4"
          ? ["N5", "N3"]
          : ["N4", "N5"];

      for (const fbLevel of fallbackLevels) {
        const fbCurated = (CURATED_QUESTIONS[fbLevel] || []).filter((q) => matchesMode(q, mode));
        for (const fq of shuffleArray(fbCurated)) {
          if (!pool.some((p) => p.prompt === fq.prompt)) {
            pool.push(fq);
            if (pool.length >= count * 2) break;
          }
        }
        if (pool.length >= count * 2) break;
      }
    }

    // Strict Mode Enforcement fallback: If pool is STILL empty because of an unusual filter combination
    if (pool.length === 0) {
      pool = shuffleArray([...dbQuestions, ...curated]);
    }

    const seenPrompts = new Set<string>();
    const deduplicated: YokaiQuestion[] = [];

    for (const q of pool) {
      if (!seenPrompts.has(q.prompt)) {
        seenPrompts.add(q.prompt);
        deduplicated.push(q);
      }
      if (deduplicated.length >= count) break;
    }

    // If deduplicated matching pool STILL has fewer items than requested count,
    // repeat items from the matching pool to reach count WITHOUT mixing in conflicting question modes.
    if (deduplicated.length > 0 && deduplicated.length < count) {
      const originalMatches = [...deduplicated];
      let repeatIndex = 0;
      while (deduplicated.length < count) {
        const item = originalMatches[repeatIndex % originalMatches.length];
        deduplicated.push({
          ...item,
          id: `${item.id}_rep_${deduplicated.length}`,
        });
        repeatIndex++;
      }
    }

    return deduplicated;
  } catch (err) {
    console.error("Error generating Yokai Dash questions:", err);
    const fallback = CURATED_QUESTIONS[level] || CURATED_QUESTIONS.N5;
    const filtered = fallback.filter((q) => matchesMode(q, mode));
    const validFallback = filtered.length > 0 ? filtered : fallback;
    const pool = shuffleArray(validFallback);
    const result: YokaiQuestion[] = [];
    let idx = 0;
    while (result.length < count && pool.length > 0) {
      result.push(pool[idx % pool.length]);
      idx++;
    }
    return result;
  }
}
