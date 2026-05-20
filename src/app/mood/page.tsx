import { Suspense } from "react";
import { MetricCard } from "@/components/common/MetricCard";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";
import { listEntries } from "@/server/entries";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader title="情绪" description="优先读取 entry_emotions。" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/5" />}>
        <MoodContent />
      </Suspense>
    </div>
  );
}

async function MoodContent() {
  const entries = await listEntries();
  const emotions = entries.flatMap((entry) => entry.entryEmotions);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="情绪记录" value={String(emotions.length)} hint="来自 entry 的结构化分析" />
        <MetricCard label="焦虑" value={String(emotions.filter((item) => item.name === "焦虑").length)} hint="按名称聚合" />
        <MetricCard label="平静" value={String(emotions.filter((item) => item.name === "平静").length)} hint="按名称聚合" />
        <MetricCard label="其他" value={String(Math.max(emotions.length - 2, 0))} hint="其余情绪项" />
      </section>

      <Panel title="情绪明细" subtitle="来自 AI 分析结果。">
        <div className="space-y-3">
          {emotions.length ? (
            emotions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-white">{item.name}</h3>
                  <Pill tone="warning">{item.intensity.toFixed(1)}</Pill>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.reason ?? "无原因说明"}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">暂无 AI 情绪结果。</p>
          )}
        </div>
      </Panel>
    </>
  );
}
