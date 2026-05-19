import { NextResponse } from "next/server";
import { analyzeEntry } from "@/server/aiAnalyze";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await analyzeEntry(body);
  return NextResponse.json({ ok: true, result });
}
