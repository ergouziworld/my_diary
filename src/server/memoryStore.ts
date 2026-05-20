export type MemoryEntryRecord = {
  id: string;
  userId: string;
  rawContent: string;
  contentText: string;
  type: string;
  inputType: string;
  createdAt: Date;
  updatedAt: Date;
  entryAnalysis?: MemoryEntryAnalysisRecord | null;
  entryEmotions: MemoryEntryEmotionRecord[];
  tasks: MemoryTaskRecord[];
  workItems: MemoryWorkItemRecord[];
  financeItems: MemoryFinanceItemRecord[];
};

export type MemoryEntryAnalysisRecord = {
  id: string;
  entryId: string;
  summary: string;
  compressedMemory: string;
  timelineType: string;
  timelineTitle: string;
  confidence: number;
  rawAiResult: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type MemoryFinanceItemRecord = {
  id: string;
  entryId: string;
  title: string;
  amountText: string;
  type: "expense" | "income";
  category: string;
  sourceText: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MemoryEntryEmotionRecord = {
  id: string;
  entryId: string;
  name: string;
  intensity: number;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MemoryTaskRecord = {
  id: string;
  userId: string;
  entryId: string | null;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  deadlineText: string | null;
  sourceText: string | null;
  status: "todo" | "doing" | "done" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

export type MemoryWorkItemRecord = {
  id: string;
  userId: string;
  entryId: string | null;
  category: "work" | "study" | "project" | "idea" | "coding" | "competition" | "course";
  projectName: string | null;
  title: string;
  description: string | null;
  status: "todo" | "doing" | "done" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

const memoryEntries = new Map<string, MemoryEntryRecord>();
const memoryAnalyses = new Map<string, MemoryEntryAnalysisRecord>();
const memoryEmotions = new Map<string, MemoryEntryEmotionRecord[]>();
const memoryTasks = new Map<string, MemoryTaskRecord[]>();
const memoryWorkItems = new Map<string, MemoryWorkItemRecord[]>();
const memoryFinanceItems = new Map<string, MemoryFinanceItemRecord[]>();

export function memoryCreateEntry(entry: Omit<MemoryEntryRecord, "entryAnalysis" | "entryEmotions" | "tasks" | "workItems" | "financeItems">) {
  const record: MemoryEntryRecord = {
    ...entry,
    entryAnalysis: memoryAnalyses.get(entry.id) ?? null,
    entryEmotions: memoryEmotions.get(entry.id) ?? [],
    tasks: memoryTasks.get(entry.id) ?? [],
    workItems: memoryWorkItems.get(entry.id) ?? [],
    financeItems: memoryFinanceItems.get(entry.id) ?? []
  };
  memoryEntries.set(entry.id, record);
  return record;
}

export function memoryListEntries(userId: string) {
  return [...memoryEntries.values()]
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function memoryUpsertAnalysis(
  entryId: string,
  analysis: Omit<MemoryEntryAnalysisRecord, "id" | "entryId" | "createdAt" | "updatedAt">
) {
  const record: MemoryEntryAnalysisRecord = {
    id: `mem-analysis-${entryId}`,
    entryId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...analysis
  };
  memoryAnalyses.set(entryId, record);
  const entry = memoryEntries.get(entryId);
  if (entry) {
    entry.entryAnalysis = record;
  }
  return record;
}

export function memoryReplaceEmotions(entryId: string, emotions: Array<Omit<MemoryEntryEmotionRecord, "id" | "entryId" | "createdAt" | "updatedAt">>) {
  const records = emotions.map((emotion, index) => ({
    id: `mem-emotion-${entryId}-${index}`,
    entryId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...emotion
  }));
  memoryEmotions.set(entryId, records);
  const entry = memoryEntries.get(entryId);
  if (entry) {
    entry.entryEmotions = records;
  }
  return records;
}

export function memoryReplaceTasks(entryId: string, tasks: Array<Omit<MemoryTaskRecord, "id" | "createdAt" | "updatedAt">>) {
  const records = tasks.map((task, index) => ({
    id: `mem-task-${entryId}-${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...task
  }));
  memoryTasks.set(entryId, records);
  const entry = memoryEntries.get(entryId);
  if (entry) {
    entry.tasks = records;
  }
  return records;
}

export function memoryReplaceWorkItems(entryId: string, items: Array<Omit<MemoryWorkItemRecord, "id" | "createdAt" | "updatedAt">>) {
  const records = items.map((item, index) => ({
    id: `mem-work-${entryId}-${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...item
  }));
  memoryWorkItems.set(entryId, records);
  const entry = memoryEntries.get(entryId);
  if (entry) {
    entry.workItems = records;
  }
  return records;
}

export function memoryReplaceFinanceItems(
  entryId: string,
  items: Array<Omit<MemoryFinanceItemRecord, "id" | "createdAt" | "updatedAt">>
) {
  const records = items.map((item, index) => ({
    id: `mem-finance-${entryId}-${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...item
  }));
  memoryFinanceItems.set(entryId, records);
  const entry = memoryEntries.get(entryId);
  if (entry) {
    entry.financeItems = records;
  }
  return records;
}

export function memoryFindEntry(entryId: string, userId: string) {
  const entry = memoryEntries.get(entryId);
  return entry && entry.userId === userId ? entry : null;
}
