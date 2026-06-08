import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type WallpaperImage = {
  id: string;
  url: string;
  title: string | null;
  size: number | null;
  createdAt: string;
};

export async function GET() {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [attachments, albumItems] = await Promise.all([
    prisma.attachment.findMany({
      where: {
        userId,
        OR: [{ fileType: "image" }, { mimeType: { startsWith: "image/" } }]
      },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: { id: true, fileUrl: true, size: true, createdAt: true }
    }),
    prisma.albumItem.findMany({
      where: { userId, mediaType: "image" },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        mediaUrl: true,
        title: true,
        createdAt: true,
        attachment: { select: { size: true } }
      }
    })
  ]);

  const byUrl = new Map<string, WallpaperImage>();

  for (const item of albumItems) {
    if (!item.mediaUrl) continue;
    byUrl.set(item.mediaUrl, {
      id: `album:${item.id}`,
      url: item.mediaUrl,
      title: item.title,
      size: item.attachment?.size ?? null,
      createdAt: item.createdAt.toISOString()
    });
  }

  for (const item of attachments) {
    if (!item.fileUrl || byUrl.has(item.fileUrl)) continue;
    byUrl.set(item.fileUrl, {
      id: `attachment:${item.id}`,
      url: item.fileUrl,
      title: null,
      size: item.size,
      createdAt: item.createdAt.toISOString()
    });
  }

  return NextResponse.json({ ok: true, images: Array.from(byUrl.values()).slice(0, 80) });
}
