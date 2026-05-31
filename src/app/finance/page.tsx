import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { SectionHeader } from "@/components/common/SectionHeader";
import { FinanceDashboard, type FinanceEntry } from "@/components/finance/FinanceDashboard";

export const dynamic = "force-dynamic";

/** 从 "32元" / "¥180" / "1,200.5" 这类文本里解析出数字金额 */
function parseAmount(text: string): number | null {
  if (!text) return null;
  const m = text.replace(/,/g, "").match(/\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

export default async function Page() {
  const userId = await getUserId();

  let rows: Array<{
    id: string;
    title: string;
    amountText: string;
    type: string;
    category: string | null;
    createdAt: Date;
  }> = [];
  try {
    rows = await prisma.financeItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, amountText: true, type: true, category: true, createdAt: true }
    });
  } catch {
    rows = [];
  }

  const items: FinanceEntry[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    amount: parseAmount(r.amountText),
    amountText: r.amountText,
    type: r.type,
    category: r.category,
    createdAtISO: r.createdAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <SectionHeader title="收支" description="从日记中自动提取的收入与支出，按时间和分类统计。" />
      {items.length ? (
        <FinanceDashboard items={items} />
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-slate-400">暂无收支记录。在日记中提到花钱或收入后会自动提取。</p>
        </div>
      )}
    </div>
  );
}
