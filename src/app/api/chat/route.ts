import { NextResponse } from "next/server";
import { createAiProducer } from "@/lib/aiProducer";
import { answerChatSchema } from "@/lib/aiSchemas";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const question = typeof body === "object" && body !== null ? (body as { question?: unknown }).question : undefined;
  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ ok: false, error: "Field `question` is required." }, { status: 400 });
  }

  try {
    const producer = createAiProducer();
    const result = await producer.produceStructured({
      purpose: "answer_chat",
      input: { question: question.trim() },
      schema: answerChatSchema
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat API failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
