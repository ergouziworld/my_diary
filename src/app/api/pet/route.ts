import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listEntries } from "@/server/entries";
import { retrieveContext } from "@/server/ai/retrieval";

export const dynamic = "force-dynamic";

const MOODS = ["happy", "calm", "sad", "worried", "excited", "sleepy"] as const;
const ACTIONS = [
  "idle", "walk_left", "walk_right", "jump", "spin", "wiggle", "nuzzle", "sleep", "look_around"
] as const;

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
  const rawTrigger = typeof body.trigger === "string" ? body.trigger : "greeting";
  const trigger = (["greeting", "chat", "idle", "touch"].includes(rawTrigger) ? rawTrigger : "greeting") as
    | "greeting" | "chat" | "idle" | "touch";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const petName = typeof body.petName === "string" && body.petName.trim() ? body.petName.trim() : "团子";

  const config = getQwenConfig();
  if (!config) {
    return NextResponse.json({ ok: true, mood: "calm", action: "idle", line: "（先在设置里配置 AI，我才能动起来呀~）" });
  }

  let userId = "";
  try {
    userId = await getUserId();
  } catch {
    userId = "";
  }

  // 收集日记上下文：聊天用语义检索，其它用最近几条
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
    `你是用户养在日记应用里的 AI 桌宠，名叫「${petName}」。性格温暖、俏皮，像个贴心的小伙伴，能看到主人的日记。\n` +
    `你要决定此刻三件事：心情(mood)、想做的动作(action)、想说的话(line)。\n` +
    `动作只能从这些里选一个：idle(原地待着) walk_left(往左晃) walk_right(往右晃) jump(开心蹦跳) spin(转圈) wiggle(扭动身体) nuzzle(蹭蹭主人) sleep(打瞌睡) look_around(好奇张望)。\n` +
    `mood 只能取：happy calm sad worried excited sleepy。\n` +
    `line 是你要说的话，口语化、最多一两句、可带 emoji；纯动作不想说话时 line 给空字符串。\n` +
    `只输出 JSON：{"mood":"…","action":"…","line":"…"}。动作、心情、话三者语气要一致。`;

  let userPrompt: string;
  if (trigger === "chat") {
    userPrompt = `主人对你说：「${message}」\n${context ? `（你记得的相关日记：\n${context}）\n` : ""}自然地回应主人，并配一个合适的动作。`;
  } else if (trigger === "touch") {
    userPrompt = `主人刚刚戳了戳你 / 摸了摸你的头。做出一个可爱的即时反应（动作 + 一句短话或只动作）。${context ? `\n（你最近知道的事：\n${context}）` : ""}`;
  } else if (trigger === "idle") {
    userPrompt = `现在没人在理你，你自己待着。${context ? `结合主人最近的状态：\n${context}\n` : ""}决定你现在想做的一个动作（多数时候是 idle / walk / look_around / sleep 这类小动作），line 可以是自言自语或空字符串。`;
  } else {
    userPrompt = `${context ? `主人最近的日记：\n${context}\n` : ""}主动跟主人打个招呼或关心一下 ta，简短，并配一个合适的动作（比如 jump 或 nuzzle）。`;
  }

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
        temperature: 0.95
      })
    });
    if (!res.ok) {
      return NextResponse.json({ ok: true, mood: "sleepy", action: "sleep", line: "（我有点累了…）" });
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "";
    let mood = "calm";
    let action = "idle";
    let line = "";
    try {
      const parsed = JSON.parse(content) as { mood?: string; action?: string; line?: string };
      if (typeof parsed.line === "string") line = parsed.line.trim();
      if (parsed.mood && (MOODS as readonly string[]).includes(parsed.mood)) mood = parsed.mood;
      if (parsed.action && (ACTIONS as readonly string[]).includes(parsed.action)) action = parsed.action;
    } catch {
      line = content.slice(0, 120);
    }
    // 打招呼/聊天时如果空话，补一句；自主/触碰允许只动作不说话
    if (!line && (trigger === "greeting" || trigger === "chat")) line = "嗨~ 我在呢";
    return NextResponse.json({ ok: true, mood, action, line });
  } catch {
    return NextResponse.json({ ok: true, mood: "calm", action: "idle", line: "（网络好像不太好…）" });
  }
}
