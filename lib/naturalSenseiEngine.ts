// Natural Japanese Conversational Dialogue Engine (Context-Aware Kaiwa Simulator & Learning Assistant)
// Speaks authentic, warm Japanese with personalized learning recommendations, mistakes remediation, and multi-language translations.

import type { NativeLanguage } from "@/components/LanguageContext";
import type { UserMistakeSummary } from "@/lib/learningMistakes";

export interface DialogueContext {
  scenarioId?: string;
  userMessage: string;
  userProgress?: {
    userLevel?: string;
    level?: number;
    totalXP?: number;
    currentStreak?: number;
    completedLessonsCount?: number;
    totalLessonsInLevel?: number;
    dueReviewCount?: number;
    accuracyPercent?: number;
  } | null;
  mistakes?: UserMistakeSummary | null;
  nativeLanguage?: NativeLanguage;
}

const LANGUAGE_NAMES: Record<NativeLanguage, string> = {
  vi: "Tiếng Việt",
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  id: "Bahasa Indonesia",
  th: "ภาษาไทย",
  ru: "Русский",
  pt: "Português",
};

export function getLanguageName(lang?: NativeLanguage): string {
  if (!lang) return "Tiếng Việt";
  return LANGUAGE_NAMES[lang] || "Tiếng Việt";
}

export function generateNaturalJapaneseResponse({
  scenarioId = "free_kaiwa",
  userMessage,
  userProgress,
  mistakes,
  nativeLanguage = "vi",
}: DialogueContext): string {
  const msg = userMessage.trim();
  const lower = msg.toLowerCase();
  const isEn = nativeLanguage === "en";
  const langName = getLanguageName(nativeLanguage);

  // 0. MISTAKES & WEAK POINTS REMEDIATION (Kiểm soát lỗi sai & hướng dẫn khắc phục)
  if (
    /(?:lỗi sai|sửa sai|sửa lỗi|làm sai|chỗ sai|chữa lỗi|sai sót|điểm yếu|khắc phục|sai chỗ nào|hay sai|tại sao sai|mistake|wrong|weak point|weakness|error|fix|错题|错在哪里|틀린|오답|erro|fehle)/i.test(
      msg
    ) ||
    scenarioId === "mistakes_remedy"
  ) {
    if (mistakes && mistakes.totalMistakesCount > 0) {
      const vocabList = mistakes.weakVocab.slice(0, 3).map(
        (v) => `• **${v.word}** (${v.kana}) [${v.romaji}]: nghĩa là "${v.meaning}"`
      ).join("\n");

      const failedEx = mistakes.failedExercises[0];
      const exSample = failedEx
        ? `\n\n📌 **Câu bài tập bạn vừa làm sai gần đây:**\n- *Câu hỏi:* "${failedEx.question}"\n- *Bạn đã chọn:* ~~"${failedEx.userAnswer}"~~ ❌\n- *Đáp án chuẩn xác:* **"${failedEx.correctAnswer}"** ✔️\n*(Sensei giải thích: Hãy chú ý cấu trúc và ngữ cảnh của câu để không bị nhầm lẫn nhé!)*`
        : "";

      if (isEn) {
        return `Sensei noticed a few weak spots in your recent reviews: 🌸\n\n${
          vocabList ? `**Words that need reinforcement:**\n${vocabList}\n` : ""
        }${exSample}\n\n**Sensei's Tip:** Repetition right before you forget is the key! Let's try 1 quick practice: What is the meaning or reading of one of these words? Reply right here and I'll grade it for you!`;
      }

      return `Sensei đã rà soát các bài tập và thẻ ôn gần đây của bạn nè: 🌸\n\n${
        vocabList ? `**Các từ vựng bạn hay nhầm hoặc quên:**\n${vocabList}\n` : ""
      }${exSample}\n\n**Mẹo khắc phục từ Sensei:**\nKhi gặp từ khó, hãy đặt câu với từ đó trong ngữ cảnh đời thường để nhớ lâu hơn! Bạn có muốn cùng Sensei làm 1 câu đố nhỏ để ôn lại ngay các điểm trên không? Hãy trả lời Sensei nhé! ✨`;
    }

    if (isEn) {
      return `Awesome news! Sensei checked your records and found **no recent critical mistakes or weak cards**! ✨ Your accuracy is solid. Keep moving forward on your [Learning Path](/app/path)!`;
    }
    return `Tin vui đây! Sensei đã kiểm tra và thấy **bạn không có lỗi sai nào chưa xử lý**! ✨ Tỷ lệ làm bài của bạn đang rất chuẩn xác. Hãy tiếp tục giữ vững phong độ bằng bài học tiếp theo trên [Lộ trình](/app/path) nhé!`;
  }

  // 1. PROGRESS, STUDY ADVICE & TUTOR ASSISTANCE (Trợ lý học tập & tiến trình)
  if (
    /(?:hôm nay học gì|học gì|tiến độ|tiến trình|srs|thẻ ôn|lời khuyên|gợi ý|thống kê|kế hoạch|what should i study|study advice|my progress|review cards|今天学什么|오늘 뭐 공부해)/i.test(
      msg
    ) ||
    scenarioId === "assistant_guide"
  ) {
    const level = userProgress?.userLevel || "N5";
    const pLevel = userProgress?.level || 1;
    const xp = userProgress?.totalXP ?? 0;
    const streak = userProgress?.currentStreak ?? 0;
    const due = userProgress?.dueReviewCount ?? 0;
    const completed = userProgress?.completedLessonsCount ?? 0;
    const totalLessons = userProgress?.totalLessonsInLevel ?? 50;

    if (isEn) {
      return `Konnichiwa! Sensei has reviewed your Nihon Quest learning profile: 🌸✨
- **Current JLPT:** Level ${level} (Tier ${pLevel})
- **Total XP:** ${xp} XP | **Daily Streak:** 🔥 ${streak} days
- **Curriculum Lessons:** ${completed}/${totalLessons} completed
- **SRS Flashcards:** ${due > 0 ? `⏰ **${due} cards** due for review today!` : "✨ All caught up for today!"}

**Sensei's Personal Recommendation:**
${
  due > 0
    ? `1. First, spend 5-10 minutes on [Spaced Repetition Review](/app/review) to clear your ${due} due cards so they lock into long-term memory!\n2. Next, tackle the next lesson on your [Learning Path](/app/path)!\n3. Ask me if you want me to explain any grammar point, check mistakes, or test your Japanese.`
    : `1. You have zero review backlog—fantastic discipline! Keep up the momentum with a new lesson in your [Learning Path](/app/path).\n2. Practice conversational fluency with me right here by replying in Japanese!`
}
*(Keep going! Ganbatte kudasai! 🎌)*`;
    }

    return `Konnichiwa! Sensei đã kiểm tra hồ sơ học tập của bạn rồi nè: 🌸✨
- **Cấp độ JLPT:** Trình độ ${level} (Level ${pLevel})
- **Điểm tích lũy:** ${xp.toLocaleString("vi-VN")} XP | **Chuỗi Streak:** 🔥 ${streak} ngày
- **Bài học giáo trình:** Đã hoàn thành ${completed}/${totalLessons} bài
- **Ôn tập SRS:** ${due > 0 ? `⏰ Đang có **${due} thẻ từ vựng** đến hạn ôn tập hôm nay!` : "✨ Bạn đã ôn tập sạch sẽ các thẻ hôm nay rồi!"}

**Lời khuyên học tập từ Sensei hôm nay:**
${
  due > 0
    ? `1. Dành ngay 5-10 phút vào mục [Ôn tập Flashcard SRS](/app/review) để giải quyết ${due} thẻ đến hạn, giúp từ vựng ghi nhớ sâu vào tiềm thức!\n2. Học tiếp 1 bài học mới trong [Lộ trình](/app/path).\n3. Nếu có lỗi sai hay mẫu câu nào chưa hiểu, hãy bấm nút "Khắc phục lỗi sai" hoặc gõ câu hỏi để Sensei phân tích cặn kẽ cho bạn nhé!`
    : `1. Không có thẻ từ vựng nào bị nợ—tinh thần học của bạn quá tuyệt vời! Hãy duy trì chuỗi Streak bằng cách học 1 bài mới trong [Lộ trình](/app/path).\n2. Luyện phản xạ đối thoại tiếng Nhật ngay tại đây cùng Sensei nhé!`
}
*(一緒に頑張りましょう！ Hãy cùng nhau cố gắng nhé! 🎌)*`;
  }

  // 2. GREETINGS & TIME OF DAY (Chào hỏi thời gian)
  if (/^(?:こんばんは|こんばんわ|konbanwa|chào buổi tối|good evening|晚上好|안녕하세요)/i.test(msg)) {
    if (scenarioId === "business_horenso") {
      return "こんばんは！遅くまでお疲れ様です。今日の業務の進捗状況はどうですか？何か報告や相談があればいつでもどうぞ！💼\n\n*(Chào buổi tối! Làm việc đến muộn thế này vất vả cho bạn quá. Tiến độ công việc hôm nay thế nào rồi? Nếu có báo cáo hay thảo luận gì bạn cứ nói nhé!)*";
    }
    if (scenarioId === "casual_friends") {
      return "こんばんは〜！今日も一日お疲れ！夜遅くまで日本語の勉強えらいね〜。今日はどんな一日だった？✨\n\n*(Chào buổi tối nè~! Hôm nay vất vả cả ngày rồi nhỉ! Đêm muộn thế này mà vẫn chăm học tiếng Nhật, đỉnh thật đấy. Hôm nay ngày của cậu thế nào?)*";
    }
    return "こんばんは！今日も一日お疲れ様でした。夜の日本語練習、素晴らしいですね！🌙\n今日はどんな一日でしたか？何か楽しいことはありましたか？🌸\n\n*(Chào buổi tối! Hôm nay bạn đã vất vả cả ngày rồi. Luyện tập tiếng Nhật vào buổi tối thật tuyệt vời! Hôm nay ngày của bạn thế nào? Có chuyện gì vui không?)*";
  }

  if (/^(?:こんにちは|こんにちわ|konnichiwa|chào|xin chào|hello|hi|你好|안녕)/i.test(msg)) {
    if (scenarioId === "casual_friends") {
      return "やっほー！こんにちは！今日も会えて嬉しいよ〜。最近なんか面白いことあった？☕\n\n*(Hé lô! Chào cậu nhé! Hôm nay lại được gặp cậu vui quá. Dạo gần đây có chuyện gì vui hay ho không?)*";
    }
    if (scenarioId === "business_horenso") {
      return "こんにちは！お疲れ様です。お忙しいところ恐れ入りますが、本日の進捗についてお聞かせいただけますでしょうか？💼\n\n*(Xin chào bạn! Hôm nay bạn vất vả rồi. Xin phép làm phiền lúc bạn đang bận, bạn có thể chia sẻ về tiến độ công việc hôm nay được không ạ?)*";
    }
    return "こんにちは！お会いできて嬉しいです。今日も一緒に楽しく日本語を話しましょう！🌸\n今、何をしていますか？\n\n*(Xin chào bạn! Rất vui được gặp bạn. Hôm nay chúng ta hãy cùng nhau trò chuyện tiếng Nhật thật vui nhé! Bây giờ bạn đang làm gì đấy?)*";
  }

  if (/^(?:おはよう|おはようございます|ohayou|chào buổi sáng|good morning|早上好|좋은 아침)/i.test(msg)) {
    return "おはようございます！🌅 朝から日本語の練習を始めるなんて、本当に素晴らしい向上心ですね！今日もいい一日にしましょうね。朝ごはんはもう食べましたか？\n\n*(Chào buổi sáng! Bắt đầu luyện tiếng Nhật ngay từ sáng sớm thế này, tinh thần học tập của bạn thật tuyệt vời! Chúc bạn một ngày tốt lành nhé. Bạn đã ăn sáng chưa?)*";
  }

  if (/(?:おやすみ|お休みなさい|oyasumi|ngủ ngon|đi ngủ|good night|晚安|잘 자)/i.test(msg)) {
    return "今日もたくさん練習しましたね！本当にお疲れ様でした。ゆっくり休んで、いい夢を見てくださいね。おやすみなさい〜！⭐💤\n\n*(Hôm nay bạn đã luyện tập rất nhiều rồi! Vất vả cho bạn rồi. Hãy nghỉ ngơi thật thoải mái và có những giấc mơ đẹp nhé. Chúc bạn ngủ ngon~!)*";
  }

  // 3. GRATITUDE & POLITE SOCIAL RESPONSES (Cảm ơn, xin lỗi)
  if (/(?:ありがとう|感謝|cảm ơn|thank|谢谢|고마워)/i.test(msg)) {
    return "どういたしまして！こちらこそ、いつも一生懸命練習してくれて嬉しいです。😊 他にも気になるフレーズや話したいことがあれば、何でも気軽に言ってくださいね！🌸\n\n*(Không có chi! Sensei mới là người phải cảm ơn vì bạn luôn chăm chỉ luyện tập. Nếu còn cụm từ nào thắc mắc hay muốn trò chuyện đề tài gì, cứ tự nhiên nói nhé!)*";
  }

  if (/(?:お疲れ様|おつかれ|vất vả rồi)/i.test(msg)) {
    return "お疲れ様です！優しいお言葉をありがとうございます。あなたも毎日のお仕事や勉強、本当にお疲れ様です！お茶でも飲んで一息つきましょうね。🍵\n\n*(Bạn cũng vất vả rồi! Cảm ơn lời hỏi thăm ấm áp của bạn. Bạn học tập và làm việc mỗi ngày cũng vất vả lắm rồi! Hãy uống chút trà nghỉ ngơi nhé.)*";
  }

  // 4. EMOTIONS & PHYSICAL STATES
  if (/(?:疲れた|つかれた|mệt|mệt mỏi|tired|累|피곤)/i.test(msg)) {
    return "お疲れ様です！今日はいろいろ大変だったんですね… 無理をしないでくださいね。少し肩の力を抜いて、リラックスしながらお話ししましょう。今日は何が一番大変でしたか？🍀\n\n*(Vất vả cho bạn quá! Hôm nay chắc có nhiều việc mệt mỏi lắm nhỉ... Đừng gượng ép quá nhé. Thả lỏng vai một chút và trò chuyện thư giãn cùng tôi nào. Hôm nay điều gì làm bạn vất vả nhất?)*";
  }

  if (/(?:お腹|おなかすいた|腹減った|đói bụng|hungry|饿|배고파)/i.test(msg)) {
    return "お腹が空きましたか！美味しいご飯を食べてエネルギーを補給してくださいね。今夜は何が食べたいですか？ラーメン、お寿司、それとも美味しい料理？🍜🍣\n\n*(Bạn đói bụng rồi à! Hãy ăn món gì thật ngon để nạp lại năng lượng nhé. Tối nay bạn muốn ăn món gì nào? Ramen, Sushi hay món ăn truyền thống quê bạn?)*";
  }

  // 5. RESTAURANT & TRAVEL
  if (/(?:寿司|すし|sushi)/i.test(msg)) {
    return "お寿司、最高ですよね！🍣 私もサーモンやマグロ、いくらが大好きです。ワサビは入れても大丈夫ですか？日本の回転寿司にも行ってみたいですか？😋\n\n*(Sushi ngon tuyệt cú mèo luôn nhỉ! Tôi cũng cực kỳ thích cá hồi (salmon), cá ngừ và trứng cá hồi đấy. Bạn ăn kèm mù tạt (wasabi) được không? Bạn có muốn đi thử các quán sushi băng chuyền ở Nhật không?)*";
  }

  if (/(?:ラーメン|らーめん|ramen)/i.test(msg)) {
    return "ラーメン、いいですね！🍜 豚骨（とんこつ）、醤油（しょうゆ）、味噌（みそ）、どれが一番好きですか？日本のラーメン屋さんはスープや麺の硬さも選べるんですよ！😋\n\n*(Ramen thích quá đi chứ! Giữa nước dùng xương heo (Tonkotsu), nước tương (Shoyu) và tương Miso, bạn mê vị nào nhất? Ở quán ramen bên Nhật mình còn được tự chọn độ đậm của nước súp và độ dai của sợi mì nữa đấy!)*";
  }

  // 6. GENERAL JAPANESE NATURAL CONVERSATION FALLBACK
  return `なるほど、「${msg}」ですね！🌸\n\nとても自然で気持ちの伝わる表現ですね。あなたの日本語のセンス、とても素晴らしいと思います！✨\n\nもっと色んなお話がしたいので、最近あった楽しかったことや、気になっていることについて教えてくれますか？😊\n\n*(Sensei hiểu rồi, là chuyện "${msg}" nhỉ! Cách diễn đạt của bạn rất tự nhiên và truyền cảm xúc rất tốt. Hãy tiếp tục trò chuyện cùng Sensei nhé!)*`;
}
