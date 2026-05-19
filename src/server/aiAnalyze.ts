import { createAiProducer } from "@/lib/aiProducer";
import { analyzeEntrySchema } from "@/lib/aiSchemas";

export async function analyzeEntry(input: Record<string, unknown>) {
  const producer = createAiProducer();
  return producer.produceStructured({
    purpose: "analyze_entry",
    input,
    schema: analyzeEntrySchema
  });
}
