"use client";

import React, { useId } from "react";
import { GameZone } from "@/lib/yokai-dash/types";

/* =====================================================================
 * ZoneBanner.tsx — ảnh bìa SVG riêng cho từng map trong thẻ chọn map.
 * Đặt cạnh YokaiHub.tsx (components/yokai-dash/...).
 * ===================================================================== */

const W = 400;
const H = 200;

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------ building blocks ------------------------------ */

function Torii({
  x, y, s = 1, color = "#d8281e", trim, rope,
}: { x: number; y: number; s?: number; color?: string; trim?: string; rope?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-50} y={-84} width={9} height={84} fill={color} />
      <rect x={41} y={-84} width={9} height={84} fill={color} />
      <rect x={-52} y={-8} width={13} height={8} fill="#1a1014" />
      <rect x={39} y={-8} width={13} height={8} fill="#1a1014" />
      <rect x={-56} y={-66} width={112} height={6} fill={color} />
      <rect x={-62} y={-88} width={124} height={9} fill={color} />
      <path d="M-72 -100 Q0 -90 72 -100 L66 -88 Q0 -80 -66 -88 Z" fill="#1a1014" />
      {trim && <rect x={-62} y={-90} width={124} height={2} fill={trim} />}
      {rope && (
        <>
          <path d="M-48 -70 Q0 -58 48 -70" stroke="#e8c878" strokeWidth={3} fill="none" />
          {[-28, 0, 28].map((sx) => (
            <rect key={sx} x={sx - 2} y={-64 + Math.abs(sx) * -0.0} width={4} height={11} fill="#ffffff" opacity={0.95} />
          ))}
        </>
      )}
    </g>
  );
}

function Lantern({ x, y, s = 1, color = "#ff7a3a" }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={22} fill={color} opacity={0.14} />
      <circle r={14} fill={color} opacity={0.22} />
      <rect x={-3} y={-12} width={6} height={3} fill="#1a1014" />
      <ellipse rx={6} ry={8} fill={color} />
      <ellipse rx={3} ry={7} fill="#ffe2a8" opacity={0.55} />
      <rect x={-3} y={8} width={6} height={3} fill="#1a1014" />
    </g>
  );
}

function Stars({ n, seed, yMax }: { n: number; seed: number; yMax: number }) {
  const r = rng(seed);
  return (
    <g fill="#fff">
      {Array.from({ length: n }).map((_, i) => (
        <circle key={i} cx={r() * W} cy={r() * yMax} r={0.5 + r() * 0.9} opacity={0.4 + r() * 0.6} />
      ))}
    </g>
  );
}

function Petals({ n, seed, color, yMin = 0, yMax = H }: { n: number; seed: number; color: string; yMin?: number; yMax?: number }) {
  const r = rng(seed);
  return (
    <g fill={color}>
      {Array.from({ length: n }).map((_, i) => (
        <ellipse
          key={i}
          cx={r() * W}
          cy={yMin + r() * (yMax - yMin)}
          rx={2.2 + r() * 1.6}
          ry={1.2 + r() * 0.8}
          opacity={0.55 + r() * 0.4}
          transform={`rotate(${Math.floor(r() * 180)} ${r() * W} ${yMin + r() * (yMax - yMin)})`}
        />
      ))}
    </g>
  );
}

function Blossom({ cx, cy, r, colors, seed }: { cx: number; cy: number; r: number; colors: string[]; seed: number }) {
  const rd = rng(seed);
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => {
        const a = rd() * Math.PI * 2;
        const d = rd() * r * 0.7;
        return (
          <circle
            key={i}
            cx={cx + Math.cos(a) * d}
            cy={cy + Math.sin(a) * d * 0.8}
            r={r * (0.35 + rd() * 0.35)}
            fill={colors[i % colors.length]}
            opacity={0.92}
          />
        );
      })}
    </g>
  );
}

function Moon({ cx, cy, r, color, halo, id }: { cx: number; cy: number; r: number; color: string; halo: string; id: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 2.6} fill={`url(#${id}halo)`} />
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.18} fill={halo} opacity={0.18} />
      <circle cx={cx + r * 0.25} cy={cy + r * 0.3} r={r * 0.12} fill={halo} opacity={0.15} />
    </g>
  );
}

function HaloDef({ id, color }: { id: string; color: string }) {
  return (
    <radialGradient id={`${id}halo`}>
      <stop offset="0" stopColor={color} stopOpacity={0.75} />
      <stop offset="1" stopColor={color} stopOpacity={0} />
    </radialGradient>
  );
}

function Pagoda({ x, y, s = 1, color = "#2a1440", lit = "#ffb45c" }: { x: number; y: number; s?: number; color?: string; lit?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 1, 2].map((t) => {
        const bw = 22 - t * 5;
        const yy = -t * 16;
        return (
          <g key={t}>
            <rect x={-bw / 2} y={yy - 12} width={bw} height={12} fill={color} />
            <rect x={-bw / 4} y={yy - 9} width={bw / 2} height={4} fill={lit} opacity={0.85} />
            <path d={`M${-bw / 2 - 7} ${yy - 12} L0 ${yy - 22} L${bw / 2 + 7} ${yy - 12} Z`} fill={color} />
          </g>
        );
      })}
      <rect x={-1} y={-62} width={2} height={12} fill={color} />
    </g>
  );
}

function Ripples({ y, colors, seed, count = 8 }: { y: number; colors: string[]; seed: number; count?: number }) {
  const r = rng(seed);
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <ellipse
          key={i}
          cx={20 + r() * 360}
          cy={y + 6 + r() * (H - y - 10)}
          rx={1.6}
          ry={9 + r() * 10}
          fill={colors[i % colors.length]}
          opacity={0.38}
        />
      ))}
    </g>
  );
}

function PathStrip({ vanishY = 140, color = "#2a1a3e", lane = "#ff8a5a" }: { vanishY?: number; color?: string; lane?: string }) {
  return (
    <g>
      <path d={`M176 ${vanishY} L224 ${vanishY} L340 ${H} L60 ${H} Z`} fill={color} />
      <path d={`M192 ${vanishY} L208 ${vanishY} L222 ${H} L178 ${H} Z`} fill="#fff" opacity={0.05} />
      <path d={`M190 ${vanishY} L160 ${H}`} stroke={lane} strokeWidth={1.2} opacity={0.7} />
      <path d={`M210 ${vanishY} L240 ${H}`} stroke={lane} strokeWidth={1.2} opacity={0.7} />
    </g>
  );
}

function Rails({ color = "#c4231a", vanishY = 140 }: { color?: string; vanishY?: number }) {
  return (
    <g stroke={color} strokeWidth={2.2} fill="none" opacity={0.95}>
      <path d={`M174 ${vanishY - 2} L40 ${H}`} />
      <path d={`M226 ${vanishY - 2} L360 ${H}`} />
      <path d={`M176 ${vanishY - 8} L70 ${H - 22}`} strokeWidth={1.2} />
      <path d={`M224 ${vanishY - 8} L330 ${H - 22}`} strokeWidth={1.2} />
    </g>
  );
}

/* --------------------------------- scenes --------------------------------- */

function SceneTorii({ p }: { p: string }) {
  const gates = [0, 1, 2, 3, 4, 5].map((i) => ({ s: 0.14 + i * 0.16, y: 142 + i * i * 2.5 }));
  return (
    <>
      <defs>
        <linearGradient id={`${p}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a0b3d" /><stop offset="0.55" stopColor="#7a2a8c" /><stop offset="1" stopColor="#f06aa8" />
        </linearGradient>
        <HaloDef id={p} color="#ff9fd0" />
        <radialGradient id={`${p}end`}>
          <stop offset="0" stopColor="#fff2d8" stopOpacity={0.95} /><stop offset="1" stopColor="#ff7ad0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${p}sky)`} />
      <Stars n={40} seed={11} yMax={80} />
      <Moon cx={322} cy={48} r={20} color="#fff0dc" halo="#ff9fd0" id={p} />
      <path d="M0 142 L40 98 L82 130 L130 86 L190 132 L250 94 L312 130 L362 102 L400 132 L400 170 L0 170Z" fill="#3a1a5e" opacity={0.9} />
      <g fill="#8a3fa0" opacity={0.55}>
        <ellipse cx={60} cy={158} rx={80} ry={12} /><ellipse cx={340} cy={160} rx={90} ry={13} />
      </g>
      <g fill="#ff9ad0" opacity={0.35}>
        <ellipse cx={120} cy={170} rx={70} ry={10} /><ellipse cx={290} cy={174} rx={80} ry={11} />
      </g>
      <PathStrip color="#2a1a3e" />
      <ellipse cx={200} cy={140} rx={34} ry={22} fill={`url(#${p}end)`} />
      {gates.map((g, i) => (
        <g key={i}>
          <Torii x={200} y={g.y} s={g.s} rope={i >= 3} />
          {i >= 3 && (
            <>
              <Lantern x={200 - 38 * g.s} y={g.y - 66 * g.s} s={g.s * 1.1} />
              <Lantern x={200 + 38 * g.s} y={g.y - 66 * g.s} s={g.s * 1.1} />
            </>
          )}
        </g>
      ))}
      <Petals n={16} seed={5} color="#ffb7d5" />
    </>
  );
}

function SceneSakura({ p }: { p: string }) {
  const pink = ["#ff6fb5", "#ff9bd0", "#ffc2e2"];
  return (
    <>
      <defs>
        <linearGradient id={`${p}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d0f4a" /><stop offset="0.55" stopColor="#8a3fa0" /><stop offset="1" stopColor="#ff7fb8" />
        </linearGradient>
        <linearGradient id={`${p}water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3a9a" /><stop offset="1" stopColor="#120a40" />
        </linearGradient>
        <HaloDef id={p} color="#ff7fc0" />
      </defs>
      <rect width={W} height={H} fill={`url(#${p}sky)`} />
      <Stars n={26} seed={21} yMax={70} />
      <Moon cx={300} cy={52} r={26} color="#ffc4de" halo="#ff7fc0" id={p} />
      <path d="M0 130 L50 100 L100 124 L160 92 L220 126 L290 98 L350 124 L400 104 L400 150 L0 150Z" fill="#4a2a6e" opacity={0.85} />
      <Pagoda x={96} y={128} s={0.8} color="#2a1440" />
      <Pagoda x={316} y={128} s={0.7} color="#2a1440" />
      <rect y={138} width={W} height={H - 138} fill={`url(#${p}water)`} />
      <Ripples y={138} colors={["#ffb45c", "#ff7ad0", "#ffd9a0"]} seed={3} />
      <PathStrip vanishY={138} color="#3a2a5a" lane="#ff7ab0" />
      <Rails color="#d42a1c" vanishY={138} />
      <Torii x={200} y={140} s={0.38} color="#e0301f" rope />
      <Torii x={200} y={150} s={0.62} color="#e0301f" rope />
      {/* cherry trees */}
      <g>
        <path d="M44 200 C52 150 38 124 56 92" stroke="#3b2230" strokeWidth={9} fill="none" strokeLinecap="round" />
        <Blossom cx={52} cy={84} r={34} colors={pink} seed={2} />
        <Blossom cx={22} cy={104} r={24} colors={pink} seed={4} />
        <Blossom cx={84} cy={96} r={24} colors={pink} seed={6} />
        <path d="M356 200 C348 150 362 124 344 92" stroke="#3b2230" strokeWidth={9} fill="none" strokeLinecap="round" />
        <Blossom cx={348} cy={84} r={34} colors={pink} seed={8} />
        <Blossom cx={378} cy={104} r={24} colors={pink} seed={10} />
        <Blossom cx={316} cy={96} r={24} colors={pink} seed={12} />
      </g>
      {/* fox guardians */}
      {[130, 270].map((fx, i) => (
        <g key={fx} transform={`translate(${fx} 178)`}>
          <rect x={-9} y={0} width={18} height={14} fill="#6e6a7a" />
          <ellipse cx={0} cy={-8} rx={6} ry={10} fill="#8a8698" />
          <circle cx={0} cy={-22} r={5} fill="#8a8698" />
          <path d={`M-4 -26 L-6 -34 L-1 -28 Z M4 -26 L6 -34 L1 -28 Z`} fill="#8a8698" />
          <rect x={-5} y={-16} width={10} height={4} fill="#d8281e" />
          {i === 0 && <circle cx={0} cy={0} r={0} />}
        </g>
      ))}
      <Petals n={26} seed={9} color="#ffb0d0" />
    </>
  );
}

function SceneMoonlight({ p }: { p: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${p}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050a2e" /><stop offset="0.6" stopColor="#1a1f6a" /><stop offset="1" stopColor="#4a3a9a" />
        </linearGradient>
        <linearGradient id={`${p}water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2a7a" /><stop offset="1" stopColor="#060c30" />
        </linearGradient>
        <HaloDef id={p} color="#8fb0ff" />
        <radialGradient id={`${p}flame`}>
          <stop offset="0" stopColor="#7ff6ff" stopOpacity={0.9} /><stop offset="1" stopColor="#3ad8ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${p}sky)`} />
      <Stars n={70} seed={31} yMax={110} />
      <Moon cx={116} cy={54} r={28} color="#f4f6ff" halo="#8fb0ff" id={p} />
      <g fill="#10164a" opacity={0.75}>
        <ellipse cx={170} cy={64} rx={60} ry={6} /><ellipse cx={90} cy={44} rx={40} ry={4} /><ellipse cx={330} cy={46} rx={50} ry={5} />
      </g>
      <path d="M0 140 L22 92 L44 120 L76 70 L108 118 L150 96 L186 134 L214 134 L250 90 L290 124 L324 74 L362 118 L400 96 L400 160 L0 160Z" fill="#161c4c" />
      <path d="M0 150 L38 118 L70 142 L120 112 L170 146 L240 120 L300 148 L350 124 L400 146 L400 170 L0 170Z" fill="#0e1238" />
      <Pagoda x={52} y={136} s={0.8} color="#0a0e30" lit="#ffb45c" />
      <Pagoda x={350} y={134} s={0.75} color="#0a0e30" lit="#ffb45c" />
      <rect y={150} width={W} height={H - 150} fill={`url(#${p}water)`} />
      <rect x={104} y={152} width={26} height={48} fill="#8fb0ff" opacity={0.18} />
      <Ripples y={150} colors={["#8fb0ff", "#4fe8ff", "#ffb45c"]} seed={7} />
      <PathStrip vanishY={148} color="#262c5e" lane="#7a8fff" />
      <Rails color="#9a1a14" vanishY={148} />
      <Torii x={200} y={150} s={0.72} color="#b02218" rope />
      <Torii x={200} y={146} s={0.34} color="#b02218" rope />
      {[ [70, 150], [332, 152], [150, 144], [262, 146], [30, 170], [372, 172] ].map(([fx, fy], i) => (
        <g key={i}>
          <circle cx={fx} cy={fy - 8} r={14} fill={`url(#${p}flame)`}>
            <animate attributeName="opacity" values="0.6;1;0.6" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
          <path d={`M${fx} ${fy - 18} Q${fx + 4} ${fy - 9} ${fx} ${fy - 4} Q${fx - 4} ${fy - 9} ${fx} ${fy - 18}Z`} fill="#9ff8ff" />
        </g>
      ))}
      <Lantern x={146} y={142} s={0.8} color="#ffb45c" />
      <Lantern x={254} y={142} s={0.8} color="#ffb45c" />
      <Petals n={12} seed={13} color="#ffb0dc" />
    </>
  );
}

function SceneFuji({ p }: { p: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${p}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d7fd8" /><stop offset="0.55" stopColor="#f6a6c6" /><stop offset="1" stopColor="#ffe2a8" />
        </linearGradient>
        <HaloDef id={p} color="#ffd080" />
      </defs>
      <rect width={W} height={H} fill={`url(#${p}sky)`} />
      <circle cx={262} cy={52} r={80} fill={`url(#${p}halo)`} />
      <circle cx={262} cy={52} r={18} fill="#fff6d0" />
      <g fill="#fff" opacity={0.55}>
        <ellipse cx={60} cy={34} rx={36} ry={5} /><ellipse cx={120} cy={50} rx={28} ry={4} /><ellipse cx={350} cy={30} rx={34} ry={4} />
      </g>
      {/* Fuji */}
      <path d="M130 156 L246 66 Q262 56 278 66 L396 156 Z" fill="#6a6aa8" />
      <path d="M222 86 L246 66 Q262 56 278 66 L302 86 L290 82 L280 94 L268 82 L256 96 L244 84 L234 94 Z" fill="#fff2f6" />
      {/* floating islands */}
      {[ [62, 88, 0.9], [346, 98, 0.8], [130, 118, 0.6] ].map(([ix, iy, is], i) => (
        <g key={i} transform={`translate(${ix} ${iy}) scale(${is})`}>
          <path d="M-26 0 L26 0 L14 22 L0 34 L-14 22 Z" fill="#7a6a9a" />
          <ellipse cx={0} cy={0} rx={27} ry={4} fill="#6aa878" />
          <rect x={-8} y={-12} width={16} height={12} fill="#7a1f1f" />
          <path d="M-14 -12 L0 -22 L14 -12 Z" fill="#1d1a2b" />
          <rect x={20} y={2} width={3} height={28} fill="#d8f4ff" opacity={0.6} />
        </g>
      ))}
      {/* cloud sea */}
      <g fill="#ffd8ec" opacity={0.85}>
        <ellipse cx={40} cy={164} rx={70} ry={14} /><ellipse cx={170} cy={172} rx={80} ry={14} /><ellipse cx={330} cy={166} rx={84} ry={15} />
      </g>
      <g fill="#fff" opacity={0.9}>
        <ellipse cx={100} cy={184} rx={90} ry={14} /><ellipse cx={290} cy={186} rx={96} ry={15} />
      </g>
      <PathStrip vanishY={150} color="#3a2a52" lane="#ffd36b" />
      <Rails color="#d42a1c" vanishY={150} />
      <Torii x={200} y={152} s={0.4} color="#e02a1c" trim="#e8b84a" rope />
      <Torii x={200} y={168} s={0.75} color="#e02a1c" trim="#e8b84a" rope />
      <g>
        <path d="M0 40 C30 44 56 30 90 10" stroke="#3b2230" strokeWidth={4} fill="none" />
        <Blossom cx={40} cy={34} r={22} colors={["#ffa6cc", "#ffc8de", "#ffe0ec"]} seed={41} />
        <Blossom cx={74} cy={18} r={16} colors={["#ffa6cc", "#ffc8de", "#ffe0ec"]} seed={43} />
        <path d="M400 30 C372 36 346 24 318 6" stroke="#3b2230" strokeWidth={4} fill="none" />
        <Blossom cx={366} cy={26} r={20} colors={["#ffa6cc", "#ffc8de", "#ffe0ec"]} seed={45} />
      </g>
      <Petals n={14} seed={17} color="#ffc0da" yMax={150} />
    </>
  );
}

function SceneListening({ p }: { p: string }) {
  const ribbons: [string, string][] = [
    ["M-10 74 C70 30 130 120 200 76 S330 36 410 84", "#ff4fd8"],
    ["M-10 96 C80 56 140 128 210 92 S340 60 410 100", "#4fe8ff"],
    ["M-10 56 C60 90 150 30 220 64 S340 96 410 54", "#b066ff"],
  ];
  const bars = [14, 26, 18, 32, 22, 28, 16];
  return (
    <>
      <defs>
        <linearGradient id={`${p}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#120a46" /><stop offset="0.55" stopColor="#6a2ab8" /><stop offset="1" stopColor="#ff7ad8" />
        </linearGradient>
        <linearGradient id={`${p}water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a3ac8" /><stop offset="1" stopColor="#180a60" />
        </linearGradient>
        <HaloDef id={p} color="#d080ff" />
      </defs>
      <rect width={W} height={H} fill={`url(#${p}sky)`} />
      <Stars n={34} seed={51} yMax={80} />
      <Moon cx={200} cy={58} r={24} color="#ffe8ff" halo="#d080ff" id={p} />
      <path d="M0 140 L40 104 L84 130 L130 98 L186 134 L240 100 L296 132 L350 104 L400 130 L400 160 L0 160Z" fill="#3a1a7e" opacity={0.85} />
      {ribbons.map(([d, c], i) => (
        <g key={i}>
          <path d={d} stroke={c} strokeWidth={7} fill="none" opacity={0.22} />
          <path d={d} stroke={c} strokeWidth={2.2} fill="none" opacity={0.95}>
            <animate attributeName="stroke-dasharray" values="0 700;700 0" dur={`${5 + i}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}
      <rect y={146} width={W} height={H - 146} fill={`url(#${p}water)`} />
      <Ripples y={146} colors={["#ff4fd8", "#4fe8ff", "#b066ff"]} seed={9} />
      {[0, 1].map((side) =>
        bars.map((h, i) => {
          const bx = side === 0 ? 24 + i * 11 : 300 + i * 11;
          return (
            <rect key={`${side}-${i}`} x={bx} y={146 - h} width={7} height={h} rx={1.5} fill={side === 0 ? "#4fe8ff" : "#ff5ad0"} opacity={0.8}>
              <animate attributeName="height" values={`${h};${h * 0.45};${h}`} dur={`${0.9 + i * 0.13}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${146 - h};${146 - h * 0.45};${146 - h}`} dur={`${0.9 + i * 0.13}s`} repeatCount="indefinite" />
            </rect>
          );
        })
      )}
      <PathStrip vanishY={146} color="#2a1a5e" lane="#4fe8ff" />
      <g stroke="#d45bff" strokeWidth={1.6} opacity={0.9}><path d="M174 144 L40 200" /><path d="M226 144 L360 200" /></g>
      <Rails color="#c02818" vanishY={146} />
      <Torii x={200} y={148} s={0.7} color="#e0281e" rope />
      <Torii x={200} y={146} s={0.32} color="#e0281e" rope />
      {[ ["♪", 60, 56, "#ff7ad9", 22], ["♫", 340, 50, "#6aeeff", 24], ["♪", 128, 34, "#ffffff", 18], ["♫", 280, 28, "#ff7ad9", 20], ["♪", 372, 98, "#ffffff", 16] ].map(([ch, nx, ny, c, fs], i) => (
        <text key={i} x={nx as number} y={ny as number} fontSize={fs as number} fill={c as string} fontWeight={700}>
          {ch}
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </text>
      ))}
    </>
  );
}

function SceneKansai({ p }: { p: string }) {
  const r = rng(61);
  const buildingsL = [ [0, 70, 46], [40, 54, 36], [74, 82, 40] ];
  const buildingsR = [ [322, 66, 44], [364, 88, 40], [296, 52, 30] ];
  const neon = ["#ff3a6a", "#ffb02e", "#ff5ad0", "#3ad8ff"];
  const renderBuilding = (b: number[], key: string) => {
    const [bx, bh, bw] = b;
    const top = 148 - bh;
    const cols = Math.floor(bw / 9);
    const rows = Math.floor(bh / 12);
    return (
      <g key={key}>
        <rect x={bx} y={top} width={bw} height={bh} fill="#1b0f24" />
        {Array.from({ length: rows }).flatMap((_, ry) =>
          Array.from({ length: cols }).map((__, cx) => (
            <rect key={`${ry}-${cx}`} x={bx + 4 + cx * 9} y={top + 5 + ry * 12} width={5} height={6}
              fill={r() < 0.6 ? ["#ffd27a", "#ffb04a", "#ff7ab0", "#7ad8ff"][Math.floor(r() * 4)] : "#2a1a34"} />
          ))
        )}
        <rect x={bx + bw - 6} y={top} width={3} height={bh} fill={neon[Math.floor(r() * 4)]} opacity={0.9} />
      </g>
    );
  };
  return (
    <>
      <defs>
        <linearGradient id={`${p}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0630" /><stop offset="0.55" stopColor="#4a1458" /><stop offset="1" stopColor="#ff5a3c" />
        </linearGradient>
        <linearGradient id={`${p}water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a1a5a" /><stop offset="1" stopColor="#0a0630" />
        </linearGradient>
        <HaloDef id={p} color="#ffb090" />
      </defs>
      <rect width={W} height={H} fill={`url(#${p}sky)`} />
      <Stars n={30} seed={62} yMax={70} />
      <Moon cx={300} cy={34} r={11} color="#ffe8d0" halo="#ffb090" id={p} />
      <Pagoda x={232} y={118} s={1.0} color="#2a0f30" lit="#ffb050" />
      <path d="M200 126 L228 108 L256 126 Z" fill="#2a0f30" />
      {buildingsL.map((b, i) => renderBuilding(b, `l${i}`))}
      {buildingsR.map((b, i) => renderBuilding(b, `r${i}`))}
      {/* string of lanterns */}
      <path d="M0 24 Q100 44 200 22 Q300 0 400 26" stroke="#2a1a1a" strokeWidth={1.2} fill="none" />
      {[24, 66, 108, 150, 200, 250, 292, 334, 376].map((lx, i) => (
        <Lantern key={lx} x={lx} y={32 + Math.sin(i * 0.9) * 8 + (i % 2) * 3} s={0.9} color={i % 3 === 0 ? "#ff3a2a" : "#ff8a3a"} />
      ))}
      {/* giant lantern left + right */}
      <g>
        <line x1={44} y1={10} x2={44} y2={96} stroke="#2a1a1a" strokeWidth={2} />
        <ellipse cx={44} cy={58} rx={19} ry={26} fill="#ff2a2a" />
        <ellipse cx={44} cy={58} rx={19} ry={26} fill="none" stroke="#ff9a5a" strokeWidth={1} opacity={0.5} />
        <rect x={32} y={30} width={24} height={4} fill="#151010" /><rect x={32} y={82} width={24} height={4} fill="#151010" />
        {["な", "ん", "ば"].map((ch, i) => (
          <text key={i} x={44} y={50 + i * 14} fontSize={13} fill="#101010" textAnchor="middle" fontWeight={900}
            fontFamily="'Noto Sans JP','Yu Gothic',sans-serif">{ch}</text>
        ))}
      </g>
      <g>
        <line x1={356} y1={6} x2={356} y2={92} stroke="#2a1a1a" strokeWidth={2} />
        <ellipse cx={356} cy={56} rx={17} ry={24} fill="#f8ead0" />
        <rect x={345} y={32} width={22} height={4} fill="#151010" /><rect x={345} y={78} width={22} height={4} fill="#151010" />
        {["京", "都"].map((ch, i) => (
          <text key={i} x={356} y={52 + i * 17} fontSize={15} fill="#7a1010" textAnchor="middle" fontWeight={900}
            fontFamily="'Noto Sans JP','Yu Gothic',sans-serif">{ch}</text>
        ))}
      </g>
      <rect y={150} width={W} height={H - 150} fill={`url(#${p}water)`} />
      <Ripples y={150} colors={["#ffa040", "#ff5a3c", "#ffd27a"]} seed={15} count={12} />
      <PathStrip vanishY={148} color="#3a1a3e" lane="#ffa040" />
      <Rails color="#b81c14" vanishY={148} />
      <Torii x={200} y={150} s={0.62} color="#d8281a" rope />
      {[ -34, -18, 18, 34 ].map((dx) => <Lantern key={dx} x={200 + dx} y={102} s={0.7} color="#ff6a2a" />)}
      <Petals n={10} seed={19} color="#ffb0c8" yMax={150} />
    </>
  );
}

/* --------------------------------- export --------------------------------- */

export function ZoneBanner({ zone, className = "" }: { zone: GameZone; className?: string }) {
  const rawId = useId();
  const p = "zb" + rawId.replace(/[^a-zA-Z0-9]/g, "") + zone.id.replace(/[^a-zA-Z0-9]/g, "");

  let scene: React.ReactNode;
  switch (zone.id) {
    case "torii_path": scene = <SceneTorii p={p} />; break;
    case "sakura_grove": scene = <SceneSakura p={p} />; break;
    case "moonlight_shrine": scene = <SceneMoonlight p={p} />; break;
    case "fuji_summit": scene = <SceneFuji p={p} />; break;
    case "listening_realm": scene = <SceneListening p={p} />; break;
    case "kansai_festival": scene = <SceneKansai p={p} />; break;
    default:
      scene = (
        <>
          <defs>
            <linearGradient id={`${p}sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={zone.skyColor} /><stop offset="1" stopColor={zone.fogColor} />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#${p}sky)`} />
          <Torii x={200} y={190} s={1} color={zone.gateColor} />
        </>
      );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={zone.nameVi}
    >
      {scene}
    </svg>
  );
}