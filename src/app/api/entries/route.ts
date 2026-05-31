import { NextResponse } from "next/server";
import { createEntry, listEntries } from "@/server/entries";

export async function GET() {
  const data = await listEntries();
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const value = body as { rawContent?: unknown; type?: unknown; attachmentIds?: unknown };
  if (typeof value.rawContent !== "string" || !value.rawContent.trim()) {
    return NextResponse.json({ ok: false, error: "Field `rawContent` is required." }, { status: 400 });
  }
  if (value.type !== "text") {
    return NextResponse.json({ ok: false, error: "Field `type` must be `text`." }, { status: 400 });
  }

  const attachmentIds = Array.isArray(value.attachmentIds)
    ? value.attachmentIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : undefined;

  try {
    const entry = await createEntry({ rawContent: value.rawContent.trim(), type: "text", attachmentIds });
    return NextResponse.json({
      ok: true,
      data: {
        id: entry.id,
        rawContent: entry.rawContent,
        type: entry.type,
        createdAt: entry.createdAt
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "保存失败，请重试";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
