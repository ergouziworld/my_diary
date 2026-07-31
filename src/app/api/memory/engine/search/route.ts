import { NextResponse } from "next/server";
import { assertMemoryEngineAccess, memoryEngineFetch } from "@/lib/memoryEngine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await assertMemoryEngineAccess();
    const body = await request.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) return NextResponse.json({ ok: false, error: "请输入检索内容" }, { status: 400 });
    const upstream = await memoryEngineFetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, source_prefix: "wecom_" }) });
    const data = await upstream.json();
    if (!upstream.ok) return NextResponse.json({ ok: false, error: data.error ?? "检索失败" }, { status: 502 });
    return NextResponse.json({ ok: true, items: data.items ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}
