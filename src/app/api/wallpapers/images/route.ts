import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { imageWallpaperValue, WALLPAPER_URL_PREFIX } from "@/lib/wallpapers";

export const runtime = "nodejs";

// 只返回壁纸专用图（按 /uploads/wallpaper- 文件名前缀隔离），不含日记/相册图片
export async function GET() {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const attachments = await prisma.attachment.findMany({
    where: { userId, fileUrl: { startsWith: WALLPAPER_URL_PREFIX } },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: { id: true, fileUrl: true, size: true, createdAt: true }
  });

  return NextResponse.json({
    ok: true,
    data: attachments.map((item) => ({
      id: item.id,
      url: item.fileUrl,
      size: item.size,
      createdAt: item.createdAt
    }))
  });
}

// 删除一张壁纸专用图：删附件 + 删磁盘文件 + 清掉指向它的页面壁纸设置
export async function DELETE(req: Request) {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "缺少 id" }, { status: 400 });

  const attachment = await prisma.attachment.findFirst({
    where: { id, userId, fileUrl: { startsWith: WALLPAPER_URL_PREFIX } },
    select: { id: true, fileUrl: true }
  });
  if (!attachment) {
    return NextResponse.json({ ok: false, error: "图片不存在" }, { status: 404 });
  }

  // 清掉所有用了这张图的页面壁纸设置，避免留下指向已删图的坏壁纸
  await prisma.pageWallpaper.deleteMany({
    where: { userId, value: imageWallpaperValue(attachment.fileUrl) }
  });
  await prisma.attachment.delete({ where: { id: attachment.id } });

  // 删磁盘文件（失败不影响接口成功——记录已删）。文件在扁平的 public/uploads/ 下
  try {
    const fileName = attachment.fileUrl.slice("/uploads/".length);
    if (fileName && !fileName.includes("..") && !fileName.includes("/")) {
      await unlink(path.join(process.cwd(), "public", "uploads", fileName));
    }
  } catch {
    /* 文件可能已不存在，忽略 */
  }

  return NextResponse.json({ ok: true });
}
