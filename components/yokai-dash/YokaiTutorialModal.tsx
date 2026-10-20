"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";

interface YokaiTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPlaying?: () => void;
}

export function YokaiTutorialModal({ isOpen, onClose, onStartPlaying }: YokaiTutorialModalProps) {
  const [step, setStep] = useState<number>(0);

  if (!isOpen) return null;

  const slides = [
    {
      badge: "BƯỚC 1 • CƠ CHẾ CHẠY 3 LÀN",
      title: "Chạy Vô Tận & Đổi Làn Thần Tốc",
      desc: "Linh thú sẽ chạy theo 3 làn đường đền thờ (Trái - Giữa - Phải). Bạn có thể đổi làn bất cứ lúc nào để né chướng ngại và tiến vào đúng cổng đáp án.",
      icon: "⛩️",
      controls: [
        { key: "A / D hoặc ◀ / ▶", action: "Đổi sang làn Trái / Phải" },
        { key: "Vuốt màn hình Trái / Phải", action: "Dành cho điện thoại cảm ứng" },
      ],
      tip: "Mẹo: Giữ mắt nhìn xa phía trước để phát hiện cổng Torii sớm nhất có thể!",
    },
    {
      badge: "BƯỚC 2 • CHIẾN THUẬT NÉ 3 LOẠI VẬT CẢN",
      title: "Nhảy • Trượt • Đổi Làn Chuẩn Xác",
      desc: "Mỗi nhóm chướng ngại vật đòi hỏi đúng hành động khắc chế. Căn đúng nhịp sát vật cản sẽ kích hoạt NÉ CHUẨN (+100 PTS & tăng Combo)!",
      icon: "⚡",
      controls: [
        { key: "🏮 Đèn lồng / Rào tre / Hố sụt", action: "NHẢY QUA (W / Space / Vuốt Lên)" },
        { key: "🪵 Xà gỗ / Cổng thấp / Dây thừng", action: "TRƯỢT CÚI NGƯỜI (S / Vuốt Xuống)" },
        { key: "🪨 Đá phong ấn / Cây đổ / Đường sập", action: "BẮT BUỘC ĐỔI LÀN (A/D hoặc ◀/▶)" },
      ],
      tip: "Thu thập Ngọc Magatama 🟢 và Linh Ngọc ✨ trên đường chạy (hoặc lơ lửng trên cao khi nhảy) để nhận thêm +50 PTS!",
    },
    {
      badge: "BƯỚC 3 • CHỌN CỔNG TRI THỨC",
      title: "3 Cổng Torii Tương Ứng 3 Đáp Án",
      desc: "Mỗi câu hỏi sẽ hiện 3 đáp án tương ứng trên 3 làn chạy [Cổng A - Cổng B - Cổng C]. Hãy đọc câu hỏi trên đầu màn hình và chạy vào làn có đáp án đúng!",
      icon: "💮",
      controls: [
        { key: "Cổng A (Trái)", action: "Tương ứng với Đáp án số 1" },
        { key: "Cổng B (Giữa)", action: "Tương ứng với Đáp án số 2" },
        { key: "Cổng C (Phải)", action: "Tương ứng với Đáp án số 3" },
      ],
      tip: "Thanh hiển thị phụ trên đầu màn hình cũng sẽ highlight theo làn bạn đang đứng, giúp không bao giờ nhầm lẫn!",
    },
    {
      badge: "BƯỚC 4 • SINH MỆNH & YŌKAI TRUY ĐUỔI",
      title: "Giữ Vững Sinh Mệnh & Đẩy Lùi Yêu Quái",
      desc: "Phía sau bạn luôn có Ác Quỷ Oni truy đuổi! Duy trì Combo cao sẽ đẩy lùi yêu quái ra xa, trong khi mất Tim sẽ khiến chúng áp sát sát nút.",
      icon: "🔥",
      controls: [
        { key: "❤️ 3 Tim Sinh Mệnh", action: "Mất hết 3 tim màn chạy kết thúc" },
        { key: "🛡️ Khiên Thần Yatagarasu", action: "Miễn nhiễm 1 lần va chạm đầu tiên" },
        { key: "🐺 Bạch Lang Okami", action: "Tự động hút Ngọc Magatama & x2 điểm ngọc khi đầy tim" },
      ],
      tip: "Sau trận đấu, bạn sẽ được xem lại giải thích chi tiết cho từng câu hỏi đã qua!",
    },
  ];

  const current = slides[step];

  return (
    <div className="fixed inset-0 z-50 yk-ui flex items-center justify-center p-4 bg-[#050310]/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="yk-frame relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-[linear-gradient(145deg,#12102a,#0a0818_58%,#2a0f24)] border border-amber-300/40 rounded-[1.75rem] shadow-[0_30px_100px_-25px_rgba(0,0,0,0.9)] ring-1 ring-white/10 text-white flex flex-col">
        <span className="yk-corner-bl" />
        <span className="yk-corner-br" />
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-[linear-gradient(110deg,rgba(136,19,55,0.35),rgba(15,23,42,0.95),rgba(120,53,15,0.28))] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              {current.badge}
            </div>
            <h3 className="yk-display text-xl sm:text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
              <span>{current.icon}</span>
              <span>{current.title}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            className="text-slate-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">{current.desc}</p>

          <div className="space-y-2">
            {current.controls.map((ctrl, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.045] border border-white/10 text-xs shadow-inner"
              >
                <span className="font-bold text-amber-300 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30">
                  {ctrl.key}
                </span>
                <span className="text-slate-200 text-right">{ctrl.action}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
            <span>💡</span>
            <span>{current.tip}</span>
          </div>

          {/* Stepper Dots */}
          <div className="flex justify-center items-center gap-2 pt-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Bước ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === step ? "w-8 bg-amber-400" : "w-2 bg-slate-700 hover:bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-950/60 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="text-xs font-bold"
          >
            ← Trước
          </Button>

          {step < slides.length - 1 ? (
            <Button
              variant="torii"
              size="sm"
              onClick={() => setStep((s) => Math.min(slides.length - 1, s + 1))}
              className="text-xs font-bold"
            >
              Tiếp Theo →
            </Button>
          ) : (
            <Button
              variant="torii"
              size="sm"
              onClick={() => {
                onClose();
                if (onStartPlaying) onStartPlaying();
              }}
              className="text-xs font-black shadow-lg shadow-rose-600/30"
            >
              🚀 Đã Hiểu, Bắt Đầu Chơi!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}