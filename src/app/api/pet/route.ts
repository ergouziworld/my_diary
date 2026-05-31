import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listEntries } from "@/server/entries";
import { retrieveContext } from "@/server/ai/retrieval";

export const dynamic = "force-dynamic";

const MOODS = ["happy", "calm", "sad", "worried", "excited", "sleepy"] as const;

function getQwenConfig() {
  const apiKey = process.env.QWEN_API_KEY?.trim() || process.env.DASHSCOPE_API_KEY?.trim() || "";
  if (!apiKey) return null;
  return {
    baseUrl: (process.env.QWEN_BASE_URL?.trim() || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, ""),
    apiKey,
    model: process.env.QWEN_MODEL?.trim() || "qwen-plus"
  };
}

export async function POST(req: Request) {
  let body: { trigger?: unknown; message?: unknown; petName?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const trigger = body.trigger === "chat" ? "chat" : "greeting";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const petName = typeof body.petName === "string" && body.petName.trim() ? body.petName.trim() : "团子";

  const config = getQwenConfig();
  if (!config) {
    return NextResponse.json({ ok: true, mood: "calm", line: "（先在设置里配置 AI，我才能开口陪你呀~）" });
  }

  let userId = "";
  try {
    userId = await getUserId();
  } catch {
    userId = "";
  }

  // 收集日记上下文：聊天用语义检索，打招呼用最近几条
  let context = "";
  try {
    if (trigger === "chat" && message && userId) {
      const { contextText } = await retrieveContext(userId, message, 5);
      context = contextText;
    } else if (userId) {
      const entries = await listEntries();
      context = entries
        .slice(0, 3)
        .map((e) => {
          const emo = e.entryEmotions.map((x) => x.name).join("、");
          const text = e.entryAnalysis?.summary ?? e.rawContent ?? "";
          return `(${e.createdAt.toLocaleDateString("zh-CN")}) ${text}${emo ? ` [情绪：${emo}]` : ""}`;
        })
        .join("\n");
    }
  } catch {
    context = "";
  }

  const system =
    `你是用户养在日记应用里的 AI 桌宠，名叫「${petName}」。性格温暖、俏皮，像个贴心的小伙伴。` +
    `你能看到主人的日记，所以说话要自然地结合 ta 最近的生活和心情，但不要照搬原文、不要长篇大论。` +
    `每次只说一两句口语化的话，像宠物对主人撒娇、关心或打趣，可以带点 emoji。` +
    `只输出 JSON：{"mood": 取值之一[happy, calm, sad, worried, excited, sleepy], "line": "你要说的一两句话"}。` +
    `mood 表示你此刻的表情情绪，要和 line 的语气一致。`;

  const userPrompt =
    trigger === "chat"
      ? `主人对你说：「${message}」\n${context ? `（你记得的相关日记：\n${context}）\n` : ""}请自然地回应主人。`
      : `${context ? `主人最近的日记：\n${context}\n` : ""}请主动跟主人打个招呼或关心一下 ta，结合最近的情况，简短一点。`;

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.9
      })
    });
    if (!res.ok) {
      return NextResponse.json({ ok: true, mood: "sleepy", line: "（我有点累了，待会儿再陪你聊~）" });
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "";
    let mood: string = "calm";
    let line = "";
    try {
      const parsed = JSON.parse(content) as { mood?: string; line?: string };
      if (typeof parsed.line === "string") line = parsed.line.trim();
      if (parsed.mood && (MOODS as readonly string[]).includes(parsed.mood)) mood = parsed.mood;
    } catch {
      line = content.slice(0, 120);
    }
    if (!line) line = "嗨~ 我在呢";
    return NextResponse.json({ ok: true, mood, line });
  } catch {
    return NextResponse.json({ ok: true, mood: "calm", line: "（网络好像不太好…）" });
  }
}
