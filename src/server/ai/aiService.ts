import { MockProvider } from "@/server/ai/providers/mockProvider";
import { QwenProvider } from "@/server/ai/providers/qwenProvider";

export type EntryAnalyzeInput = {
  entryId: string;
  content: string;
  type: "text";
};

export type EntryAnalyzeResult = Awaited<ReturnType<QwenProvider["analyzeEntry"]>>;

function getProviderName() {
  return (process.env.AI_PROVIDER ?? "mock").toLowerCase();
}

function getProvider() {
  const provider = getProviderName();
  if (provider === "qwen") {
    return new QwenProvider();
  }
  return new MockProvider();
}

export async function analyzeEntry(input: EntryAnalyzeInput): Promise<{ provider: string; result: EntryAnalyzeResult }> {
  const provider = getProvider();

  try {
    const result = await provider.analyzeEntry(input);
    return { provider: provider.name, result };
  } catch {
    const fallback = await new MockProvider().analyzeEntry(input);
    return { provider: "mock", result: fallback };
  }
}

