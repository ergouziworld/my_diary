import { NextResponse } from "next/server";
import { assertMemoryEngineAccess, memoryEngineFetch } from "@/lib/memoryEngine";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertMemoryEngineAccess();
    const { id } = await context.params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ ok: false, error: "无效的记忆 ID" }, { status: 400 });
    const upstream = await memoryEngineFetch(`/api/memories/${id}`, { method: "DELETE" });
    const data = await upstream.json();
    return NextResponse.json({ ok: upstream.ok, ...data }, { status: upstream.ok ? 200 : upstream.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}
