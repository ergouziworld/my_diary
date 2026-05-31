/**
 * 语义检索：把日记灌进 VectorDocument，提问时做"语义相似度 + 近期加权 + 词面命中"的混合打分召回。
 * 向量直接以 JSON 存在 VectorDocument.embeddingRef，检索时全量读出在内存里算余弦——
 * 单用户、数据量几百上千条时毫秒级，足够用；真要更大规模再换专用向量库。
 */

import { prisma } from "@/lib/prisma";
import { embedText, embedTexts, cosineSimilarity, isEmbeddingEnabled } from "@/server/ai/embeddings";

export { isEmbeddingEnabled };

type EntryForIndex = {
  id: string;
  rawContent: string | null;
  contentText: string | null;
  createdAt: Date;
  entryAnalysis: { summary: string | null; compressedMemory: string | null } | null;
  entryEmotions: Array<{ name: string }>;
  entryTags: Array<{ tag: { name: string } }>;
};

/** 把一条日记的多个信号拼成一段用于检索/embedding 的文本 */
function buildEntryText(entry: EntryForIndex): string {
  const parts: string[] = [];
  if (entry.entryAnalysis?.summary) parts.push(`摘要：${entry.entryAnalysis.summary}`);
  const tags = entry.entryTags.map((t) => t.tag.name).filter(Boolean);
  if (tags.length) parts.push(`标签：${tags.join("、")}`);
  const emotions = entry.entryEmotions.map((e) => e.name).filter(Boolean);
  if (emotions.length) parts.push(`情绪：${emotions.join("、")}`);
  const raw = entry.rawContent ?? entry.contentText ?? "";
  if (raw.trim()) parts.push(`原文：${raw.trim()}`);
  return parts.join("\n");
}

function loadEntryForIndex(entryId: string) {
  return prisma.entry.findUnique({
    where: { id: entryId },
    select: {
      id: true,
      rawContent: true,
      contentText: true,
      createdAt: true,
      userId: true,
      entryAnalysis: { select: { summary: true, compressedMemory: true } },
      entryEmotions: { select: { name: true } },
      entryTags: { select: { tag: { select: { name: true } } } }
    }
  });
}

/** 给单条日记建立/更新向量索引。embedding 未配置或失败时静默跳过，不影响主流程。 */
export async function indexEntry(entryId: string): Promise<boolean> {
  if (!isEmbeddingEnabled()) return false;
  const entry = await loadEntryForIndex(entryId);
  if (!entry) return false;

  const content = buildEntryText(entry);
  if (!content.trim()) return false;

  const vector = await embedText(content);
  if (!vector.length) return false;

  const metadata = {
    createdAt: entry.createdAt.toISOString(),
    tags: entry.entryTags.map((t) => t.tag.name),
    emotions: entry.entryEmotions.map((e) => e.name),
    summary: entry.entryAnalysis?.summary ?? null
  };

  // 一条 entry 对应一条向量文档：先删后建，保证幂等
  await prisma.vectorDocument.deleteMany({ where: { entryId, sourceType: "entry" } });
  await prisma.vectorDocument.create({
    data: {
      userId: entry.userId,
      sourceType: "entry",
      entryId: entry.id,
      content,
      embeddingRef: JSON.stringify(vector),
      metadata
    }
  });
  return true;
}

/** 删除某条日记的向量索引（日记被删除时调用） */
export async function removeEntryFromIndex(entryId: string): Promise<void> {
  await prisma.vectorDocument.deleteMany({ where: { entryId } });
}

/** 给某用户的所有日记重建索引，返回成功条数 */
export async function reindexAllEntries(userId: string): Promise<{ total: number; indexed: number }> {
  if (!isEmbeddingEnabled()) return { total: 0, indexed: 0 };

  const entries = await prisma.entry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rawContent: true,
      contentText: true,
      createdAt: true,
      entryAnalysis: { select: { summary: true, compressedMemory: true } },
      entryEmotions: { select: { name: true } },
      entryTags: { select: { tag: { select: { name: true } } } }
    }
  });

  const withText = entries
    .map((entry) => ({ entry, content: buildEntryText(entry as EntryForIndex) }))
    .filter((row) => row.content.trim());

  if (!withText.length) return { total: entries.length, indexed: 0 };

  const vectors = await embedTexts(withText.map((row) => row.content));

  // 整表重建该用户的 entry 向量
  await prisma.vectorDocument.deleteMany({ where: { userId, sourceType: "entry" } });
  let indexed = 0;
  for (let i = 0; i < withText.length; i += 1) {
    const vector = vectors[i];
    if (!vector || !vector.length) continue;
    const { entry, content } = withText[i];
    await prisma.vectorDocument.create({
      data: {
        userId,
        sourceType: "entry",
        entryId: entry.id,
        content,
        embeddingRef: JSON.stringify(vector),
        metadata: {
          createdAt: entry.createdAt.toISOString(),
          tags: entry.entryTags.map((t) => t.tag.name),
          emotions: entry.entryEmotions.map((e) => e.name),
          summary: entry.entryAnalysis?.summary ?? null
        }
      }
    });
    indexed += 1;
  }
  return { total: entries.length, indexed };
}

export type RetrievedDoc = {
  entryId: string | null;
  content: string;
  date: string | null;
  summary: string | null;
  score: number;
  cosine: number;
};

export type RetrievalResult = {
  docs: RetrievedDoc[];
  contextText: string;
};

function recencyScore(iso: string | null): number {
  if (!iso) return 0;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return 0;
  const ageDays = (Date.now() - ts) / 86_400_000;
  // 半衰期约 45 天的指数衰减
  return Math.exp(-Math.max(0, ageDays) / 45);
}

/** 词面命中加成：问题里出现的 2+ 字 token 命中正文则小幅加分 */
function lexicalBonus(question: string, content: string): number {
  const tokens = question
    .toLowerCase()
    .split(/[\s,，。.!！?？、:：;；]+/)
    .filter((t) => t.length >= 2);
  if (!tokens.length) return 0;
  const lower = content.toLowerCase();
  const hits = tokens.filter((t) => lower.includes(t)).length;
  return Math.min(0.15, hits * 0.05);
}

/**
 * 检索与问题最相关的日记，返回拼好的上下文文本 + 命中文档列表。
 * @param topK 返回条数上限
 */
export async function retrieveContext(
  userId: string,
  question: string,
  topK = 12
): Promise<RetrievalResult> {
  if (!isEmbeddingEnabled() || !question.trim()) {
    return { docs: [], contextText: "" };
  }

  const rows = await prisma.vectorDocument.findMany({
    where: { userId, sourceType: "entry", embeddingRef: { not: null } },
    select: { entryId: true, content: true, embeddingRef: true, metadata: true }
  });
  if (!rows.length) return { docs: [], contextText: "" };

  const queryVector = await embedText(question.trim());
  if (!queryVector.length) return { docs: [], contextText: "" };

  const scored: RetrievedDoc[] = rows.map((row) => {
    let vector: number[] = [];
    try {
      vector = row.embeddingRef ? (JSON.parse(row.embeddingRef) as number[]) : [];
    } catch {
      vector = [];
    }
    const cosine = cosineSimilarity(queryVector, vector);
    const meta = (row.metadata ?? {}) as { createdAt?: string; summary?: string };
    const recency = recencyScore(meta.createdAt ?? null);
    const lex = lexicalBonus(question, row.content);
    // 混合打分：语义为主，近期与词面命中为辅
    const score = cosine * 0.75 + recency * 0.15 + lex;
    return {
      entryId: row.entryId,
      content: row.content,
      date: meta.createdAt ?? null,
      summary: meta.summary ?? null,
      score,
      cosine
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  const contextText = top
    .map((doc, i) => {
      const date = doc.date ? new Date(doc.date).toLocaleDateString("zh-CN") : "未知日期";
      const body = doc.content.length > 600 ? `${doc.content.slice(0, 600)}…` : doc.content;
      return `【片段 ${i + 1}】(${date})\n${body}`;
    })
    .join("\n\n");

  return { docs: top, contextText };
}
