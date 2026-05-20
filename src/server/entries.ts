import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { memoryCreateEntry, memoryListEntries } from "@/server/memoryStore";
import { cache } from "react";

export type CreateEntryInput = {
  rawContent: string;
  type: "text";
};

export async function createEntry(input: CreateEntryInput) {
  const data = {
    userId: getUserId(),
    rawContent: input.rawContent,
    contentText: input.rawContent,
    type: input.type,
    inputType: "text" as const
  };

  try {
    return await prisma.entry.create({ data });
  } catch {
    return memoryCreateEntry({
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

export const listEntries = cache(async function listEntries() {
  try {
    return await prisma.entry.findMany({
      where: { userId: getUserId() },
      orderBy: { createdAt: "desc" },
      include: {
        entryAnalysis: true,
        entryEmotions: true,
        tasks: true,
        workItems: true
      }
    });
  } catch {
    return memoryListEntries(getUserId());
  }
});
