import { analyzeEntrySchema } from "@/lib/aiSchemas";

export type AiProviderName = "mock";

export type StructuredAiRequest = {
  purpose: "analyze_entry" | "summarize_day" | "answer_chat";
  input: Record<string, unknown>;
  schema: typeof analyzeEntrySchema;
};

export type StructuredAiResult<TOutput> = {
  provider: AiProviderName;
  model: string;
  output: TOutput;
  raw: unknown;
};

export interface AiProducer {
  name: AiProviderName;
  produceStructured<TOutput>(request: StructuredAiRequest): Promise<StructuredAiResult<TOutput>>;
}

class MockAiProducer implements AiProducer {
  name: AiProviderName = "mock";

  async produceStructured<TOutput>(request: StructuredAiRequest): Promise<StructuredAiResult<TOutput>> {
    return {
      provider: this.name,
      model: "mock",
      output: {
        summary: "",
        moodLabel: "neutral",
        moodScore: 0,
        tags: [],
        extractedTasks: [],
        extractedFinance: [],
        extractedTimelineEvents: [],
        extractedAlbumItems: [],
        extractedWorkItems: []
      } as TOutput,
      raw: { request }
    };
  }
}

export function createAiProducer(): AiProducer {
  return new MockAiProducer();
}
