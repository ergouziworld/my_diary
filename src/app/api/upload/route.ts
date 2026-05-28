import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getVisionConfig() {
  const provider = process.env.AI_PROVIDER?.toLowerCase().trim();
  if (provider === "qwen") {
    return {
      baseUrl: process.env.QWEN_BASE_URL?.trim() || "https://dashscope.aliyuncs.com/compatible-mode/v1",
      apiKey: process.env.QWEN_API_KEY?.trim() || "",
      model: "qwen-vl-plus"
    };
  }
  if (provider === "openai") {
    return {
      baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY?.trim() || "",
      model: "gpt-4o-mini"
    };
  }
  return null;
}

function getTextConfig() {
  const provider = process.env.AI_PROVIDER?.toLowerCase().trim();
  if (provider === "qwen") {
    return {
      baseUrl: process.env.QWEN_BASE_URL?.trim() || "https://dashscope.aliyuncs.com/compatible-mode/v1",
      apiKey: process.env.QWEN_API_KEY?.trim() || "",
      model: process.env.QWEN_MODEL?.trim() || "qwen-plus"
    };
  }
  if (provider === "openai") {
    return {
      baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY?.trim() || "",
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
    };
  }
  return null;
}

async function describeImage(base64: string, mimeType: string): Promise<string> {
  const config = getVisionConfig();
  if (!config?.apiKey) return "（图片）";

  try {
    const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: "text", text: "用一两句话描述这张图片的主要内容，中文回答，不超过50字。" }
          ]
        }],
        max_tokens: 100
      })
    });
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() ?? "（图片）";
  } catch {
    return "（图片）";
  }
}

async function summarizeText(text: string, filename: string): Promise<string> {
  const config = getTextConfig();
  if (!config?.apiKey) return `文档《${filename}》`;

  const snippet = text.slice(0, 2000);
  try {
    const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: "你是摘要助理，用不超过60字概括文档内容，只输出摘要本身。" },
          { role: "user", content: snippet }
        ],
        max_tokens: 120
      })
    });
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() ?? `文档《${filename}》`;
  } catch {
    return `文档《${filename}》`;
  }
}

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: "文件最大 10MB" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mimeType = file.type || "application/octet-stream";

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  const fileType = isImage ? "image" : "file";

  // 保存文件
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), buffer);
  const fileUrl = `/uploads/${safeName}`;

  // AI 描述
  let description = "";
  if (isImage) {
    description = await describeImage(buffer.toString("base64"), mimeType);
  } else if (isPdf) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const { text } = await pdfParse(buffer);
      description = await summarizeText(text, file.name);
    } catch {
      description = `PDF 文档《${file.name}》`;
    }
  } else {
    description = `文件《${file.name}》`;
  }

  // 存 Attachment 记录
  let attachmentId: string | null = null;
  try {
    const att = await prisma.attachment.create({
      data: { userId, fileUrl, fileType, mimeType, size: file.size }
    });
    attachmentId = att.id;
  } catch {
    // 忽略数据库错误，继续返回文件 URL
  }

  return NextResponse.json({ ok: true, data: { id: attachmentId, url: fileUrl, type: fileType, description, name: file.name } });
}
