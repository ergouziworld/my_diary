import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { memoryCreateEntry, memoryListEntries } from "@/server/memoryStore";
import { cache } from "react";

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
};

export type CreateEntryInput = {
  rawContent: string;
  type: "text";
};

export async function createEntry(input: CreateEntryInput): Promise<EntryRecord> {
  const userId = await getUserId();
  const data = {
    userId,
    rawContent: input.rawContent,
    contentText: input.rawContent,
    type: input.type,
    inputType: "text" as const
  } as any;

  try {
    const entry = await prisma.entry.create({ data });
    return {
      ...entry,
      contentText: input.rawContent,
      type: input.type,
      inputType: "text",
      entryAnalysis: null,
      entryEmotions: [],
      tasks: [],
      workItems: []
    };
  } catch {
    return memoryCreateEntry({
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

export const listEntries = cache(async function listEntries(): Promise<EntryRecord[]> {
  const userId = await getUserId();
  try {
    const entries = await prisma.entry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        entryAnalysis: true,
        entryEmotions: true,
        tasks: true,
        workItems: true
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
      workItems: entry.workItems
    })) as EntryRecord[];
  } catch {
    return memoryListEntries(userId);
  }
});
