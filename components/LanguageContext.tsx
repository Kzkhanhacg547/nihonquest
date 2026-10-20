"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type NativeLanguage =
  | "vi"
  | "en"
  | "zh-CN"
  | "zh-TW"
  | "ko"
  | "es"
  | "fr"
  | "de"
  | "id"
  | "th"
  | "ru"
  | "pt";

export interface NativeLanguageInfo {
  code: NativeLanguage;
  name: string;
  nativeName: string;
  flag: string;
  short: string;
  speechLang: string; // BCP 47 code for speech recognition and synthesis
}

export const SUPPORTED_LANGUAGES: NativeLanguageInfo[] = [
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", short: "VI", speechLang: "vi-VN" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", short: "EN", speechLang: "en-US" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳", short: "简", speechLang: "zh-CN" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼", short: "繁", speechLang: "zh-TW" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", short: "KO", speechLang: "ko-KR" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", short: "ES", speechLang: "es-ES" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", short: "FR", speechLang: "fr-FR" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", short: "DE", speechLang: "de-DE" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", short: "ID", speechLang: "id-ID" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭", short: "TH", speechLang: "th-TH" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", short: "RU", speechLang: "ru-RU" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", short: "PT", speechLang: "pt-BR" },
];

interface LanguageContextType {
  nativeLanguage: NativeLanguage;
  setNativeLanguage: (lang: NativeLanguage) => void;
  langInfo: NativeLanguageInfo;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const DICTIONARY: Record<NativeLanguage, Record<string, string>> = {
  vi: {
    nativeLangTitle: "Ngôn ngữ mẹ đẻ",
    nativeLangSubtitle: "Giải thích ngữ pháp, từ vựng và AI Sensei sẽ theo ngôn ngữ này",
    aiAssistant: "Trợ lý AI Kawaii Sensei",
    todayStudyTip: "Hôm nay tôi nên học gì?",
    checkSrsCards: "Kiểm tra thẻ ôn tập SRS",
    explainGrammar: "Giải thích ngữ pháp",
    practiceSpeaking: "Luyện phản xạ giao tiếp",
    fixMistakes: "Khắc phục lỗi sai",
    srsDueAlert: "thẻ từ vựng cần ôn tập hôm nay!",
    streakAlert: "Duy trì chuỗi học tập hôm nay để bảo toàn Streak!",
    sendReminderBtn: "Gửi nhắc nhở qua Email",
    reminderSent: "Hệ thống đã gửi email nhắc nhở học tập đến hộp thư của bạn!",
    dailyGoal: "Mục tiêu ngày",
    voiceChatStart: "Nhấn để nói chuyện với Sensei",
    voiceChatStop: "Đang lắng nghe...",
    autoSpeechOn: "Tự động phát âm: Bật",
    autoSpeechOff: "Tự động phát âm: Tắt",
  },
  en: {
    nativeLangTitle: "Native Language",
    nativeLangSubtitle: "Grammar, vocabulary and AI Sensei explanations will be in this language",
    aiAssistant: "Kawaii Sensei AI Assistant",
    todayStudyTip: "What should I study today?",
    checkSrsCards: "Check SRS review cards",
    explainGrammar: "Explain grammar points",
    practiceSpeaking: "Practice speaking",
    fixMistakes: "Fix my mistakes",
    srsDueAlert: "SRS flashcard(s) due for review today!",
    streakAlert: "Keep your daily streak alive today!",
    sendReminderBtn: "Send study reminder via email",
    reminderSent: "Study reminder email sent to your inbox!",
    dailyGoal: "Daily Goal",
    voiceChatStart: "Click to speak with Sensei",
    voiceChatStop: "Listening to your voice...",
    autoSpeechOn: "Auto speech: ON",
    autoSpeechOff: "Auto speech: OFF",
  },
  "zh-CN": {
    nativeLangTitle: "母语设置",
    nativeLangSubtitle: "语法、词汇解析和 AI Sensei 教学将使用此语言",
    aiAssistant: "Kawaii Sensei AI 学习助手",
    todayStudyTip: "今天我应该学习什么？",
    checkSrsCards: "检查 SRS 复习卡片",
    explainGrammar: "解析核心语法",
    practiceSpeaking: "日常日语会话练习",
    fixMistakes: "错题诊断与辅导",
    srsDueAlert: "张复习卡片今日到期！",
    streakAlert: "今天请继续学习以保持连续打卡！",
    sendReminderBtn: "发送邮件学习提醒",
    reminderSent: "学习提醒邮件已发送至您的邮箱！",
    dailyGoal: "每日目标",
    voiceChatStart: "点击与 Sensei 语音交流",
    voiceChatStop: "正在倾听您的声音...",
    autoSpeechOn: "自动语音朗读：开启",
    autoSpeechOff: "自动语音朗读：关闭",
  },
  "zh-TW": {
    nativeLangTitle: "母語設定",
    nativeLangSubtitle: "文法、單字解析與 AI Sensei 教學將使用此語言",
    aiAssistant: "Kawaii Sensei AI 學習助手",
    todayStudyTip: "今天我應該學習什麼？",
    checkSrsCards: "檢查 SRS 複習卡片",
    explainGrammar: "解析核心文法",
    practiceSpeaking: "日常日語會話練習",
    fixMistakes: "錯題診斷與輔導",
    srsDueAlert: "張複習卡片今日到期！",
    streakAlert: "今天請繼續學習以保持連續打卡！",
    sendReminderBtn: "發送郵件學習提醒",
    reminderSent: "學習提醒郵件已發送至您的信箱！",
    dailyGoal: "每日目標",
    voiceChatStart: "點擊與 Sensei 語音交流",
    voiceChatStop: "正在聆聽您的聲音...",
    autoSpeechOn: "自動語音朗讀：開啟",
    autoSpeechOff: "自動語音朗讀：關閉",
  },
  ko: {
    nativeLangTitle: "모국어 설정",
    nativeLangSubtitle: "문법 및 어휘 설명과 AI Sensei 지도가 이 언어로 진행됩니다",
    aiAssistant: "Kawaii Sensei AI 학습 도우미",
    todayStudyTip: "오늘 무엇을 공부해야 할까요?",
    checkSrsCards: "SRS 복습 카드 확인",
    explainGrammar: "문법 핵심 설명",
    practiceSpeaking: "회화 말하기 연습",
    fixMistakes: "틀린 문제 교정 및 복습",
    srsDueAlert: "장의 복습 카드가 대기 중입니다!",
    streakAlert: "연속 학습 스트릭을 유지하세요!",
    sendReminderBtn: "이메일 알림 발송",
    reminderSent: "학습 알림 이메일이 전송되었습니다!",
    dailyGoal: "일일 목표",
    voiceChatStart: "음성으로 대화하기",
    voiceChatStop: "음성을 듣고 있습니다...",
    autoSpeechOn: "자동 음성 읽기: 켜짐",
    autoSpeechOff: "자동 음성 읽기: 꺼짐",
  },
  es: {
    nativeLangTitle: "Idioma Materno",
    nativeLangSubtitle: "Las explicaciones de gramática, vocabulario y Sensei serán en este idioma",
    aiAssistant: "Asistente AI Kawaii Sensei",
    todayStudyTip: "¿Qué debería estudiar hoy?",
    checkSrsCards: "Revisar tarjetas SRS",
    explainGrammar: "Explicar gramática",
    practiceSpeaking: "Practicar conversación",
    fixMistakes: "Corregir mis errores",
    srsDueAlert: "tarjeta(s) listas para repasar hoy!",
    streakAlert: "¡Mantén viva tu racha de estudio hoy!",
    sendReminderBtn: "Enviar recordatorio por correo",
    reminderSent: "¡Correo de recordatorio enviado a tu bandeja!",
    dailyGoal: "Meta Diaria",
    voiceChatStart: "Toca para hablar con Sensei",
    voiceChatStop: "Escuchando tu voz...",
    autoSpeechOn: "Voz automática: ACTIVADA",
    autoSpeechOff: "Voz automática: DESACTIVADA",
  },
  fr: {
    nativeLangTitle: "Langue Maternelle",
    nativeLangSubtitle: "La grammaire, le vocabulaire et les explications de Sensei seront dans cette langue",
    aiAssistant: "Assistant AI Kawaii Sensei",
    todayStudyTip: "Que devrais-je étudier aujourd'hui ?",
    checkSrsCards: "Vérifier les cartes SRS",
    explainGrammar: "Expliquer la grammaire",
    practiceSpeaking: "Pratiquer la conversation",
    fixMistakes: "Corriger mes erreurs",
    srsDueAlert: "carte(s) à réviser aujourd'hui !",
    streakAlert: "Gardez votre série d'apprentissage active !",
    sendReminderBtn: "Envoyer un rappel par e-mail",
    reminderSent: "E-mail de rappel envoyé dans votre boîte !",
    dailyGoal: "Objectif Quotidien",
    voiceChatStart: "Appuyez pour parler à Sensei",
    voiceChatStop: "Écoute en cours...",
    autoSpeechOn: "Lecture vocale : ACTIVÉE",
    autoSpeechOff: "Lecture vocale : DÉSACTIVÉE",
  },
  de: {
    nativeLangTitle: "Muttersprache",
    nativeLangSubtitle: "Grammatik, Wortschatz und Sensei-Erklärungen erfolgen in dieser Sprache",
    aiAssistant: "Kawaii Sensei AI Assistent",
    todayStudyTip: "Was soll ich heute lernen?",
    checkSrsCards: "SRS-Karten prüfen",
    explainGrammar: "Grammatik erklären",
    practiceSpeaking: "Gespräch üben",
    fixMistakes: "Meine Fehler korrigieren",
    srsDueAlert: "Karte(n) heute fällig zum Wiederholen!",
    streakAlert: "Halte deinen Lern-Streak heute aktiv!",
    sendReminderBtn: "Lern-Erinnerung per E-Mail senden",
    reminderSent: "Erinnerungs-E-Mail wurde gesendet!",
    dailyGoal: "Tagesziel",
    voiceChatStart: "Klicken, um mit Sensei zu sprechen",
    voiceChatStop: "Höre zu...",
    autoSpeechOn: "Automatische Sprache: AN",
    autoSpeechOff: "Automatische Sprache: AUS",
  },
  id: {
    nativeLangTitle: "Bahasa Ibu",
    nativeLangSubtitle: "Tata bahasa, kosakata, dan panduan Sensei akan disajikan dalam bahasa ini",
    aiAssistant: "Asisten AI Kawaii Sensei",
    todayStudyTip: "Apa yang harus saya pelajari hari ini?",
    checkSrsCards: "Cek kartu ulasan SRS",
    explainGrammar: "Jelaskan tata bahasa",
    practiceSpeaking: "Latihan percakapan",
    fixMistakes: "Perbaiki kesalahan saya",
    srsDueAlert: "kartu siap diulang hari ini!",
    streakAlert: "Pertahankan streak belajar Anda hari ini!",
    sendReminderBtn: "Kirim pengingat lewat email",
    reminderSent: "Email pengingat belajar telah dikirim!",
    dailyGoal: "Target Harian",
    voiceChatStart: "Ketuk untuk bicara dengan Sensei",
    voiceChatStop: "Mendengarkan suara Anda...",
    autoSpeechOn: "Suara otomatis: NYALA",
    autoSpeechOff: "Suara otomatis: MATI",
  },
  th: {
    nativeLangTitle: "ภาษาแม่",
    nativeLangSubtitle: "ไวยากรณ์ คำศัพท์ และคำแนะนำของ Sensei จะอธิบายเป็นภาษานี้",
    aiAssistant: "ผู้ช่วย AI Kawaii Sensei",
    todayStudyTip: "วันนี้ฉันควรเรียนอะไรดี?",
    checkSrsCards: "ตรวจสอบการ์ดทบทวน SRS",
    explainGrammar: "อธิบายไวยากรณ์",
    practiceSpeaking: "ฝึกสนทนาภาษาญี่ปุ่น",
    fixMistakes: "แก้ไขข้อผิดพลาดของฉัน",
    srsDueAlert: "การ์ดครบกำหนดทบทวนวันนี้!",
    streakAlert: "รักษา streak การเรียนของคุณในวันนี้!",
    sendReminderBtn: "ส่งอีเมลแจ้งเตือนการเรียน",
    reminderSent: "ส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว!",
    dailyGoal: "เป้าหมายประจำวัน",
    voiceChatStart: "แตะเพื่อพูดคุยกับ Sensei",
    voiceChatStop: "กำลังฟังเสียงของคุณ...",
    autoSpeechOn: "เสียงพูดอัตโนมัติ: เปิด",
    autoSpeechOff: "เสียงพูดอัตโนมัติ: ปิด",
  },
  ru: {
    nativeLangTitle: "Родной язык",
    nativeLangSubtitle: "Грамматика, словарь и подсказки Sensei будут на этом языке",
    aiAssistant: "AI-ассистент Kawaii Sensei",
    todayStudyTip: "Что мне выучить сегодня?",
    checkSrsCards: "Проверить карточки SRS",
    explainGrammar: "Объяснить грамматику",
    practiceSpeaking: "Практиковать диалог",
    fixMistakes: "Исправить мои ошибки",
    srsDueAlert: "карточек ждут повторения сегодня!",
    streakAlert: "Сохраните вашу серию обучения сегодня!",
    sendReminderBtn: "Отправить напоминание на почту",
    reminderSent: "Письмо с напоминанием отправлено на почту!",
    dailyGoal: "Цель на день",
    voiceChatStart: "Нажмите, чтобы говорить с Sensei",
    voiceChatStop: "Слушаю ваш голос...",
    autoSpeechOn: "Автоозвучка: ВКЛ",
    autoSpeechOff: "Автоозвучка: ВЫКЛ",
  },
  pt: {
    nativeLangTitle: "Idioma Nativo",
    nativeLangSubtitle: "Gramática, vocabulário e explicações do Sensei estarão neste idioma",
    aiAssistant: "Assistente AI Kawaii Sensei",
    todayStudyTip: "O que devo estudar hoje?",
    checkSrsCards: "Verificar cartões SRS",
    explainGrammar: "Explicar gramática",
    practiceSpeaking: "Praticar conversação",
    fixMistakes: "Corrigir meus erros",
    srsDueAlert: "cartão(ões) para revisar hoje!",
    streakAlert: "Mantenha sua sequência diária ativa!",
    sendReminderBtn: "Enviar lembrete por e-mail",
    reminderSent: "E-mail de lembrete enviado para sua caixa de entrada!",
    dailyGoal: "Meta Diária",
    voiceChatStart: "Toque para falar com o Sensei",
    voiceChatStop: "Ouvindo sua voz...",
    autoSpeechOn: "Áudio automático: LIGADO",
    autoSpeechOff: "Áudio automático: DESLIGADO",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [nativeLanguage, setNativeLanguageState] = useState<NativeLanguage>("vi");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nq_native_language") as NativeLanguage | null;
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        setNativeLanguageState(stored);
      }
    } catch {
      // Ignore
    }
  }, []);

  const setNativeLanguage = useCallback((lang: NativeLanguage) => {
    setNativeLanguageState(lang);
    try {
      localStorage.setItem("nq_native_language", lang);
    } catch {
      // Ignore
    }
  }, []);

  const langInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === nativeLanguage) || SUPPORTED_LANGUAGES[0];

  const t = useCallback(
    (key: string): string => {
      return DICTIONARY[nativeLanguage]?.[key] || DICTIONARY.vi[key] || DICTIONARY.en[key] || key;
    },
    [nativeLanguage]
  );

  return (
    <LanguageContext.Provider value={{ nativeLanguage, setNativeLanguage, langInfo, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useNativeLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      nativeLanguage: "vi" as NativeLanguage,
      setNativeLanguage: () => {},
      langInfo: SUPPORTED_LANGUAGES[0],
      t: (key: string) => DICTIONARY.vi[key] || key,
    };
  }
  return ctx;
}
