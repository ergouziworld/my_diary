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

const SYSTEM_PROMPT =
  "你是用户的私人 AI 助理，了解他的日记和生活记录。请认真、详细地回答用户的问题，回答长度和 ChatGPT 保持一致，需要多长就多长。";

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
    const encoder = new TextEncoder();
    return new Response(encoder.encode("先说重点。（mock 模式）"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: question.trim() }
        ],
        stream: true,
        temperature: 0.7
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

  const upstream = upstreamResponse.body;
  if (!upstream) {
    return NextResponse.json({ ok: false, error: "Empty upstream body." }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (typeof content === "string" && content.length > 0) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // 忽略无法解析的 SSE 行
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
        try {
          controller.close();
        } catch {
          // 已关闭则忽略
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
