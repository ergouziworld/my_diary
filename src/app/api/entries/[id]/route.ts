import { NextResponse } from "next/server";
import { deleteEntry, updateEntry } from "@/server/entries";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entryId = typeof id === "string" ? id.trim() : "";
  if (!entryId) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const rawContent = (body as { rawContent?: unknown }).rawContent;
  if (typeof rawContent !== "string" || !rawContent.trim()) {
    return NextResponse.json({ ok: false, error: "rawContent is required" }, { status: 400 });
  }

  try {
    await updateEntry(entryId, rawContent.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "修改失败";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
    }
    const status = message.includes("不存在") || message.includes("无权") ? 404 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entryId = typeof id === "string" ? id.trim() : "";
  if (!entryId) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
  }

  try {
    await deleteEntry(entryId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "删除失败";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
    }
    const status = message.includes("不存在") || message.includes("无权") ? 404 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
