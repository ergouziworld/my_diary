import { Suspense } from "react";
import { BigInputBox } from "@/components/entry/BigInputBox";
import { SmallAiBox } from "@/components/entry/SmallAiBox";
import { MetricCard } from "@/components/common/MetricCard";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { listEntries } from "@/server/entries";
import pkg from "../../package.json";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.82))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.25)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-4xl space-y-5">
            <div className="flex flex-wrap gap-2">
              <Pill tone="accent">AI 日记</Pill>
              <Pill tone="good">快速输入</Pill>
              <Pill tone="neutral">长期记忆</Pill>
              <Pill tone="neutral">v{pkg.version}</Pill>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">把生活变成可检索的第二大脑</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                记录一条，自动沉淀为摘要、标签、情绪、任务、时间线和人物关系。首页先展示壳子，再等数据回来。
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
            v{pkg.version}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Suspense fallback={<MetricCard label="今日记录" value="..." hint="加载中" />}>
          <EntryMetrics />
        </Suspense>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel title="快速记一条" subtitle="先保存原文，再交给 AI 做结构化分析。">
          <BigInputBox />
        </Panel>

        <SmallAiBox />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Suspense fallback={<Panel title="最近记录" subtitle="正在加载"><p className="text-sm text-slate-400">加载中...</p></Panel>}>
          <RecentEntries />
        </Suspense>

        <Panel title="AI 助手" subtitle="用于后续扩展的入口位。">
          <div className="space-y-3">
            {["帮我总结", "提取任务", "分析情绪", "润色记录", "拆解计划"].map((item, index) => (
              <button
                key={item}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-left text-sm text-white transition hover:border-cyan-400/40"
              >
                <span>{item}</span>
                <span className="text-slate-500">{index + 1}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

async function EntryMetrics() {
  const entries = await listEntries();
  return (
    <>
      <MetricCard label="今日记录" value={String(entries.length)} hint="原文已保存到数据库" />
      <MetricCard label="待办任务" value={String(entries.flatMap((item) => item.tasks).length)} hint="来自 AI 提取" />
      <MetricCard label="情绪记录" value={String(entries.flatMap((item) => item.entryEmotions).length)} hint="来自结构化分析" />
      <MetricCard label="AI 总结" value={String(entries.filter((item) => item.entryAnalysis).length)} hint="已有分析结果的条目数" />
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
