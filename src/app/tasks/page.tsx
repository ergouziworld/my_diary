import { Suspense } from "react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { listTasks, type TaskRecord } from "@/server/tasks";
import { TaskStatusButton } from "@/components/tasks/TaskStatusButton";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader title="任务" description="AI 从日记中提取的任务，可直接更改状态。" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-slate-950/55" />}>
        <TaskBoard />
      </Suspense>
    </div>
  );
}

const PRIORITY_STYLES: Record<TaskRecord["priority"], { pill: string; dot: string; label: string }> = {
  urgent: {
    pill: "border-red-400/30 bg-red-400/10 text-red-300",
    dot: "bg-red-400",
    label: "紧急",
  },
  high: {
    pill: "border-orange-400/30 bg-orange-400/10 text-orange-300",
    dot: "bg-orange-400",
    label: "高",
  },
  medium: {
    pill: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
    dot: "bg-yellow-400",
    label: "中",
  },
  low: {
    pill: "border-white/10 bg-slate-950/55 text-slate-400",
    dot: "bg-slate-500",
    label: "低",
  },
};

const STATUS_GROUPS: { status: TaskRecord["status"]; label: string; color: string }[] = [
  { status: "todo", label: "待办", color: "text-slate-300" },
  { status: "doing", label: "进行中", color: "text-accent-300" },
  { status: "done", label: "已完成", color: "text-emerald-300" },
];

async function TaskBoard() {
  const tasks = await listTasks();

  const grouped = {
    todo: tasks.filter((t) => t.status === "todo"),
    doing: tasks.filter((t) => t.status === "doing"),
    done: tasks.filter((t) => t.status === "done"),
  };

  const total = tasks.length;
  const doneCount = grouped.done.length;

  return (
    <div className="space-y-6">
      {/* 统计栏 */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <StatCard label="全部" value={total} />
        <StatCard label="待办" value={grouped.todo.length} />
        <StatCard label="进行中" value={grouped.doing.length} />
        <StatCard label="已完成" value={doneCount} accent="emerald" />
      </div>

      {/* 分组列表 */}
      {total === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-slate-950/55 p-8 text-center text-sm text-slate-400">
          暂无任务，去写日记让 AI 帮你提取吧。
        </p>
      ) : (
        STATUS_GROUPS.map(({ status, label, color }) => {
          const items = grouped[status as keyof typeof grouped];
          return (
            <section key={status}>
              <h2 className={`mb-3 text-sm font-semibold uppercase tracking-widest ${color}`}>
                {label}
                <span className="ml-2 text-xs font-normal opacity-60">{items.length}</span>
              </h2>
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                  无
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function TaskCard({ task }: { task: TaskRecord }) {
  const p = PRIORITY_STYLES[task.priority];
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-4 transition-colors hover:bg-white/[0.07]">
      {/* 优先级色点 */}
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${p.dot}`} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-white">{task.title}</p>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-400">{task.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${p.pill}`}>
            {p.label}
          </span>
          {task.deadlineText && (
            <span className="text-xs text-slate-500">截止：{task.deadlineText}</span>
          )}
        </div>
      </div>

      <TaskStatusButton taskId={task.id} status={task.status} />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const valueClass = accent === "emerald" ? "text-emerald-300" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
