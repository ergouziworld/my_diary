import {
  type AnalyzeEntryOutput,
  analyzeEntrySchema,
  type AnswerChatOutput,
  answerChatSchema,
  type SummarizeDayOutput,
  summarizeDaySchema
} from "@/lib/aiSchemas";

export type AiProviderName = "mock" | "openai" | "qwen" | "deepseek";

export type AiPurpose = "analyze_entry" | "summarize_day" | "answer_chat";

export type AiRequestMap = {
  analyze_entry: {
    input: Record<string, unknown>;
    schema: typeof analyzeEntrySchema;
  };
  summarize_day: {
    input: Record<string, unknown>;
    schema: typeof summarizeDaySchema;
  };
  answer_chat: {
    input: Record<string, unknown>;
    schema: typeof answerChatSchema;
  };
};

export type AiOutputMap = {
  analyze_entry: AnalyzeEntryOutput;
  summarize_day: SummarizeDayOutput;
  answer_chat: AnswerChatOutput;
};

export type StructuredAiRequest<Purpose extends AiPurpose = AiPurpose> = {
  purpose: Purpose;
} & AiRequestMap[Purpose];

export type StructuredAiResult<TOutput> = {
  provider: AiProviderName;
  model: string;
  output: TOutput;
  raw: unknown;
};

export interface AiProducer {
  name: AiProviderName;
  produceStructured(request: StructuredAiRequest<"analyze_entry">): Promise<StructuredAiResult<AnalyzeEntryOutput>>;
  produceStructured(request: StructuredAiRequest<"summarize_day">): Promise<StructuredAiResult<SummarizeDayOutput>>;
  produceStructured(request: StructuredAiRequest<"answer_chat">): Promise<StructuredAiResult<AnswerChatOutput>>;
}

type ProviderFactory = () => AiProducer;

type OpenAiCompatibleChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

function buildJsonSchemaResponseFormat(name: string, schema: unknown) {
  return {
    type: "json_schema",
    json_schema: {
      name,
      schema,
      strict: true
    }
  } as const;
}

class OpenAiCompatibleProducer implements AiProducer {
  constructor(
    public name: AiProviderName,
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async produceStructured(request: StructuredAiRequest<"analyze_entry">): Promise<StructuredAiResult<AnalyzeEntryOutput>>;
  async produceStructured(request: StructuredAiRequest<"summarize_day">): Promise<StructuredAiResult<SummarizeDayOutput>>;
  async produceStructured(request: StructuredAiRequest<"answer_chat">): Promise<StructuredAiResult<AnswerChatOutput>>;
  async produceStructured(
    request: StructuredAiRequest<AiPurpose>
  ): Promise<StructuredAiResult<AiOutputMap[AiPurpose]>> {
    if (!this.apiKey) {
      throw new Error(`${this.name.toUpperCase()} API key is missing.`);
    }

    const prompt = this.buildPrompt(request);
    const responseFormat =
      request.purpose === "analyze_entry"
        ? buildJsonSchemaResponseFormat("analyze_entry", analyzeEntrySchema)
        : request.purpose === "summarize_day"
          ? buildJsonSchemaResponseFormat("summarize_day", summarizeDaySchema)
          : buildJsonSchemaResponseFormat("answer_chat", answerChatSchema);

    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        messages: prompt,
        response_format: responseFormat,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`AI request failed (${response.status}): ${detail}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error("AI response was empty.");
    }

    let output: unknown;
    try {
      output = JSON.parse(content);
    } catch {
      throw new Error("AI response was not valid JSON.");
    }

    return {
      provider: this.name,
      model: this.model,
      output: output as AiOutputMap[AiPurpose],
      raw: payload
    };
  }

  private buildPrompt(request: StructuredAiRequest<AiPurpose>): OpenAiCompatibleChatMessage[] {
    if (request.purpose === "analyze_entry") {
      return [
        {
          role: "system",
          content:
            "你是一个日记分析助手。请严格只输出符合 JSON Schema 的 JSON，不要输出额外解释。需要从文本中提取摘要、情绪、标签和任务、财务、时间线、相册、工作信息。"
        },
        {
          role: "user",
          content: JSON.stringify(request.input, null, 2)
        }
      ];
    }

    if (request.purpose === "summarize_day") {
      return [
        {
          role: "system",
          content: "你是一个日记总结助手。请严格只输出 JSON。"
        },
        {
          role: "user",
          content: JSON.stringify(request.input, null, 2)
        }
      ];
    }

    return [
      {
        role: "system",
        content: "你是用户的私人 AI 助理，了解他的日记和生活记录。请认真、详细地回答用户的问题，回答长度和 ChatGPT 保持一致，需要多长就多长。只输出 JSON，answer 字段填写完整回答内容，支持换行。"
      },
      {
        role: "user",
        content: JSON.stringify(request.input, null, 2)
      }
    ];
  }
}

class MockAiProducer implements AiProducer {
  name: AiProviderName = "mock";

  async produceStructured(request: StructuredAiRequest<"analyze_entry">): Promise<StructuredAiResult<AnalyzeEntryOutput>>;
  async produceStructured(request: StructuredAiRequest<"summarize_day">): Promise<StructuredAiResult<SummarizeDayOutput>>;
  async produceStructured(request: StructuredAiRequest<"answer_chat">): Promise<StructuredAiResult<AnswerChatOutput>>;
  async produceStructured(
    request: StructuredAiRequest<AiPurpose>
  ): Promise<StructuredAiResult<AiOutputMap[AiPurpose]>> {
    if (request.purpose === "analyze_entry") {
      const output: AnalyzeEntryOutput = {
        summary: "",
        moodLabel: "neutral",
        moodScore: 0,
        tags: [],
        extractedTasks: [],
        extractedFinance: [],
        extractedTimelineEvents: [],
        extractedAlbumItems: [],
        extractedWorkItems: []
      };

      return {
        provider: this.name,
        model: "mock",
        output,
        raw: { request }
      };
    }

    if (request.purpose === "summarize_day") {
      const output: SummarizeDayOutput = {
        summary: "",
        highlights: []
      };

      return {
        provider: this.name,
        model: "mock",
        output,
        raw: { request }
      };
    }

    if (request.purpose === "answer_chat") {
      const output: AnswerChatOutput = {
        answer: "先说重点。"
      };

      return {
        provider: this.name,
        model: "mock",
        output,
        raw: { request }
      };
    }

    throw new Error(`MockAiProducer does not implement purpose: ${request.purpose}`);
  }
}

const providerFactories: Record<AiProviderName, ProviderFactory> = {
  mock: () => new MockAiProducer(),
  openai: () =>
    new OpenAiCompatibleProducer(
      "openai",
      getEnv("OPENAI_BASE_URL") ?? "https://api.openai.com/v1",
      getEnv("OPENAI_API_KEY") ?? "",
      getEnv("OPENAI_MODEL") ?? "gpt-4o-mini"
    ),
  qwen: () =>
    new OpenAiCompatibleProducer(
      "qwen",
      getEnv("QWEN_BASE_URL") ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
      getEnv("QWEN_API_KEY") ?? "",
      getEnv("QWEN_MODEL") ?? "qwen-plus"
    ),
  deepseek: () =>
    new OpenAiCompatibleProducer(
      "deepseek",
      getEnv("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com/v1",
      getEnv("DEEPSEEK_API_KEY") ?? "",
      getEnv("DEEPSEEK_MODEL") ?? "deepseek-chat"
    )
};

function getAiProviderName(): AiProviderName {
  const raw = process.env.AI_PROVIDER?.toLowerCase();
  if (raw === "openai" || raw === "qwen" || raw === "deepseek" || raw === "mock") {
    return raw;
  }

  return "mock";
}

export function createAiProducer(): AiProducer {
  return providerFactories[getAiProviderName()]();
}
