"use server";

import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "doing" | "done" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  deadlineText: string | null;
  dueDate: Date | null;
  createdAt: Date;
  entryId: string | null;
};

export async function listTasks(): Promise<TaskRecord[]> {
  const userId = await getUserId();
  const tasks = await prisma.task.findMany({
    where: { userId, status: { not: "archived" } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadlineText: true,
      dueDate: true,
      createdAt: true,
      entryId: true,
    },
  });
  return tasks as TaskRecord[];
}

export async function updateTaskStatus(taskId: string, status: "todo" | "doing" | "done" | "archived") {
  const userId = await getUserId();
  await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: { status },
  });
  revalidatePath("/tasks");
}
