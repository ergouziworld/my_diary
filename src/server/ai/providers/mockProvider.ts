export type EntryAnalyzeResult = {
  summary: string;
  memoryText: string;
  entryTypes: Array<"timeline" | "emotion" | "task" | "work" | "study" | "life" | "finance" | "other">;
  tags: string[];
  emotions: Array<{ name: string; intensity: number; reason: string }>;
  tasks: Array<{ title: string; priority: "low" | "medium" | "high"; deadlineText: string; sourceText: string }>;
  workItems: Array<{ project: string; type: "development" | "study" | "competition" | "course" | "other"; title: string; description: string }>;
  financeItems: Array<{ title: string; amountText: string; type: "expense" | "income"; category: string; sourceText: string }>;
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
  financeItems: [],
  timelineTitle: "",
  people: [],
  confidence: 0.2
};

function buildHeuristicResult(content: string): Partial<EntryAnalyzeResult> {
  const text = content.trim();
  const result: Partial<EntryAnalyzeResult> = {
    entryTypes: ["timeline"],
    timelineTitle: text.slice(0, 24) || "日记条目",
    summary: text.slice(0, 40) || "空内容",
    memoryText: text.slice(0, 200)
  };

  const emotions: EntryAnalyzeResult["emotions"] = [];
  if (/[烦焦躁崩溃累累死]/.test(text)) {
    emotions.push({ name: "烦躁", intensity: 0.7, reason: "文本中出现明显负向情绪词" });
  }
  if (/[开心成就完成解决太好了顺利]/.test(text)) {
    emotions.push({ name: "成就感", intensity: 0.7, reason: "文本中出现明显正向结果词" });
  }
  if (emotions.length) {
    result.emotions = emotions;
    result.entryTypes = Array.from(new Set([...(result.entryTypes ?? []), "emotion"]));
  }

  const tasks: EntryAnalyzeResult["tasks"] = [];
  if (/明天|记得|待办|需要|要/.test(text)) {
    const match = text.match(/(?:明天|记得|待办|需要|要)([^。！？\n]+)/);
    const title = match?.[1]?.trim() || text.slice(0, 24);
    tasks.push({
      title: title || "待办事项",
      priority: /赶紧|尽快|马上|今天/.test(text) ? "high" : "medium",
      deadlineText: /明天/.test(text) ? "明天" : "无",
      sourceText: text
    });
    result.entryTypes = Array.from(new Set([...(result.entryTypes ?? []), "task"]));
  }
  if (tasks.length) result.tasks = tasks;

  const workItems: EntryAnalyzeResult["workItems"] = [];
  if (/项目|开发|AI|代码|bug|导航卡顿|接口|API|千问/.test(text)) {
    workItems.push({
      project: /AI日记|AI 日记|日记项目/.test(text) ? "AI 日记项目" : "工作 / 学习",
      type: /修|bug|API|接口|代码|开发/.test(text) ? "development" : "other",
      title: /修|bug/.test(text) ? "修复问题" : "项目推进",
      description: text
    });
    result.entryTypes = Array.from(new Set([...(result.entryTypes ?? []), "work"]));
  }
  if (workItems.length) result.workItems = workItems;

  const financeItems: EntryAnalyzeResult["financeItems"] = [];
  const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (/花了|支出|买了|消费|付款|转账|收款|收入/.test(text)) {
    const isIncome = /收入|收款|到账/.test(text);
    financeItems.push({
      title: /鸟粮/.test(text) ? "鸟粮" : isIncome ? "收入记录" : "消费记录",
      amountText: amountMatch?.[1] ?? "无",
      type: isIncome ? "income" : "expense",
      category: /鸟粮/.test(text) ? "pet" : "general",
      sourceText: text
    });
    result.entryTypes = Array.from(new Set([...(result.entryTypes ?? []), "finance"]));
  }
  if (financeItems.length) result.financeItems = financeItems;

  return result;
}

export class MockProvider {
  name = "mock" as const;

  async analyzeEntry(input: { content: string }): Promise<EntryAnalyzeResult> {
    const content = input.content.trim();
    const heuristic = buildHeuristicResult(content);
    return {
      ...defaultResult,
      ...heuristic,
      entryTypes: heuristic.entryTypes?.length ? heuristic.entryTypes : ["other"],
      summary: heuristic.summary ?? defaultResult.summary,
      memoryText: heuristic.memoryText ?? defaultResult.memoryText,
      timelineTitle: heuristic.timelineTitle ?? defaultResult.timelineTitle,
      confidence: 0.35
    };
  }
}
