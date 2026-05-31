"use client";

import { useState } from "react";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";

const suggestions = [
  "我最近为什么焦虑？",
  "帮我总结今天的状态",
  "我这周的任务该怎么安排？",
  "根据我的记录给我一个行动建议"
];

export default function Page() {
  const [question, setQuestion] = useState("我最近为什么焦虑？");
  const [answer, setAnswer] = useState("等待输入问题后调用 AI。");
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState("");

  async function handleReindex() {
    if (indexing) return;
    setIndexing(true);
    setIndexStatus("正在让大 AI 读取你的全部日记...");
    try {
      const res = await fetch("/api/ai/reindex", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; total?: number; indexed?: number; error?: string };
      if (data.ok) {
        setIndexStatus(`已建立索引：${data.indexed ?? 0} / ${data.total ?? 0} 条日记。现在可以提问了。`);
      } else {
        setIndexStatus(data.error ?? "建立索引失败。");
      }
    } catch {
      setIndexStatus("请求失败，请稍后重试。");
    } finally {
      setIndexing(false);
    }
  }

  async function handleAsk() {
    const text = question.trim();
    if (!text || loading) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json()) as { error?: string };
        setAnswer(payload.error ?? "AI 返回失败。");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAnswer((prev) => prev + chunk);
      }
    } catch {
      setAnswer("请求失败，请检查后端服务和 AI 配置。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="大 AI"
        description="这里是长期记忆问答入口，会检索你的相关日记作为上下文交给 AI，再返回可操作建议。"
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <button
          onClick={handleReindex}
          disabled={indexing}
          className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {indexing ? "建立索引中..." : "重建记忆索引"}
        </button>
        <span className="text-xs text-slate-400">
          {indexStatus || "首次使用或日记有大量更新后，点一次让大 AI 重新读取全部日记。新日记会自动入库。"}
        </span>
      </div>

      <Panel title="长期记忆问答" subtitle="先提问，再由服务端调用配置的 AI 提供商。">
        <div className="space-y-4">
          <textarea
            className="min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-red-500/50"
            placeholder="输入你的问题，例如：我最近为什么焦虑？"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">长期记忆</Pill>
            <Pill tone="neutral">结构化输出</Pill>
            <Pill tone="neutral">服务端调用</Pill>
            <Pill tone="neutral">可替换 provider</Pill>
          </div>
          <button
            onClick={handleAsk}
            disabled={loading}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "生成中..." : "开始回答"}
          </button>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="快捷提问" subtitle="常见问题可以直接点选，减少输入成本。">
          <div className="space-y-3">
            {suggestions.map((item) => (
              <button
                key={item}
                onClick={() => setQuestion(item)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="回答草稿" subtitle="这里显示 AI 的最终结论，后续可以拆成证据、建议和下一步。">
          <div className="h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-300 pr-2">{answer}</div>
        </Panel>
      </div>
    </div>
  );
}
