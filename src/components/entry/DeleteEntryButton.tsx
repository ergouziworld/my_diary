"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        startTransition(() => router.refresh());
      } else {
        setError(data.error ?? "删除失败");
        setDeleting(false);
      }
    } catch {
      setError("删除失败");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
        title="删除这条记录（连同 AI 记忆一并清除）"
      >
        删除
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      {error && <span className="text-xs text-rose-400">{error}</span>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        title="连同 AI 记忆一并清除"
        className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/30 disabled:opacity-60"
      >
        {deleting ? "删除中..." : error ? "重试" : "确认删除"}
      </button>
      <button
        type="button"
        onClick={() => { setConfirming(false); setError(""); }}
        disabled={deleting}
        className="rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:text-white disabled:opacity-60"
      >
        取消
      </button>
    </div>
  );
}
