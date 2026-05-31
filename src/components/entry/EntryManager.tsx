"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/common/Pill";
import { DeleteEntryButton } from "@/components/entry/DeleteEntryButton";

export type ManageItem = {
  id: string;
  createdAtISO: string;
  meta: string;
  rawContent: string;
  summary: string | null;
  tags: string[];
  emotions: string[];
  tasks: string[];
  images: { id: string; url: string }[];
};

type SearchMode = "all" | "date" | "keyword" | "ai";

function toDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MODES: { key: SearchMode; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "date", label: "日历" },
  { key: "keyword", label: "关键词" },
  { key: "ai", label: "AI 查找" }
];

export function EntryManager({ items }: { items: ManageItem[] }) {
  const [mode, setMode] = useState<SearchMode>("all");
  const [dateValue, setDateValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState("");

  async function handleReindex() {
    if (indexing) return;
    setIndexing(true);
    setIndexStatus("正在重建索引，让 AI 重新读取全部日记...");
    try {
      const res = await fetch("/api/ai/reindex", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; total?: number; indexed?: number; error?: string };
      if (data.ok) {
        setIndexStatus(`已建立索引：${data.indexed ?? 0} / ${data.total ?? 0} 条。现在可以 AI 查找了。`);
      } else {
        setIndexStatus(data.error ?? "重建索引失败。");
      }
    } catch {
      setIndexStatus("请求失败，请稍后重试。");
    } finally {
      setIndexing(false);
    }
  }

  async function runAiSearch() {
    const q = aiQuery.trim();
    if (!q || aiLoading) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/entries/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q })
      });
      const data = (await res.json()) as { ok: boolean; entryIds?: string[]; error?: string };
      if (data.ok) {
        setAiResults(data.entryIds ?? []);
      } else {
        setAiError(data.error ?? "搜索失败");
        setAiResults(null);
      }
    } catch {
      setAiError("搜索失败，请重试");
      setAiResults(null);
    } finally {
      setAiLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (mode === "date") {
      if (!dateValue) return items;
      return items.filter((it) => toDateKey(it.createdAtISO) === dateValue);
    }
    if (mode === "keyword") {
      const k = keyword.trim().toLowerCase();
      if (!k) return items;
      return items.filter(
        (it) =>
          it.rawContent.toLowerCase().includes(k) ||
          (it.summary ?? "").toLowerCase().includes(k) ||
          it.tags.some((t) => t.toLowerCase().includes(k)) ||
          it.emotions.some((e) => e.toLowerCase().includes(k))
      );
    }
    if (mode === "ai") {
      if (!aiResults) return [];
      const map = new Map(items.map((it) => [it.id, it]));
      return aiResults.map((id) => map.get(id)).filter((it): it is ManageItem => Boolean(it));
    }
    return items;
  }, [mode, dateValue, keyword, aiResults, items]);

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-slate-400">还没有日记。先去首页写一条吧。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 查找栏 */}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex gap-1 rounded-xl bg-slate-950/50 p-1">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                mode === m.key ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "date" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 [color-scheme:dark]"
            />
            {dateValue && (
              <button
                type="button"
                onClick={() => setDateValue("")}
                className="rounded-xl px-3 py-2 text-xs text-slate-400 hover:text-white"
              >
                清除
              </button>
            )}
          </div>
        )}

        {mode === "keyword" && (
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入关键词，匹配正文、摘要、标签、情绪"
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
          />
        )}

        {mode === "ai" && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runAiSearch()}
                placeholder="用自然语言描述你想找的，如「那次很焦虑的事」"
                className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
              />
              <button
                type="button"
                onClick={runAiSearch}
                disabled={aiLoading}
                className="shrink-0 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {aiLoading ? "查找中..." : "查找"}
              </button>
            </div>
            {aiError && <p className="text-xs text-rose-400">{aiError}</p>}
            <p className="text-xs text-slate-600">按语义相关度排序，能匹配换了说法的内容。</p>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-2">
              <button
                type="button"
                onClick={handleReindex}
                disabled={indexing}
                className="shrink-0 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-60"
              >
                {indexing ? "重建中..." : "重建记忆索引"}
              </button>
              <span className="text-xs text-slate-500">
                {indexStatus || "首次使用或日记有大量更新后，点一次重新读取全部日记。"}
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        {mode === "ai" && !aiResults ? "输入描述后点查找" : `${filtered.length} 条结果`}
      </p>

      {filtered.length ? (
        filtered.map((item) => <EntryCard key={item.id} item={item} />)
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
          {mode === "ai" && !aiResults ? "试试用一句话描述你想找的日记。" : "没有匹配的记录。"}
        </div>
      )}
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
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
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
