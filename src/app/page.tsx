import Link from "next/link";
import { HomeInputSection } from "@/components/entry/HomeInputSection";
import { DeleteEntryButton } from "@/components/entry/DeleteEntryButton";
import { SmallAiBox } from "@/components/entry/SmallAiBox";
import { MetricCard } from "@/components/common/MetricCard";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { listEntries } from "@/server/entries";
import type { EntryRecord } from "@/server/entries";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const isTimeline = view === "timeline";
  const entries = await listEntries();

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 w-fit">
        <Link
          href="/"
          className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
            !isTimeline ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
          }`}
        >
          概览
        </Link>
        <Link
          href="/?view=timeline"
          className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
            isTimeline ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
          }`}
        >
          时间线
        </Link>
      </div>

      {isTimeline ? (
        <TimelineView entries={entries} />
      ) : (
        <div className="space-y-5">
          <HomeInputSection />

          <section className="grid grid-cols-2 gap-3">
            <EntryMetrics entries={entries} />
          </section>

          <SmallAiBox />

          <RecentEntries entries={entries} />
        </div>
      )}
    </div>
  );
}

function EntryMetrics({ entries }: { entries: EntryRecord[] }) {
  return (
    <>
      <MetricCard label="今日记录" value={String(entries.length)} hint="原文已保存" />
      <MetricCard label="待办任务" value={String(entries.flatMap((item) => item.tasks).length)} hint="AI 提取" />
      <MetricCard label="情绪记录" value={String(entries.flatMap((item) => item.entryEmotions).length)} hint="结构化分析" />
      <MetricCard label="AI 总结" value={String(entries.filter((item) => item.entryAnalysis).length)} hint="已分析条目" />
    </>
  );
}

function RecentEntries({ entries }: { entries: EntryRecord[] }) {
  const recentItems = entries.slice(0, 5).map((entry) => {
    const raw = entry.entryAnalysis?.rawAiResult as { tags?: string[] } | null | undefined;
    const images = entry.attachments.filter((a) => a.fileType === "image" || a.mimeType.startsWith("image/"));
    return {
      id: entry.id,
      rawContent: entry.rawContent ?? "",
      meta: entry.createdAt.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      summary: entry.entryAnalysis?.summary ?? null,
      tags: raw?.tags ?? [],
      images,
    };
  });

  return (
    <Panel title="最近记录" subtitle="">
      <div className="space-y-4">
        {recentItems.length ? (
          recentItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">{item.meta}</p>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((tag) => <Pill key={tag} tone="neutral">{tag}</Pill>)}
                  </div>
                  <DeleteEntryButton entryId={item.id} />
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words line-clamp-6">
                {item.rawContent || "（无内容）"}
              </p>

              {item.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.images.slice(0, 4).map((img) => (
                    <img key={img.id} src={img.fileUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  ))}
                  {item.images.length > 4 && (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-slate-400">
                      +{item.images.length - 4}
                    </div>
                  )}
                </div>
              )}

              {item.summary && (
                <p className="border-t border-white/5 pt-3 text-xs text-slate-500 leading-relaxed break-words">
                  AI · {item.summary}
                </p>
              )}
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-400">还没有记录，先去写一条吧。</p>
        )}
      </div>
    </Panel>
  );
}

function TimelineView({ entries }: { entries: EntryRecord[] }) {
  return (
    <Panel title="时间线" subtitle="把原文和摘要串起来。">
      <div className="space-y-4">
        {entries.length ? (
          entries.map((entry) => {
            const raw = entry.entryAnalysis?.rawAiResult as { timelineTitle?: string } | null | undefined;
            const title = raw?.timelineTitle ?? entry.entryAnalysis?.summary ?? "未生成摘要";
            return (
              <div key={entry.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[96px_1fr]">
                <div className="text-sm font-medium text-slate-300">
                  {entry.createdAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-white">{title}</h3>
                    <Pill tone="accent">{entry.type}</Pill>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">{entry.entryAnalysis?.summary ?? entry.rawContent ?? ""}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-400">暂无时间线数据。</p>
        )}
      </div>
    </Panel>
  );
}
