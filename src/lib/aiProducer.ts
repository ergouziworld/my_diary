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

    throw new Error(`MockAiProducer does not implement purpose: ${request.purpose}`);
  }
}

const providerFactories: Record<AiProviderName, ProviderFactory> = {
  mock: () => new MockAiProducer(),
  openai: () => new MockAiProducer(),
  qwen: () => new MockAiProducer(),
  deepseek: () => new MockAiProducer()
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
