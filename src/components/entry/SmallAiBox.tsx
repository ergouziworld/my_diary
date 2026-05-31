"use client";

import { useState } from "react";

const quickQuestions = [
  "怎么快速进入状态？",
  "我现在有点焦虑，怎么办？",
  "今天先做哪一件事？",
  "帮我一句话总结建议"
];

function trimToLimit(text: string, limit: number) {
  const value = text.trim();
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
}

export function SmallAiBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("输入一个问题，100 字以内。");
  const [loading, setLoading] = useState(false);

  async function handleAsk(nextQuestion?: string) {
    const text = (nextQuestion ?? question).trim();
    if (!text || loading) return;
    if (text.length > 100) {
      setAnswer("问题最多 100 字。");
      return;
    }

    setLoading(true);
    setAnswer("AI 思考中...");

    try {
      const response = await fetch("/api/smallai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      });

      const payload = (await response.json()) as { ok: boolean; answer?: string; error?: string };

      if (!response.ok || !payload.ok) {
        setAnswer(payload.error ?? "回答失败。");
        return;
      }

      setAnswer(trimToLimit(payload.answer ?? "", 30));
    } catch {
      setAnswer("请求失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-[2rem] border border-accent-500/20 bg-[radial-gradient(circle_at_top,_rgb(var(--accent-500)_/_0.14),_transparent_42%),linear-gradient(180deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.88))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-500/25 bg-accent-500/10 px-3 py-1 text-[11px] font-medium text-accent-300">
            小 AI
          </div>
          <h3 className="mt-3 text-xl font-semibold text-white">独立问答区</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">只回答问题，不读取日记数据，也不保存上下文。</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">limit</div>
          <div className="text-sm font-semibold text-accent-300">100 / 30</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickQuestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuestion(item);
              void handleAsk(item);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:border-accent-500/40 hover:bg-accent-500/10"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <label className="flex items-center justify-between text-xs text-slate-500">
          <span>问题输入</span>
          <span>{question.length}/100</span>
        </label>
        <textarea
          maxLength={100}
          rows={4}
          className="w-full resize-none rounded-3xl border border-white/10 bg-slate-900/90 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-accent-500/50"
          placeholder="输入问题，100 字以内"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">回答自动压缩到 30 字以内。</p>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleAsk()}
          className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "回答中..." : "提问"}
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4">
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">answer</div>
        <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-accent-500/15 px-4 py-3 text-sm leading-6 text-slate-100">
          {answer}
        </div>
      </div>
    </div>
  );
}
