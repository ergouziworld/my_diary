"use client";

import { useMemo, useState } from "react";

export type FinanceEntry = {
  id: string;
  title: string;
  amount: number | null;
  amountText: string;
  type: string;
  category: string | null;
  createdAtISO: string;
};

type Period = "thisMonth" | "lastMonth" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "thisMonth", label: "本月" },
  { key: "lastMonth", label: "上月" },
  { key: "all", label: "全部" }
];

function fmt(n: number) {
  return `¥${n.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

function inPeriod(iso: string, period: Period): boolean {
  if (period === "all") return true;
  const d = new Date(iso);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === "thisMonth") return d.getFullYear() === y && d.getMonth() === m;
  const lm = m === 0 ? 11 : m - 1;
  const ly = m === 0 ? y - 1 : y;
  return d.getFullYear() === ly && d.getMonth() === lm;
}

const CATEGORY_COLORS = [
  "bg-accent-500", "bg-emerald-400", "bg-amber-400", "bg-rose-400",
  "bg-violet-400", "bg-sky-400", "bg-lime-400", "bg-pink-400"
];

export function FinanceDashboard({ items }: { items: FinanceEntry[] }) {
  const [period, setPeriod] = useState<Period>("thisMonth");

  const view = useMemo(() => {
    const inScope = items.filter((it) => inPeriod(it.createdAtISO, period));
    const withAmount = inScope.filter((it) => typeof it.amount === "number");
    const expenses = withAmount.filter((it) => it.type === "expense");
    const incomes = withAmount.filter((it) => it.type === "income");
    const totalExpense = expenses.reduce((s, it) => s + (it.amount ?? 0), 0);
    const totalIncome = incomes.reduce((s, it) => s + (it.amount ?? 0), 0);

    // 上月支出（用于本月对比）
    const lastMonthExpense = items
      .filter((it) => inPeriod(it.createdAtISO, "lastMonth") && it.type === "expense" && typeof it.amount === "number")
      .reduce((s, it) => s + (it.amount ?? 0), 0);

    // 分类占比（支出）
    const catMap = new Map<string, number>();
    for (const it of expenses) {
      const key = it.category?.trim() || "未分类";
      catMap.set(key, (catMap.get(key) ?? 0) + (it.amount ?? 0));
    }
    const categories = [...catMap.entries()]
      .map(([name, amount]) => ({ name, amount, pct: totalExpense ? amount / totalExpense : 0 }))
      .sort((a, b) => b.amount - a.amount);

    // 趋势：本月/上月按天，全部按月
    const trendMap = new Map<string, number>();
    for (const it of expenses) {
      const d = new Date(it.createdAtISO);
      const key = period === "all"
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : `${String(d.getDate()).padStart(2, "0")}日`;
      trendMap.set(key, (trendMap.get(key) ?? 0) + (it.amount ?? 0));
    }
    const trend = [...trendMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, amount]) => ({ label, amount }));
    const trendMax = trend.reduce((m, t) => Math.max(m, t.amount), 0);

    const uncounted = inScope.length - withAmount.length;

    return { inScope, totalExpense, totalIncome, lastMonthExpense, categories, trend, trendMax, uncounted };
  }, [items, period]);

  const net = view.totalIncome - view.totalExpense;
  const expenseDelta = period === "thisMonth" && view.lastMonthExpense > 0
    ? (view.totalExpense - view.lastMonthExpense) / view.lastMonthExpense
    : null;

  return (
    <div className="space-y-5">
      {/* 时间范围切换 */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-slate-950/55 p-1 w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
              period === p.key ? "bg-accent-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 总额 */}
      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4">
          <p className="text-xs text-slate-400">支出</p>
          <p className="mt-1 text-xl font-semibold text-rose-300">{fmt(view.totalExpense)}</p>
          {expenseDelta !== null && (
            <p className={`mt-1 text-xs ${expenseDelta > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              较上月 {expenseDelta > 0 ? "↑" : "↓"} {Math.abs(Math.round(expenseDelta * 100))}%
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <p className="text-xs text-slate-400">收入</p>
          <p className="mt-1 text-xl font-semibold text-emerald-300">{fmt(view.totalIncome)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <p className="text-xs text-slate-400">结余</p>
          <p className={`mt-1 text-xl font-semibold ${net >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {net >= 0 ? "" : "-"}{fmt(Math.abs(net))}
          </p>
        </div>
      </section>

      {view.uncounted > 0 && (
        <p className="text-xs text-slate-500">
          有 {view.uncounted} 笔金额无法识别为数字，未计入统计（仍在下方明细中）。
        </p>
      )}

      {/* 分类占比 */}
      {view.categories.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
          <h3 className="mb-4 text-base font-semibold text-white">支出分类</h3>
          <div className="space-y-3">
            {view.categories.map((cat, i) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{cat.name}</span>
                  <span className="text-slate-400">{fmt(cat.amount)} · {Math.round(cat.pct * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950/55">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                    style={{ width: `${Math.max(2, cat.pct * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 趋势 */}
      {view.trend.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
          <h3 className="mb-4 text-base font-semibold text-white">
            支出趋势（{period === "all" ? "按月" : "按天"}）
          </h3>
          <div className="flex items-end gap-1.5 overflow-x-auto pb-2" style={{ minHeight: "120px" }}>
            {view.trend.map((t) => (
              <div key={t.label} className="flex min-w-[28px] flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end" style={{ height: "90px" }}>
                  <div
                    className="w-full rounded-t bg-accent-500/70"
                    style={{ height: `${view.trendMax ? Math.max(4, (t.amount / view.trendMax) * 90) : 0}px` }}
                    title={fmt(t.amount)}
                  />
                </div>
                <span className="whitespace-nowrap text-[10px] text-slate-500">{t.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 明细 */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
        <h3 className="mb-4 text-base font-semibold text-white">收支明细</h3>
        <div className="space-y-3">
          {view.inScope.length ? (
            view.inScope.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate font-medium text-white">{item.title}</h4>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.category?.trim() || "未分类"} · {new Date(item.createdAtISO).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <span className={`shrink-0 text-lg font-semibold ${item.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                    {item.type === "income" ? "+" : "-"}{typeof item.amount === "number" ? fmt(item.amount) : item.amountText}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">这个时间段暂无收支记录。</p>
          )}
        </div>
      </section>
    </div>
  );
}
