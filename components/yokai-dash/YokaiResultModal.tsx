"use client";

import React, { useState } from "react";
import { YokaiGameResult } from "@/lib/yokai-dash/types";
import { Button } from "@/components/ui";

interface YokaiResultModalProps {
  result: YokaiGameResult;
  earnedXP: number;
  newTotalXP?: number;
  newLevel?: number;
  leveledUp?: boolean;
  stamina: number;
  onPlayAgain: () => void;
  onBackToHub: () => void;
}

export function YokaiResultModal({
  result,
  earnedXP,
  newTotalXP,
  newLevel,
  leveledUp,
  stamina,
  onPlayAgain,
  onBackToHub,
}: YokaiResultModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "review">("summary");

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const missedCount = result.answeredQuestions.filter((q) => !q.isCorrect).length;
  const total = result.answeredQuestions.length;
  const ratio = total > 0 ? result.correctCount / total : 0;
  const stars = total === 0 ? 0 : ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;

  return (
    <div className="fixed inset-0 z-[70] yk-ui flex items-center justify-center p-3 sm:p-4 bg-[#050310]/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="yk-frame relative w-full max-w-xl max-h-[92dvh] flex flex-col bg-[linear-gradient(145deg,#12102a,#0a0818_58%,#2a0f24)] border border-amber-300/40 rounded-[1.75rem] shadow-[0_30px_100px_-25px_rgba(0,0,0,0.9)] ring-1 ring-white/10 text-white overflow-hidden">
        <span className="yk-corner-bl" />
        <span className="yk-corner-br" />
        {/* Header Banner */}
        <div
          className={`p-4 sm:p-6 text-center border-b ${
            result.isVictory
              ? "bg-gradient-to-b from-amber-600/30 to-slate-900 border-amber-500/30"
              : "bg-gradient-to-b from-rose-900/30 to-slate-900 border-rose-500/30"
          }`}
        >
          <div className="flex items-end justify-center gap-2 mb-2" aria-label={`${stars} trên 3 sao`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`yk-pop leading-none ${i === 1 ? "text-5xl -translate-y-1" : "text-4xl"} ${
                  i < stars ? "drop-shadow-[0_0_14px_rgba(251,191,36,.9)]" : "grayscale opacity-25"
                }`}
                style={{ animationDelay: `${i * 140}ms` }}
              >
                ⭐
              </span>
            ))}
          </div>
          <h2 className="yk-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {result.isVictory ? "Chinh phục cõi Linh Giới!" : "Kết thúc hành trình"}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            {result.isVictory
              ? "Tuyệt vời! Bạn đã vượt qua tất cả cổng tri thức."
              : "Đã hết 3 tim sinh mệnh. Ôn lại các câu sai để bứt phá lượt sau nhé."}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/25">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
              activeTab === "summary"
                ? "border-amber-400 text-amber-300 bg-white/5"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            📊 Tổng Kết & Phần Thưởng
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "review"
                ? "border-amber-400 text-amber-300 bg-white/5"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span>📖 Ôn Tập Kiến Thức</span>
            {missedCount > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                {missedCount} câu sai
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTab === "summary" ? (
            <div className="space-y-4">
              {/* XP & Level Badge */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[linear-gradient(110deg,rgba(245,158,11,0.16),rgba(244,63,94,0.12),rgba(168,85,247,0.12))] border border-amber-300/30 flex items-center justify-between shadow-inner">
                <div>
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Kinh Nghiệm Nhận Được
                  </div>
                  <div className="yk-display text-4xl font-extrabold text-amber-300 flex items-baseline gap-1 mt-0.5">
                    +{earnedXP} <span className="text-sm font-bold text-white/80">XP</span>
                  </div>
                  {result.isPractice && (
                    <div className="text-xs text-emerald-400 mt-1 font-medium">
                      (Chế độ Luyện tập không tốn thể lực)
                    </div>
                  )}
                </div>
                {leveledUp ? (
                  <div className="text-center bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl font-black text-xs animate-bounce shadow-lg">
                    🌟 LÊN CẤP {newLevel}!
                  </div>
                ) : (
                  newTotalXP && (
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Tổng XP Tài Khoản</div>
                      <div className="text-base font-bold text-white">{newTotalXP.toLocaleString()} XP</div>
                    </div>
                  )
                )}
              </div>

              {/* Match Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.045] border border-white/10 text-center shadow-inner">
                  <div className="text-xs text-slate-400">Điểm số</div>
                  <div className="text-lg font-black text-white mt-0.5">{result.score.toLocaleString()}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.045] border border-white/10 text-center shadow-inner">
                  <div className="text-xs text-slate-400">Quãng đường</div>
                  <div className="text-lg font-black text-white mt-0.5">{result.distance}m</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.045] border border-white/10 text-center shadow-inner">
                  <div className="text-xs text-slate-400">Combo tối đa</div>
                  <div className="text-lg font-black text-amber-400 mt-0.5">🔥 x{result.maxCombo}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.045] border border-white/10 text-center shadow-inner">
                  <div className="text-xs text-slate-400">Chính xác</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    {result.correctCount}/{result.answeredQuestions.length}
                  </div>
                </div>
              </div>

              {/* SRS Integration Note */}
              {missedCount > 0 ? (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3">
                  <span className="text-xl">⛩️</span>
                  <div className="text-xs text-slate-300">
                    <b className="text-rose-300">{missedCount} câu trả lời chưa đúng</b> đã tự động được thêm
                    vào hàng đợi <b>Ôn tập thông minh (SRS)</b> của Nihon Quest. Bạn có thể ôn lại bất cứ lúc nào!
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                  <span className="text-xl">✨</span>
                  <div className="text-xs text-slate-300">
                    <b className="text-emerald-300">Thần thái phi phàm!</b> Bạn đã trả lời đúng tất cả các câu
                    hỏi trong lượt chạy này.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Review Tab */
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Chi tiết các câu hỏi trong lượt chạy vừa rồi. Bấm biểu tượng 🔊 để nghe phát âm tiếng Nhật chuẩn:
              </p>
              {result.answeredQuestions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Chưa trả lời câu hỏi nào trước khi va chạm.
                </div>
              ) : (
                result.answeredQuestions.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.isCorrect
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-rose-950/30 border-rose-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              item.isCorrect
                                ? "bg-emerald-500/30 text-emerald-300"
                                : "bg-rose-500/30 text-rose-300"
                            }`}
                          >
                            {item.isCorrect ? "✓ Đúng" : "✕ Chưa đúng"}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {item.question.category}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white">{item.question.prompt}</div>
                      </div>

                      {item.question.audioText && (
                        <button
                          onClick={() => speakText(item.question.audioText!)}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0 active:scale-95 transition-transform"
                          title="Nghe phát âm"
                        >
                          🔊
                        </button>
                      )}
                    </div>

                    <div className="mt-2 text-xs grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <div>
                        <span className="text-slate-400">Bạn đã chọn: </span>
                        <span className={item.isCorrect ? "text-emerald-300 font-bold" : "text-rose-400 font-bold"}>
                          {item.question.options[item.chosenLane]}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Đáp án đúng: </span>
                        <span className="text-amber-300 font-bold">{item.question.correctAnswer}</span>
                      </div>
                    </div>

                    {item.question.explanation && (
                      <div className="mt-2 text-xs text-slate-300 bg-black/30 p-2 rounded-xl">
                        💡 {item.question.explanation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={onBackToHub} className="flex-1 rounded-2xl">
            🏛️ Về Sảnh
          </Button>
          <button
            onClick={onPlayAgain}
            disabled={!result.isPractice && stamina <= 0}
            className="yk-launch yk-display flex-1 py-2.5 rounded-2xl text-base font-extrabold text-white border-2 border-amber-300/80 bg-[linear-gradient(180deg,#fb4a6b,#e11d48_45%,#9f1239)] shadow-[0_12px_30px_-10px_rgba(225,29,72,.85)] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            🔁 {stamina <= 0 && !result.isPractice ? "Hết thể lực" : "Chơi lại"}
          </button>
        </div>
      </div>
    </div>
  );
}