import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { retrieveContext, isEmbeddingEnabled } from "@/server/ai/retrieval";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求格式错误" }, { status: 400 });
  }

  const query = typeof body === "object" && body !== null && typeof (body as { query?: unknown }).query === "string"
    ? (body as { query: string }).query.trim()
    : "";
  if (!query) return NextResponse.json({ ok: false, error: "请输入检索内容" }, { status: 400 });
  if (!isEmbeddingEnabled()) return NextResponse.json({ ok: false, error: "Embedding 尚未配置" }, { status: 503 });

  try {
    const startedAt = Date.now();
    const result = await retrieveContext(userId, query, 12);
    return NextResponse.json({
      ok: true,
      elapsedMs: Date.now() - startedAt,
      items: result.docs.map((doc) => ({
        entryId: doc.entryId,
        content: doc.content,
        date: doc.date,
        summary: doc.summary,
        score: doc.score,
        cosine: doc.cosine
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "检索失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
