import { NextResponse } from "next/server";
import { deleteEntry } from "@/server/entries";

export const dynamic = "force-dynamic";

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
