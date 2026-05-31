import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { reindexAllEntries, isEmbeddingEnabled } from "@/server/ai/retrieval";

export const dynamic = "force-dynamic";
// 给历史日记批量补向量可能较久，放宽超时
export const maxDuration = 300;

export async function POST() {
  if (!isEmbeddingEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Embedding provider 未配置（缺少 QWEN_API_KEY）。" },
      { status: 500 }
    );
  }

  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "未登录。" }, { status: 401 });
  }

  try {
    const result = await reindexAllEntries(userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reindex failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
