"use client";

import { useState } from "react";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";

const suggestions = ["我最近为什么焦虑？", "帮我总结今天的状态", "我这周的任务该怎么排", "根据我的记录给我一个行动建议"];

export default function Page() {
  const [question, setQuestion] = useState("我最近为什么焦虑？");
  const [answer, setAnswer] = useState("等待输入问题后调用 AI。");
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    const text = question.trim();
    if (!text || loading) {
      return;
    }

    setLoading(true);
    setAnswer("AI 正在思考...");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      });

      const payload = (await response.json()) as
        | { ok: true; result: { output: { answer: string }; provider: string; model: string } }
        | { ok: false; error: string };

      if (!response.ok || !payload.ok) {
        setAnswer(!payload.ok ? payload.error : "AI 返回失败。");
        return;
      }

      setAnswer(`${payload.result.output.answer}\n\n来源：${payload.result.provider}/${payload.result.model}`);
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
        description="这里是长期记忆问答入口，会把你的记录上下文接到 AI，再返回可操作的建议。"
      />

      <Panel title="长期记忆问答" subtitle="先提问，再由服务端去调用你配置的 AI 提供商。">
        <div className="space-y-4">
          <textarea
            className="min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
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
            className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "生成中..." : "开始回答"}
          </button>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="快捷提问" subtitle="常见问题可以直接点，减少输入成本。">
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

        <Panel title="回答草稿" subtitle="这里显示 AI 的最终结论，后续可以继续拆成证据、建议和下一步。">
          <div className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{answer}</div>
        </Panel>
      </div>
    </div>
  );
}
