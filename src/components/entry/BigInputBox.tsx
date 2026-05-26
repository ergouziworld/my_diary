"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AnalysisResult = { 
  summary: string;
  compressedMemory: string;
  tags: string[];
  emotions: Array<{ name: string; intensity: number; reason: string }>;
  tasks: Array<{ title: string; priority: "low" | "medium" | "high"; deadlineText: string; sourceText: string }>;
};

export function BigInputBox() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("等待提交");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const text = content.trim();
    if (!text || loading) return;

    setLoading(true);
    setStatus("先保存 entry，再请求 AI 分析");
    setResult(null);

    try {
      const savedResponse = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawContent: text, type: "text" })
      });
      const saved = (await savedResponse.json()) as { ok: true; data?: { id?: string } } | { ok: false; error: string };

      if (!savedResponse.ok || !saved.ok) {
        setStatus("ok" in saved && !saved.ok ? saved.error : "保存失败");
        return;
      }

      const entryId = saved.data?.id;
      if (!entryId) {
        setStatus("保存成功，但没有拿到 entryId");
        return;
      }

      const analysisResponse = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, content: text, type: "text" })
      });
      const analysis = (await analysisResponse.json()) as { ok: true; data?: AnalysisResult } | { ok: false; error: string };

      if (!analysisResponse.ok || !analysis.ok) {
        setStatus("ok" in analysis && !analysis.ok ? analysis.error : "AI 分析稍后可重试");
        return;
      }

      const nextResult = analysis.data ?? null;
      setResult(nextResult);
      setStatus("已保存并完成分析");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AI 分析稍后可重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        className="min-h-44 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
        placeholder="今天发生了什么？"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onPointerDown={() => setStatus("已点击，准备提交")}
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "处理中..." : "快速记一条"}
        </button>
        <div className="text-sm text-slate-400">{status}</div>
      </div>
      {result ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <div>摘要：{result.summary}</div>
          <div>标签：{result.tags.join("、") || "无"}</div>
          <div>情绪：{result.emotions.map((item) => item.name).join("、") || "无"}</div>
          <div>任务：{result.tasks.map((item) => item.title).join("、") || "无"}</div>
        </div>
      ) : null}
    </div>
  );
}