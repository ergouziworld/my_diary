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
        .map((item) => {
          if (typeof item === "string" && item.length > 0) {
            return { name: item, intensity: 0.5, reason: "" };
          }
          const obj = asObject(item);
          if (!obj) return null;
          const name = typeof obj.name === "string" ? obj.name : "";
          if (!name.length) return null;
          return {
            name,
            intensity: typeof obj.intensity === "number" ? obj.intensity : 0.5,
            reason: typeof obj.reason === "string" ? obj.reason : ""
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  const tasks: EntryAnalyzeResult["tasks"] = Array.isArray(record.tasks)
    ? record.tasks
        .map((item) => {
          if (typeof item === "string" && item.length > 0) {
            return { title: item, priority: "medium" as const, deadlineText: "", sourceText: "" };
          }
          const obj = asObject(item);
          if (!obj) return null;
          const title = typeof obj.title === "string" ? obj.title : "";
          if (!title.length) return null;
          return {
            title,
            priority: (obj.priority === "high" || obj.priority === "low" ? obj.priority : "medium") as "low" | "medium" | "high",
            deadlineText: typeof obj.deadlineText === "string" ? obj.deadlineText : "",
            sourceText: typeof obj.sourceText === "string" ? obj.sourceText : ""
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  const workItems: EntryAnalyzeResult["workItems"] = Array.isArray(record.workItems)
    ? record.workItems
        .map((item) => {
          if (typeof item === "string" && item.length > 0) {
            return { project: "", type: "other" as const, title: item, description: "" };
          }
          const obj = asObject(item);
          if (!obj) return null;
          const title = typeof obj.title === "string" ? obj.title : (typeof obj.name === "string" ? obj.name : "");
          if (!title.length) return null;
          return {
            project: typeof obj.project === "string" ? obj.project : "",
            type: (obj.type === "development" || obj.type === "study" || obj.type === "competition" || obj.type === "course" ? obj.type : "other") as EntryAnalyzeResult["workItems"][number]["type"],
            title,
            description: typeof obj.description === "string" ? obj.description : ""
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  const financeItems: EntryAnalyzeResult["financeItems"] = Array.isArray(record.financeItems)
    ? record.financeItems
        .map(asObject)
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => {
          // 兼容 Qwen 返回的 amount(number)/source 字段，以及标准的 amountText/title 字段
          const title = typeof item.title === "string" ? item.title
            : typeof item.source === "string" ? item.source
            : typeof item.category === "string" ? item.category : "";
          const amountText = typeof item.amountText === "string" ? item.amountText
            : typeof item.amount === "number" ? String(item.amount)
            : typeof item.amount === "string" ? item.amount : "";
          if (!amountText) return null;
          return {
            title: title || (item.type === "income" ? "收入" : "支出"),
            amountText,
            type: item.type === "income" ? ("income" as const) : ("expense" as const),
            category: typeof item.category === "string" ? item.category : (typeof item.source === "string" ? item.source : ""),
            sourceText: typeof item.sourceText === "string" ? item.sourceText : ""
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
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
