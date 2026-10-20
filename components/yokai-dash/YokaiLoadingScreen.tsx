"use client";

import React, { useEffect, useRef, useState } from "react";
import { SpiritBeast } from "@/lib/yokai-dash/types";

interface YokaiLoadingScreenProps {
  beast?: SpiritBeast;
  /** true khi dữ liệu câu hỏi đã tải xong -> thanh chạy nốt tới 100% */
  ready?: boolean;
  title?: string;
  subtitle?: string;
}

const TIPS = [
  "Giữ mắt nhìn xa để thấy cổng Torii sớm nhất.",
  "Né sát vật cản đúng nhịp để nhận +100 điểm NÉ CHUẨN.",
  "Combo càng cao, Oni phía sau càng bị đẩy lùi.",
  "Cuối lượt chạy bạn sẽ xem lại giải thích từng câu hỏi.",
  "Bạn có thể chọn chế độ câu hỏi (Từ vựng, Câu, Ngữ pháp) tại Sảnh.",
  "Tốc độ di chuyển có thể đặt chế độ Dễ, Vừa sức hoặc Tự chọn.",
];

export function YokaiLoadingScreen({
  beast,
  ready = false,
  title,
  subtitle,
}: YokaiLoadingScreenProps) {
  const [progress, setProgress] = useState(6);
  const [tipIdx, setTipIdx] = useState(0);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  // Tiến độ giả lập: chạy nhanh rồi chậm dần quanh 90%, vọt lên 100% khi ready
  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (readyRef.current) return Math.min(100, p + 9);
        if (p < 60) return p + 4;
        if (p < 90) return p + 1;
        return p;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] overflow-hidden bg-[#07041a] text-white yk-ui flex flex-col justify-between items-center px-4 py-3 sm:px-8 sm:py-6"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
      }}
      role="status"
      aria-live="polite"
      aria-label="Đang tải màn chơi"
    >
      {/* 1. Ambient Glow Backdrop — lấp đầy màn hình mobile bằng màu sắc mờ ảo của chính ảnh nền (không để lộ viền đen) */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('/yokai-dash/loading-bg.png')" }}
      />

      {/* 2. Ảnh nền chính — trên mobile tự bóp vừa 100% chiều ngang khung hình (bg-contain), thấy trọn vẹn 100% bức tranh không bị cắt xén; trên màn hình lớn tự lấp đầy (sm:bg-cover) */}
      <div
        className="absolute inset-0 bg-contain sm:bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-300"
        style={{ backgroundImage: "url('/yokai-dash/loading-bg.png')" }}
      />

      {/* 3. Lớp gradient phủ nhẹ góc và đáy để text và thanh tiến trình luôn sắc nét */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(6,4,20,.95)_0%,rgba(6,4,20,.35)_30%,transparent_60%,rgba(6,4,20,.7)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_55%,rgba(5,3,18,.6)_100%)] pointer-events-none" />

      {/* TOP: Floating Header Pill */}
      <div className="relative z-10 w-full flex justify-center shrink-0">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase bg-black/60 text-amber-200 border border-amber-300/40 backdrop-blur-md shadow-lg">
          <span className="text-amber-400">🌸</span>
          <span>Yōkai Dash • 妖怪ダッシュ</span>
        </div>
      </div>

      {/* CENTER: Giữ thông thoáng để thấy trọn vẹn 100% bức tranh loading-bg không bị che khuất */}
      <div className="relative z-10 flex-1 w-full" aria-hidden />

      {/* BOTTOM: Compact Info & Progress Bar (Không che khuất tranh, không tràn viền) */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col gap-2.5 shrink-0 px-2">
        {/* Tip / Subtitle */}
        <div className="text-center rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md px-3.5 py-2 shadow-lg">
          {title ? (
            <h2 className="yk-display text-sm sm:text-base font-black text-amber-300 tracking-wide mb-0.5">
              {title}
            </h2>
          ) : null}
          <p className="text-[12px] sm:text-xs text-amber-100/90 leading-relaxed font-medium">
            {subtitle ? (
              subtitle
            ) : beast ? (
              <>
                Linh thú <b className="text-amber-300 font-extrabold">{beast.name}</b> • {TIPS[tipIdx]}
              </>
            ) : (
              TIPS[tipIdx]
            )}
          </p>
        </div>

        {/* Thanh tiến trình viền vàng */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="relative w-full h-4 sm:h-5 rounded-full p-[2px] sm:p-[2.5px] bg-[#120c2c]/90 border border-amber-300/70 shadow-[0_0_24px_-4px_rgba(245,185,66,.55),inset_0_2px_6px_rgba(0,0,0,.8)]">
            <div
              className="yk-load-fill h-full rounded-full transition-[width] duration-200 ease-out shadow-[0_0_14px_rgba(252,211,77,.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-amber-200 tabular-nums px-1">
            <span className="flex items-center gap-1.5 text-amber-300/90 text-[11px] sm:text-xs">
              <span aria-hidden>🌸</span>
              <span>{beast ? beast.title : "Nihon Quest"}</span>
            </span>
            <span className="font-extrabold text-[12px] sm:text-xs">
              {progress >= 100 ? "Sẵn sàng xuất trận!" : `Đang tải ${Math.floor(progress)}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}