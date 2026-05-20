import type { EntryAnalyzeResult } from "@/server/ai/providers/mockProvider";

const allowedEntryTypes: EntryAnalyzeResult["entryTypes"][number][] = [
  "timeline",
  "emotion",
  "task",
  "work",
  "study",
  "life",
  "finance",
  "other"
];

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function normalizeEntryAnalyzeResult(value: unknown): EntryAnalyzeResult | null {
  const record = asObject(value);
  if (!record) return null;
  if (typeof record.summary !== "string" || typeof record.memoryText !== "string") return null;

  const entryTypes = Array.isArray(record.entryTypes)
    ? record.entryTypes.filter(
        (item): item is EntryAnalyzeResult["entryTypes"][number] =>
          typeof item === "string" && allowedEntryTypes.includes(item as EntryAnalyzeResult["entryTypes"][number])
      )
    : [];

  const emotions: EntryAnalyzeResult["emotions"] = Array.isArray(record.emotions)
    ? record.emotions
        .map(asObject)
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => ({
          name: typeof item.name === "string" ? item.name : "",
          intensity: typeof item.intensity === "number" ? item.intensity : 0,
          reason: typeof item.reason === "string" ? item.reason : ""
        }))
        .filter((item) => item.name.length > 0)
    : [];

  const tasks: EntryAnalyzeResult["tasks"] = Array.isArray(record.tasks)
    ? record.tasks
        .map(asObject)
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => ({
          title: typeof item.title === "string" ? item.title : "",
          priority: (
            item.priority === "high" || item.priority === "medium" || item.priority === "low" ? item.priority : "low"
          ) as "low" | "medium" | "high",
          deadlineText: typeof item.deadlineText === "string" ? item.deadlineText : "",
          sourceText: typeof item.sourceText === "string" ? item.sourceText : ""
        }))
        .filter((item) => item.title.length > 0)
    : [];

  const workItems: EntryAnalyzeResult["workItems"] = Array.isArray(record.workItems)
    ? record.workItems
        .map(asObject)
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item): EntryAnalyzeResult["workItems"][number] => ({
          project: typeof item.project === "string" ? item.project : "",
          type:
            item.type === "development" || item.type === "study" || item.type === "competition" || item.type === "course"
              ? item.type
              : "other",
          title: typeof item.title === "string" ? item.title : "",
          description: typeof item.description === "string" ? item.description : ""
        }))
        .filter((item) => item.title.length > 0)
    : [];

  const financeItems: EntryAnalyzeResult["financeItems"] = Array.isArray(record.financeItems)
    ? record.financeItems
        .map(asObject)
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => ({
          title: typeof item.title === "string" ? item.title : "",
          amountText: typeof item.amountText === "string" ? item.amountText : "",
          type: item.type === "income" ? ("income" as const) : ("expense" as const),
          category: typeof item.category === "string" ? item.category : "",
          sourceText: typeof item.sourceText === "string" ? item.sourceText : ""
        }))
        .filter((item) => item.title.length > 0)
    : [];

  return {
    summary: record.summary,
    memoryText: record.memoryText,
    entryTypes: entryTypes.length ? entryTypes : ["other"],
    tags: toStringArray(record.tags),
    emotions,
    tasks,
    workItems,
    financeItems,
    timelineTitle: typeof record.timelineTitle === "string" ? record.timelineTitle : "",
    people: toStringArray(record.people),
    confidence: typeof record.confidence === "number" ? record.confidence : 0
  };
}
