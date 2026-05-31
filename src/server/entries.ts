import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { cache } from "react";
import { unlink } from "fs/promises";
import path from "path";

export type EntryRecord = {
  id: string;
  userId: string | null;
  rawContent: string | null;
  contentText: string | null;
  type: string;
  inputType: string;
  createdAt: Date;
  updatedAt: Date;
  entryAnalysis?: {
    rawAiResult: unknown;
    summary: string | null;
    compressedMemory: string | null;
  } | null;
  entryEmotions: Array<{
    id: string;
    entryId: string;
    name: string;
    intensity: number;
    reason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: "todo" | "doing" | "done" | "archived";
    priority: "low" | "medium" | "high" | "urgent";
    deadlineText: string | null;
  }>;
  workItems: Array<{
    id: string;
    title: string;
    category: "work" | "study" | "project" | "idea" | "coding" | "competition" | "course";
    description: string | null;
    status: "todo" | "doing" | "done" | "archived";
    projectName: string | null;
  }>;
  attachments: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    mimeType: string;
  }>;
};

export type CreateEntryInput = {
  rawContent: string;
  type: "text";
  attachmentIds?: string[];
};

export async function createEntry(input: CreateEntryInput): Promise<EntryRecord> {
  const userId = await getUserId();
  const hasAttachments = Boolean(input.attachmentIds?.length);
  const data = {
    userId,
    rawContent: input.rawContent,
    contentText: input.rawContent,
    type: input.type,
    inputType: hasAttachments ? "mixed" : "text"
  } as any;

  const entry = await prisma.entry.create({ data });

  // 把这次上传的附件绑定到本条日记。限定 userId + 未绑定(entryId 为空)，
  // 防止抢绑别人的或已属于其它日记的附件。
  let attachments: EntryRecord["attachments"] = [];
  if (input.attachmentIds?.length) {
    await prisma.attachment.updateMany({
      where: { id: { in: input.attachmentIds }, userId, entryId: null },
      data: { entryId: entry.id }
    });
    attachments = await prisma.attachment.findMany({
      where: { entryId: entry.id },
      select: { id: true, fileUrl: true, fileType: true, mimeType: true }
    });
  }

  return {
    ...entry,
    contentText: input.rawContent,
    type: input.type,
    inputType: hasAttachments ? "mixed" : "text",
    entryAnalysis: null,
    entryEmotions: [],
    tasks: [],
    workItems: [],
    attachments
  };
}

export const listEntries = cache(async function listEntries(): Promise<EntryRecord[]> {
  const userId = await getUserId();
  const entries = await prisma.entry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      entryAnalysis: true,
      entryEmotions: true,
      tasks: true,
      workItems: true,
      attachments: { select: { id: true, fileUrl: true, fileType: true, mimeType: true } }
    }
  });
  return entries.map((entry) => ({
    ...entry,
    contentText: (entry as any).contentText ?? entry.rawContent,
    type: (entry as any).type ?? "text",
    inputType: (entry as any).inputType ?? "text",
    entryAnalysis: entry.entryAnalysis ?? null,
    entryEmotions: entry.entryEmotions,
    tasks: entry.tasks,
    workItems: entry.workItems,
    attachments: entry.attachments
  })) as EntryRecord[];
});

/**
 * 彻底删除一条日记及所有与之相关的数据：AI 记忆向量、分析、情绪、任务、
 * 工作项、财务、心情、时间线、标签、人物、相册、附件（含磁盘文件）。
 * schema 里不少关联是 SetNull，所以这里逐表显式按 entryId 删除，保证不留孤儿。
 */
export async function deleteEntry(entryId: string): Promise<void> {
  const userId = await getUserId();

  const entry = await prisma.entry.findFirst({
    where: { id: entryId, userId },
    select: { id: true }
  });
  if (!entry) {
    throw new Error("记录不存在或无权删除");
  }

  // 先取出关联附件的磁盘路径，事务提交后再删文件
  const attachments = await prisma.attachment.findMany({
    where: { entryId },
    select: { fileUrl: true }
  });

  await prisma.$transaction(async (tx) => {
    await tx.vectorDocument.deleteMany({ where: { entryId } }); // AI 记忆
    await tx.entryEmotion.deleteMany({ where: { entryId } });
    await tx.task.deleteMany({ where: { entryId } });
    await tx.workItem.deleteMany({ where: { entryId } });
    await tx.financeItem.deleteMany({ where: { entryId } });
    await tx.moodRecord.deleteMany({ where: { entryId } });
    await tx.timelineEvent.deleteMany({ where: { entryId } });
    await tx.albumItem.deleteMany({ where: { entryId } });
    await tx.entryTag.deleteMany({ where: { entryId } });
    await tx.entryPerson.deleteMany({ where: { entryId } });
    await tx.attachment.deleteMany({ where: { entryId } });
    await tx.aiAnalysis.deleteMany({ where: { entryId } });
    await tx.entryAnalysis.deleteMany({ where: { entryId } });
    await tx.entry.delete({ where: { id: entryId } });
  });

  // 删除磁盘上的附件文件（尽力而为，失败不影响已完成的删除）
  await Promise.all(
    attachments
      .filter((att) => att.fileUrl?.startsWith("/uploads/"))
      .map((att) => unlink(path.join(process.cwd(), "public", att.fileUrl)).catch(() => {}))
  );
}
