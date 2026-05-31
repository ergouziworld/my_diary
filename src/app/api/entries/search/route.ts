import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { retrieveContext, isEmbeddingEnabled } from "@/server/ai/retrieval";

export const dynamic = "force-dynamic";

/** AI 语义查找：把查询词向量化，按相关度返回 entryId 列表 */
export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const query = typeof (body as { query?: unknown }).query === "string"
    ? (body as { query: string }).query.trim()
    : "";
  if (!query) {
    return NextResponse.json({ ok: false, error: "查询内容不能为空" }, { status: 400 });
  }

  if (!isEmbeddingEnabled()) {
    return NextResponse.json(
      { ok: false, error: "AI 检索未配置（缺少 embedding key）。" },
      { status: 500 }
    );
  }

  try {
    const { docs } = await retrieveContext(userId, query, 30);
    const entryIds = docs.map((d) => d.entryId).filter((id): id is string => Boolean(id));
    return NextResponse.json({ ok: true, entryIds });
  } catch (err) {
    const message = err instanceof Error ? err.message : "搜索失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
