"use client";

import React from "react";

/**
 * Bảng màu & primitives dùng chung cô lập riêng cho module Yōkai Dash (Nihon Quest):
 * - Tím mận (Plum Night: #0d0722 / #1a0f2e / #2d1238)
 * - Đỏ Torii (Torii Vermilion: #e11d48 / #fb4a6b / #be123c)
 * - Vàng hồ ly (Kitsune Gold: #f59e0b / #fbbf24 / #fde68a)
 * - Xanh ngọc (Spirit Jade: #14b8a6 / #2dd4bf / #00e5ff)
 */

/**
 * YokaiStyles: CSS đã được chuyển toàn bộ vào app/yokai.css
 * (được import tại app/layout.tsx để triệt tiêu lỗi Hydration Mismatch & Google Fonts 404).
 */
export function YokaiStyles() {
  return null;
}

/** Khung có 4 góc vàng hồ ly. Bọc nội dung bất kỳ. */
export function OrnateFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`yk-frame ${className}`}>
      {children}
      <span className="yk-corner-bl" />
      <span className="yk-corner-br" />
    </div>
  );
}

/** Ngọc Magatama (SVG) dùng cho thanh thể lực */
export function MagatamaIcon({ filled, size = 30 }: { filled: boolean; size?: number }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full transition-all duration-300 ${
        filled ? "yk-ember" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: filled
          ? "radial-gradient(circle at 35% 30%, #fde68a, #f59e0b 45%, #be123c 100%)"
          : "radial-gradient(circle at 50% 50%, rgba(255,255,255,.06), rgba(255,255,255,.02))",
        border: filled ? "1px solid rgba(253,230,138,.9)" : "1px solid rgba(255,255,255,.14)",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56}>
        <path
          d="M15.5 4.2c-4.1-1.5-8.6 1.2-8.9 5.6-.3 4.2 3.2 7.2 6.4 6.6 2.2-.4 3.3-2.2 2.6-3.9-.6-1.5-2.3-1.4-2.7-.1-.2.7.3 1.2.8 1.2"
          fill="none"
          stroke={filled ? "#4c0519" : "rgba(255,255,255,.28)"}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Trái tim sinh mệnh trong game */
export function HeartIcon({ alive, size = 22 }: { alive: boolean; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={alive ? "yk-heart-live" : "opacity-30"}
      style={{ filter: alive ? "drop-shadow(0 0 6px rgba(244,63,94,.85))" : "grayscale(1)" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="yk-heart-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fda4af" />
          <stop offset="0.5" stopColor="#f43f5e" />
          <stop offset="1" stopColor="#9f1239" />
        </linearGradient>
      </defs>
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.3 4.5c2.1 0 3.8 1.2 5.7 3.3 1.9-2.1 3.6-3.3 5.7-3.3 3.6 0 5.4 3.9 3.9 7.3C19.5 16.4 12 21 12 21z"
        fill="url(#yk-heart-g)"
        stroke="#fff1f2"
        strokeOpacity="0.75"
        strokeWidth="1"
      />
    </svg>
  );
}

/** Chip HUD kính mờ viền vàng hồ ly nhạt */
export function HudChip({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`yk-ui flex items-center gap-1.5 rounded-xl border border-amber-300/30 bg-[linear-gradient(160deg,rgba(19,10,38,.86),rgba(42,12,34,.78))] backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.08)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Nút tròn/vuông trong HUD (tạm dừng, âm thanh, giảm hiệu ứng, thoát) */
export function HudIconButton({
  onClick,
  title,
  children,
  tone = "default",
  active = false,
  className = "",
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "danger" | "jade" | "amber";
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`pointer-events-auto yk-ui h-9 sm:h-10 min-w-9 sm:min-w-10 px-2 sm:px-2.5 rounded-xl border text-white/95 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 backdrop-blur-md shadow-md active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
        tone === "danger"
          ? "border-rose-400/40 bg-[linear-gradient(160deg,rgba(80,12,32,.88),rgba(40,8,22,.88))] hover:bg-rose-700"
          : tone === "amber"
          ? "border-amber-300/70 bg-[linear-gradient(160deg,rgba(217,119,6,.75),rgba(146,64,14,.85))] text-amber-100 shadow-[0_0_12px_rgba(245,158,11,.4)]"
          : tone === "jade" || active
          ? "border-teal-300/60 bg-[linear-gradient(160deg,rgba(13,148,136,.75),rgba(19,78,74,.85))] text-teal-100"
          : "border-amber-200/30 bg-[linear-gradient(160deg,rgba(19,10,38,.86),rgba(38,16,52,.8))] hover:bg-purple-900/80"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Họa tiết bùa chú phong ấn Ofuda (御札) vàng son
 */
export function OfudaBadge({
  text = "疾風",
  kanji = "風",
  color = "amber",
  className = "",
}: {
  text?: string;
  kanji?: string;
  color?: "amber" | "rose" | "teal" | "purple";
  className?: string;
}) {
  const colorMap = {
    amber: "border-amber-300/60 bg-[linear-gradient(180deg,#78350f,#451a03)] text-amber-200 shadow-[0_0_12px_rgba(245,185,66,.3)]",
    rose: "border-rose-300/60 bg-[linear-gradient(180deg,#881337,#4c0519)] text-rose-200 shadow-[0_0_12px_rgba(244,63,94,.3)]",
    teal: "border-teal-300/60 bg-[linear-gradient(180deg,#134e4a,#042f2e)] text-teal-200 shadow-[0_0_12px_rgba(20,184,166,.3)]",
    purple: "border-purple-300/60 bg-[linear-gradient(180deg,#581c87,#3b0764)] text-purple-200 shadow-[0_0_12px_rgba(168,85,247,.3)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-extrabold tracking-wider uppercase select-none ${colorMap[color]} ${className}`}
    >
      <span className="font-serif text-xs font-black px-1 py-0.2 rounded bg-black/40 border border-white/20">
        {kanji}
      </span>
      <span>{text}</span>
    </span>
  );
}

/**
 * Họa tiết sóng biển Seigaiha (青海波) làm nền trang trí
 */
export function SeigaihaDecor({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 bg-wagara-seigaiha opacity-40 mix-blend-overlay ${className}`}
    />
  );
}

/**
 * Biểu tượng quạt giấy Senzu mạ vàng
 */
export function JapaneseFanIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={`inline-block ${className}`} fill="currentColor" aria-hidden>
      <path d="M24 28c-2 0-20-8-23-22 8-2 15-3 23-3s15 1 23 3c-3 14-21 22-23 22z" fillOpacity="0.25" />
      <path
        d="M24 28L1 6c8-2 15-3 23-3s15 1 23 3L24 28z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M24 28L12 5M24 28L18 4M24 28L24 3M24 28L30 4M24 28L36 5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
      <circle cx="24" cy="28" r="2" fill="currentColor" />
    </svg>
  );
}

/**
 * Hoa anh đào Sakura rơi trang trí góc thẻ
 */
export function SakuraBranchDecor({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 80" className={`pointer-events-none absolute ${className}`} fill="currentColor" aria-hidden>
      <path
        d="M10 70 Q 40 40 90 20 Q 60 45 40 75"
        stroke="#9a3412"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle cx="28" cy="46" r="6" fill="#f472b6" fillOpacity="0.75" />
      <circle cx="48" cy="38" r="5" fill="#fbcfe8" fillOpacity="0.8" />
      <circle cx="72" cy="26" r="7" fill="#fb7185" fillOpacity="0.85" />
      <circle cx="86" cy="18" r="4" fill="#fda4af" fillOpacity="0.9" />
    </svg>
  );
}