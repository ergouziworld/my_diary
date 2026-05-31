import Link from "next/link";
import { HomeInputSection } from "@/components/entry/HomeInputSection";
import { DeleteEntryButton } from "@/components/entry/DeleteEntryButton";
import { SmallAiBox } from "@/components/entry/SmallAiBox";
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
            !isTimeline ? "bg-accent-500 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          概览
        </Link>
        <Link
          href="/?view=timeline"
          className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
            isTimeline ? "bg-accent-500 text-white" : "text-slate-400 hover:text-white"
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

          <TodayStatus entries={entries} />

          <Link
            href="/world"
            className="group relative block overflow-hidden rounded-[2rem] border border-accent-500/25 bg-[radial-gradient(ellipse_at_top_right,_rgb(var(--accent-500)_/_0.18),_transparent_60%),linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(2,6,23,0.95))] p-6 shadow-[0_0_50px_rgb(var(--accent-500)_/_0.08)] transition hover:border-accent-500/45"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-400/80">3D · Memory World</p>
            <h3 className="mt-2 text-xl font-semibold text-white">进入记忆世界 →</h3>
            <p className="mt-1 text-sm text-slate-400">把日记走成一片可以漫步的风景。全屏沉浸，手机摇杆操作。</p>
          </Link>

          <SmallAiBox />

          <RecentEntries entries={entries} />
        </div>
      )}
    </div>
  );
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function TodayStatus({ entries }: { entries: EntryRecord[] }) {
  const total = entries.length;
  const pending = entries
    .flatMap((item) => item.tasks)
    .filter((t) => t.status === "todo" || t.status === "doing").length;

  // 连续记录天数：从今天（或昨天）往回数有记录的连续天数
  const keys = new Set(entries.map((e) => dayKey(e.createdAt)));
  let streak = 0;
  const cursor = new Date();
  if (!keys.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (keys.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-slate-300">
      <span>📖 已记录 <b className="font-semibold text-white">{total}</b> 篇</span>
      <span className="text-slate-600">·</span>
      {streak > 0 ? (
        <span>🔥 连续 <b className="font-semibold text-accent-400">{streak}</b> 天</span>
      ) : (
        <span>✍️ 今天还没记，写一条吧</span>
      )}
      <span className="text-slate-600">·</span>
      <span>
        {pending > 0 ? (
          <>✅ 还有 <b className="font-semibold text-white">{pending}</b> 件待办</>
        ) : (
          "🎉 待办都清空了"
        )}
      </span>
    </div>
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
      <div className="mb-3 flex justify-end">
        <Link
          href="/manage"
          className="rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-xs font-medium text-accent-300 transition hover:bg-accent-500/20"
        >
          管理全部日记 →
        </Link>
      </div>
      <div className="space-y-4">
        {recentItems.length ? (
          recentItems.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">{item.meta}</p>
                <DeleteEntryButton entryId={item.id} />
              </div>
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.slice(0, 3).map((tag) => <Pill key={tag} tone="neutral">{tag}</Pill>)}
                </div>
              )}

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
