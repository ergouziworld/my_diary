"use client";

/**
 * 宠物形象（可替换插槽）。当前用纯 SVG 画的表情小生物。
 * 以后接 Live2D 时，只要做一个同样接收 mood 的 Live2DAvatar 替换这里即可，
 * 上层 PetCompanion 的大脑/互动逻辑无需改动。
 */

export type PetMood = "happy" | "calm" | "sad" | "worried" | "excited" | "sleepy" | "thinking";

type Palette = { body1: string; body2: string; outline: string; cheek: string };

const PALETTE: Palette = {
  body1: "#67e8f9", // cyan-300
  body2: "#22d3ee", // cyan-400
  outline: "#0e7490",
  cheek: "#fb7185"
};

function Eyes({ mood }: { mood: PetMood }) {
  const c = "#0f172a";
  // 不同情绪不同眼睛
  if (mood === "happy" || mood === "excited") {
    // ^ ^ 弯眼
    return (
      <g stroke={c} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M30 44 q6 -7 12 0" />
        <path d="M58 44 q6 -7 12 0" />
      </g>
    );
  }
  if (mood === "sleepy") {
    // 半闭眼 —— —
    return (
      <g stroke={c} strokeWidth={3} strokeLinecap="round">
        <line x1="30" y1="46" x2="42" y2="46" />
        <line x1="58" y1="46" x2="70" y2="46" />
      </g>
    );
  }
  if (mood === "sad" || mood === "worried") {
    // 八字下垂眼
    return (
      <g fill={c}>
        <circle cx="36" cy="48" r="4.5" />
        <circle cx="64" cy="48" r="4.5" />
        <g stroke={c} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d="M28 40 q8 -4 14 0" />
          <path d="M58 40 q6 -4 14 0" />
        </g>
      </g>
    );
  }
  if (mood === "thinking") {
    return (
      <g fill={c}>
        <circle cx="36" cy="46" r="4" />
        <circle cx="64" cy="46" r="4" />
      </g>
    );
  }
  // calm 默认：圆豆眼 + 高光
  return (
    <g fill={c}>
      <circle cx="36" cy="46" r="5" />
      <circle cx="64" cy="46" r="5" />
      <circle cx="37.6" cy="44.4" r="1.6" fill="#fff" />
      <circle cx="65.6" cy="44.4" r="1.6" fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: PetMood }) {
  const c = "#0f172a";
  if (mood === "excited") return <path d="M42 58 q8 12 16 0 q-8 6 -16 0" fill={c} />;
  if (mood === "happy") return <path d="M42 58 q8 9 16 0" stroke={c} strokeWidth={3} fill="none" strokeLinecap="round" />;
  if (mood === "sad") return <path d="M44 62 q6 -7 12 0" stroke={c} strokeWidth={3} fill="none" strokeLinecap="round" />;
  if (mood === "worried") return <path d="M43 60 q4 -4 7 0 q4 4 8 0" stroke={c} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
  if (mood === "sleepy") return <ellipse cx="50" cy="60" rx="3.5" ry="4.5" fill={c} />;
  if (mood === "thinking") return <line x1="46" y1="60" x2="56" y2="60" stroke={c} strokeWidth={3} strokeLinecap="round" />;
  return <path d="M44 59 q6 5 12 0" stroke={c} strokeWidth={2.8} fill="none" strokeLinecap="round" />;
}

export function PetAvatar({ mood, size = 72 }: { mood: PetMood; size?: number }) {
  const showCheek = mood === "happy" || mood === "excited";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id="petBody" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor={PALETTE.body1} />
          <stop offset="100%" stopColor={PALETTE.body2} />
        </radialGradient>
      </defs>
      {/* 身体：圆润的水滴/团子 */}
      <path
        d="M50 12 C74 12 86 32 86 54 C86 78 70 90 50 90 C30 90 14 78 14 54 C14 32 26 12 50 12 Z"
        fill="url(#petBody)"
        stroke={PALETTE.outline}
        strokeWidth={2}
      />
      {/* 头顶呆毛 */}
      <path d="M50 12 q4 -8 9 -9 q-3 5 -1 9" fill={PALETTE.body2} stroke={PALETTE.outline} strokeWidth={1.5} />
      {showCheek && (
        <g fill={PALETTE.cheek} opacity={0.65}>
          <ellipse cx="26" cy="58" rx="6" ry="4" />
          <ellipse cx="74" cy="58" rx="6" ry="4" />
        </g>
      )}
      <Eyes mood={mood} />
      <Mouth mood={mood} />
    </svg>
  );
}
