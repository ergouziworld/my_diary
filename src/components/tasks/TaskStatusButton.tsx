"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "@/server/tasks";

type Status = "todo" | "doing" | "done" | "archived";

const NEXT_STATUS: Record<Status, { next: Status; label: string }> = {
  todo: { next: "doing", label: "开始" },
  doing: { next: "done", label: "完成" },
  done: { next: "todo", label: "重置" },
  archived: { next: "todo", label: "恢复" },
};

const buttonStyles: Record<string, string> = {
  开始: "border-accent-500/30 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20",
  完成: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20",
  重置: "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
  恢复: "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
};

export function TaskStatusButton({ taskId, status }: { taskId: string; status: Status }) {
  const [isPending, startTransition] = useTransition();
  const { next, label } = NEXT_STATUS[status];

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => updateTaskStatus(taskId, next))}
      className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-40 ${buttonStyles[label]}`}
    >
      {isPending ? "…" : label}
    </button>
  );
}
