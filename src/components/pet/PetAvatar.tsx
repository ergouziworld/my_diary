"use client";

/**
 * 宠物形象（可替换插槽）。当前皮肤：Q 版羽毛球少年（黑色刺猬头 + 黑红运动服 + 羽毛球）。
 * 保持 { mood, size } 接口不变——以后换 Live2D 或其它皮肤只要替换这里即可，
 * 上层 PetCompanion 的大脑/互动逻辑无需改动。
 */

export type PetMood = "happy" | "calm" | "sad" | "worried" | "excited" | "sleepy" | "thinking";

const HAIR = "#1b1d24";
const SKIN = "#f4cba6";
const SKIN_LINE = "#dca87f";
const RED = "#e11d48";
const PURPLE = "#7c3aed";

function Eyes({ mood }: { mood: PetMood }) {
  const c = "#0f172a";
  if (mood === "happy" || mood === "excited") {
    return (
      <g stroke={c} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M30 46 q6 -7 12 0" />
        <path d="M58 46 q6 -7 12 0" />
      </g>
    );
  }
  if (mood === "sleepy") {
    return (
      <g stroke={c} strokeWidth={3} strokeLinecap="round">
        <line x1="30" y1="48" x2="42" y2="48" />
        <line x1="58" y1="48" x2="70" y2="48" />
      </g>
    );
  }
  if (mood === "sad" || mood === "worried") {
    return (
      <g fill={c}>
        <circle cx="36" cy="50" r="4.5" />
        <circle cx="64" cy="50" r="4.5" />
        <g stroke={c} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d="M28 42 q8 -4 14 0" />
          <path d="M58 42 q6 -4 14 0" />
        </g>
      </g>
    );
  }
  if (mood === "thinking") {
    return (
      <g fill={c}>
        <circle cx="37" cy="45" r="5" />
        <circle cx="65" cy="45" r="5" />
        <circle cx="38.6" cy="43" r="1.8" fill="#fff" />
        <circle cx="66.6" cy="43" r="1.8" fill="#fff" />
      </g>
    );
  }
  // calm 默认：坚定的圆眼 + 高光（运动少年感）
  return (
    <g fill={c}>
      <circle cx="36" cy="48" r="5" />
      <circle cx="64" cy="48" r="5" />
      <circle cx="37.6" cy="46.4" r="1.6" fill="#fff" />
      <circle cx="65.6" cy="46.4" r="1.6" fill="#fff" />
    </g>
  );
}

function Brows({ mood }: { mood: PetMood }) {
  // 默认/兴奋时一对坚定的眉毛，强化"热血"感
  if (mood === "sad" || mood === "worried" || mood === "sleepy") return null;
  const slant = mood === "excited" ? 2 : 0;
  return (
    <g stroke="#2a2d36" strokeWidth={2.6} strokeLinecap="round">
      <line x1="30" y1={39 + slant} x2="43" y2={37} />
      <line x1="57" y1={37} x2="70" y2={39 + slant} />
    </g>
  );
}

function Mouth({ mood }: { mood: PetMood }) {
  const c = "#7a2e22";
  if (mood === "excited") return <path d="M42 60 q8 12 16 0 q-8 6 -16 0" fill={c} />;
  if (mood === "happy") return <path d="M42 60 q8 9 16 0" stroke={c} strokeWidth={3} fill="none" strokeLinecap="round" />;
  if (mood === "sad") return <path d="M44 64 q6 -7 12 0" stroke={c} strokeWidth={3} fill="none" strokeLinecap="round" />;
  if (mood === "worried") return <path d="M43 62 q4 -4 7 0 q4 4 8 0" stroke={c} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
  if (mood === "sleepy") return <ellipse cx="50" cy="62" rx="3.5" ry="4.5" fill={c} />;
  if (mood === "thinking") return <ellipse cx="50" cy="63" rx="3" ry="3.5" fill={c} />;
  return <path d="M45 61 q5 4 10 0" stroke={c} strokeWidth={2.8} fill="none" strokeLinecap="round" />;
}

export function PetAvatar({ mood, size = 72 }: { mood: PetMood; size?: number }) {
  const showCheek = mood === "happy" || mood === "excited";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="petShirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#262932" />
          <stop offset="100%" stopColor="#121319" />
        </linearGradient>
      </defs>

      {/* 运动服 / 肩膀 */}
      <path d="M18 98 C18 81 32 73 50 73 C68 73 82 81 82 98 Z" fill="url(#petShirt)" stroke="#0b0c10" strokeWidth={2} />
      {/* 红 / 紫 斜向撞色 */}
      <path d="M50 73 L63 75 L41 98 L29 98 Z" fill={RED} opacity={0.92} />
      <path d="M63 75 L72 78 L54 98 L45 98 Z" fill={PURPLE} opacity={0.5} />
      {/* 领口 V */}
      <path d="M42 73 L50 82 L58 73" fill="none" stroke="#e2e8f0" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />

      {/* 头发（脑后，刺猬冠） */}
      <path
        d="M20 52 L26 22 L34 38 L41 14 L48 34 L50 10 L54 34 L61 14 L68 38 L76 22 L80 52 C80 62 75 68 70 70 L30 70 C25 68 20 62 20 52 Z"
        fill={HAIR}
      />

      {/* 脸 */}
      <ellipse cx="50" cy="49" rx="24" ry="26" fill={SKIN} stroke={SKIN_LINE} strokeWidth={1.4} />

      {/* 刘海（额前刺猬） */}
      <path
        d="M28 30 L33 44 L39 30 L45 43 L50 29 L55 43 L61 30 L67 44 L72 30 C67 23 59 20 50 20 C41 20 33 23 28 30 Z"
        fill={HAIR}
      />
      {/* 鬓角 */}
      <path d="M27 44 C25 54 27 61 31 64 C28 56 29 50 30 45 Z" fill={HAIR} />
      <path d="M73 44 C75 54 73 61 69 64 C72 56 71 50 70 45 Z" fill={HAIR} />

      {showCheek && (
        <g fill="#fb7185" opacity={0.5}>
          <ellipse cx="31" cy="56" rx="5" ry="3.4" />
          <ellipse cx="69" cy="56" rx="5" ry="3.4" />
        </g>
      )}

      <Brows mood={mood} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />

      {/* 羽毛球配饰（右上角） */}
      <g transform="translate(80 18) rotate(18)">
        <ellipse cx="0" cy="7" rx="4.2" ry="3.2" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={0.8} />
        <path d="M0 9 L-6 -7 L6 -7 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth={0.8} />
        <line x1="-3.5" y1="-4" x2="-2" y2="6" stroke="#cbd5e1" strokeWidth={0.6} />
        <line x1="0" y1="-6" x2="0" y2="7" stroke="#cbd5e1" strokeWidth={0.6} />
        <line x1="3.5" y1="-4" x2="2" y2="6" stroke="#cbd5e1" strokeWidth={0.6} />
      </g>

      {mood === "thinking" && <text x="6" y="26" fontSize="20" fontWeight="bold" fill="#fde047">?</text>}
      {mood === "sleepy" && <text x="8" y="28" fontSize="15" fill="#94a3b8">z</text>}
    </svg>
  );
}
