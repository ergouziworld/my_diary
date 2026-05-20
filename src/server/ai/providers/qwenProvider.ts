import { ENTRY_ANALYZE_SYSTEM_PROMPT } from "@/server/ai/prompts/entryAnalyzePrompt";
import type { EntryAnalyzeResult } from "@/server/ai/providers/mockProvider";

function getEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeResult(value: unknown): EntryAnalyzeResult | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.summary !== "string" || typeof record.memoryText !== "string") return null;

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

  const entryTypes = Array.isArray(record.entryTypes)
    ? record.entryTypes.filter(
        (item): item is EntryAnalyzeResult["entryTypes"][number] =>
          typeof item === "string" && allowedEntryTypes.includes(item as EntryAnalyzeResult["entryTypes"][number])
      )
    : [];

  const tags = Array.isArray(record.tags) ? record.tags.filter((item): item is string => typeof item === "string") : [];

  const emotions: EntryAnalyzeResult["emotions"] = Array.isArray(record.emotions)
    ? record.emotions
        .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
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
        .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => {
          const priority: "low" | "medium" | "high" =
            item.priority === "high" || item.priority === "medium" || item.priority === "low" ? item.priority : "low";
          return {
            title: typeof item.title === "string" ? item.title : "",
            priority,
            deadlineText: typeof item.deadlineText === "string" ? item.deadlineText : "无",
            sourceText: typeof item.sourceText === "string" ? item.sourceText : ""
          };
        })
        .filter((item) => item.title.length > 0)
    : [];

  const workItems: EntryAnalyzeResult["workItems"] = Array.isArray(record.workItems)
    ? record.workItems
        .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => {
          const type: "development" | "study" | "competition" | "course" | "other" =
            item.type === "development" || item.type === "study" || item.type === "competition" || item.type === "course"
              ? item.type
              : "other";
          return {
            project: typeof item.project === "string" ? item.project : "",
            type,
            title: typeof item.title === "string" ? item.title : "",
            description: typeof item.description === "string" ? item.description : ""
          };
        })
        .filter((item) => item.title.length > 0)
    : [];

  const financeItems: EntryAnalyzeResult["financeItems"] = Array.isArray(record.financeItems)
    ? record.financeItems
        .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
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

  const timelineTitle = typeof record.timelineTitle === "string" ? record.timelineTitle : "";
  const people = Array.isArray(record.people) ? record.people.filter((item): item is string => typeof item === "string") : [];
  const confidence = typeof record.confidence === "number" ? record.confidence : 0;

  const normalizedEntryTypes = (entryTypes.length ? entryTypes : ["other"]) as EntryAnalyzeResult["entryTypes"];

  return {
    summary: record.summary,
    memoryText: record.memoryText,
    entryTypes: normalizedEntryTypes,
    tags,
    emotions,
    tasks,
    workItems,
    financeItems,
    timelineTitle,
    people,
    confidence
  };
}

function fillEmotionsFromAiOutput(result: EntryAnalyzeResult): EntryAnalyzeResult {
  if (result.emotions.length) return result;

  const sourceText = `${result.summary} ${result.tags.join(" ")}`;
  const emotions: EntryAnalyzeResult["emotions"] = [];
  const seen = new Set<string>();

  const addEmotion = (name: string, reason: string, intensity = 0.7) => {
    if (seen.has(name)) return;
    emotions.push({ name, reason, intensity });
    seen.add(name);
  };

  if (/嫉妒/.test(sourceText)) addEmotion("嫉妒", "AI 在摘要或标签中明确表达嫉妒", 0.8);
  if (/不开心|难受/.test(sourceText)) addEmotion("不开心", "AI 在摘要或标签中明确表达不开心或难受", 0.7);
  if (/烦躁|烦/.test(sourceText)) addEmotion("烦躁", "AI 在摘要或标签中明确表达烦躁", 0.7);
  if (/委屈/.test(sourceText)) addEmotion("委屈", "AI 在摘要或标签中明确表达委屈", 0.7);
  if (/生气/.test(sourceText)) addEmotion("生气", "AI 在摘要或标签中明确表达生气", 0.7);
  if (/开心/.test(sourceText)) addEmotion("开心", "AI 在摘要或标签中明确表达开心", 0.7);
  if (/成就感/.test(sourceText)) addEmotion("成就感", "AI 在摘要或标签中明确表达成就感", 0.7);

  return emotions.length ? { ...result, emotions } : result;
}

export class QwenProvider {
  name = "qwen" as const;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = getEnv("QWEN_BASE_URL") ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";
    this.apiKey = getEnv("QWEN_API_KEY") ?? "";
    this.model = getEnv("QWEN_MODEL") ?? "qwen-plus";
  }

  async analyzeEntry(input: { content: string }): Promise<EntryAnalyzeResult> {
    if (!this.apiKey) {
      throw new Error("QWEN API key is missing.");
    }

    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: ENTRY_ANALYZE_SYSTEM_PROMPT },
          { role: "user", content: input.content }
        ],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    if (!response.ok) {
      throw new Error(`AI request failed (${response.status})`);
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty AI response");
    }

    const parsed = safeParseJson(content);
    const normalized = normalizeResult(parsed);
    if (!normalized) {
      throw new Error("AI response was not valid JSON.");
    }

    return fillEmotionsFromAiOutput(normalized);
  }
}
