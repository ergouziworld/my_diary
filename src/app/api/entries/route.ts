import { NextResponse } from "next/server";
import { createEntry, listEntries } from "@/server/entries";
import { memoryCreateEntry } from "@/server/memoryStore";
import { getUserId } from "@/lib/auth";

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

  const value = body as { rawContent?: unknown; type?: unknown };
  if (typeof value.rawContent !== "string" || !value.rawContent.trim()) {
    return NextResponse.json({ ok: false, error: "Field `rawContent` is required." }, { status: 400 });
  }
  if (value.type !== "text") {
    return NextResponse.json({ ok: false, error: "Field `type` must be `text`." }, { status: 400 });
  }

  try {
    const entry = await createEntry({ rawContent: value.rawContent.trim(), type: "text" });
    return NextResponse.json({
      ok: true,
      data: {
        id: entry.id,
        rawContent: entry.rawContent,
        type: entry.type,
        createdAt: entry.createdAt
      }
    });
  } catch {
    const entry = memoryCreateEntry({
      id: crypto.randomUUID(),
      userId: await getUserId(),
      rawContent: value.rawContent.trim(),
      contentText: value.rawContent.trim(),
      type: "text",
      inputType: "text",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return NextResponse.json({
      ok: true,
      data: {
        id: entry.id,
        rawContent: entry.rawContent,
        type: entry.type,
        createdAt: entry.createdAt
      }
    });
  }
}
