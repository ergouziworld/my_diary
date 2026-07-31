"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel, Pill, SectionHeader } from "@/components/common";

type MemoryItem = {
  id: number;
  content: string;
  source: string | null;
  created_at: string | null;
  imported_at: string;
  embedding_model?: string | null;
  similarity?: number;
};

function formatDate(value?: string | null) {
  if (!value) return "未知时间";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN");
}

export function MemoryIdeClient() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [results, setResults] = useState<MemoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<MemoryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/memory/engine", { cache: "no-store" });
      const data = (await response.json()) as { ok: boolean; items?: MemoryItem[]; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "记忆引擎暂不可用");
      setItems(data.items ?? []);
      setMessage(`已加载 ${data.items?.length ?? 0} 条微信记忆`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function search() {
    const text = query.trim();
    if (!text || searching) return;
    setSearching(true);
    try {
      const response = await fetch("/api/memory/engine/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: text }) });
      const data = (await response.json()) as { ok: boolean; items?: MemoryItem[]; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "检索失败");
      setResults(data.items ?? []);
      setMessage(`检索到 ${data.items?.length ?? 0} 条微信记忆`);
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : "检索失败");
    } finally {
      setSearching(false);
    }
  }

  async function remove(item: MemoryItem) {
    if (!window.confirm("删除这条微信记忆？删除后不会再参与检索。")) return;
    const response = await fetch(`/api/memory/engine/${item.id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) { setMessage(data.error ?? "删除失败"); return; }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setResults((current) => current.filter((entry) => entry.id !== item.id));
    setSelected(null);
    setMessage("已删除这条微信记忆");
  }

  const sourceSummary = useMemo(() => Object.entries(items.reduce<Record<string, number>>((acc, item) => { const source = item.source ?? "unknown"; acc[source] = (acc[source] ?? 0) + 1; return acc; }, {})), [items]);

  return (
    <div className="space-y-6">
      <SectionHeader title="微信记忆控制台" description="这里只管理通过 bocchi 817702qq 绑定的微信 / 企业微信输入，不混入普通日记。" />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"><p className="text-xs text-slate-500">微信记忆片段</p><p className="mt-1 text-2xl font-semibold text-white">{items.length}</p></div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"><p className="text-xs text-slate-500">来源类型</p><p className="mt-1 text-2xl font-semibold text-white">{sourceSummary.length}</p></div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4"><p className="text-xs text-emerald-200/70">绑定账号</p><p className="mt-1 text-sm font-medium text-emerald-100">bocchi 817702qq</p></div>
      </div>

      <Panel title="检索微信记忆" subtitle="检索只在 wecom_* 来源中进行，不会读取 my_diary 的普通日记。">
        <div className="flex gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void search(); }} placeholder="例如：我最近的学习计划" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-accent-500/50" />
          <button onClick={() => void search()} disabled={searching} className="rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{searching ? "检索中" : "检索"}</button>
          <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 disabled:opacity-60">刷新</button>
        </div>
        {message ? <p className="mt-3 text-xs text-slate-400">{message}</p> : null}
        {results.length ? <div className="mt-4 space-y-3">{results.map((item) => <MemoryCard key={`result-${item.id}`} item={item} onOpen={setSelected} onDelete={remove} />)}</div> : null}
      </Panel>

      <Panel title="微信输入库" subtitle="按导入时间倒序。点击一条记录可查看完整内容并删除。">
        {loading ? <p className="text-sm text-slate-400">正在读取微信记忆…</p> : items.length ? <div className="space-y-3">{items.map((item) => <MemoryCard key={item.id} item={item} onOpen={setSelected} onDelete={remove} />)}</div> : <p className="text-sm text-slate-500">还没有通过微信导入的记忆。</p>}
      </Panel>

      {selected ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onClick={() => setSelected(null)}><div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-slate-500">微信记忆 #{selected.id}</p><h2 className="mt-1 text-lg font-semibold text-white">完整内容</h2></div><button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">关闭</button></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{selected.content}</p><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4"><span className="text-xs text-slate-500">导入于 {formatDate(selected.imported_at)}</span><button onClick={() => void remove(selected)} className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs text-rose-200">删除</button></div></div></div> : null}
    </div>
  );
}

function MemoryCard({ item, onOpen, onDelete }: { item: MemoryItem; onOpen: (item: MemoryItem) => void; onDelete: (item: MemoryItem) => Promise<void> }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><div className="flex items-center gap-2"><Pill tone="neutral">{item.source ?? "wecom"}</Pill><span>{formatDate(item.imported_at)}</span></div><div className="flex items-center gap-2">{typeof item.similarity === "number" ? <span className="text-emerald-300">{(item.similarity * 100).toFixed(1)}%</span> : null}<button onClick={() => onOpen(item)} className="text-accent-300 hover:text-accent-200">查看</button><button onClick={() => void onDelete(item)} className="text-rose-300 hover:text-rose-200">删除</button></div></div><p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.content}</p></div>;
}
