import Link from "next/link";
import { EntryManager, type ManageItem } from "@/components/entry/EntryManager";
import { listEntries } from "@/server/entries";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const entries = await listEntries();

  const items: ManageItem[] = entries.map((entry) => {
    const raw = entry.entryAnalysis?.rawAiResult as { tags?: string[] } | null | undefined;
    const images = entry.attachments
      .filter((a) => a.fileType === "image" || a.mimeType.startsWith("image/"))
      .map((a) => ({ id: a.id, url: a.fileUrl }));
    return {
      id: entry.id,
      createdAtISO: entry.createdAt.toISOString(),
      meta: entry.createdAt.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      rawContent: entry.rawContent ?? "",
      summary: entry.entryAnalysis?.summary ?? null,
      tags: raw?.tags ?? [],
      emotions: entry.entryEmotions.map((e) => e.name),
      tasks: entry.tasks.map((t) => t.title),
      images
    };
  });

  return (
    <div className="space-y-5">
      <Link
        href="/"
        aria-label="返回首页"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/55 px-3 py-1.5 text-sm text-slate-300 transition hover:text-white"
      >
        <span className="text-base leading-none">←</span> 返回首页
      </Link>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white">管理日记</h2>
        <p className="text-sm leading-6 text-slate-400">
          回看、查找、修改或删除你的全部日记。支持按日历、关键词和 AI 语义查找。
        </p>
      </div>

      <EntryManager items={items} />
    </div>
  );
}
