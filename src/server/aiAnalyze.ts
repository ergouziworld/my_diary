import { createAiProducer } from "@/lib/aiProducer";
import { analyzeEntrySchema, type AnalyzeEntryOutput } from "@/lib/aiSchemas";

export type AnalyzeEntryInput = {
  text: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

function assertAnalyzeEntryInput(input: unknown): AnalyzeEntryInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid analyze entry payload.");
  }

  const value = input as Partial<AnalyzeEntryInput> & { text?: unknown };
  if (typeof value.text !== "string" || value.text.trim().length === 0) {
    throw new Error("Field `text` is required.");
  }

  return {
    text: value.text,
    source: typeof value.source === "string" ? value.source : undefined,
    metadata: value.metadata && typeof value.metadata === "object" ? (value.metadata as Record<string, unknown>) : undefined
  };
}

export async function analyzeEntry(input: unknown) {
  const parsed = assertAnalyzeEntryInput(input);
  const producer = createAiProducer();

  return producer.produceStructured({
    purpose: "analyze_entry",
    input: parsed,
    schema: analyzeEntrySchema
  });
}

export function parseAnalyzeEntryInput(input: unknown): AnalyzeEntryInput {
  return assertAnalyzeEntryInput(input);
}

export type { AnalyzeEntryOutput };
