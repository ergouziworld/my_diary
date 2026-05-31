"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PetAvatar, type PetMood } from "./PetAvatar";

const PET_NAME_KEY = "pet:name";
const PET_POS_KEY = "pet:pos";
const GREETED_KEY = "pet:greeted";
const DEFAULT_NAME = "团子";
const SIZE = 72;

type PetAction =
  | "idle" | "walk_left" | "walk_right" | "jump" | "spin" | "wiggle" | "nuzzle" | "sleep" | "look_around";

const ACTION_ANIM: Partial<Record<PetAction, { cls: string; ms: number }>> = {
  jump: { cls: "pet-jump", ms: 700 },
  spin: { cls: "pet-spin", ms: 800 },
  wiggle: { cls: "pet-wiggle", ms: 700 },
  nuzzle: { cls: "pet-nuzzle", ms: 800 },
  look_around: { cls: "pet-look", ms: 1200 }
};

const WALK_STEP = 90;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function maxX() {
  return (typeof window !== "undefined" ? window.innerWidth : 400) - SIZE - 8;
}
function maxY() {
  return (typeof window !== "undefined" ? window.innerHeight : 800) - SIZE - 8;
}

export function PetCompanion() {
  const [mood, setMood] = useState<PetMood>("calm");
  const [line, setLine] = useState("");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [petName, setPetName] = useState(DEFAULT_NAME);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [animClass, setAnimClass] = useState("");
  const [dragging, setDragging] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wanderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(false);
  const loadingRef = useRef(false);
  const draggingRef = useRef(false);
  const petNameRef = useRef(DEFAULT_NAME);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { draggingRef.current = dragging; }, [dragging]);
  useEffect(() => { petNameRef.current = petName; }, [petName]);

  const playAnim = useCallback((cls: string, ms: number) => {
    if (animTimer.current) clearTimeout(animTimer.current);
    setAnimClass(cls);
    animTimer.current = setTimeout(() => setAnimClass(""), ms);
  }, []);

  const runAction = useCallback((action: PetAction) => {
    if (action === "walk_left") {
      setPos((p) => (p ? { ...p, x: clamp(p.x - WALK_STEP, 8, maxX()) } : p));
      return;
    }
    if (action === "walk_right") {
      setPos((p) => (p ? { ...p, x: clamp(p.x + WALK_STEP, 8, maxX()) } : p));
      return;
    }
    if (action === "sleep") {
      setMood("sleepy");
      return;
    }
    const anim = ACTION_ANIM[action];
    if (anim) playAnim(anim.cls, anim.ms);
  }, [playAnim]);

  const ask = useCallback(async (trigger: "greeting" | "chat" | "idle" | "touch", message?: string) => {
    setLoading(true);
    if (trigger === "greeting" || trigger === "chat") {
      setMood("thinking");
      setBubbleVisible(true);
    } else if (trigger === "touch") {
      setBubbleVisible(true);
    }
    try {
      const res = await fetch("/api/pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger, message, petName: petNameRef.current })
      });
      const data = (await res.json()) as { mood?: PetMood; action?: PetAction; line?: string };
      if (data.mood) setMood(data.mood);
      if (typeof data.line === "string" && data.line) {
        setLine(data.line);
        setBubbleVisible(true);
      }
      if (data.action) runAction(data.action);
    } catch {
      setMood("calm");
      if (trigger !== "idle") setLine("（我走神了，再说一次？）");
    } finally {
      setLoading(false);
    }
  }, [runAction]);

  // 初始化位置（读存储或默认右下角）
  useEffect(() => {
    let initial = { x: maxX(), y: maxY() - 80 };
    try {
      const saved = localStorage.getItem(PET_POS_KEY);
      if (saved) {
        const p = JSON.parse(saved) as { x: number; y: number };
        if (typeof p.x === "number" && typeof p.y === "number") {
          initial = { x: clamp(p.x, 8, maxX()), y: clamp(p.y, 8, maxY()) };
        }
      }
      const savedName = localStorage.getItem(PET_NAME_KEY);
      if (savedName) setPetName(savedName);
    } catch {
      /* ignore */
    }
    setPos(initial);

    const onResize = () => setPos((p) => (p ? { x: clamp(p.x, 8, maxX()), y: clamp(p.y, 8, maxY()) } : p));
    window.addEventListener("resize", onResize);

    try {
      if (!sessionStorage.getItem(GREETED_KEY)) {
        sessionStorage.setItem(GREETED_KEY, "1");
        void ask("greeting");
      }
    } catch {
      /* ignore */
    }

    // AI 自主"想做什么"：较慢（说话/表情/带感情的动作），省 token
    const schedule = () => {
      const delay = 60000 + Math.random() * 60000;
      tickTimer.current = setTimeout(() => {
        if (typeof document !== "undefined" && !document.hidden && !openRef.current && !loadingRef.current) {
          void ask("idle");
        }
        schedule();
      }, delay);
    };
    schedule();

    // 环境漫游：代码驱动、频繁、免费——让它真的到处溜达
    const wander = () => {
      const delay = 7000 + Math.random() * 6000;
      wanderTimer.current = setTimeout(() => {
        const idle =
          typeof document !== "undefined" &&
          !document.hidden && !openRef.current && !draggingRef.current && !loadingRef.current;
        if (idle) {
          const r = Math.random();
          if (r < 0.6) {
            setPos((p) => (p ? { x: clamp(p.x + (Math.random() * 2 - 1) * 170, 8, maxX()), y: p.y } : p));
          } else if (r < 0.82) {
            playAnim("pet-jump", 700);
          } else {
            playAnim("pet-look", 1200);
          }
        }
        wander();
      }, delay);
    };
    wander();

    return () => {
      window.removeEventListener("resize", onResize);
      if (tickTimer.current) clearTimeout(tickTimer.current);
      if (wanderTimer.current) clearTimeout(wanderTimer.current);
      if (animTimer.current) clearTimeout(animTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 位置变化时存一下（拖动结束/走动后）
  useEffect(() => {
    if (!pos || dragging) return;
    try {
      localStorage.setItem(PET_POS_KEY, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  }, [pos, dragging]);

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (bubbleVisible && !open && !loading && line) {
      hideTimer.current = setTimeout(() => setBubbleVisible(false), 8000);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [bubbleVisible, open, loading, line]);

  function handlePoke() {
    if (loading) return;
    // 立刻给个活泼反应，不要先呆住
    setMood("excited");
    playAnim("pet-wiggle", 700);
    void ask("touch");
  }

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void ask("chat", text);
  }

  // 拖拽
  function onPointerDown(e: React.PointerEvent) {
    if (!pos) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    setPos({ x: clamp(d.ox + dx, 8, maxX()), y: clamp(d.oy + dy, 8, maxY()) });
  }
  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d && !d.moved) handlePoke(); // 没怎么移动 = 轻点 = 摸摸
  }

  const bubbleBelow = pos !== null && pos.y < 150;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-40"
      style={{
        transform: `translate(${pos?.x ?? 0}px, ${pos?.y ?? 0}px)`,
        transition: dragging ? "none" : "transform 1s ease-in-out",
        opacity: pos ? 1 : 0
      }}
    >
      <div className="relative">
        {/* 气泡 / 对话面板：根据位置朝上或朝下展开 */}
        <div className={`absolute right-0 ${bubbleBelow ? "top-full mt-2" : "bottom-full mb-2"}`}>
          {open ? (
            <div className="pointer-events-auto w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-red-500/25 bg-slate-900/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-red-300">{petName}</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-1.5 text-slate-500 transition hover:text-white"
                  aria-label="收起"
                >
                  ×
                </button>
              </div>
              <div className="min-h-[2.5rem] rounded-xl bg-white/5 px-3 py-2 text-sm leading-relaxed text-slate-200">
                {loading ? "……" : line || "想跟我说点什么？"}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`和${petName}说说话…`}
                  className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-500/50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading}
                  className="shrink-0 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-400 disabled:opacity-60"
                >
                  说
                </button>
              </div>
            </div>
          ) : (
            bubbleVisible &&
            (loading || line) && (
              <div className="pointer-events-auto w-max max-w-[min(16rem,calc(100vw-5rem))] rounded-2xl border border-white/10 bg-slate-900/95 px-3 py-2 text-sm leading-relaxed text-slate-200 shadow-lg backdrop-blur">
                {loading ? "……" : line}
              </div>
            )
          )}
        </div>

        {/* 形象（可拖拽，轻点=摸摸） */}
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label={`拖动或摸摸${petName}`}
          style={{ touchAction: "none" }}
          className={`pointer-events-auto cursor-grab drop-shadow-[0_6px_16px_rgba(239,68,68,0.35)] active:cursor-grabbing ${
            dragging ? "" : animClass || "animate-petBob"
          }`}
        >
          <PetAvatar mood={mood} size={SIZE} />
        </button>
        <button
          type="button"
          onClick={() => { setOpen(true); setBubbleVisible(true); }}
          aria-label="和宠物聊天"
          className="pointer-events-auto absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-red-500/40 bg-slate-900 text-xs shadow"
        >
          💬
        </button>
      </div>
    </div>
  );
}
