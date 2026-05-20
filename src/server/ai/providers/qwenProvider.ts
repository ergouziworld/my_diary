import { normalizeEntryAnalyzeResult } from "@/server/ai/analysisNormalizer";
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

    const normalized = normalizeEntryAnalyzeResult(safeParseJson(content));
    if (!normalized) {
      throw new Error("AI response was not valid JSON.");
    }

    return normalized;
  }
}
