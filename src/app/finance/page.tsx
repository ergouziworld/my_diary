import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { MetricCard } from "@/components/common/MetricCard";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader title="收支" description="从日记中自动提取的收入与支出记录。" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/5" />}>
        <FinanceContent />
      </Suspense>
    </div>
  );
}

async function FinanceContent() {
  const userId = await getUserId();
  let items: Array<{
    id: string;
    title: string;
    amountText: string;
    type: string;
    category: string | null;
    createdAt: Date;
  }> = [];

  try {
    items = await prisma.financeItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, amountText: true, type: true, category: true, createdAt: true }
    });
  } catch {
    items = [];
  }

  const income = items.filter((i) => i.type === "income");
  const expense = items.filter((i) => i.type === "expense");

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="收支记录" value={String(items.length)} hint="AI 从日记中提取" />
        <MetricCard label="收入笔数" value={String(income.length)} hint="type = income" />
        <MetricCard label="支出笔数" value={String(expense.length)} hint="type = expense" />
      </section>

      <Panel title="收支明细" subtitle="金额、类型与来源分类。">
        <div className="space-y-3">
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-white">{item.title}</h3>
                    {item.category ? <p className="mt-0.5 text-xs text-slate-400">{item.category}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-semibold ${item.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                      {item.type === "income" ? "+" : "-"}{item.amountText}
                    </span>
                    <Pill tone={item.type === "income" ? "accent" : "warning"}>
                      {item.type === "income" ? "收入" : "支出"}
                    </Pill>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">暂无收支记录，在日记中提及收入或支出后会自动提取。</p>
          )}
        </div>
      </Panel>
    </>
  );
}
