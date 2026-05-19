import { NextResponse } from "next/server";
import { analyzeEntry, parseAnalyzeEntryInput } from "@/server/aiAnalyze";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const input = parseAnalyzeEntryInput(body);
    const result = await analyzeEntry(input);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyze entry failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
