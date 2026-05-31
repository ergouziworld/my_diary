"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PetAvatar, type PetMood } from "./PetAvatar";

const PET_NAME_KEY = "pet:name";
const GREETED_KEY = "pet:greeted";
const DEFAULT_NAME = "团子";

type PetAction =
  | "idle" | "walk_left" | "walk_right" | "jump" | "spin" | "wiggle" | "nuzzle" | "sleep" | "look_around";

// 动作 → 一次性动画 class 与时长（walk/sleep/idle 不用一次性动画）
const ACTION_ANIM: Partial<Record<PetAction, { cls: string; ms: number }>> = {
  jump: { cls: "pet-jump", ms: 700 },
  spin: { cls: "pet-spin", ms: 800 },
  wiggle: { cls: "pet-wiggle", ms: 700 },
  nuzzle: { cls: "pet-nuzzle", ms: 800 },
  look_around: { cls: "pet-look", ms: 1200 }
};

const WALK_STEP = 84; // 每次走动的像素
const WALK_MIN = -200; // 最左（向屏幕内）
const WALK_MAX = 0; // 最右（初始角落）

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function PetCompanion() {
  const [mood, setMood] = useState<PetMood>("calm");
  const [line, setLine] = useState("");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [petName, setPetName] = useState(DEFAULT_NAME);
  const [offsetX, setOffsetX] = useState(0);
  const [animClass, setAnimClass] = useState("");

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(false);
  const loadingRef = useRef(false);
  const petNameRef = useRef(DEFAULT_NAME);

  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { petNameRef.current = petName; }, [petName]);

  // 执行 AI 选定的动作（代码负责"怎么演"）
  const runAction = useCallback((action: PetAction) => {
    if (animTimer.current) clearTimeout(animTimer.current);
    if (action === "walk_left") {
      setOffsetX((x) => clamp(x - WALK_STEP, WALK_MIN, WALK_MAX));
      return;
    }
    if (action === "walk_right") {
      setOffsetX((x) => clamp(x + WALK_STEP, WALK_MIN, WALK_MAX));
      return;
    }
    if (action === "sleep") {
      setMood("sleepy");
      return;
    }
    const anim = ACTION_ANIM[action];
    if (anim) {
      setAnimClass(anim.cls);
      animTimer.current = setTimeout(() => setAnimClass(""), anim.ms);
    }
  }, []);

  const ask = useCallback(async (trigger: "greeting" | "chat" | "idle" | "touch", message?: string) => {
    setLoading(true);
    if (trigger !== "idle") {
      setMood("thinking");
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
      } else if (trigger === "idle") {
        // 自主动作可以不说话，不强行弹气泡
      }
      if (data.action) runAction(data.action);
    } catch {
      setMood("calm");
      if (trigger !== "idle") setLine("（我走神了，再说一次？）");
    } finally {
      setLoading(false);
    }
  }, [runAction]);

  // 初始化名字 + 每次会话打一次招呼 + 启动自主活动循环
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(PET_NAME_KEY);
      if (savedName) setPetName(savedName);
      if (!sessionStorage.getItem(GREETED_KEY)) {
        sessionStorage.setItem(GREETED_KEY, "1");
        void ask("greeting");
      }
    } catch {
      /* ignore */
    }

    // 自主活动：每隔 60~120s 问一次 AI 想做什么（页面可见、未在对话/加载时）
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

    return () => {
      if (tickTimer.current) clearTimeout(tickTimer.current);
      if (animTimer.current) clearTimeout(animTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 气泡在面板关闭时定时自动隐藏
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
    void ask("touch");
  }

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void ask("chat", text);
  }

  return (
    <div
      className="pointer-events-none fixed bottom-24 right-3 z-40 flex flex-col items-end gap-2 transition-transform duration-[1200ms] ease-in-out md:bottom-6"
      style={{ transform: `translateX(${offsetX}px)` }}
    >
      {open ? (
        <div className="pointer-events-auto w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-cyan-400/25 bg-slate-900/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-200">{petName}</span>
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
              className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="shrink-0 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              说
            </button>
          </div>
        </div>
      ) : (
        bubbleVisible &&
        (loading || line) && (
          <div className="pointer-events-auto max-w-[min(16rem,calc(100vw-5rem))] rounded-2xl rounded-br-sm border border-white/10 bg-slate-900/95 px-3 py-2 text-sm leading-relaxed text-slate-200 shadow-lg backdrop-blur">
            {loading ? "……" : line}
          </div>
        )
      )}

      {/* 形象 + 聊天入口 */}
      <div className="relative">
        <button
          type="button"
          onClick={handlePoke}
          aria-label={`摸摸${petName}`}
          className={`pointer-events-auto drop-shadow-[0_6px_16px_rgba(34,211,238,0.35)] transition-transform active:scale-90 ${
            animClass || "animate-petBob"
          }`}
        >
          <PetAvatar mood={mood} size={72} />
        </button>
        <button
          type="button"
          onClick={() => { setOpen(true); setBubbleVisible(true); }}
          aria-label="和宠物聊天"
          className="pointer-events-auto absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400/40 bg-slate-900 text-xs shadow"
        >
          💬
        </button>
      </div>
    </div>
  );
}
