import Link from "next/link";
import { SectionHeader } from "@/components/common/SectionHeader";
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
    <div className="space-y-6">
      <SectionHeader
        title="管理日记"
        description="回看、修改或删除你的全部日记。修改后 AI 会按新内容重新分析。"
        action={
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:text-white"
          >
            返回首页
          </Link>
        }
      />
      <p className="text-sm text-slate-500">共 {items.length} 条记录</p>
      <EntryManager items={items} />
    </div>
  );
}
