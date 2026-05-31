"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/common/Pill";
import { DeleteEntryButton } from "@/components/entry/DeleteEntryButton";

export type ManageItem = {
  id: string;
  meta: string;
  rawContent: string;
  summary: string | null;
  tags: string[];
  emotions: string[];
  tasks: string[];
  images: { id: string; url: string }[];
};

export function EntryManager({ items }: { items: ManageItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-slate-400">还没有日记。先去首页写一条吧。</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <EntryCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function EntryCard({ item }: { item: ManageItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.rawContent);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSave() {
    const next = draft.trim();
    if (!next || saving) return;
    setSaving(true);
    setStatus("保存中...");
    try {
      const res = await fetch(`/api/entries/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawContent: next })
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setStatus(data.error ?? "保存失败");
        setSaving(false);
        return;
      }
      // 内容变了，重新跑 AI 分析（会一并更新摘要/情绪/任务/标签/向量记忆）
      setStatus("重新分析中...");
      await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: item.id, content: next, type: "text" })
      }).catch(() => {});
      setStatus("");
      setSaving(false);
      setEditing(false);
      startTransition(() => router.refresh());
    } catch {
      setStatus("保存失败，请重试");
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(item.rawContent);
    setStatus("");
    setEditing(false);
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{item.meta}</p>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-cyan-300 transition hover:bg-cyan-400/10"
            >
              编辑
            </button>
          )}
          <DeleteEntryButton entryId={item.id} />
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            className="min-h-40 w-full resize-y rounded-xl border border-white/10 bg-slate-950/80 p-3 text-sm leading-relaxed text-white outline-none focus:border-cyan-400/50"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-full px-4 py-2 text-sm text-slate-400 transition hover:text-white disabled:opacity-60"
            >
              取消
            </button>
            {status && <span className="text-xs text-slate-400">{status}</span>}
          </div>
          <p className="text-xs text-slate-600">提示：保存后 AI 会按新内容重新分析情绪、任务和记忆。</p>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">
            {item.rawContent || "（无内容）"}
          </p>

          {item.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.images.slice(0, 6).map((img) => (
                <img key={img.id} src={img.url} alt="" className="h-20 w-20 rounded-xl object-cover" />
              ))}
            </div>
          )}

          {(item.tags.length > 0 || item.emotions.length > 0 || item.tasks.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => <Pill key={`tag-${t}`} tone="neutral">{t}</Pill>)}
              {item.emotions.map((e) => <Pill key={`emo-${e}`} tone="accent">{e}</Pill>)}
              {item.tasks.map((t, i) => <Pill key={`task-${i}`} tone="warning">☑ {t}</Pill>)}
            </div>
          )}

          {item.summary && (
            <p className="border-t border-white/5 pt-3 text-xs leading-relaxed text-slate-500">
              AI · {item.summary}
            </p>
          )}
        </>
      )}
    </article>
  );
}
