import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmbeddingConfig, isEmbeddingEnabled } from "@/server/ai/embeddings";

export const dynamic = "force-dynamic";

function getChatModel() {
  const provider = (process.env.AI_PROVIDER ?? "qwen").toLowerCase().trim();
  if (provider === "openai") return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  if (provider === "deepseek") return process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  return process.env.QWEN_MODEL?.trim() || "qwen-plus";
}

export async function GET() {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  try {
    const [entryCount, memoryCount, sessionCount, recent] = await Promise.all([
      prisma.entry.count({ where: { userId } }),
      prisma.vectorDocument.count({ where: { userId } }),
      prisma.chatSession.count({ where: { userId } }),
      prisma.vectorDocument.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, sourceType: true, entryId: true, content: true, metadata: true, createdAt: true }
      })
    ]);

    const embedding = getEmbeddingConfig();
    return NextResponse.json({
      ok: true,
      stats: {
        entryCount,
        memoryCount,
        sessionCount,
        embeddingEnabled: isEmbeddingEnabled(),
        embeddingModel: embedding?.model ?? null,
        provider: (process.env.AI_PROVIDER ?? "qwen").toLowerCase().trim() || "qwen",
        chatModel: getChatModel(),
        retrievalTopK: 12
      },
      recent: recent.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取记忆状态失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
