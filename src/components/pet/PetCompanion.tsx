"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PetAvatar, type PetMood } from "./PetAvatar";

const PET_NAME_KEY = "pet:name";
const GREETED_KEY = "pet:greeted";
const DEFAULT_NAME = "团子";

export function PetCompanion() {
  const [mood, setMood] = useState<PetMood>("calm");
  const [line, setLine] = useState("");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [petName, setPetName] = useState(DEFAULT_NAME);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ask = useCallback(
    async (trigger: "greeting" | "chat", message?: string) => {
      setLoading(true);
      setMood("thinking");
      setBubbleVisible(true);
      try {
        const res = await fetch("/api/pet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trigger, message, petName })
        });
        const data = (await res.json()) as { ok?: boolean; mood?: PetMood; line?: string };
        setMood(data.mood ?? "calm");
        setLine(data.line ?? "嗨~");
      } catch {
        setMood("calm");
        setLine("（我走神了，再说一次？）");
      } finally {
        setLoading(false);
      }
    },
    [petName]
  );

  // 初始化名字 + 每次会话打一次招呼
  useEffect(() => {
    try {
      const savedName = localStorage.getItem(PET_NAME_KEY);
      if (savedName) setPetName(savedName);
      if (!sessionStorage.getItem(GREETED_KEY)) {
        sessionStorage.setItem(GREETED_KEY, "1");
        void ask("greeting");
      }
    } catch {
      /* localStorage 不可用时忽略 */
    }
    // 只在首次挂载执行
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

  function handleAvatarClick() {
    setOpen((v) => {
      const next = !v;
      if (next) setBubbleVisible(true);
      return next;
    });
  }

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void ask("chat", text);
  }

  return (
    <div className="pointer-events-none fixed bottom-24 right-3 z-40 flex flex-col items-end gap-2 md:bottom-6">
      {/* 对话面板 / 气泡 */}
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

      {/* 形象 */}
      <button
        type="button"
        onClick={handleAvatarClick}
        aria-label={`和${petName}互动`}
        className="pointer-events-auto animate-petBob drop-shadow-[0_6px_16px_rgba(34,211,238,0.35)] transition-transform active:scale-95"
      >
        <PetAvatar mood={mood} size={72} />
      </button>
    </div>
  );
}
