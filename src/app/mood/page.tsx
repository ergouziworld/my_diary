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
      <SectionHeader title="情绪" description="读取 entry_emotions 和分析结果中的情绪。"/>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/5" />}>
        <MoodContent />
      </Suspense>
    </div>
  );
}

async function MoodContent() {
  const entries = await listEntries();
  const emotions = entries.flatMap((entry) => {
    if (entry.entryEmotions.length) return entry.entryEmotions;
    const raw = entry.entryAnalysis?.rawAiResult as { emotions?: Array<{ name?: string; intensity?: number; reason?: string }> } | null | undefined;
    return (raw?.emotions ?? [])
      .map((item, index) => ({
        id: `${entry.id}-raw-emotion-${index}`,
        entryId: entry.id,
        name: item.name ?? "",
        intensity: typeof item.intensity === "number" ? item.intensity : 0,
        reason: item.reason ?? null,
        createdAt: entry.createdAt,
        updatedAt: entry.createdAt
      }))
      .filter((item) => item.name.length > 0);
  });

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="情绪记录" value={String(emotions.length)} hint="来自结构化分析" />
        <MetricCard label="高强度" value={String(emotions.filter((item) => item.intensity >= 0.7).length)} hint="intensity >= 0.7" />
        <MetricCard label="中强度" value={String(emotions.filter((item) => item.intensity >= 0.4 && item.intensity < 0.7).length)} hint="intensity 0.4-0.7" />
        <MetricCard label="低强度" value={String(emotions.filter((item) => item.intensity < 0.4).length)} hint="intensity < 0.4" />
      </section>

      <Panel title="情绪明细" subtitle="名称、强度、原因与来源摘要。">
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
            <p className="text-sm text-slate-400">暂无情绪结果。</p>
          )}
        </div>
      </Panel>
    </>
  );
}
