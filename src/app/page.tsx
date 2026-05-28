import Link from "next/link";
import { Suspense } from "react";
import { RichInputBox } from "@/components/entry/RichInputBox";
import { SmallAiBox } from "@/components/entry/SmallAiBox";
import { MetricCard } from "@/components/common/MetricCard";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { listEntries } from "@/server/entries";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const isTimeline = view === "timeline";

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
        <Suspense fallback={<Panel title="时间线" subtitle="正在加载"><p className="text-sm text-slate-400">加载中...</p></Panel>}>
          <TimelineView />
        </Suspense>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col rounded-[2rem] border border-cyan-400/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(34,211,238,0.09),_transparent_55%),linear-gradient(180deg,_rgba(2,6,23,0.97),_rgba(15,23,42,0.92))] p-6 shadow-[0_0_60px_rgba(34,211,238,0.06),inset_0_1px_0_rgba(255,255,255,0.05)]" style={{ minHeight: "calc(100svh - 8rem)" }}>
            <div className="mb-4 flex items-end justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-semibold text-white">今天</h2>
                <p className="mt-0.5 text-sm text-slate-500">支持图片 · 文档 · 链接</p>
              </div>
            </div>
            <RichInputBox />
          </div>

          <section className="grid grid-cols-2 gap-3">
            <Suspense fallback={<><MetricCard label="今日记录" value="..." hint="" /><MetricCard label="待办任务" value="..." hint="" /><MetricCard label="情绪记录" value="..." hint="" /><MetricCard label="AI 总结" value="..." hint="" /></>}>
              <EntryMetrics />
            </Suspense>
          </section>

          <SmallAiBox />

          <Suspense fallback={<Panel title="最近记录" subtitle="正在加载"><p className="text-sm text-slate-400">加载中...</p></Panel>}>
            <RecentEntries />
          </Suspense>
        </div>
      )}
    </div>
  );
}

async function EntryMetrics() {
  const entries = await listEntries();
  return (
    <>
      <MetricCard label="今日记录" value={String(entries.length)} hint="原文已保存" />
      <MetricCard label="待办任务" value={String(entries.flatMap((item) => item.tasks).length)} hint="AI 提取" />
      <MetricCard label="情绪记录" value={String(entries.flatMap((item) => item.entryEmotions).length)} hint="结构化分析" />
      <MetricCard label="AI 总结" value={String(entries.filter((item) => item.entryAnalysis).length)} hint="已分析条目" />
    </>
  );
}

async function RecentEntries() {
  const entries = await listEntries();
  const recentItems = entries.slice(0, 3).map((entry) => {
    const raw = entry.entryAnalysis?.rawAiResult as { tags?: string[] } | null | undefined;
    return {
      id: entry.id,
      title: entry.entryAnalysis?.summary ?? entry.rawContent?.slice(0, 20) ?? "未生成摘要",
      meta: `${entry.type} · ${entry.createdAt.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
      summary: entry.entryAnalysis?.compressedMemory ?? entry.rawContent ?? "暂无内容",
      tags: raw?.tags ?? []
    };
  });

  return (
    <Panel title="最近记录" subtitle="刷新后也能看到数据库里的最新结果。">
      <div className="space-y-4">
        {recentItems.length ? (
          recentItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-medium text-white">{item.title}</h4>
                  <p className="mt-1 text-xs text-slate-400">{item.meta}</p>
                </div>
                <Pill tone="accent">已保存</Pill>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.length ? item.tags.map((tag) => <Pill key={tag} tone="neutral">{tag}</Pill>) : <Pill tone="neutral">无标签</Pill>}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-400">还没有 entry，先写一条吧。</p>
        )}
      </div>
    </Panel>
  );
}

async function TimelineView() {
  const entries = await listEntries();

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
