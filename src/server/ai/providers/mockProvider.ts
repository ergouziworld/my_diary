export type EntryAnalyzeResult = {
  summary: string;
  memoryText: string;
  entryTypes: Array<"timeline" | "emotion" | "task" | "work" | "study" | "life" | "finance" | "other">;
  tags: string[];
  emotions: Array<{ name: string; intensity: number; reason: string }>;
  tasks: Array<{ title: string; priority: "low" | "medium" | "high"; deadlineText: string; sourceText: string }>;
  workItems: Array<{ project: string; type: "development" | "study" | "competition" | "course" | "other"; title: string; description: string }>;
  timelineTitle: string;
  people: string[];
  confidence: number;
};

const defaultResult: EntryAnalyzeResult = {
  summary: "",
  memoryText: "",
  entryTypes: ["other"],
  tags: [],
  emotions: [],
  tasks: [],
  workItems: [],
  timelineTitle: "",
  people: [],
  confidence: 0.2
};

export class MockProvider {
  name = "mock" as const;

  async analyzeEntry(input: { content: string }): Promise<EntryAnalyzeResult> {
    const content = input.content.trim();
    const prefix = content.slice(0, 24);
    return {
      ...defaultResult,
      summary: prefix || "空内容",
      memoryText: content.slice(0, 200),
      timelineTitle: prefix || "日记条目"
    };
  }
}

