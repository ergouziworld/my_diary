import { Suspense } from "react";
import { MetricCard } from "@/components/common/MetricCard";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";
import { listEntries } from "@/server/entries";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader title="工作 / 学习" description="读取 workItems 与相关分析结果。" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/5" />}>
        <WorkContent />
      </Suspense>
    </div>
  );
}

async function WorkContent() {
  const entries = await listEntries();
  const items = entries.flatMap((entry) =>
    entry.workItems.map((item) => ({
      title: item.title,
      projectName: item.projectName ?? null,
      category: item.category,
      description: item.description ?? null,
      status: item.status,
      entryId: entry.id
    }))
  );

  const summaryCount = items.length;
  const studyCount = items.filter((item) => item.category === "study" || item.category === "course").length;
  const codingCount = items.filter((item) => item.category === "coding").length;
  const projectCount = items.filter((item) => item.category === "project").length;

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="工作学习条目" value={String(summaryCount)} hint="来自 workItems" />
        <MetricCard label="学习项" value={String(studyCount)} hint="study / course" />
        <MetricCard label="开发项" value={String(codingCount)} hint="development -> coding" />
        <MetricCard label="项目项" value={String(projectCount)} hint="project" />
      </section>

      <Panel title="工作学习明细" subtitle="项目、分类、标题与说明。">
        <div className="space-y-3">
          {items.length ? (
            items.map((item) => (
              <div key={`${item.entryId}-${item.title}-${item.projectName ?? "none"}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{item.projectName ?? "未关联项目"}</p>
                  </div>
                  <Pill tone="accent">{item.category}</Pill>
                </div>
                {item.description ? <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p> : null}
                <p className="mt-2 text-xs text-slate-500">{item.status}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">暂无工作/学习条目。</p>
          )}
        </div>
      </Panel>
    </>
  );
}
