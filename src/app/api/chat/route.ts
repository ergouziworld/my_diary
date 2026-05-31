import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { retrieveContext } from "@/server/ai/retrieval";

export const dynamic = "force-dynamic";

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
  "你是用户的私人 AI 助理，可以访问从他的日记中检索出的相关片段。" +
  "回答时请优先依据这些片段，引用时自然地带上日期（例如「你在 6 月 3 日写到…」），让用户感到你真的读过他的记录。" +
  "如果检索到的片段不足以回答，就如实说明你在记录里没找到相关内容，再给出一般性建议，不要编造日记里没有的事实。" +
  "请认真、详细地回答，回答长度和 ChatGPT 保持一致，需要多长就多长。";

function buildContextMessage(contextText: string) {
  return (
    "以下是从用户日记中检索到的、与当前问题最相关的片段（按相关度排序）。" +
    "请把它们当作回答的主要依据：\n\n" +
    contextText
  );
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
    const encoder = new TextEncoder();
    return new Response(encoder.encode("先说重点。（mock 模式）"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  if (!config.apiKey) {
    return NextResponse.json({ ok: false, error: "AI API key is not configured." }, { status: 500 });
  }

  // 检索用户日记里与问题相关的片段，拼进上下文。失败不阻断对话。
  let contextText = "";
  try {
    const userId = await getUserId();
    const retrieval = await retrieveContext(userId, question.trim());
    contextText = retrieval.contextText;
  } catch {
    contextText = "";
  }

  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT }
  ];
  if (contextText) {
    messages.push({ role: "system", content: buildContextMessage(contextText) });
  }
  messages.push({ role: "user", content: question.trim() });

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
        messages,
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
