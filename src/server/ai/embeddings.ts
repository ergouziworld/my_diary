/**
 * Embedding 工具：把文本转成向量，用于语义检索。
 * 复用 chat 那套 provider 配置（Qwen / OpenAI 的 OpenAI 兼容接口）。
 */

type EmbeddingConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  dimensions?: number;
};

function getEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getEmbeddingConfig(): EmbeddingConfig | null {
  const provider = (process.env.AI_PROVIDER ?? "").toLowerCase().trim();

  if (provider === "openai") {
    return {
      baseUrl: getEnv("OPENAI_BASE_URL") ?? "https://api.openai.com/v1",
      apiKey: getEnv("OPENAI_API_KEY") ?? "",
      model: getEnv("OPENAI_EMBED_MODEL") ?? "text-embedding-3-small"
    };
  }

  // 默认走 Qwen（deepseek 没有自己的 embedding，也回退到 Qwen 配置）
  const apiKey = getEnv("QWEN_API_KEY") ?? getEnv("DASHSCOPE_API_KEY") ?? "";
  if (!apiKey) return null;
  return {
    baseUrl: getEnv("QWEN_BASE_URL") ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey,
    model: getEnv("QWEN_EMBED_MODEL") ?? "text-embedding-v3",
    dimensions: 1024
  };
}

export function isEmbeddingEnabled() {
  const config = getEmbeddingConfig();
  return Boolean(config?.apiKey);
}

/** DashScope / OpenAI 兼容接口的批量上限，分批发送更稳妥 */
const BATCH_SIZE = 10;

async function embedBatch(config: EmbeddingConfig, inputs: string[]): Promise<number[][]> {
  const body: Record<string, unknown> = {
    model: config.model,
    input: inputs,
    encoding_format: "float"
  };
  if (config.dimensions) body.dimensions = config.dimensions;

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Embedding request failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[]; index?: number }>;
  };
  const data = payload.data ?? [];
  // 按 index 排序，保证和输入顺序一致
  const sorted = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return sorted.map((item) => item.embedding ?? []);
}

/** 把一批文本转成向量。空文本会被替换成单空格避免接口报错。 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const config = getEmbeddingConfig();
  if (!config?.apiKey) throw new Error("Embedding provider is not configured.");

  const safe = texts.map((t) => (t.trim() ? t.trim().slice(0, 2000) : " "));
  const out: number[][] = [];
  for (let i = 0; i < safe.length; i += BATCH_SIZE) {
    const chunk = safe.slice(i, i + BATCH_SIZE);
    const vectors = await embedBatch(config, chunk);
    out.push(...vectors);
  }
  return out;
}

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector ?? [];
}

/** 余弦相似度，输入需为同维向量 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
