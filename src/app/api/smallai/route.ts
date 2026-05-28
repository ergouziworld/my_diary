import { NextResponse } from "next/server";

function getProviderConfig() {
  const provider = process.env.AI_PROVIDER?.toLowerCase().trim();

  if (provider === "openai") {
    return {
      baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY?.trim() || "",
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
    };
  }

  if (provider === "qwen") {
    return {
      baseUrl: process.env.QWEN_BASE_URL?.trim() || "https://dashscope.aliyuncs.com/compatible-mode/v1",
      apiKey: process.env.QWEN_API_KEY?.trim() || "",
      model: process.env.QWEN_MODEL?.trim() || "qwen-plus"
    };
  }

  if (provider === "deepseek") {
    return {
      baseUrl: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API_KEY?.trim() || "",
      model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat"
    };
  }

  return null;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const question =
    typeof body === "object" && body !== null ? (body as { question?: unknown }).question : undefined;
  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ ok: false, error: "Field `question` is required." }, { status: 400 });
  }

  const config = getProviderConfig();

  if (!config) {
    return NextResponse.json({ ok: true, answer: "先说重点。（mock 模式）" });
  }

  if (!config.apiKey) {
    return NextResponse.json({ ok: false, error: "AI API key is not configured." }, { status: 500 });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content: "你是用户的私人 AI 助理。请用不超过 30 字简洁回答用户的问题，只输出答案本身，不要加任何解释或前缀。"
          },
          { role: "user", content: question.trim() }
        ],
        temperature: 0.7,
        max_tokens: 60
      })
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }

  if (!upstreamResponse.ok) {
    const detail = await upstreamResponse.text();
    return NextResponse.json(
      { ok: false, error: `AI request failed (${upstreamResponse.status}): ${detail}` },
      { status: 500 }
    );
  }

  const payload = (await upstreamResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const answer = payload.choices?.[0]?.message?.content?.trim() ?? "";
  return NextResponse.json({ ok: true, answer });
}
