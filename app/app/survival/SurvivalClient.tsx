"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Badge } from "@/components/ui";
import { useSoundAndTheme } from "@/components/SoundAndThemeContext";
import { getSurvivalLessonImage, getSurvivalCharacterImage } from "@/lib/assets/base64Images";
import { notifyProgressUpdated } from "@/components/UserProgressContext";
import { SafeImg } from "./SafeImg";

type CategoryKey = "restaurant" | "station" | "konbini" | "other";

interface DialogueStep {
  npcSpeaker: string;
  npcAvatar: string;
  npcJapanese: string;
  npcRomaji: string;
  npcMeaning: string;
  choices: Array<{
    textJa: string;
    textRomaji: string;
    textVi: string;
    politeness: "POLITE" | "CASUAL" | "RUDE";
    score: number;
    npcFeedback: string;
    knowledgeNote?: string;
  }>;
}

interface ScenarioDef {
  id: string;
  slug: string;
  title: string;
  locationName: string;
  level: string;
  xpReward: number;
  bgGradient: string;
  category: CategoryKey;
  description: string;
  steps: DialogueStep[];
}

const REAL_SCENARIOS: ScenarioDef[] = [
  {
    id: "sc-ramen",
    slug: "ordering-ramen",
    category: "restaurant",
    title: "Gọi Món Tại Tiệm Ramen Shibuya",
    locationName: "Quán Ramen Ichiran Shibuya, Tokyo",
    level: "N5 Thực Chiến",
    xpReward: 100,
    bgGradient: "from-amber-600 via-rose-700 to-sumi-950",
    description: "Bước vào một tiệm Ramen truyền thống náo nhiệt. Tự tin trả lời số lượng người, chọn độ cứng sợi mì và khen món ăn sau khi dùng bữa!",
    steps: [
      {
        npcSpeaker: "BÁC CHỦ TIỆM RAMEN",
        npcAvatar: "👨‍🍳",
        npcJapanese: "いらっしゃいませ！何名様ですか？",
        npcRomaji: "Irasshaimase! Nan-mei sama desu ka?",
        npcMeaning: "Kính chào quý khách! Quý khách đi mấy người ạ?",
        choices: [
          {
            textJa: "一人です。カウンター席でいいですか？",
            textRomaji: "Hitori desu. Kauntā-seki de ii desu ka?",
            textVi: "Dạ đi 1 người ạ. Ngồi ở quầy bar được không?",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Bác chủ quán gật đầu niềm nở mời bạn vào ghế quầy bar số 3!",
          },
          {
            textJa: "一人。",
            textRomaji: "Hitori.",
            textVi: "Một người. (Nói cộc lốc)",
            politeness: "CASUAL",
            score: 60,
            npcFeedback: "Bác chủ quán hơi ngạc nhiên nhưng vẫn chỉ tay: 'Mời bạn ngồi đây'.",
          },
          {
            textJa: "ラーメン二つ！",
            textRomaji: "Rāmen futatsu!",
            textVi: "Cho hai tô ramen! (Nhầm số người)",
            politeness: "RUDE",
            score: 40,
            npcFeedback: "Bác chủ quán cười: 'Ủa bạn đi mấy người mà gọi 2 tô liền vậy?'",
          },
        ],
      },
      {
        npcSpeaker: "BÁC CHỦ TIỆM RAMEN",
        npcAvatar: "👨‍🍳",
        npcJapanese: "どのラーメンにしますか？麺の硬さはどうしますか？",
        npcRomaji: "Dono rāmen ni shimasu ka? Men no katasa wa dō shimasu ka?",
        npcMeaning: "Quý khách dùng loại Ramen nào? Sợi mì muốn nấu độ cứng ra sao?",
        choices: [
          {
            textJa: "豚骨ラーメンをお願いします！麺は硬めで！",
            textRomaji: "Tonkotsu rāmen o onegaishimasu! Men wa katame de!",
            textVi: "Cho tôi một tô Tonkotsu Ramen! Sợi mì nấu hơi cứng chút ạ!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Chuẩn phong cách người sành ăn mì Ramen Nhật Bản! Bác chủ quán hô to: 'Tonkotsu katame!'",
          },
          {
            textJa: "普通のラーメンでいいです。",
            textRomaji: "Futsū no rāmen de ii desu.",
            textVi: "Lấy tô bình thường là được rồi.",
            politeness: "CASUAL",
            score: 75,
            npcFeedback: "Bác chủ quán ghi đơn: 'Vâng, một tô Shoyu bình thường nhé'.",
          },
          {
            textJa: "何でもいい。",
            textRomaji: "Nandemo ii.",
            textVi: "Cái gì cũng được. (Bất lịch sự)",
            politeness: "RUDE",
            score: 30,
            npcFeedback: "Bác chủ quán gãi đầu lúng túng.",
          },
        ],
      },
      {
        npcSpeaker: "BÁC CHỦ TIỆM RAMEN",
        npcAvatar: "👨‍🍳",
        npcJapanese: "お待たせしました！豚骨ラーメン一丁！熱いので気をつけてね。",
        npcRomaji: "Omatase shimashita! Tonkotsu rāmen itchō! Atsui node ki o tsukete ne.",
        npcMeaning: "Xin để quý khách đợi lâu! Một tô Tonkotsu nóng hổi đây! Coi chừng nóng nhé.",
        choices: [
          {
            textJa: "いただきます！うわぁ、すごく美味しそうですね！",
            textRomaji: "Itadakimasu! Uwā, sugoku oishisō desu ne!",
            textVi: "Tôi xin phép dùng bữa! Oa, trông ngon mắt quá chừng!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Bác chủ quán cười tươi rói tự hào về món mì của mình!",
          },
          {
            textJa: "ごちそうさまでした。とても美味しかったです！",
            textRomaji: "Gochisōsama deshita. Totemo oishikatta desu!",
            textVi: "Cảm ơn vì bữa ăn ngon miệng. Món mì rất ngon!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Bác chủ quán cảm ơn bạn rối rít và chào tạm biệt nhiệt tình!",
          },
        ],
      },
    ],
  },
  {
    id: "sc-station",
    slug: "shinjuku-station",
    category: "station",
    title: "Hỏi Đường Tại Đại Nhà Ga Shinjuku",
    locationName: "Ga Shinjuku Tuyến Yamanote, Tokyo",
    level: "N5 Thực Chiến",
    xpReward: 100,
    bgGradient: "from-blue-700 via-indigo-800 to-sumi-950",
    description: "Nhà ga đông đúc nhất hành tinh. Tìm đúng cổng soát vé và hỏi nhân viên nhà ga đường đến sân ga Yamanote số 14 một cách chuẩn chỉ!",
    steps: [
      {
        npcSpeaker: "NHÂN VIÊN NHÀ GA",
        npcAvatar: "👮‍♂️",
        npcJapanese: "はい、何かお困りですか？どちらへ行かれますか？",
        npcRomaji: "Hai, nanika okomari desu ka? Dochira e ikaremasu ka?",
        npcMeaning: "Dạ vâng, quý khách cần hỗ trợ gì không? Quý khách muốn đi đâu ạ?",
        choices: [
          {
            textJa: "すみません、山手線の渋谷方面は何番線ですか？",
            textRomaji: "Sumimasen, Yamanote-sen no Shibuya hōmen wa nan-bansen desu ka?",
            textVi: "Xin lỗi anh, tuyến Yamanote hướng đi Shibuya ở đường ray số mấy ạ?",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Nhân viên mỉm cười giơ tay hướng dẫn rành mạch: 'Dạ ở sân ga số 14 nhé bạn!'",
          },
          {
            textJa: "山手線、どこ？",
            textRomaji: "Yamanote-sen, doko?",
            textVi: "Yamanote, ở đâu? (Cộc lốc)",
            politeness: "CASUAL",
            score: 55,
            npcFeedback: "Nhân viên hơi sững sờ nhưng vẫn chỉ đường: 'À, ở bên kia bạn nhé'.",
          },
        ],
      },
      {
        npcSpeaker: "NHÂN VIÊN NHÀ GA",
        npcAvatar: "👮‍♂️",
        npcJapanese: "あちらの階段を上って、右側の14番線ですよ。Suicaはお持ちですか？",
        npcRomaji: "Achira no kaidan o agatte, migigawa no jū-yon bansen desu yo. Suica wa omochi desu ka?",
        npcMeaning: "Bạn đi lên cầu thang đằng kia, sân ga số 14 ở bên phải nhé. Bạn đã có thẻ IC Suica chưa?",
        choices: [
          {
            textJa: "はい、持っています。教えていただきありがとうございます！",
            textRomaji: "Hai, motte imasu. Oshiete itadaki arigatō gozaimasu!",
            textVi: "Dạ tôi có rồi. Cảm ơn anh rất nhiều vì đã tận tình chỉ dẫn!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Nhân viên cúi chào thân thiện: 'Không có chi, chúc bạn chuyến đi tốt lành!'",
          },
          {
            textJa: "Suica？分かりません。切符はどこで買えますか？",
            textRomaji: "Suica? Wakarimasen. Kippu wa doko de kaemasu ka?",
            textVi: "Suica là gì tôi chưa rõ. Tôi có thể mua vé giấy ở đâu ạ?",
            politeness: "POLITE",
            score: 90,
            npcFeedback: "Nhân viên chỉ vào máy bán vé tự động: 'Ở dãy máy bán vé màu xanh kia nhé bạn!'",
          },
        ],
      },
    ],
  },
  {
    id: "sc-konbini",
    slug: "konbini-shopping",
    category: "konbini",
    title: "Mua Sắm Tại Cửa Hàng Tiện Lợi (Konbini)",
    locationName: "Cửa hàng 7-Eleven Akihabara",
    level: "N5 Thực Chiến",
    xpReward: 100,
    bgGradient: "from-emerald-700 via-teal-800 to-sumi-950",
    description: "Thanh toán cơm hộp Bento, trà xanh Matcha và đối đáp lưu loát các câu hỏi thường gặp về hâm nóng thức ăn, túi đựng và biên lai!",
    steps: [
      {
        npcSpeaker: "THU NGÂN KONBINI",
        npcAvatar: "🏪",
        npcJapanese: "いらっしゃいませ！ポイントカードはお持ちですか？",
        npcRomaji: "Irasshaimase! Pointo kādo wa omochi desu ka?",
        npcMeaning: "Kính chào quý khách! Quý khách có mang theo thẻ tích điểm không ạ?",
        choices: [
          {
            textJa: "持っていません。大丈夫です。",
            textRomaji: "Motte imasen. Daijōbu desu.",
            textVi: "Dạ tôi không có. Cứ thanh toán bình thường đi ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Thu ngân nhanh nhẹn quét mã vạch sản phẩm 'Tít!'",
          },
          {
            textJa: "ない。",
            textRomaji: "Nai.",
            textVi: "Không có. (Khá cộc)",
            politeness: "CASUAL",
            score: 60,
            npcFeedback: "Thu ngân tiếp tục tính tiền.",
          },
        ],
      },
      {
        npcSpeaker: "THU NGÂN KONBINI",
        npcAvatar: "🏪",
        npcJapanese: "お弁当は温めますか？レジ袋はお付けしますか？",
        npcRomaji: "Obentō wa atatamemasu ka? Reji-bukuro wa otsuke shimasu ka?",
        npcMeaning: "Hộp cơm có cần quay nóng trong lò vi sóng không? Bạn có lấy túi nilông không?",
        choices: [
          {
            textJa: "温めをお願いします。袋も1枚ください。",
            textRomaji: "Atatame o onegaishimasu. Fukuro mo ichi-mai kudasai.",
            textVi: "Làm ơn hâm nóng giúp tôi. Cho tôi xin thêm 1 chiếc túi nữa ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Thu ngân cho cơm vào lò vi sóng 30 giây và xếp vào túi xách gọn gàng!",
          },
          {
            textJa: "そのままでいいです。袋は要りません。",
            textRomaji: "Sono mama de ii desu. Fukuro wa irimasen.",
            textVi: "Cứ để vậy được rồi. Tôi không cần túi đâu ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Thu ngân dán tem thanh toán trực tiếp lên hộp cơm: 'Dạ vâng!'",
          },
        ],
      },
      {
        npcSpeaker: "THU NGÂN KONBINI",
        npcAvatar: "🏪",
        npcJapanese: "ちょうど680円になります。レシートはどうされますか？",
        npcRomaji: "Chōdo roppyaku hachijū-en ni narimasu. Reshīto wa dō saremasu ka?",
        npcMeaning: "Tổng cộng vừa đúng 680 Yên. Hóa đơn biên lai bạn có lấy không ạ?",
        choices: [
          {
            textJa: "レシートは結構です。ありがとうございました！",
            textRomaji: "Reshīto wa kekkō desu. Arigatō gozaimashita!",
            textVi: "Dạ hóa đơn tôi không cần đâu. Cảm ơn bạn rất nhiều!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Thu ngân cúi đầu cảm ơn: 'Arigatō gozaimashita! Xin hẹn gặp lại quý khách!'",
          },
          {
            textJa: "レシートもください。",
            textRomaji: "Reshīto mo kudasai.",
            textVi: "Cho tôi xin cả hóa đơn nhé.",
            politeness: "POLITE",
            score: 95,
            npcFeedback: "Thu ngân đưa tiền thừa và hóa đơn bằng cả hai tay trang trọng.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-akiba",
    slug: "akihabara-anime",
    category: "other",
    title: "Mua Sắm Anime & Miễn Thuế Tại Akihabara",
    locationName: "Cửa hàng Figure Akihabara, Tokyo",
    level: "N5 Thực Chiến",
    xpReward: 90,
    bgGradient: "from-purple-600 via-pink-700 to-sumi-950",
    description: "Khám phá phố điện tử Akihabara, hỏi nhân viên xem mô hình trong tủ kính và làm thủ tục miễn thuế Passport Tax-Free.",
    steps: [
      {
        npcSpeaker: "NHÂN VIÊN AKIHABARA",
        npcAvatar: "🤖",
        npcJapanese: "いらっしゃいませ！ショーケースの中の商品をご覧になりますか？",
        npcRomaji: "Irasshaimase! Shōkēsu no naka no shōhin o goran ni narimasu ka?",
        npcMeaning: "Kính chào quý khách! Quý khách có muốn xem sản phẩm bên trong tủ kính không ạ?",
        choices: [
          {
            textJa: "すみません、このフィギュアを見せていただけますか？",
            textRomaji: "Sumimasen, kono figyua o misete itadakemasu ka?",
            textVi: "Xin lỗi anh, làm ơn cho tôi xem mô hình này được không ạ?",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Nhân viên dùng chìa khóa cẩn thận mở tủ kính lấy mô hình ra cho bạn ngắm!",
          },
          {
            textJa: "これ見たい。",
            textRomaji: "Kore mitai.",
            textVi: "Tôi muốn xem cái này. (Cộc lốc)",
            politeness: "CASUAL",
            score: 65,
            npcFeedback: "Nhân viên hỗ trợ mở tủ nhưng có vẻ hơi ngập ngừng.",
          },
        ],
      },
      {
        npcSpeaker: "NHÂN VIÊN AKIHABARA",
        npcAvatar: "🤖",
        npcJapanese: "はい、どうぞ！こちらの大人気フィギュアですね。免税をご利用ですか？",
        npcRomaji: "Hai, dōzo! Kochira no daininki figyua desu ne. Menzei o goriyō desu ka?",
        npcMeaning: "Vâng, xin mời! Đây là mô hình đang rất hot đó. Quý khách có dùng dịch vụ miễn thuế Tax-Free không?",
        choices: [
          {
            textJa: "はい、パスポートを持っています。免税でお願いします！",
            textRomaji: "Hai, pasupōto o motte imasu. Menzei de onegaishimasu!",
            textVi: "Dạ có, tôi có mang hộ chiếu. Làm ơn tính giá miễn thuế giúp tôi ạ!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Nhân viên kiểm tra visa và giảm ngay 10% thuế tiêu dùng cho bạn!",
          },
          {
            textJa: "免税って何ですか？",
            textRomaji: "Menzei tte nan desu ka?",
            textVi: "Miễn thuế là cái gì thế?",
            politeness: "CASUAL",
            score: 80,
            npcFeedback: "Nhân viên giải thích ngắn gọn về chính sách giảm thuế cho khách du lịch.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-ryokan",
    slug: "hakone-ryokan",
    category: "other",
    title: "Nhận Phòng Ryokan & Tắm Onsen Tại Hakone",
    locationName: "Lữ quán suối nước nóng Hakone Onsen",
    level: "N5 Thực Chiến",
    xpReward: 100,
    bgGradient: "from-teal-700 via-emerald-800 to-sumi-950",
    description: "Trải nghiệm văn hóa lữ quán truyền thống Nhật Bản, hỏi giờ dùng bữa tối Kaiseki và quy tắc tắm suối nước nóng Onsen.",
    steps: [
      {
        npcSpeaker: "NỮ TIẾP VIÊN OKAMI",
        npcAvatar: "👘",
        npcJapanese: "ようこそ箱根温泉へ！ご予約のお名前をお伺いできますか？",
        npcRomaji: "Yōkoso Hakone Onsen e! Goyoyaku no onamae o oukagai dekimasu ka?",
        npcMeaning: "Chào mừng quý khách đến với Suối nước nóng Hakone! Tôi xin phép được hỏi tên người đặt phòng ạ?",
        choices: [
          {
            textJa: "予約したグエンと申します。チェックインをお願いします。",
            textRomaji: "Yoyaku shita Guen to mōshimasu. Chekkuin o onegaishimasu.",
            textVi: "Tôi tên là Nguyễn đã đặt phòng trước. Làm ơn cho tôi làm thủ tục nhận phòng ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Nữ tiếp viên cúi đầu 90 độ cung kính mời bạn vào phòng trà thưởng thức bánh wagashi!",
          },
          {
            textJa: "チェックイン。",
            textRomaji: "Chekkuin.",
            textVi: "Nhận phòng. (Thiếu lịch sự)",
            politeness: "RUDE",
            score: 45,
            npcFeedback: "Nữ tiếp viên giật mình nhưng vẫn cố gắng tìm tên bạn trong danh sách.",
          },
        ],
      },
      {
        npcSpeaker: "NỮ TIẾP VIÊN OKAMI",
        npcAvatar: "👘",
        npcJapanese: "確認いたしました！夕食は18時から大広間でご用意いたします。温泉は24時間ご利用いただけますよ。",
        npcRomaji: "Kakunin itashimashita! Yūshoku wa jū-hachi-ji kara ōbiroma de goyōi itashimasu. Onsen wa nijū-yo-jikan goriyō itadakemasu yo.",
        npcMeaning: "Tôi đã kiểm tra rồi ạ! Bữa tối sẽ phục vụ từ 18 giờ tại sảnh lớn. Suối nước nóng mở cửa phục vụ 24/24 giờ nhé quý khách.",
        choices: [
          {
            textJa: "ありがとうございます！温泉に入るのがとても楽しみです。",
            textRomaji: "Arigatō gozaimasu! Onsen ni hairu no ga totemo tanoshimi desu.",
            textVi: "Cảm ơn cô rất nhiều! Tôi rất hào hứng được ngâm mình trong suối nước nóng.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Nữ tiếp viên mỉm cười trao chìa khóa phòng và hướng dẫn mặc áo yukata!",
          },
        ],
      },
    ],
  },
  {
    id: "sc-pharmacy",
    slug: "japanese-pharmacy",
    category: "other",
    title: "Mua Thuốc Cảm Sốt Tại Hiệu Thuốc Nhật",
    locationName: "Hiệu thuốc Matsumoto Kiyoshi, Tokyo",
    level: "N5 Thực Chiến",
    xpReward: 95,
    bgGradient: "from-cyan-700 via-blue-800 to-sumi-950",
    description: "Diễn tả triệu chứng đau đầu, sốt nhẹ khi đi du lịch và hỏi dược sĩ liều lượng uống mỗi ngày một cách an tâm.",
    steps: [
      {
        npcSpeaker: "DƯỢC SĨ HIỆU THUỐC",
        npcAvatar: "💊",
        npcJapanese: "どうされましたか？どのような症状ですか？",
        npcRomaji: "Dō saremashita ka? Dono yō na shōjō desu ka?",
        npcMeaning: "Bạn bị làm sao thế? Triệu chứng của bạn như thế nào?",
        choices: [
          {
            textJa: "昨日から頭が痛くて、少し熱があります。かぜ薬はありますか？",
            textRomaji: "Kinō kara atama ga itakute, sukoshi netsu ga arimasu. Kaze-gusuri wa arimasu ka?",
            textVi: "Từ hôm qua tôi bị đau đầu và có hơi sốt nhẹ. Ở đây có thuốc cảm không ạ?",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Dược sĩ gật đầu thấu hiểu và lấy ngay hộp thuốc cảm tổng hợp chuyên dụng!",
          },
          {
            textJa: "頭痛い。薬。",
            textRomaji: "Atama itai. Kusuri.",
            textVi: "Đau đầu. Thuốc. (Rất cộc lốc)",
            politeness: "RUDE",
            score: 50,
            npcFeedback: "Dược sĩ nhìn bạn bối rối trước khi tìm thuốc.",
          },
        ],
      },
      {
        npcSpeaker: "DƯỢC SĨ HIỆU THUỐC",
        npcAvatar: "💊",
        npcJapanese: "頭痛と熱ですね。この総合かぜ薬がよく効きますよ。1日3回、食後に飲んでください。",
        npcRomaji: "Zutsū to netsu desu ne. Kono sōgō kaze-gusuri ga yoku kikimasu yo. Ichi-nichi san-kai, shokugo ni nonde kudasai.",
        npcMeaning: "Đau đầu và sốt đúng không. Loại thuốc cảm này công hiệu lắm đó. Hãy uống mỗi ngày 3 lần sau bữa ăn nhé.",
        choices: [
          {
            textJa: "分かりました。食後ですね。ありがとうございます！",
            textRomaji: "Wakarimashita. Shokugo desu ne. Arigatō gozaimasu!",
            textVi: "Tôi hiểu rồi ạ. Uống sau bữa ăn đúng không. Cảm ơn dược sĩ nhiều!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Dược sĩ ân cần dặn dò: 'Chúc bạn mau chóng khỏi bệnh và giữ ấm nhé!'",
          },
        ],
      },
    ],
  },
  {
    id: "sc-taxi",
    slug: "kyoto-taxi",
    category: "station",
    title: "Đi Taxi Ngắm Cảnh Tại Cố Đô Kyoto",
    locationName: "Cửa Tây Ga Kyoto",
    level: "N5 Thực Chiến",
    xpReward: 90,
    bgGradient: "from-amber-700 via-orange-800 to-sumi-950",
    description: "Bắt taxi tại ga Kyoto để đến Chùa Vàng Kinkaku-ji, học cách nói điểm đến và hỏi cách thanh toán bằng thẻ IC Suica.",
    steps: [
      {
        npcSpeaker: "TÀI XẾ TAXI KYOTO",
        npcAvatar: "🚕",
        npcJapanese: "ご乗車ありがとうございます！どちらまで向かいますか？",
        npcRomaji: "Gojōsha arigatō gozaimasu! Dochira made mukaimasu ka?",
        npcMeaning: "Cảm ơn quý khách đã lên xe! Quý khách muốn đi đến đâu ạ?",
        choices: [
          {
            textJa: "金閣寺（きんかくじ）までお願いします。",
            textRomaji: "Kinkaku-ji made onegaishimasu.",
            textVi: "Làm ơn chở tôi đến Chùa Vàng Kinkaku-ji ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Bác tài xế bật đồng hồ tính cước và vui vẻ khởi hành!",
          },
          {
            textJa: "金閣寺！",
            textRomaji: "Kinkaku-ji!",
            textVi: "Chùa Vàng! (Cộc lốc)",
            politeness: "CASUAL",
            score: 65,
            npcFeedback: "Bác tài xế gật đầu rồi lái xe đi.",
          },
        ],
      },
      {
        npcSpeaker: "TÀI XẾ TAXI KYOTO",
        npcAvatar: "🚕",
        npcJapanese: "金閣寺ですね！かしこまりました。20分ほどで到着しますよ。",
        npcRomaji: "Kinkaku-ji desu ne! Kashikomarimashita. Ni-juppun hodo de tōchaku shimasu yo.",
        npcMeaning: "Chùa Vàng đúng không! Tôi hiểu rồi. Khoảng 20 phút nữa là chúng ta sẽ tới nơi nhé.",
        choices: [
          {
            textJa: "お支払いはSuica（スイカ）でできますか？",
            textRomaji: "Oshiharai wa Suica de dekimasu ka?",
            textVi: "Tôi có thể thanh toán bằng thẻ Suica được không bác?",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Bác tài xế cười tươi chỉ vào máy quẹt thẻ: 'Dạ được chứ, thanh toán không chạm rất tiện lợi!'",
            knowledgeNote: "Mẫu 'お支払いは〜でできますか' dùng tiền tố lịch sự お + danh từ 支払い kết hợp khả năng できます, rất chuẩn mực.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-n4-baito",
    slug: "n4-baito-interview",
    category: "restaurant",
    title: "Phỏng Vấn Xin Việc Làm Thêm (Baito)",
    locationName: "Nhà hàng Izakaya Shinjuku, Tokyo",
    level: "N4 Thực Chiến",
    xpReward: 50,
    bgGradient: "from-emerald-700 via-teal-800 to-sumi-950",
    description: "Ứng tuyển vị trí nhân viên quán ăn tại Tokyo: Chào hỏi bằng khiêm nhường ngữ, trình bày động lực và xác nhận ca làm việc.",
    steps: [
      {
        npcSpeaker: "店長 (CHỦ QUÁN)",
        npcAvatar: "👔",
        npcJapanese: "本日は面接にお越しいただきありがとうございます。まず自己紹介をお願いできますか？",
        npcRomaji: "Honjitsu wa mensetsu ni okoshi itadaki arigatō gozaimasu. Mazu jikoshōkai o onegai dekimasu ka?",
        npcMeaning: "Cảm ơn bạn hôm nay đã đến phỏng vấn. Trước hết bạn có thể tự giới thiệu đôi nét về bản thân không?",
        choices: [
          {
            textJa: "初めまして。ベトナムから参りましたナムと申します。日本の飲食文化を学びたくて応募いたしました。",
            textRomaji: "Hajimemashite. Betonamu kara mairimashita Namu to mōshimasu. Nihon no inshoku bunka o manabitakute ōbo itashimashita.",
            textVi: "Xin chào anh. Tôi là Nam đến từ Việt Nam. Vì muốn học hỏi văn hóa ẩm thực Nhật nên tôi đã ứng tuyển ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Chủ quán gật đầu ấn tượng trước cách dùng Khiêm nhường ngữ chuẩn xác của bạn!",
            knowledgeNote: "Khiêm nhường ngữ (謙譲語): '参りました' (đến từ), 'と申します' (tên là), '応募いたしました' (đã ứng tuyển) cực kỳ ghi điểm khi phỏng vấn.",
          },
          {
            textJa: "ナムです。ベトナムから来ました。よろしく。",
            textRomaji: "Namu desu. Betonamu kara kimashita. Yoroshiku.",
            textVi: "Tôi là Nam. Đến từ Việt Nam. Mong giúp đỡ nhé.",
            politeness: "CASUAL",
            score: 60,
            npcFeedback: "Chủ quán ghi chép lại nhưng nhắc nhở nhẹ nhàng về việc dùng kính ngữ với khách hàng.",
            knowledgeNote: "Nói 'よろしく' trống không trong buổi phỏng vấn bị coi là thiếu trang trọng; cần nói 'よろしくお願いいたします'.",
          },
          {
            textJa: "履歴書に書いてあるから読んで。",
            textRomaji: "Rirekisho ni kaite aru kara yonde.",
            textVi: "Có ghi trong sơ yếu lý lịch rồi nên tự đọc đi.",
            politeness: "RUDE",
            score: 20,
            npcFeedback: "Chủ quán cau mày vì thái độ thiếu tôn trọng trong buổi phỏng vấn!",
            knowledgeNote: "Thể mệnh lệnh/nhờ vả trống không '読んで' với người phỏng vấn sẽ làm mất điểm nghiêm trọng (-1 ❤️).",
          },
        ],
      },
      {
        npcSpeaker: "店長 (CHỦ QUÁN)",
        npcAvatar: "👔",
        npcJapanese: "日本語がとても丁寧ですね！週に何日くらいシフトに入れますか？",
        npcRomaji: "Nihongo ga totemo teinei desu ne! Shū ni nannichi kurai shifuto ni hairemasu ka?",
        npcMeaning: "Tiếng Nhật của bạn rất lịch sự đấy! Một tuần bạn có thể vào ca được khoảng mấy buổi?",
        choices: [
          {
            textJa: "週に3日、平日の夕方と土曜日に働くことができます！",
            textRomaji: "Shū ni mikka, heijitsu no yūgata to doyōbi ni hataraku koto ga dekimasu!",
            textVi: "Em có thể làm 3 buổi/tuần vào chiều tối ngày thường và thứ Bảy ạ!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Chủ quán mỉm cười: 'Tuyệt vời, quán đang rất cần người vào tối ngày thường và thứ Bảy!'",
            knowledgeNote: "Mẫu khả năng 'V-ることができます' kết hợp thời gian cụ thể giúp nhà tuyển dụng dễ xếp lịch (シフト).",
          },
          {
            textJa: "いつでもいいですが、忙しい日は急に休みます。",
            textRomaji: "Itsudemo ii desu ga, isogashii hi wa kyū ni yasumimasu.",
            textVi: "Lúc nào cũng được nhưng ngày bận thì tôi nghỉ đột xuất.",
            politeness: "RUDE",
            score: 30,
            npcFeedback: "Chủ quán lo ngại: 'Nghỉ đột xuất không báo trước sẽ rất khó cho quán...'",
            knowledgeNote: "Tại Nhật, nghỉ ca làm thêm đột xuất (無断欠勤 / 急な休み) gây ảnh hưởng lớn đến đồng đội.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-n4-apartment",
    slug: "n4-apartment-leasing",
    category: "other",
    title: "Thuê Nhà Trọ & Ký Hợp Đồng Bất Động Sản",
    locationName: "Văn phòng Bất động sản Takadanobaba",
    level: "N4 Thực Chiến",
    xpReward: 50,
    bgGradient: "from-indigo-700 via-sky-800 to-sumi-950",
    description: "Trao đổi với công ty bất động sản Nhật Bản về tiền đặt cọc (Shikikin), tiền lễ (Reikin) và giấy tờ cần thiết khi ký hợp đồng.",
    steps: [
      {
        npcSpeaker: "不動産屋さん (NHÂN VIÊN BĐS)",
        npcAvatar: "🏠",
        npcJapanese: "こちらの部屋は駅から徒歩5分で、敷金・礼金もゼロとなっております。いかがでしょうか？",
        npcRomaji: "Kochira no heya wa eki kara toho go-fun de, shikikin reikin mo zero to natte orimasu. Ikaga deshō ka?",
        npcMeaning: "Căn phòng này cách ga 5 phút đi bộ, tiền cọc và tiền lễ đều bằng 0. Quý khách thấy thế nào ạ?",
        choices: [
          {
            textJa: "とても便利そうですね！契約の際に必要な書類は何ですか？",
            textRomaji: "Totemo benri sō desu ne! Keiyaku no sai ni hitsuyō na shorui wa nan desu ka?",
            textVi: "Trông rất tiện lợi ạ! Khi làm hợp đồng thì tôi cần chuẩn bị những giấy tờ gì ạ?",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Nhân viên BĐS lấy danh sách hồ sơ hướng dẫn bạn tận tình từng mục!",
            knowledgeNote: "Cụm '契約の際に' (Khi ký hợp đồng) là cách diễn đạt N4/N3 lịch sự hơn '契約の時'.",
          },
          {
            textJa: "もっと安い部屋を出して。",
            textRomaji: "Motto yasui heya o dashite.",
            textVi: "Đưa phòng rẻ hơn ra đây. (Cộc lốc)",
            politeness: "RUDE",
            score: 35,
            npcFeedback: "Nhân viên BĐS hơi ngượng ngùng lật tìm tập hồ sơ khác.",
            knowledgeNote: "Khi muốn xem phòng rẻ hơn một cách lịch sự, hãy nói: 'もう少し家賃が安い物件はありますか？'.",
          },
        ],
      },
      {
        npcSpeaker: "不動産屋さん (NHÂN VIÊN BĐS)",
        npcAvatar: "🏠",
        npcJapanese: "在留カードと学生証、それから銀行口座の通帳をお持ちいただけますか？",
        npcRomaji: "Zairyū kādo to gakuseishō, sorekara ginkō kōza no tsūchō o omochi itadakemasu ka?",
        npcMeaning: "Bạn có thể mang theo Thẻ lưu trú, thẻ sinh viên và sổ tài khoản ngân hàng được không?",
        choices: [
          {
            textJa: "はい、すべて揃っています。明日もう一度伺ってもよろしいでしょうか？",
            textRomaji: "Hai, subete sorotte imasu. Ashita mō ichido ukagatte mo yoroshii deshō ka?",
            textVi: "Dạ tôi có đủ cả rồi. Ngày mai tôi xin phép ghé lại lần nữa có được không ạ?",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Nhân viên BĐS hẹn lịch 10h sáng mai và giữ phòng ưu tiên cho bạn!",
            knowledgeNote: "'伺ってもよろしいでしょうか' (Khiêm nhường ngữ của 行きます + xin phép lịch sự) rất chuẩn mực.",
          },
          {
            textJa: "在留カードと銀行口座の書類を準備しておきます。",
            textRomaji: "Zairyū kādo to ginkō kōza no shorui o junbi shite okimasu.",
            textVi: "Tôi sẽ chuẩn bị sẵn thẻ lưu trú và giấy tờ ngân hàng.",
            politeness: "POLITE",
            score: 90,
            npcFeedback: "Nhân viên BĐS gật đầu xác nhận lịch hẹn.",
            knowledgeNote: "Mẫu 'V-ておきます' diễn tả sự chuẩn bị sẵn sàng cho một việc sắp tới.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-n4-hospital",
    slug: "n4-hospital-visit",
    category: "other",
    title: "Khám Bệnh Tại Bệnh Viện Nhật Bản",
    locationName: "Phòng khám Nội khoa Tokyo Clinic",
    level: "N4 Thực Chiến",
    xpReward: 50,
    bgGradient: "from-cyan-700 via-teal-800 to-sumi-950",
    description: "Diễn tả chi tiết triệu chứng sốt và đau đầu bằng cấu trúc giải thích 〜んです, xét nghiệm cúm và hỏi bác sĩ cách uống thuốc.",
    steps: [
      {
        npcSpeaker: "お医者さん (BÁC SĨ)",
        npcAvatar: "🩺",
        npcJapanese: "今日はどうされましたか？どこが調子悪いですか？",
        npcRomaji: "Kyō wa dō saremashita ka? Doko ga chōshi warui desu ka?",
        npcMeaning: "Hôm nay bạn bị sao vậy? Trong người thấy khó chịu ở đâu?",
        choices: [
          {
            textJa: "昨日の夜から熱があって、頭も痛いんです。",
            textRomaji: "Kinō no yoru kara netsu ga atte, atama mo itai n desu.",
            textVi: "Từ tối hôm qua tôi bị sốt và đầu cũng đau nữa bác sĩ ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Bác sĩ gật đầu đo nhiệt độ và kiểm tra cổ họng cho bạn ngay.",
            knowledgeNote: "Mẫu '〜んです' dùng để trình bày tình trạng/hoàn cảnh bản thân khi khám bệnh hoặc nhờ giúp đỡ.",
          },
          {
            textJa: "薬だけ早くちょうだい。",
            textRomaji: "Kusuri dake hayaku chōdai.",
            textVi: "Đưa nhanh thuốc đây cho tôi thôi.",
            politeness: "RUDE",
            score: 25,
            npcFeedback: "Bác sĩ giải thích rằng phải khám triệu chứng trước mới kê đơn an toàn được.",
            knowledgeNote: "'ちょうだい' là khẩu ngữ thân mật/trẻ con, không dùng với bác sĩ.",
          },
        ],
      },
      {
        npcSpeaker: "お医者さん (BÁC SĨ)",
        npcAvatar: "🩺",
        npcJapanese: "インフルエンザの検査をしましょう。熱を下げる薬も出しておきますね。",
        npcRomaji: "Infuruenza no kensa o shimashō. Netsu o sageru kusuri mo dashite okimasu ne.",
        npcMeaning: "Chúng ta hãy xét nghiệm cúm nhé. Tôi cũng sẽ kê sẵn thuốc hạ sốt cho bạn.",
        choices: [
          {
            textJa: "ありがとうございます。この薬は食後に飲めばいいですか？",
            textRomaji: "Arigatō gozaimasu. Kono kusuri wa shokugo ni nomeba ii desu ka?",
            textVi: "Cảm ơn bác sĩ. Thuốc này tôi uống sau bữa ăn là được phải không ạ?",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Bác sĩ dặn dò kỹ lưỡng và chúc bạn mau bình phục!",
            knowledgeNote: "Mẫu điều kiện 'V-ばいいですか' dùng để hỏi xác nhận cách làm đúng (Uống sau ăn là được nhỉ?).",
          },
          {
            textJa: "薬は嫌いだから飲みません。",
            textRomaji: "Kusuri wa kirai dakara nomimasen.",
            textVi: "Tôi ghét thuốc nên không uống đâu.",
            politeness: "RUDE",
            score: 30,
            npcFeedback: "Bác sĩ thở dài lo lắng cho sức khỏe của bạn.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-n4-office",
    slug: "n4-office-reporting",
    category: "other",
    title: "Báo Cáo Công Việc Với Cấp Trên (Horenso N4)",
    locationName: "Văn phòng Công ty IT Shinagawa",
    level: "N4 Thực Chiến",
    xpReward: 50,
    bgGradient: "from-slate-700 via-indigo-900 to-sumi-950",
    description: "Sử dụng khiêm nhường ngữ (いたしております / ご提出いたします) để báo cáo tiến độ tài liệu với Trưởng phòng.",
    steps: [
      {
        npcSpeaker: "部長 (TRƯỞNG PHÒNG)",
        npcAvatar: "💼",
        npcJapanese: "ナムくん、例の会議資料の作成はどこまで進んでいる？",
        npcRomaji: "Namu-kun, rei no kaigi shiryō no sakusei wa doko made susunde iru?",
        npcMeaning: "Nam này, việc soạn thảo tài liệu cuộc họp hôm trước tiến triển đến đâu rồi?",
        choices: [
          {
            textJa: "ただいま最終確認をいたしております。午後3時までに部長にご提出いたします。",
            textRomaji: "Tadaima saishū kakunin o itashite orimasu. Gogo san-ji made ni Buchō ni go-teishutsu itashimasu.",
            textVi: "Dạ em đang kiểm tra lần cuối ạ. Trước 3 giờ chiều em sẽ nộp trình Trưởng phòng ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Trưởng phòng hài lòng: 'Tốt lắm, đúng tinh thần báo cáo Horenso rõ ràng!'",
            knowledgeNote: "Khiêm nhường ngữ 'いたしております' (đang làm) và 'ご提出いたします' (xin phép nộp) kèm mốc giờ 'までに' (trước hạn).",
          },
          {
            textJa: "まだできていません。明日でいいですか？",
            textRomaji: "Mada dekite imasen. Ashita de ii desu ka?",
            textVi: "Vẫn chưa xong. Để mai được không?",
            politeness: "CASUAL",
            score: 50,
            npcFeedback: "Trưởng phòng nhắc nhở: 'Chiều nay họp rồi, em phải báo sớm chứ!'",
          },
        ],
      },
      {
        npcSpeaker: "部長 (TRƯỞNG PHÒNG)",
        npcAvatar: "💼",
        npcJapanese: "分かった。提出してくれたらすぐに目を通すよ。",
        npcRomaji: "Wakatta. Teishutsu shite kuretara sugu ni me o tōsu yo.",
        npcMeaning: "Được rồi. Khi nào em nộp anh sẽ xem qua (目を通す) ngay nhé.",
        choices: [
          {
            textJa: "よろしくお願いいたします。何か修正点がございましたらご指示ください。",
            textRomaji: "Yoroshiku onegai itashimasu. Nanika shūseiten ga gozaimashitara go-shiji kudasai.",
            textVi: "Em cảm ơn Trưởng phòng. Nếu có điểm nào cần chỉnh sửa xin anh cứ chỉ đạo ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Trưởng phòng khen ngợi thái độ cầu thị và chuyên nghiệp của bạn!",
            knowledgeNote: "'ございましたら' (lịch sự của ありましたら) + 'ご指示ください' (xin hãy chỉ đạo) là mẫu câu vàng nơi công sở Nhật.",
          },
          {
            textJa: "忙しいから自分で直してください。",
            textRomaji: "Isogashii kara jibun de naoshite kudasai.",
            textVi: "Em bận lắm nên anh tự sửa đi.",
            politeness: "RUDE",
            score: 15,
            npcFeedback: "Trưởng phòng sững sờ trước câu trả lời vô lễ!",
          },
        ],
      },
    ],
  },
  {
    id: "sc-koban-wallet",
    slug: "koban-lost-wallet",
    category: "station",
    title: "Báo Mất Ví Khẩn Cấp Tại Đồn Cảnh Sát (Kōban)",
    locationName: "Đồn cảnh sát Kōban trước Ga Ikebukuro",
    level: "N4 Thực Chiến",
    xpReward: 110,
    bgGradient: "from-rose-700 via-red-800 to-sumi-950",
    description: "Tình huống sinh tồn khẩn cấp: Bị rơi ví tiền chứa thẻ lưu trú trên tàu điện. Bình tĩnh mô tả đặc điểm chiếc ví và làm tờ khai thất lạc (遺失届).",
    steps: [
      {
        npcSpeaker: "お巡りさん (CẢNH SÁT KŌBAN)",
        npcAvatar: "👮",
        npcJapanese: "どうされましたか？落ち着いて話してくださいね。",
        npcRomaji: "Dō saremashita ka? Ochitsuite hanashite kudasai ne.",
        npcMeaning: "Có chuyện gì xảy ra vậy bạn? Hãy bình tĩnh kể cho tôi nghe nhé.",
        choices: [
          {
            textJa: "すみません、さっき山手線の電車の中で財布を落としてしまったんです。",
            textRomaji: "Sumimasen, sakki Yamanote-sen no densha no naka de saifu o otoshite shimatta n desu.",
            textVi: "Xin lỗi anh, vừa nãy tôi lỡ đánh rơi mất chiếc ví trên tàu tuyến Yamanote rồi ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Viên cảnh sát lấy ngay mẫu đơn báo mất đồ và trấn an bạn!",
            knowledgeNote: "Cấu trúc '落としてしまったんです' (てしまう diễn tả sự việc đáng tiếc lỡ xảy ra + んです giải thích hoàn cảnh).",
          },
          {
            textJa: "財布がない！早く探して！",
            textRomaji: "Saifu ga nai! Hayaku sagashite!",
            textVi: "Mất ví rồi! Tìm nhanh lên!",
            politeness: "RUDE",
            score: 35,
            npcFeedback: "Viên cảnh sát khuyên bạn bình tĩnh nói rõ địa điểm đánh rơi thì mới tra cứu được.",
          },
        ],
      },
      {
        npcSpeaker: "お巡りさん (CẢNH SÁT KŌBAN)",
        npcAvatar: "👮",
        npcJapanese: "なるほど。どんな特徴の財布ですか？中に何が入っていますか？",
        npcRomaji: "Naruhodo. Donna tokuchō no saifu desu ka? Naka ni nani ga haitte imasu ka?",
        npcMeaning: "Tôi hiểu rồi. Chiếc ví có đặc điểm gì và bên trong có những giấy tờ nào?",
        choices: [
          {
            textJa: "黒い革の長財布で、中に在留カードと現金が少し入っています。遺失届をお願いします。",
            textRomaji: "Kuroi kawa no nagazaifu de, naka ni zairyū kādo to genkin ga sukoshi haitte imasu. Ishitsutodoke o onegaishimasu.",
            textVi: "Là ví dài bằng da màu đen, bên trong có Thẻ lưu trú và một ít tiền mặt. Cho tôi xin làm tờ khai mất đồ (遺失届) ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Cảnh sát tra hệ thống nhà ga và báo tin mừng: Có người vừa nhặt được và nộp ở ga tiếp theo!",
            knowledgeNote: "Từ khóa sinh tồn quan trọng: '遺失届' (いしつとどけ - Tờ khai báo mất đồ) giúp cảnh sát cấp mã số hồ sơ tìm lại tài sản.",
          },
          {
            textJa: "普通の財布です。",
            textRomaji: "Futsū no saifu desu.",
            textVi: "Ví bình thường thôi.",
            politeness: "CASUAL",
            score: 50,
            npcFeedback: "Cảnh sát hỏi thêm về màu sắc và giấy tờ bên trong để xác minh chủ sở hữu.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-n3-workplace",
    slug: "n3-workplace-reporting",
    category: "other",
    title: "Báo Cáo Tiến Độ Dự Án & Xin Chỉ Đạo (Horenso N3)",
    locationName: "Trụ sở Tập đoàn Công nghệ Marunouchi, Tokyo",
    level: "N3 Thực Chiến",
    xpReward: 60,
    bgGradient: "from-blue-800 via-slate-900 to-sumi-950",
    description: "Thực hành giao tiếp thương mại N3: Dùng từ đệm công sở (クッション言葉), báo cáo tỷ lệ hoàn thành dự án và xin phản hồi từ Trưởng phòng Yamada.",
    steps: [
      {
        npcSpeaker: "山田部長 (TRƯỞNG PHÒNG YAMADA)",
        npcAvatar: "👨‍💼",
        npcJapanese: "ナムさん、来週のクライアント向けプレゼン資料の進捗状況はどうなっていますか？",
        npcRomaji: "Namu-san, raishū no kuraianto-muke purezen shiryō no shinchoku jōkyō wa dō natte imasu ka?",
        npcMeaning: "Nam ơi, tình hình tiến độ tài liệu thuyết trình cho khách hàng tuần sau đến đâu rồi em?",
        choices: [
          {
            textJa: "部長、お疲れ様です。資料のドラフトは8割方完成しており、本日中にご確認いただける予定です。",
            textRomaji: "Buchō, otsukaresama desu. Shiryō no dorafuto wa hachiwarigata kansei shite ori, honjitsuchū ni go-kakunin itadakeru yotei desu.",
            textVi: "Dạ chào Trưởng phòng ạ. Bản thảo đã hoàn thiện khoảng 80%, dự kiến trong hôm nay em sẽ gửi trình anh duyệt ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Trưởng phòng Yamada gật đầu đánh giá cao cách báo cáo số liệu cụ thể!",
            knowledgeNote: "Trong văn hóa Horenso N3: Luôn nêu con số cụ thể ('8割方完成しており' - xong 80%) và mốc thời gian ('本日中に' - ngay trong hôm nay).",
          },
          {
            textJa: "今やっているところです。",
            textRomaji: "Ima yatte iru tokoro desu.",
            textVi: "Em đang làm đây ạ.",
            politeness: "CASUAL",
            score: 55,
            npcFeedback: "Trưởng phòng hỏi lại: 'Cụ thể là xong được bao nhiêu phần trăm rồi?'",
          },
        ],
      },
      {
        npcSpeaker: "山田部長 (TRƯỞNG PHÒNG YAMADA)",
        npcAvatar: "👨‍💼",
        npcJapanese: "順調だね。グラフのデータも最新版のものを反映しておいてね。",
        npcRomaji: "Junchō da ne. Gurafu no dēta mo saishinban no mono o han'ei shite oite ne.",
        npcMeaning: "Thuận lợi đấy. Em nhớ cập nhật cả dữ liệu biểu đồ bản mới nhất vào luôn nhé.",
        choices: [
          {
            textJa: "承知いたしました。何か修正点がございましたら、遠慮なくご指摘ください。",
            textRomaji: "Shōchi itashimashita. Nanika shūseiten ga gozaimashitara, enryo naku go-shiteki kudasai.",
            textVi: "Dạ em đã rõ ạ (承知いたしました). Nếu có điểm nào cần sửa xin anh cứ góp ý chỉ dẫn ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Trưởng phòng Yamada khen ngợi phong thái Business Japanese chuyên nghiệp của bạn!",
            knowledgeNote: "'承知いたしました' là Khiêm nhường ngữ trang trọng hơn '分かりました' khi nhận lệnh từ cấp trên hoặc khách hàng.",
          },
          {
            textJa: "自分で全部完璧にしたので直す必要はありません。",
            textRomaji: "Jibun de zenbu kanpeki ni shita node naosu hitsuyō wa arimasen.",
            textVi: "Em tự làm hoàn hảo hết rồi nên không cần sửa đâu.",
            politeness: "RUDE",
            score: 20,
            npcFeedback: "Trưởng phòng Yamada nghiêm mặt nhắc nhở về quy trình duyệt tài liệu nhóm.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-n3-clinic",
    slug: "n3-medical-clinic",
    category: "other",
    title: "Khám Chuyên Khoa & Khai Báo Dị Ứng Thuốc (N3)",
    locationName: "Bệnh viện Đa khoa Quốc tế St. Luke, Tokyo",
    level: "N3 Thực Chiến",
    xpReward: 60,
    bgGradient: "from-teal-700 via-cyan-900 to-sumi-950",
    description: "Trình bày diễn biến bệnh lý chi tiết từ hôm kia, khai báo tiền sử dị ứng kháng sinh và xác nhận đơn thuốc.",
    steps: [
      {
        npcSpeaker: "医師 (BÁC SĨ CHUYÊN KHOA)",
        npcAvatar: "👩‍⚕️",
        npcJapanese: "今日はどのような症状でいらっしゃいましたか？いつ頃からですか？",
        npcRomaji: "Kyō wa dono yō na shōjō de irasshaimashita ka? Itsu goro kara desu ka?",
        npcMeaning: "Hôm nay bạn đến khám vì triệu chứng gì? Triệu chứng bắt đầu từ khoảng khi nào?",
        choices: [
          {
            textJa: "一昨日から喉が痛くて、昨夜から38度の熱が出てしまいました。",
            textRomaji: "Ototoi kara nodo ga itakute, yūbe kara sanjūhachi-do no netsu ga dete shimaimashita.",
            textVi: "Từ hôm kia cổ họng tôi bị đau rát, và từ đêm qua thì bị sốt lên tới 38 độ ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Bác sĩ ghi nhận bệnh sử rõ ràng vào hồ sơ bệnh án điện tử.",
            knowledgeNote: "Cách nêu mốc thời gian y tế chuẩn xác: '一昨日 (おととい) から' (từ hôm kia) + '昨夜 (ゆうべ) から' (từ tối qua).",
          },
          {
            textJa: "熱があります。",
            textRomaji: "Netsu ga arimasu.",
            textVi: "Tôi bị sốt.",
            politeness: "CASUAL",
            score: 65,
            npcFeedback: "Bác sĩ phải hỏi thêm bạn sốt bao nhiêu độ và từ bao giờ.",
          },
        ],
      },
      {
        npcSpeaker: "医師 (BÁC SĨ CHUYÊN KHOA)",
        npcAvatar: "👩‍⚕️",
        npcJapanese: "喉がかなり腫れていますね。抗生物質を出しますが、薬のアレルギーはありますか？",
        npcRomaji: "Nodo ga kanari harete imasu ne. Kōseibusshitsu o dashimasu ga, kusuri no arerugī wa arimasu ka?",
        npcMeaning: "Cổ họng bạn sưng khá nặng đấy. Tôi sẽ kê thuốc kháng sinh, bạn có bị dị ứng với loại thuốc nào không?",
        choices: [
          {
            textJa: "薬のアレルギーは特にありません。よろしくお願いいたします。",
            textRomaji: "Kusuri no arerugī wa toku ni arimasen. Yoroshiku onegai itashimasu.",
            textVi: "Dạ tôi không bị dị ứng loại thuốc nào đặc biệt cả. Nhờ bác sĩ kê đơn giúp ạ.",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Bác sĩ in đơn thuốc kháng sinh và hướng dẫn bạn sang quầy dược nhận thuốc!",
            knowledgeNote: "Từ vựng y tế N3: '腫れる' (はれる - sưng tấy), '抗生物質' (こうせいぶっしつ - thuốc kháng sinh), 'アレルギー' (dị ứng).",
          },
          {
            textJa: "注射は嫌いなので薬だけたくさんください。",
            textRomaji: "Chūsha wa kirai na node kusuri dake takusan kudasai.",
            textVi: "Tôi ghét tiêm lắm nên chỉ cho thật nhiều thuốc uống thôi.",
            politeness: "RUDE",
            score: 30,
            npcFeedback: "Bác sĩ giải thích không thể kê quá liều kháng sinh quy định.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-osaka-kansai",
    slug: "osaka-takoyaki-kansai",
    category: "restaurant",
    title: "Gọi Takoyaki & Giao Tiếp Phương Ngữ Kansai (Osaka)",
    locationName: "Phố ẩm thực Dōtonbori, Osaka",
    level: "N3 Thực Chiến",
    xpReward: 120,
    bgGradient: "from-orange-600 via-amber-700 to-sumi-950",
    description: "Trải nghiệm không khí náo nhiệt tại Dōtonbori (Osaka): Nghe hiểu phương ngữ Kansai-ben (まいど / めっちゃ / かまへん / おおきに) và trò chuyện thân thiện với chủ quầy!",
    steps: [
      {
        npcSpeaker: "たこ焼き屋の大将 (CHỦ QUẦY OSAKA)",
        npcAvatar: "🐙",
        npcJapanese: "まいど！いらっしゃい！焼きたてのたこ焼き、めっちゃ美味しいで！何個入りにする？",
        npcRomaji: "Maido! Irasshai! Yakitate no takoyaki, metcha oishii de! Nan-ko iri ni suru?",
        npcMeaning: "Xin chào khách quý! Bánh Takoyaki vừa nướng nóng hổi cực kỳ ngon đây! Bạn chọn phần mấy viên nào?",
        choices: [
          {
            textJa: "8個入りを一つお願いします！すごくいい匂いですね。",
            textRomaji: "Hachi-ko iri o hitotsu onegaishimasu! Sugoku ii nioi desu ne.",
            textVi: "Cho tôi một phần 8 viên ạ! Thơm phức hấp dẫn quá chừng!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Ông chủ quầy cười sảng khoái: 'Haha, mắt nhìn tinh đời lắm! Đợi chú 1 phút nghen!'",
            knowledgeNote: "Phương ngữ Kansai (関西弁): 'まいど' = lời chào thân thuộc; 'めっちゃ' = とても (cực kỳ); '美味しいで' = 美味しいよ.",
          },
          {
            textJa: "関西弁は分かりません。標準語で話してください。",
            textRomaji: "Kansai-ben wa wakarimasen. Hyōjungo de hanashite kudasai.",
            textVi: "Tôi không hiểu tiếng Kansai. Hãy nói tiếng Nhật chuẩn đi.",
            politeness: "RUDE",
            score: 35,
            npcFeedback: "Ông chủ quầy hơi cụt hứng nhưng vẫn làm bánh cho bạn.",
            knowledgeNote: "Người Osaka rất tự hào về văn hóa ẩm thực Kuidaore và giọng Kansai-ben nồng hậu của họ.",
          },
        ],
      },
      {
        npcSpeaker: "たこ焼き屋の大将 (CHỦ QUẦY OSAKA)",
        npcAvatar: "🐙",
        npcJapanese: "8個入りやね！ソースとマヨネーズは全部かけてもかまへんか？",
        npcRomaji: "Hachi-ko iri ya ne! Sōsu to mayonēzu wa zenbu kakete mo kamahen ka?",
        npcMeaning: "Phần 8 viên ha! Chú rưới hết cả sốt và mayonnaise lên luôn có được không (kamahen ka)?",
        choices: [
          {
            textJa: "はい、全部かけてください！おおきに！",
            textRomaji: "Hai, zenbu kakete kudasai! Ōkini!",
            textVi: "Dạ vâng, chú rưới hết lên giúp cháu nhé! Cảm ơn chú nhiều (Ōkini)!",
            politeness: "POLITE",
            score: 100,
            npcFeedback: "Ông chủ rắc thêm thật nhiều cá bào Katsuobushi nhảy múa trên bánh và hô to: 'Maido ōkini!'",
            knowledgeNote: "Trong Kansai-ben: '〜やね' = 〜だね; 'かまへん' = 構わない / 大丈夫 (không sao/được chứ); 'おおきに' = ありがとう!",
          },
          {
            textJa: "マヨネーズは抜きでお願いします。ありがとうございます！",
            textRomaji: "Mayonēzu wa nuki de onegaishimasu. Arigatō gozaimasu!",
            textVi: "Làm ơn không cho mayonnaise giúp tôi nhé (〜抜きで). Cảm ơn nhiều ạ!",
            politeness: "POLITE",
            score: 95,
            npcFeedback: "Ông chủ gật đầu: 'Ok, chỉ rưới sốt đặc trưng và cá bào thôi nghen!'",
            knowledgeNote: "Mẫu câu thực tế cực hữu ích khi gọi món: '[Món/Gia vị] + 抜きでお願いします' (Xin đừng bỏ [gia vị] vào).",
          },
        ],
      },
    ],
  },
];

// ======================== META GIAO DIỆN (mục tiêu / tiến độ / từ vựng) ========================
interface VocabItem {
  ja: string;
  romaji: string;
  vi: string;
  say?: string; // chuỗi đọc khi bấm loa (mặc định = ja)
}

interface ScenarioMeta {
  objective: string;
  stepLabels: string[];
  vocab: VocabItem[];
  tip?: string;
}

const DEFAULT_TIP = "Khi gọi món hoặc nhờ giúp đỡ, bạn có thể dùng 「〜をお願いします」 để thể hiện sự lịch sự.";

const SCENARIO_META: Record<string, ScenarioMeta> = {
  "ordering-ramen": {
    objective: "Gọi món ramen một cách lịch sự và tự nhiên.",
    stepLabels: ["Chào và báo số người", "Chọn món & độ cứng mì", "Nhận món và cảm ơn"],
    vocab: [
      { ja: "ラーメン", romaji: "ramen", vi: "mì ramen" },
      { ja: "注文", romaji: "chūmon", vi: "gọi món", say: "ちゅうもん" },
      { ja: "お願いします", romaji: "onegaishimasu", vi: "làm ơn / xin hãy…" },
      { ja: "硬め", romaji: "katame", vi: "sợi mì cứng", say: "かため" },
      { ja: "いただきます", romaji: "itadakimasu", vi: "xin phép dùng bữa" },
    ],
  },
  "shinjuku-station": {
    objective: "Hỏi đúng sân ga tuyến Yamanote và xác nhận cách đi.",
    stepLabels: ["Hỏi nhân viên nhà ga", "Xác nhận đường đi & thẻ Suica"],
    vocab: [
      { ja: "山手線", romaji: "Yamanote-sen", vi: "tuyến Yamanote", say: "やまのてせん" },
      { ja: "番線", romaji: "bansen", vi: "số sân ga", say: "ばんせん" },
      { ja: "階段", romaji: "kaidan", vi: "cầu thang", say: "かいだん" },
      { ja: "右側", romaji: "migigawa", vi: "phía bên phải", say: "みぎがわ" },
      { ja: "教えてください", romaji: "oshiete kudasai", vi: "xin hãy chỉ giúp" },
    ],
  },
  "konbini-shopping": {
    objective: "Thanh toán tại konbini và trả lời các câu hỏi quen thuộc của thu ngân.",
    stepLabels: ["Chào thu ngân", "Trả lời câu hỏi tại quầy", "Thanh toán và cảm ơn"],
    vocab: [
      { ja: "袋", romaji: "fukuro", vi: "túi", say: "ふくろ" },
      { ja: "温めますか", romaji: "atatamemasu ka", vi: "có hâm nóng không?", say: "あたためますか" },
      { ja: "箸", romaji: "hashi", vi: "đũa", say: "はし" },
      { ja: "ポイントカード", romaji: "pointo kādo", vi: "thẻ tích điểm" },
      { ja: "レジ", romaji: "reji", vi: "quầy thu ngân" },
    ],
  },
  "akihabara-anime": {
    objective: "Mua figure và hỏi thủ tục miễn thuế dành cho khách nước ngoài.",
    stepLabels: ["Hỏi mua hàng", "Làm thủ tục miễn thuế"],
    vocab: [
      { ja: "免税", romaji: "menzei", vi: "miễn thuế", say: "めんぜい" },
      { ja: "パスポート", romaji: "pasupōto", vi: "hộ chiếu" },
      { ja: "フィギュア", romaji: "figyua", vi: "figure / mô hình" },
      { ja: "会計", romaji: "kaikei", vi: "thanh toán", say: "かいけい" },
      { ja: "これをください", romaji: "kore o kudasai", vi: "cho tôi cái này" },
    ],
  },
  "hakone-ryokan": {
    objective: "Nhận phòng ryokan và hỏi quy tắc tắm onsen.",
    stepLabels: ["Nhận phòng", "Hỏi về onsen & bữa tối"],
    vocab: [
      { ja: "予約", romaji: "yoyaku", vi: "đặt chỗ", say: "よやく" },
      { ja: "温泉", romaji: "onsen", vi: "suối nước nóng", say: "おんせん" },
      { ja: "浴衣", romaji: "yukata", vi: "áo yukata", say: "ゆかた" },
      { ja: "夕食", romaji: "yūshoku", vi: "bữa tối", say: "ゆうしょく" },
      { ja: "チェックイン", romaji: "chekkuin", vi: "nhận phòng" },
    ],
  },
  "japanese-pharmacy": {
    objective: "Mô tả triệu chứng và hỏi cách dùng thuốc cảm sốt.",
    stepLabels: ["Nói triệu chứng", "Hỏi cách uống thuốc"],
    vocab: [
      { ja: "薬", romaji: "kusuri", vi: "thuốc", say: "くすり" },
      { ja: "熱", romaji: "netsu", vi: "sốt", say: "ねつ" },
      { ja: "風邪", romaji: "kaze", vi: "cảm lạnh", say: "かぜ" },
      { ja: "頭痛", romaji: "zutsū", vi: "đau đầu", say: "ずつう" },
      { ja: "飲み方", romaji: "nomikata", vi: "cách uống", say: "のみかた" },
    ],
  },
  "kyoto-taxi": {
    objective: "Báo điểm đến cho tài xế và hỏi cách thanh toán.",
    stepLabels: ["Báo điểm đến", "Hỏi thanh toán bằng Suica"],
    vocab: [
      { ja: "タクシー", romaji: "takushī", vi: "taxi" },
      { ja: "〜までお願いします", romaji: "~made onegaishimasu", vi: "cho tôi đến…" },
      { ja: "何分", romaji: "nan-pun", vi: "bao nhiêu phút", say: "なんぷん" },
      { ja: "支払い", romaji: "shiharai", vi: "thanh toán", say: "しはらい" },
      { ja: "着きました", romaji: "tsukimashita", vi: "đã đến nơi", say: "つきました" },
    ],
  },
  "n4-baito-interview": {
    objective: "Tự giới thiệu bằng khiêm nhường ngữ và chốt lịch ca làm thêm (シフト).",
    stepLabels: ["Tự giới thiệu bản thân (自己紹介)", "Xác nhận số buổi làm trong tuần"],
    tip: "Trong phỏng vấn Baito, hãy dùng 「〜と申します」(tôi tên là) và 「〜から参りました」(đến từ) thay vì 名前は/来ました.",
    vocab: [
      { ja: "面接", romaji: "mensetsu", vi: "phỏng vấn", say: "めんせつ" },
      { ja: "自己紹介", romaji: "jikoshōkai", vi: "tự giới thiệu", say: "じこしょうかい" },
      { ja: "応募する", romaji: "ōbo suru", vi: "ứng tuyển", say: "おうぼする" },
      { ja: "シフト", romaji: "shifuto", vi: "ca làm việc" },
      { ja: "平日", romaji: "heijitsu", vi: "ngày thường trong tuần", say: "へいじつ" },
    ],
  },
  "n4-apartment-leasing": {
    objective: "Tìm hiểu điều kiện thuê phòng (Shikikin/Reikin) và hẹn nộp hồ sơ ký hợp đồng.",
    stepLabels: ["Hỏi thủ tục & giấy tờ hợp đồng", "Xác nhận thẻ lưu trú & hẹn ngày ghé"],
    tip: "Khi hỏi lịch hẹn ghé thăm văn phòng, dùng Khiêm nhường ngữ 「伺ってもよろしいでしょうか」 sẽ tạo thiện cảm lớn.",
    vocab: [
      { ja: "敷金・礼金", romaji: "shikikin / reikin", vi: "tiền cọc / tiền lễ", say: "しききん・れいきん" },
      { ja: "徒歩", romaji: "toho", vi: "đi bộ", say: "とほ" },
      { ja: "契約", romaji: "keiyaku", vi: "hợp đồng", say: "けいやく" },
      { ja: "在留カード", romaji: "zairyū kādo", vi: "thẻ lưu trú" },
      { ja: "伺う", romaji: "ukagau", vi: "ghé thăm / hỏi (Khiêm nhường)", say: "うかがう" },
    ],
  },
  "n4-hospital-visit": {
    objective: "Trình bày triệu chứng sốt, đau đầu bằng cấu trúc 〜んです và hỏi cách uống thuốc.",
    stepLabels: ["Mô tả triệu chứng với bác sĩ", "Xác nhận xét nghiệm & liều uống"],
    tip: "Dùng 「〜んです」 khi kể triệu chứng bệnh giúp câu nói tự nhiên và thể hiện mong muốn được bác sĩ tư vấn.",
    vocab: [
      { ja: "調子が悪い", romaji: "chōshi ga warui", vi: "trong người khó chịu", say: "ちょうしがわるい" },
      { ja: "検査", romaji: "kensa", vi: "xét nghiệm / kiểm tra", say: "けんさ" },
      { ja: "熱を下げる", romaji: "netsu o sageru", vi: "hạ sốt", say: "ねつをさげる" },
      { ja: "食後", romaji: "shokugo", vi: "sau bữa ăn", say: "しょくご" },
    ],
  },
  "n4-office-reporting": {
    objective: "Báo cáo tiến độ tài liệu rõ ràng và tiếp nhận chỉ đạo từ Trưởng phòng.",
    stepLabels: ["Báo cáo tiến độ & giờ nộp", "Tiếp nhận phản hồi của cấp trên"],
    tip: "Quy tắc Hō-Ren-Sō (報連相): Luôn kèm mốc thời gian hoàn thành dự kiến khi báo cáo với cấp trên.",
    vocab: [
      { ja: "資料の作成", romaji: "shiryō no sakusei", vi: "soạn thảo tài liệu", say: "しりょうのさくせい" },
      { ja: "提出する", romaji: "teishutsu suru", vi: "nộp trình", say: "ていしゅつする" },
      { ja: "目を通す", romaji: "me o tōsu", vi: "đọc lướt / duyệt qua", say: "めをとおす" },
      { ja: "修正点", romaji: "shūseiten", vi: "điểm cần chỉnh sửa", say: "しゅうせいてん" },
    ],
  },
  "koban-lost-wallet": {
    objective: "Trình báo mất ví tiền trên tàu điện và điền tờ khai thất lạc (遺失届) tại Kōban.",
    stepLabels: ["Báo địa điểm & thời gian rơi ví", "Mô tả đặc điểm ví & làm tờ khai 遺失届"],
    tip: "Khi làm rơi đồ ở Nhật, hãy đến ngay Đồn cảnh sát khu phố (交番 - Kōban) hoặc quầy nhà ga để làm 『遺失届』(Tờ khai mất đồ).",
    vocab: [
      { ja: "交番", romaji: "kōban", vi: "đồn cảnh sát khu phố", say: "こうばん" },
      { ja: "財布を落とす", romaji: "saifu o otosu", vi: "đánh rơi ví", say: "さいふをおとす" },
      { ja: "長財布", romaji: "nagazaifu", vi: "ví dáng dài", say: "ながざいふ" },
      { ja: "遺失届", romaji: "ishitsutodoke", vi: "tờ khai báo mất đồ", say: "いしつとどけ" },
      { ja: "現金", romaji: "genkin", vi: "tiền mặt", say: "げんきん" },
    ],
  },
  "n3-workplace-reporting": {
    objective: "Thực hành báo cáo tiến độ chuyên sâu N3 (Horenso) và dùng Khiêm nhường ngữ chuẩn công sở.",
    stepLabels: ["Báo cáo tỷ lệ hoàn thành bản thảo", "Tiếp nhận yêu cầu cập nhật số liệu"],
    tip: "Trong môi trường công sở N3, hãy dùng 『承知いたしました』 thay cho 『分かりました』 khi nhận chỉ thị từ cấp trên.",
    vocab: [
      { ja: "進捗状況", romaji: "shinchoku jōkyō", vi: "tình hình tiến độ", say: "しんちょくじょうきょう" },
      { ja: "8割方", romaji: "hachiwarigata", vi: "khoảng 80%", say: "はちわりがた" },
      { ja: "本日中", romaji: "honjitsuchū", vi: "ngay trong hôm nay", say: "ほんじつちゅう" },
      { ja: "承知いたしました", romaji: "shōchi itashimashita", vi: "tôi đã rõ ạ (Khiêm nhường)" },
      { ja: "ご指摘", romaji: "go-shiteki", vi: "sự chỉ dẫn / góp ý", say: "ごしてき" },
    ],
  },
  "n3-medical-clinic": {
    objective: "Mô tả diễn biến bệnh lý nhiều ngày, trả lời câu hỏi về dị ứng kháng sinh tại phòng khám.",
    stepLabels: ["Mô tả diễn biến đau họng & sốt", "Xác nhận tiền sử dị ứng thuốc"],
    tip: "Khi khám bệnh ở Nhật, bác sĩ luôn hỏi 『薬のアレルギーはありますか』(Có dị ứng thuốc không) trước khi kê kháng sinh.",
    vocab: [
      { ja: "一昨日", romaji: "ototoi", vi: "hôm kia", say: "おととい" },
      { ja: "腫れる", romaji: "hareru", vi: "sưng tấy", say: "はれる" },
      { ja: "抗生物質", romaji: "kōseibusshitsu", vi: "thuốc kháng sinh", say: "こうせいぶっしつ" },
      { ja: "アレルギー", romaji: "arerugī", vi: "dị ứng" },
      { ja: "症状", romaji: "shōjō", vi: "triệu chứng", say: "しょうじょう" },
    ],
  },
  "osaka-takoyaki-kansai": {
    objective: "Nghe hiểu phương ngữ Kansai-ben tại Osaka và gọi món Takoyaki tự nhiên.",
    stepLabels: ["Nghe chủ quầy chào & chọn số viên", "Chọn sốt & cảm ơn bằng tiếng Kansai"],
    tip: "Ở Osaka/Kyoto, từ 『かまへん』(kamahen) nghĩa là 『大丈夫 / 構わない』(không sao/được chứ), và 『おおきに』 là 『ありがとう』!",
    vocab: [
      { ja: "まいど", romaji: "maido", vi: "xin chào / cảm ơn (Kansai)" },
      { ja: "めっちゃ", romaji: "metcha", vi: "cực kỳ / rất (Kansai)" },
      { ja: "かまへん", romaji: "kamahen", vi: "được chứ / không sao (Kansai)" },
      { ja: "おおきに", romaji: "ōkini", vi: "cảm ơn nhiều (Kansai)" },
      { ja: "〜抜きで", romaji: "~nuki de", vi: "không bỏ (gia vị/hành...)", say: "ぬきで" },
    ],
  },
};

const FEEDBACK_DELAY_MS = 2200;

const POLITENESS_TAG: Record<DialogueStep["choices"][0]["politeness"], { label: string; cls: string }> = {
  POLITE: {
    label: "Lịch sự & Tự nhiên",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  CASUAL: {
    label: "Thông dụng (Thân mật)",
    cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
  RUDE: {
    label: "Không phù hợp (-1 ❤️)",
    cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  },
};



// ======================== ẢNH (public/images/survival) ========================
// Ảnh minh họa bài  : /images/survival/lesson/<slug>.png     (khung 16:10, dùng cho thẻ + nền hội thoại)
// Ảnh nhân vật      : /images/survival/character/<slug>.png  (PNG nền trong suốt, nhân vật đứng, cắt từ đầu tới chân)
// Chưa có file -> tự động dùng gradient + emoji, không bị vỡ giao diện.
const IMG_BASE = "/images/survival";
const lessonImg = (slug: string) => getSurvivalLessonImage(slug);
const characterImg = (slug: string) => getSurvivalCharacterImage(slug);

const SCENARIO_ICON: Record<string, string> = {
  "ordering-ramen": "🍜",
  "shinjuku-station": "🚉",
  "konbini-shopping": "🏪",
  "akihabara-anime": "🎮",
  "hakone-ryokan": "♨️",
  "japanese-pharmacy": "💊",
  "kyoto-taxi": "🚕",
  "n4-baito-interview": "👔",
  "n4-apartment-leasing": "🏠",
  "n4-hospital-visit": "🩺",
  "n4-office-reporting": "💼",
  "koban-lost-wallet": "🚓",
  "n3-workplace-reporting": "📊",
  "n3-medical-clinic": "🏥",
  "osaka-takoyaki-kansai": "🐙",
};

const CATEGORY_TABS: Array<{ key: CategoryKey | "all"; label: string; icon: string }> = [
  { key: "all", label: "Tất cả", icon: "🔥" },
  { key: "restaurant", label: "Nhà hàng", icon: "🍜" },
  { key: "station", label: "Nhà ga", icon: "🚆" },
  { key: "konbini", label: "Konbini", icon: "🏪" },
  { key: "other", label: "Khác", icon: "✨" },
];

function levelBadgeCls(level: string) {
  if (level.startsWith("N5")) return "bg-rose-600 text-white";
  if (level.startsWith("N4")) return "bg-emerald-600 text-white";
  return "bg-sky-600 text-white";
}


type Choice = DialogueStep["choices"][0];

function SpeakerButton({ onClick, label = "Nghe phát âm", className = "" }: { onClick: () => void; label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-sm text-torii-600 shadow-sm transition hover:bg-rose-50 dark:border-rose-900 dark:bg-sumi-900 dark:text-rose-300 dark:hover:bg-sumi-800 ${className}`}
    >
      🔊
    </button>
  );
}

function SideTitle({ icon, children, right }: { icon: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-sm text-torii-600 dark:bg-rose-950/50">
          {icon}
        </span>
        <h3 className="text-xs font-black uppercase tracking-wide text-torii-600 dark:text-rose-300">{children}</h3>
      </div>
      {right}
    </div>
  );
}

export function SurvivalClient({
  scenarios,
  hero,
}: {
  scenarios: Array<{ id: string; slug: string; title: string; isCompleted: boolean }>;
  /** Hero (server-rendered) chỉ hiện ở màn danh sách, ẩn khi đang chơi. */
  hero?: ReactNode;
}) {
  const router = useRouter();
  const { playClick, playCorrect, playIncorrect, playFanfare, showToast, speak } = useSoundAndTheme();

  const [activeScenario, setActiveScenario] = useState<ScenarioDef | null>(null);
  const [showHints, setShowHints] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState<"choose" | "feedback">("choose");
  const [picked, setPicked] = useState<Choice | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<CategoryKey | "all">("all");

  // Speech Recognition (Microphone Voice Input)
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const handleVoiceSpokenRef = useRef<(transcript: string) => void>(() => {});
  const handleChooseRef = useRef<(choice: Choice) => void>(() => {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setMicSupported(true);
        const recognition = new SpeechRecognition();
        recognition.lang = "ja-JP";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) handleVoiceSpokenRef.current(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Full teardown: otherwise the mic stays live after unmount and
      // `isListening` can be written by a stale recogniser.
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          /* recogniser may already be stopped */
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
    };
  }, []);

  // Phím tắt 1-9 để chọn đáp án
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!activeScenario || isCompleted || phase !== "choose") return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1) return;
      const choice = activeScenario.steps[currentStepIndex]?.choices[n - 1];
      if (choice) handleChooseRef.current(choice);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeScenario, isCompleted, phase, currentStepIndex]);

  const startScenario = (scDef: ScenarioDef) => {
    playClick();
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveScenario(scDef);
    setCurrentStepIndex(0);
    setPhase("choose");
    setPicked(null);
    setRevealed(false);
    setTotalScore(0);
    setCombo(0);
    setHearts(3);
    setIsFailed(false);
    setMaxScore(scDef.steps.length * 100);
    setIsCompleted(false);
    speak(scDef.steps[0].npcJapanese);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exitScenario = () => {
    playClick();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isListening) recognitionRef.current?.stop();
    setActiveScenario(null);
  };

  const handleChoose = (choice: Choice) => {
    if (!activeScenario || phase !== "choose" || isCompleted) return;
    const scDef = activeScenario;
    const isLast = currentStepIndex >= scDef.steps.length - 1;
    const nextScore = totalScore + choice.score;
    const lostHeart = choice.politeness === "RUDE" || choice.score < 50 ? 1 : 0;
    const nextHearts = Math.max(0, hearts - lostHeart);

    if (choice.score >= 80) {
      playCorrect();
      setCombo((c) => c + 1);
    } else {
      playIncorrect();
      setCombo(0);
    }

    if (lostHeart > 0) {
      setHearts(nextHearts);
    }

    setTotalScore(nextScore);
    setPicked(choice);
    setPhase("feedback");

    timerRef.current = setTimeout(() => {
      if (nextHearts <= 0 || isLast) {
        finishScenario(scDef, nextScore, nextHearts);
      } else {
        const nextStep = scDef.steps[currentStepIndex + 1];
        setCurrentStepIndex((i) => i + 1);
        setPicked(null);
        setRevealed(false);
        setPhase("choose");
        speak(nextStep.npcJapanese);
      }
    }, FEEDBACK_DELAY_MS);
  };
  handleChooseRef.current = handleChoose;

  const handleVoiceSpoken = (transcript: string) => {
    if (!activeScenario || phase !== "choose") return;
    const step = activeScenario.steps[currentStepIndex];
    const normalizedTranscript = transcript.replace(/\s+/g, "").trim();
    const matched = step.choices.find((c) => {
      const normalizedChoice = c.textJa.replace(/\s+/g, "").trim();
      return (
        normalizedChoice.includes(normalizedTranscript) ||
        normalizedTranscript.includes(normalizedChoice.slice(0, 4)) ||
        normalizedTranscript.includes(normalizedChoice.slice(-4))
      );
    });

    if (!matched) {
      showToast({
        title: "🎙️ Không nhận diện rõ",
        description: `"${transcript}" không khớp với đáp án. Vui lòng thử lại hoặc chọn bằng tay.`,
        type: "error",
      });
      return;
    }

    showToast({
      title: `🎙️ Đã nhận diện giọng nói: "${transcript}"`,
      description: `Khớp với phương án: ${matched.textJa}`,
      type: "info",
    });
    handleChoose(matched);
  };
  handleVoiceSpokenRef.current = handleVoiceSpoken;

  const toggleMic = () => {
    if (!recognitionRef.current) {
      showToast({ title: "Trình duyệt chưa hỗ trợ ghi âm tiếng Nhật.", type: "error" });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      playClick();
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const finishScenario = async (scDef: ScenarioDef, finalTotalScore = totalScore, finalHearts = hearts) => {
    const scenarioMax = scDef.steps.length * 100;
    const passPct = scenarioMax > 0 ? Math.round((finalTotalScore / scenarioMax) * 100) : 100;
    if (finalHearts <= 0 || passPct < 60) {
      setIsFailed(true);
      setIsCompleted(true);
      showToast({
        title: "Chưa vượt qua tình huống sinh tồn!",
        description:
          finalHearts <= 0
            ? "Bạn đã mất hết thiện cảm của người đối thoại do chọn câu kém lịch sự. Hãy thử lại!"
            : `Điểm phản xạ đạt ${passPct}% (cần tối thiểu 60% để qua màn). Hãy ôn lại từ vựng và thử lại!`,
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const dbMatch = scenarios.find((s) => s.slug === scDef.slug);

      // `fetch` resolves on 4xx/5xx, so the response must be checked before any
      // celebration — otherwise a 401/404/500 produced a fake win.
      const res = await fetch("/api/survival/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: dbMatch?.id, slug: scDef.slug }),
      });

      if (!res.ok) {
        showToast({
          title: "Chưa lưu được kết quả.",
          description: `Máy chủ trả về lỗi ${res.status}. Bạn có thể thử lại, tiến độ chưa được ghi nhận.`,
          type: "error",
        });
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        xpAwarded?: number;
        alreadyCompleted?: boolean;
      };

      playFanfare();
      setIsFailed(false);
      setIsCompleted(true);
      showToast({
        title: `Vượt qua thử thách: ${scDef.title}!`,
        description:
          data.alreadyCompleted || !data.xpAwarded
            ? "Bạn đã hoàn thành hội thoại thực chiến này trước đó."
            : `Chúc mừng bạn đã hoàn thành hội thoại thực chiến và nhận +${data.xpAwarded} XP!`,
        type: "achievement",
      });
      notifyProgressUpdated();
      router.refresh();
    } catch {
      showToast({
        title: "Mất kết nối với máy chủ.",
        description: "Tiến độ chưa được ghi nhận. Hãy kiểm tra kết nối và thử lại.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const showGuide = () => {
    playClick();
    showToast({
      title: "Cách chơi",
      description: "Nghe nhân vật, chọn câu đáp (bấm chuột hoặc phím 1–4) hoặc bấm 🎙 để nói. Bấm 🔊 để nghe lại.",
      type: "info",
    });
  };

  // ======================== MÀN DANH SÁCH ========================
  if (!activeScenario) {
    const visible = REAL_SCENARIOS.filter((s) => filter === "all" || s.category === filter);

    return (
      <>
        {hero}
        <section id="thu-thach" className="mx-auto max-w-[1320px] scroll-mt-24 px-4 pb-24 sm:px-6">
          {/* Tiêu đề + bộ lọc */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-xl text-white shadow-lg shadow-rose-500/30"
                aria-hidden
              >
                ◎
              </span>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Chọn thử thách</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Khám phá các tình huống thực tế và chinh phục từng cấp độ!
                </p>
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Lọc thử thách"
              className="flex flex-wrap gap-1.5 rounded-full border border-white/70 bg-white/80 p-1.5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-sumi-900/80"
            >
              {CATEGORY_TABS.map((tab) => {
                const active = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      playClick();
                      setFilter(tab.key);
                    }}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                      active
                        ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-sumi-800"
                    }`}
                  >
                    <span aria-hidden>{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white/70 py-14 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-sumi-900/60">
              Chưa có thử thách nào trong mục này.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((scDef) => {
                const dbMatch = scenarios.find((s) => s.slug === scDef.slug);
                const isDone = dbMatch?.isCompleted ?? false;
                const icon = SCENARIO_ICON[scDef.slug] ?? "🎌";

                return (
                  <article
                    key={scDef.id}
                    className={`group flex flex-col overflow-hidden rounded-3xl bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-sumi-900 ${
                      isDone ? "ring-2 ring-rose-500" : "ring-1 ring-slate-200/80 dark:ring-slate-800"
                    }`}
                  >
                    {/* Ảnh minh họa */}
                    <div className={`relative h-44 overflow-hidden bg-gradient-to-br sm:h-48 ${scDef.bgGradient}`}>
                      <SafeImg
                        src={lessonImg(scDef.slug)}
                        alt={scDef.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        fallback={
                          <div className="flex h-full w-full items-center justify-center text-6xl opacity-80" aria-hidden>
                            {icon}
                          </div>
                        }
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-black shadow ${levelBadgeCls(scDef.level)}`}
                      >
                        {scDef.level}
                      </span>
                      <span
                        className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold shadow ${
                          isDone ? "bg-emerald-600 text-white" : "bg-white/90 text-slate-600"
                        }`}
                      >
                        <span aria-hidden>{isDone ? "✓" : "○"}</span>
                        {isDone ? "Đã hoàn thành" : "Chưa hoàn thành"}
                      </span>
                    </div>

                    {/* Nội dung */}
                    <div className="relative flex flex-1 flex-col px-5 pb-5 pt-9">
                      <span
                        className="absolute -top-6 left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-lg ring-4 ring-white dark:bg-sumi-900 dark:ring-sumi-900"
                        aria-hidden
                      >
                        {icon}
                      </span>
                      <h3 className="text-lg font-black leading-snug text-slate-900 dark:text-white">{scDef.title}</h3>
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span aria-hidden>📍</span>
                        <span>{scDef.locationName}</span>
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {scDef.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-800 dark:text-slate-100">
                          <span className="text-amber-500" aria-hidden>★</span>+{scDef.xpReward} XP
                        </span>
                        <button
                          type="button"
                          onClick={() => startScenario(scDef)}
                          className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold transition ${
                            isDone
                              ? "bg-rose-600 text-white shadow-md shadow-rose-500/30 hover:bg-rose-700"
                              : "border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
                          }`}
                        >
                          {isDone ? "Chơi lại" : "Bắt đầu"} <span aria-hidden>›</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-12 flex items-end justify-between" aria-hidden>
            <div className="flex items-end gap-3">
              <span className="text-5xl text-rose-500">⛩</span>
              <span className="pb-1 font-serif text-lg italic text-rose-300">がんばってね！</span>
            </div>
            <span className="text-4xl opacity-80">🌸</span>
          </div>
        </section>
      </>
    );
  }


  // ======================== MÀN CHƠI (giống ảnh thiết kế) ========================
  const steps = activeScenario.steps;
  const currentStep = steps[Math.min(currentStepIndex, steps.length - 1)];
  const meta: ScenarioMeta = SCENARIO_META[activeScenario.slug] ?? {
    objective: activeScenario.description,
    stepLabels: steps.map((_, i) => `Bước ${i + 1}`),
    vocab: [],
  };
  const scenarioNo = String(REAL_SCENARIOS.findIndex((s) => s.id === activeScenario.id) + 1).padStart(2, "0");
  const finalPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
  const idealScore = Math.max(...currentStep.choices.map((c) => c.score));
  const stepLabel = (i: number) => meta.stepLabels[i] ?? `Bước ${i + 1}`;
  const progressPct = isCompleted ? 100 : Math.round((currentStepIndex / steps.length) * 100 + (phase === "feedback" ? 100 / steps.length : 0));

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-5 px-3 pb-10 pt-4 sm:px-6 animate-in fade-in duration-200">
      {/* ── Thanh trên: quay lại / breadcrumb / công cụ ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={exitScenario}
            className="inline-flex items-center gap-1.5 font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <span aria-hidden>←</span> Quay lại
          </button>
          <span className="hidden h-5 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-torii-600 text-[10px] font-black text-torii-600">
              食
            </span>
            <span className="font-bold text-torii-600">Survival Mode</span>
            <span className="text-slate-400">/</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {scenarioNo}. {activeScenario.locationName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClick();
              setShowHints((v) => !v);
            }}
            aria-pressed={showHints}
            title="Bật/tắt Romaji và dịch nghĩa tiếng Việt"
            className={`rounded-xl border px-3 py-2.5 min-h-11 text-xs font-bold transition ${
              showHints
                ? "border-rose-200 bg-rose-50 text-torii-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                : "border-slate-200 bg-white/80 text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:bg-sumi-900 dark:hover:text-white"
            }`}
          >
            {showHints ? "👁 Romaji & Dịch" : "🔒 Chế độ thực chiến"}
          </button>
          <button
            type="button"
            onClick={showGuide}
            className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 min-h-11 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-sumi-900 dark:text-slate-200 dark:hover:bg-sumi-800"
          >
            ? Hướng dẫn
          </button>
          <button
            type="button"
            onClick={exitScenario}
            className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 min-h-11 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-sumi-900 dark:text-slate-200 dark:hover:bg-sumi-800"
          >
            ✕ Thoát
          </button>
        </div>
      </div>

      {/* ── Tiêu đề tình huống + thống kê ── */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black tracking-wide text-torii-600 dark:bg-rose-950/50 dark:text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            SURVIVAL MODE · TÌNH HUỐNG THỰC TẾ
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl leading-tight">
            {scenarioNo}. {activeScenario.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{activeScenario.description}</p>
        </div>

        <div className="flex flex-wrap items-stretch gap-3">
          {/* Bước */}
          <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-sumi-900/90 min-w-[140px]">
            <div className="flex items-center">
              {steps.map((_, i) => {
                const done = isCompleted || i < currentStepIndex || (i === currentStepIndex && phase === "feedback");
                const current = i === currentStepIndex && !done;
                return (
                  <span key={i} className="flex items-center">
                    <span
                      className={`block h-3 w-3 rounded-full border-2 transition ${
                        done
                          ? "border-torii-600 bg-torii-600"
                          : current
                          ? "border-torii-600 bg-torii-600 ring-4 ring-torii-600/20"
                          : "border-slate-300 bg-white dark:border-slate-600 dark:bg-sumi-900"
                      }`}
                    />
                    {i < steps.length - 1 && (
                      <span className={`block h-0.5 w-6 ${done ? "bg-torii-600" : "bg-slate-300 dark:bg-slate-600"}`} />
                    )}
                  </span>
                );
              })}
              <span className="text-lg leading-none text-torii-600 ml-1" aria-hidden>⛩</span>
            </div>
            <p className="mt-2 text-xs font-bold text-torii-600">
              Bước {Math.min(currentStepIndex + 1, steps.length)} / {steps.length}
            </p>
            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{stepLabel(Math.min(currentStepIndex, steps.length - 1))}</p>
          </div>

          {/* Thiện cảm / Mạng sinh tồn */}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-sm dark:border-slate-800 dark:bg-sumi-900/90 sm:min-w-[104px] sm:px-4 sm:py-3">
            <p className="flex items-center gap-1 text-lg font-black text-slate-900 dark:text-white sm:text-xl" aria-label={`${hearts}/3 thiện cảm`}>
              {[1, 2, 3].map((idx) => (
                <span key={idx} aria-hidden className={idx <= hearts ? "text-rose-500" : "opacity-25 grayscale"}>
                  ❤️
                </span>
              ))}
            </p>
            <p className="text-xs text-slate-500">Thiện cảm</p>
          </div>

          {/* Combo */}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-sm dark:border-slate-800 dark:bg-sumi-900/90 sm:min-w-[104px] sm:px-4 sm:py-3">
            <p className="flex items-center gap-1.5 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
              <span aria-hidden>🔥</span>
              {combo}
            </p>
            <p className="text-xs text-slate-500">Combo lịch sự</p>
          </div>

          {/* XP */}
          <div className="flex min-w-[104px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-sumi-900/90">
            <p className="flex items-center gap-1.5 text-2xl font-black text-slate-900 dark:text-white">
              <span className="text-amber-500" aria-hidden>★</span>
              {totalScore} XP
            </p>
            <p className="text-xs text-slate-500">Tổng điểm</p>
          </div>
        </div>
      </div>

      {/* ── Lưới chính: trái (cảnh + đáp án) / phải (sidebar) ── */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {/* Cảnh hội thoại */}
          <div
            className={`relative min-h-[360px] overflow-hidden rounded-3xl bg-gradient-to-br shadow-xl ring-1 ring-white/30 sm:min-h-[420px] lg:min-h-[480px] ${activeScenario.bgGradient}`}
          >
            <SafeImg
              src={lessonImg(activeScenario.slug)}
              alt={activeScenario.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />

            <span className="absolute left-4 top-4 inline-flex max-w-[70%] items-center gap-1.5 rounded-full border border-white/40 bg-black/30 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              <span aria-hidden>📍</span>
              <span className="truncate">{activeScenario.locationName}</span>
            </span>

            {/* Nhân vật */}
            <div className="pointer-events-none absolute bottom-0 left-2 flex h-[72%] items-end sm:left-8 sm:h-[88%]">
              <SafeImg
                key={activeScenario.slug}
                src={characterImg(activeScenario.slug)}
                alt={currentStep.npcSpeaker}
                className="h-full w-auto max-w-[48vw] object-contain object-bottom drop-shadow-2xl sm:max-w-[40vw] lg:max-w-[360px]"
                fallback={
                  <span className="select-none text-[96px] leading-none drop-shadow-2xl sm:text-[150px] lg:text-[210px]" aria-hidden>
                    {currentStep.npcAvatar}
                  </span>
                }
              />
            </div>

            {/* Bong bóng thoại */}
            <div className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-1/2 sm:w-[50%] sm:-translate-y-1/2">
              <div
                key={`${currentStepIndex}-${phase}`}
                className="relative rounded-3xl bg-white/95 p-5 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95 duration-200 dark:bg-sumi-900/95 sm:before:absolute sm:before:-left-2 sm:before:top-1/2 sm:before:h-4 sm:before:w-4 sm:before:-translate-y-1/2 sm:before:rotate-45 sm:before:bg-white/95 sm:dark:before:bg-sumi-900/95 sm:before:content-['']"
              >
                {phase === "choose" || !picked ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-torii-600 dark:text-rose-300">{currentStep.npcSpeaker}</p>
                      <SpeakerButton onClick={() => speak(currentStep.npcJapanese)} label="Nghe lại câu thoại" />
                    </div>
                    <p className="jp-text mt-2 text-xl font-black leading-snug text-slate-900 dark:text-white sm:text-2xl">
                      {currentStep.npcJapanese}
                    </p>
                    {showHints && (
                      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <p className="text-xs font-semibold text-sakura-600 dark:text-sakura-400">{currentStep.npcRomaji}</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{currentStep.npcMeaning}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-torii-600 dark:text-rose-300">{currentStep.npcSpeaker} phản hồi</p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                      💡 {picked.npcFeedback}
                    </p>
                    <div className="mt-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-sumi-800/80 dark:text-slate-300">
                      <span className="font-bold text-slate-800 dark:text-white">📖 Giải thích ngữ vực: </span>
                      {picked.knowledgeNote ??
                        (picked.politeness === "POLITE"
                          ? "Bạn dùng Thể lịch sự (丁寧語 — です/ます) hoặc Kính ngữ (敬語), chuẩn mực và an toàn trong giao tiếp đời sống tại Nhật."
                          : picked.politeness === "CASUAL"
                          ? "Bạn dùng Thể thông thường (タメ口), hơi suồng sã khi nói với nhân viên hoặc người lạ nhưng vẫn truyền đạt được ý."
                          : "Cách nói trống không hoặc mệnh lệnh (RUDE) dễ gây mất thiện cảm nghiêm trọng trong văn hóa giao tiếp Nhật Bản (-1 ❤️).")}
                    </div>
                    <p
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                        picked.score >= 80
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      +{picked.score} điểm {picked.politeness === "RUDE" || picked.score < 50 ? "· -1 ❤️ Thiện cảm" : ""}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Khung đáp án */}
          {!isCompleted ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-sumi-900/90 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                  <span className="text-torii-600" aria-hidden>🙋</span> Hãy chọn câu trả lời của bạn:
                </h2>
                <div className="flex items-center gap-2">
                  {micSupported && (
                    <button
                      type="button"
                      onClick={toggleMic}
                      disabled={phase !== "choose"}
                      className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                        isListening
                          ? "animate-pulse border-red-400 bg-red-500 text-white"
                          : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-sumi-800 dark:text-slate-300"
                      }`}
                    >
                      {isListening ? "🔴 Đang nghe..." : "🎙️ Nói tiếng Nhật"}
                    </button>
                  )}
                  <span className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-700 sm:inline-block">
                    ⓘ Bạn sẽ nhận phản hồi ngay sau khi chọn.
                  </span>
                </div>
              </div>

              <div className="space-y-3" role="list">
                {currentStep.choices.map((choice, i) => {
                  const tag = POLITENESS_TAG[choice.politeness];
                  const isPicked = picked === choice;
                  const isIdealRevealed = revealed && choice.score === idealScore;
                  const stateCls = isPicked
                    ? choice.score >= 80
                      ? "border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-900"
                      : "border-amber-400 bg-amber-50/70 ring-2 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900"
                    : isIdealRevealed
                    ? "border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-900"
                    : "border-slate-200 bg-white hover:border-torii-500 hover:bg-rose-50/40 dark:border-slate-700 dark:bg-sumi-900 dark:hover:bg-sumi-800";

                  return (
                    <div
                      key={i}
                      role="listitem"
                      className={`flex items-center gap-2 rounded-2xl border-2 pr-3 transition ${stateCls} ${
                        phase === "feedback" && !isPicked ? "opacity-50" : ""
                      }`}
                    >
                      <button
                        type="button"
                        disabled={phase !== "choose"}
                        onClick={() => handleChoose(choice)}
                        className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 text-left sm:flex-row sm:items-center sm:gap-4"
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                              isPicked || isIdealRevealed
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-600 dark:bg-sumi-800 dark:text-slate-300"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="jp-text block text-base font-black text-slate-900 dark:text-white sm:text-lg">
                              {choice.textJa}
                            </span>
                            {showHints && (
                              <span className="block text-xs text-slate-500 dark:text-slate-400">({choice.textRomaji})</span>
                            )}
                          </span>
                        </span>
                        {showHints && (
                          <span className="text-sm text-slate-600 dark:text-slate-400 sm:max-w-[34%]">{choice.textVi}</span>
                        )}
                        <span
                          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${tag.cls}`}
                        >
                          {isIdealRevealed && !isPicked ? "✓ Đáp án tốt nhất" : tag.label}
                        </span>
                      </button>
                      <SpeakerButton onClick={() => speak(choice.textJa)} label="Nghe câu trả lời" />
                    </div>
                  );
                })}
              </div>

              {/* Gợi ý */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-2.5 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
                <p className="min-w-0 text-slate-600 dark:text-slate-300">
                  <span className="mr-2 font-black text-amber-600">💡 Gợi ý</span>
                  {meta.tip ?? DEFAULT_TIP}
                </p>
                <button
                  type="button"
                  disabled={phase !== "choose" || revealed}
                  onClick={() => {
                    playClick();
                    setRevealed(true);
                  }}
                  className="shrink-0 font-bold text-torii-600 transition hover:underline disabled:opacity-50 dark:text-rose-300"
                >
                  {revealed ? "Đã hiện đáp án" : "Bỏ qua và xem đáp án →"}
                </button>
              </div>
            </div>
          ) : isFailed ? (
            <Card className="space-y-4 border-2 border-rose-400 p-8 text-center dark:border-rose-800">
              <div className="text-6xl">💦🙇‍♂️</div>
              <Badge variant="torii">Chưa Vượt Qua Thử Thách</Badge>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Điểm Phản Xạ: {finalPercentage}% · Thiện cảm: {hearts}/3 ❤️
              </h3>
              <p className="mx-auto max-w-md text-sm text-slate-600 dark:text-slate-400">
                {hearts <= 0
                  ? "Bạn đã chọn nhiều phương án thiếu lịch sự khiến đối phương bối rối. Trong văn hóa Nhật Bản, hãy ưu tiên thể Lịch sự (丁寧語) hoặc Kính ngữ (敬語) khi giao tiếp với người lạ và cấp trên."
                  : "Bạn cần đạt tối thiểu 60% điểm phản xạ và giữ còn ít nhất 1 ❤️ thiện cảm để hoàn thành tình huống này."}
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button variant="sakura" onClick={() => startScenario(activeScenario)} className="px-8 font-bold">
                  🔄 Thử lại tình huống này
                </Button>
                <Button variant="secondary" onClick={exitScenario}>
                  Quay lại danh sách
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="space-y-4 border-2 border-emerald-400 p-8 text-center dark:border-emerald-800">
              <div className="animate-bounce text-6xl">🎌✨🍜</div>
              <Badge variant="matcha">Hoàn Thành Xuất Sắc</Badge>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Khả Năng Phản Xạ:{" "}
                {finalPercentage >= 90 ? "Hạng S (Xuất Chúng)" : finalPercentage >= 75 ? "Hạng A (Chuẩn Bản Xứ)" : "Hạng B (Đạt Yêu Cầu)"}!
              </h3>
              <p className="mx-auto max-w-md text-sm text-slate-600 dark:text-slate-400">
                Bạn đã xử lý tình huống giao tiếp đời thực rất trôi chảy và tự tin ({finalPercentage}% · {hearts}/3 ❤️).
              </p>
              <div className="inline-block rounded-2xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-base font-black text-amber-800 shadow-sm dark:bg-amber-950 dark:text-amber-300">
                ✨ +{activeScenario.xpReward} XP Đã Nhận
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button variant="secondary" onClick={() => startScenario(activeScenario)}>
                  🔄 Chơi lại
                </Button>
                <Button variant="sakura" loading={submitting} onClick={exitScenario} className="px-8 font-bold">
                  Hoàn thành thử thách 🏁
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          <Card className="!p-5">
            <SideTitle icon="◎">Mục tiêu hội thoại</SideTitle>
            <p className="pl-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{meta.objective}</p>
          </Card>

          <Card className="!p-5">
            <SideTitle icon="食">Tiến độ tình huống</SideTitle>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-sumi-800">
                <div
                  className="h-full rounded-full bg-torii-600 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">
                {isCompleted ? steps.length : currentStepIndex + 1} / {steps.length}
              </span>
            </div>
            <ol className="space-y-1.5">
              {steps.map((_, i) => {
                const done = isCompleted || i < currentStepIndex;
                const current = !isCompleted && i === currentStepIndex;
                return (
                  <li
                    key={i}
                    aria-current={current ? "step" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                      current
                        ? "bg-rose-50 font-semibold text-torii-600 dark:bg-rose-950/40 dark:text-rose-300"
                        : done
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                        current
                          ? "border-torii-600 bg-torii-600 text-white"
                          : done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    {stepLabel(i)}
                  </li>
                );
              })}
            </ol>
          </Card>

          {meta.vocab.length > 0 && (
            <Card className="!p-5">
              <SideTitle icon="📖">Từ vựng hữu ích</SideTitle>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {meta.vocab.map((v) => (
                  <li key={v.ja} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="jp-text text-base font-black text-slate-900 dark:text-white">{v.ja}</p>
                      <p className="text-xs text-slate-500">({v.romaji})</p>
                    </div>
                    <p className="max-w-[40%] text-right text-xs text-slate-600 dark:text-slate-400">{v.vi}</p>
                    <SpeakerButton onClick={() => speak(v.say ?? v.ja)} label={`Nghe: ${v.ja}`} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}