import { Suspense } from "react";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";
import { listEntries } from "@/server/entries";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader title="任务" description="优先读取 AI 提取的 tasks。" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-white/5" />}>
        <TaskList />
      </Suspense>
    </div>
  );
}

async function TaskList() {
  const entries = await listEntries();
  const tasks = entries.flatMap((entry) =>
    entry.tasks.map((task) => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
      deadline: task.deadlineText ?? "无"
    }))
  );

  return (
    <Panel title="AI 任务列表" subtitle="来自 entry 分析结果的最小任务视图。">
      <div className="space-y-3">
        {tasks.length ? (
          tasks.map((task) => (
            <div key={`${task.title}-${task.deadline}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-medium text-white">{task.title}</h3>
                <div className="flex gap-2">
                  <Pill tone={task.priority === "high" ? "warning" : "neutral"}>{task.priority}</Pill>
                  <Pill tone="accent">{task.status}</Pill>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-400">截止：{task.deadline}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">暂无 AI 任务结果。</p>
        )}
      </div>
    </Panel>
  );
}
