import { Suspense } from "react";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";
import { listEntries } from "@/server/entries";

export const dynamic = "force-dynamic";

function getTimelineTitle(entry: Awaited<ReturnType<typeof listEntries>>[number]) {
  const raw = entry.entryAnalysis?.rawAiResult as { timelineTitle?: string } | null | undefined;
  return raw?.timelineTitle ?? entry.entryAnalysis?.summary ?? "未生成摘要";
}

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader title="时间线" description="优先展示事件本身，再看摘要。" />
      <Suspense fallback={<Panel title="时间线" subtitle="正在加载"><p className="text-sm text-slate-400">加载中...</p></Panel>}>
        <TimelineList />
      </Suspense>
    </div>
  );
}

async function TimelineList() {
  const entries = await listEntries();

  return (
    <Panel title="今天的时间线" subtitle="把原文和摘要串起来。">
      <div className="space-y-4">
        {entries.length ? (
          entries.map((entry) => (
            <div key={entry.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[96px_1fr]">
              <div className="text-sm font-medium text-slate-300">
                {entry.createdAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-white">{getTimelineTitle(entry)}</h3>
                  <Pill tone="accent">{entry.type}</Pill>
                </div>
                <p className="text-sm leading-6 text-slate-300">{entry.entryAnalysis?.summary ?? entry.rawContent ?? ""}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">暂无时间线数据。</p>
        )}
      </div>
    </Panel>
  );
}
