"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserProgress } from "@/components/UserProgressContext";
import { useNativeLanguage, SUPPORTED_LANGUAGES, type NativeLanguage } from "@/components/LanguageContext";
import { useSoundAndTheme } from "@/components/SoundAndThemeContext";
import { BASE64_IMAGES } from "@/lib/assets/base64Images";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function KawaiiSenseiBubble() {
  const pathname = usePathname();
  const { progress } = useUserProgress();
  const { nativeLanguage, setNativeLanguage, langInfo, t } = useNativeLanguage();
  const { playClick, speak, speakingText, showToast } = useSoundAndTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [character, setCharacter] = useState<"aoi" | "ren">("aoi");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Chat Voice State (STT & TTS)
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceInputLang, setVoiceInputLang] = useState<"ja" | "native">("ja");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load autoSpeak preference
  useEffect(() => {
    try {
      const savedAutoSpeak = localStorage.getItem("nq_sensei_autospeak");
      if (savedAutoSpeak !== null) {
        setAutoSpeak(savedAutoSpeak === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleAutoSpeak = () => {
    const nextVal = !autoSpeak;
    setAutoSpeak(nextVal);
    playClick();
    try {
      localStorage.setItem("nq_sensei_autospeak", String(nextVal));
    } catch {
      // Ignore
    }
    showToast({
      title: nextVal ? "🔊 Tự động phát âm: BẬT" : "🔇 Tự động phát âm: TẮT",
      type: "info",
    });
  };

  // Initial greeting tailored to user progress & mistakes
  useEffect(() => {
    if (messages.length === 0) {
      const isEn = nativeLanguage === "en";
      const streak = progress?.currentStreak ?? 0;
      const dueCards = progress?.stats?.dueReviewCount ?? 0;
      const level = progress?.learningLevel || "N5";

      let greetingContent = "";
      if (isEn) {
        greetingContent = `Konnichiwa! I'm Aoi Sensei, your personal Japanese learning assistant 🌸\n\nI see you are on **JLPT ${level}** with a **${streak}-day streak** 🔥\n${
          dueCards > 0
            ? `⏰ You have **${dueCards} SRS flashcards** ready for review today!`
            : "✨ Great job! No pending SRS cards today."
        }\n\nAsk me anything! I can give daily study guidance, diagnose and fix your mistakes, or practice voice conversation! 🎙️`;
      } else {
        greetingContent = `Konnichiwa! Sensei chào bạn nhé 🌸 Mình là trợ lý học tập cá nhân của bạn tại Nihon Quest.\n\nSensei thấy bạn đang học **JLPT ${level}**, duy trì chuỗi **${streak} ngày Streak** 🔥\n${
          dueCards > 0
            ? `⏰ Hiện đang có **${dueCards} thẻ từ vựng SRS** đến hạn ôn tập hôm nay đấy!`
            : "✨ Tuyệt vời! Bạn không còn thẻ SRS nào bị nợ hôm nay."
        }\n\nBạn có thể hỏi Sensei về kế hoạch học hôm nay, nhờ Sensei phân tích & khắc phục lỗi sai, hoặc bấm biểu tượng mic 🎙️ để luyện nói chuyện nhé!`;
      }

      setMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content: greetingContent,
          timestamp: new Date(),
        },
      ]);
    }
  }, [progress, nativeLanguage, messages.length]);

  // Voice Input (Speech-to-Text / STT)
  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast({
        title: "Trình duyệt không hỗ trợ nhận diện giọng nói",
        description: "Vui lòng sử dụng Google Chrome hoặc Edge để dùng voice chat.",
        type: "error",
      });
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRec();
      recognition.lang = voiceInputLang === "ja" ? "ja-JP" : (langInfo.speechLang || "vi-VN");
      recognition.continuous = false;
      recognition.interimResults = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((res: any) => res[0]?.transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      playClick();
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    playClick();
    setInput("");
    setHasInteracted(true);
    if (isListening) stopListening();

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          scenarioId: "assistant_guide",
          nativeLanguage,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối tới Sensei");
      }

      const data = await res.json();
      const assistantText =
        data?.message?.content || data?.response || "Sensei đang bận một chút, bạn thử lại sau nhé!";

      setMessages((prev) => [
        ...prev,
        {
          id: "a-" + Date.now(),
          role: "assistant",
          content: assistantText,
          timestamp: new Date(),
        },
      ]);

      // If auto-speech is enabled, speak out Japanese response
      if (autoSpeak) {
        const jaPart = assistantText.split("\n\n*")[0] || assistantText;
        speak(jaPart);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content:
            nativeLanguage === "en"
              ? "Gomen ne! I had trouble connecting. Please try again!"
              : "Gomen ne! Sensei gặp chút trục trặc kết nối, bạn thử lại nhé!",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionKey: string) => {
    const isEn = nativeLanguage === "en";
    let prompt = "";
    if (actionKey === "recommend") {
      prompt = isEn
        ? "What should I study today based on my progress?"
        : "Hôm nay tôi nên học gì dựa trên tiến trình của mình?";
    } else if (actionKey === "mistakes") {
      prompt = isEn
        ? "Sensei, what are my recent mistakes and weak points? Please help me fix them!"
        : "Sensei ơi, em gần đây hay làm sai những chỗ nào? Hãy phân tích lỗi sai và hướng dẫn em cách khắc phục với!";
    } else if (actionKey === "srs") {
      prompt = isEn
        ? "How many vocabulary cards do I need to review in SRS today?"
        : "Kiểm tra giúp tôi các thẻ từ vựng cần ôn tập SRS hôm nay.";
    } else if (actionKey === "grammar") {
      prompt = isEn
        ? "Explain the key grammar points for my level in Japanese."
        : "Giải thích giúp tôi cấu trúc ngữ pháp thông dụng cấp độ hiện tại.";
    } else if (actionKey === "conversation") {
      prompt = isEn
        ? "Let's practice a casual Japanese conversation!"
        : "Chúng ta cùng luyện phản xạ đối thoại tiếng Nhật nhé!";
    }
    handleSendMessage(prompt);
  };

  const currentPortrait =
    character === "aoi" ? BASE64_IMAGES.aoiPortrait : BASE64_IMAGES.renPortrait;

  const isFullSenseiPage = pathname === "/app/sensei";

  return (
    <>
      {/* ================= FLOATING CIRCULAR BUBBLE BUTTON ================= */}
      {!isFullSenseiPage && (
        <aside
          aria-label="Kawaii Sensei Assistant"
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 select-none flex flex-col items-end gap-2"
        >
          {/* Unread / Attention mini pill */}
          {!isOpen && !hasInteracted && (progress?.stats?.dueReviewCount ?? 0) > 0 && (
            <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg border border-white/20 animate-bounce flex items-center gap-1.5 pointer-events-none">
              <span>🌸</span>
              <span>{progress?.stats?.dueReviewCount} thẻ SRS cần ôn!</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              playClick();
              setIsOpen(!isOpen);
            }}
            aria-label="Mở trợ lý AI Kawaii Sensei"
            className={`group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-[0_8px_30px_rgba(225,29,72,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-400/50 ${
              isOpen
                ? "bg-slate-900 border-2 border-red-500 rotate-90"
                : "bg-gradient-to-br from-rose-500 via-red-600 to-amber-500 border-2 border-white/80"
            }`}
          >
            {isOpen ? (
              <span className="text-white text-xl font-bold">✕</span>
            ) : (
              <>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-white/60">
                  <Image
                    src={currentPortrait}
                    alt="Kawaii Sensei"
                    fill
                    className="object-cover object-top group-hover:scale-110 transition duration-300"
                    sizes="64px"
                    priority
                  />
                </div>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                {/* Voice speech pulse */}
                {speakingText && (
                  <span className="absolute -inset-1 rounded-full border-2 border-red-400 animate-ping opacity-75" />
                )}
              </>
            )}
          </button>
        </aside>
      )}

      {/* ================= CHAT POPUP WINDOW ================= */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Trợ lý AI Kawaii Sensei"
          className="fixed bottom-24 right-4 sm:bottom-24 sm:right-6 z-50 w-[92vw] sm:w-[410px] h-[580px] max-h-[82vh] bg-white dark:bg-sumi-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-rose-200 dark:border-sumi-700 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 p-3.5 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 bg-white/20 shrink-0">
                <Image
                  src={currentPortrait}
                  alt={character === "aoi" ? "Aoi Sensei" : "Ren Sensei"}
                  fill
                  className="object-cover object-top"
                  sizes="40px"
                />
                {speakingText && (
                  <span className="absolute inset-0 bg-red-500/20 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-black text-sm tracking-tight leading-tight">
                  <span>{character === "aoi" ? "Aoi Sensei 🌸" : "Ren Sensei 🦊"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/25 text-white font-bold uppercase">
                    AI Tutor
                  </span>
                </div>
                <div className="text-[11px] text-white/85 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    JLPT {progress?.learningLevel || "N5"} • {progress?.currentStreak ?? 0}🔥
                  </span>
                </div>
              </div>
            </div>

            {/* Header Controls: Voice Toggle, Native Lang Picker & Close */}
            <div className="flex items-center gap-1">
              {/* Voice Auto-Speak Toggle */}
              <button
                type="button"
                onClick={toggleAutoSpeak}
                title={autoSpeak ? "Tắt tự động đọc giọng nói" : "Bật tự động đọc giọng nói của Sensei"}
                className={`p-1.5 rounded-full transition text-xs font-bold ${
                  autoSpeak
                    ? "bg-white text-red-600 shadow-sm"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {autoSpeak ? "🔊" : "🔇"}
              </button>

              {/* Native Language Picker Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1 transition"
                  title="Chọn ngôn ngữ mẹ đẻ giải thích"
                >
                  <span>{langInfo.flag}</span>
                  <span className="text-[11px]">{langInfo.short}</span>
                  <span className="text-[9px] opacity-75">▾</span>
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-sumi-800 rounded-2xl shadow-xl border border-slate-200 dark:border-sumi-700 py-1.5 z-50 max-h-56 overflow-y-auto">
                    <div className="px-3 py-1 text-[10px] font-black uppercase text-slate-400">
                      Ngôn ngữ giải thích (12)
                    </div>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setNativeLanguage(l.code);
                          setShowLangMenu(false);
                          playClick();
                          showToast({
                            title: `Đã đổi ngôn ngữ: ${l.nativeName} ${l.flag}`,
                            type: "info",
                          });
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition ${
                          nativeLanguage === l.code
                            ? "bg-red-50 dark:bg-sumi-700 font-bold text-red-600 dark:text-red-400"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-sumi-750"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span>{l.nativeName}</span>
                        </span>
                        {nativeLanguage === l.code && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Character Switcher */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCharacter(character === "aoi" ? "ren" : "aoi");
                }}
                title="Đổi giáo viên"
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs transition"
              >
                🔄
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsOpen(false);
                }}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Guidance Toolbar */}
          <div className="bg-slate-50 dark:bg-sumi-950 px-3 py-2 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => handleQuickAction("recommend")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 font-bold transition active:scale-95 flex items-center gap-1"
            >
              <span>🧭</span>
              <span>{nativeLanguage === "en" ? "Study Plan" : "Học gì hôm nay"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("mistakes")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 font-bold transition active:scale-95 flex items-center gap-1"
            >
              <span>🔍</span>
              <span>{t("fixMistakes")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("srs")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-sumi-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-red-400 font-semibold transition active:scale-95"
            >
              🗂️ SRS ({progress?.stats?.dueReviewCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("grammar")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-sumi-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-red-400 font-semibold transition active:scale-95"
            >
              💡 {nativeLanguage === "en" ? "Grammar" : "Ngữ pháp"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction("conversation")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-sumi-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-red-400 font-semibold transition active:scale-95"
            >
              🗣️ {nativeLanguage === "en" ? "Voice Chat" : "Đối thoại"}
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-sm">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isUser && (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700 bg-white">
                      <Image
                        src={currentPortrait}
                        alt="Sensei"
                        fill
                        className="object-cover object-top"
                        sizes="28px"
                      />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-[13px] leading-relaxed ${
                      isUser
                        ? "bg-red-600 text-white rounded-tr-none font-medium"
                        : "bg-slate-100 dark:bg-sumi-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60 whitespace-pre-wrap"
                    }`}
                  >
                    <div>{m.content}</div>

                    {!isUser && (
                      <div className="mt-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            const jaPart = m.content.split("\n\n*")[0] || m.content;
                            speak(jaPart);
                          }}
                          className="hover:text-red-500 font-bold flex items-center gap-1 transition"
                          title="Nghe Sensei phát âm"
                        >
                          <span>🔊</span>
                          <span>Nghe đọc</span>
                        </button>
                        <span>
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                  <Image src={currentPortrait} alt="" fill className="object-cover" sizes="24px" />
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-sumi-800 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-75" />
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-150" />
                  <span className="text-[11px] font-bold ml-1 text-slate-500">
                    Sensei đang suy nghĩ & phân tích...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Listening Wave Banner */}
          {isListening && (
            <div className="bg-rose-50 dark:bg-sumi-950 px-3 py-2 border-t border-rose-200 dark:border-rose-900/40 flex items-center justify-between text-xs text-rose-600 font-bold animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span>
                  Đang lắng nghe ({voiceInputLang === "ja" ? "Tiếng Nhật 🇯🇵" : `${langInfo.name} ${langInfo.flag}`})...
                </span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold"
              >
                Dừng mic
              </button>
            </div>
          )}

          {/* Input Box with Voice Mic & Send */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-slate-50 dark:bg-sumi-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5"
          >
            {/* Mic Button (Voice Input) */}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              title={isListening ? "Dừng ghi âm" : "Nói chuyện với Sensei bằng giọng nói"}
              className={`p-2 rounded-xl transition text-sm font-bold flex items-center justify-center shrink-0 ${
                isListening
                  ? "bg-red-600 text-white animate-pulse shadow-md"
                  : "bg-slate-200 dark:bg-sumi-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-sumi-700"
              }`}
            >
              🎙️
            </button>

            {/* Language toggle for Mic */}
            <button
              type="button"
              onClick={() => {
                setVoiceInputLang(voiceInputLang === "ja" ? "native" : "ja");
                playClick();
              }}
              title={`Ngôn ngữ mic: ${voiceInputLang === "ja" ? "Tiếng Nhật" : langInfo.name}`}
              className="text-[10px] font-black px-1.5 py-2 rounded-xl bg-slate-100 dark:bg-sumi-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0"
            >
              {voiceInputLang === "ja" ? "🇯🇵 JA" : langInfo.short}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                nativeLanguage === "en"
                  ? "Ask Sensei about lessons, mistakes, tips..."
                  : "Hỏi Sensei về bài học, lỗi sai, từ vựng hoặc bật mic nói..."
              }
              className="flex-1 bg-white dark:bg-sumi-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-red-400 transition"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm shadow-md transition active:scale-95 shrink-0"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
