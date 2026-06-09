import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WALLPAPER_DIR } from "@/lib/wallpapers";

export const runtime = "nodejs";

const MAX_SIZE = 50 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"]);

function cleanExt(fileName: string, mimeType: string) {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (ext) return ext;
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
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
  const ext = cleanExt(file.name, file.type);
  const looksLikeImage = file.type.startsWith("image/") || IMAGE_EXTENSIONS.has(ext);
  if (!looksLikeImage) {
    return NextResponse.json({ ok: false, error: "只支持图片文件" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: "图片最大 50MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "wallpapers");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), buffer);

  const fileUrl = `${WALLPAPER_DIR}${safeName}`;
  // 不挂 entryId：是孤立附件，不会出现在日记/相册里
  const attachment = await prisma.attachment.create({
    data: {
      userId,
      fileUrl,
      fileType: "image",
      mimeType: file.type || (ext === "png" ? "image/png" : "image/jpeg"),
      size: file.size
    }
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: attachment.id,
      url: fileUrl,
      mimeType: attachment.mimeType,
      size: attachment.size
    }
  });
}
