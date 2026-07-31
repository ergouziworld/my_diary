import { NextResponse } from "next/server";
import { assertMemoryEngineAccess, memoryEngineFetch } from "@/lib/memoryEngine";

export const dynamic = "force-dynamic";

function unauthorized(error: unknown) {
  const message = error instanceof Error ? error.message : "Unauthorized";
  return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 403 });
}

export async function GET(request: Request) {
  try {
    await assertMemoryEngineAccess();
    const url = new URL(request.url);
    const sourcePrefix = "wecom_";
    const upstream = await memoryEngineFetch(`/api/memories?source_prefix=${encodeURIComponent(sourcePrefix)}&limit=500`);
    const data = await upstream.json();
    if (!upstream.ok) return NextResponse.json({ ok: false, error: data.error ?? "Memory Engine unavailable" }, { status: 502 });
    return NextResponse.json({ ok: true, sourcePrefix, items: data.items ?? [] });
  } catch (error) {
    return unauthorized(error);
  }
}
