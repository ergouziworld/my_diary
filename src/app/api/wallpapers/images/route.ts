import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
      select: {
        id: true,
        fileUrl: true,
        mimeType: true,
        size: true,
        createdAt: true
      }
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
        attachment: { select: { mimeType: true, size: true } }
      }
    })
  ]);

  const byUrl = new Map<
    string,
    { id: string; url: string; mimeType?: string; size?: number | null; createdAt: Date }
  >();

  for (const item of albumItems) {
    if (!item.mediaUrl) continue;
    byUrl.set(item.mediaUrl, {
      id: `album:${item.id}`,
      url: item.mediaUrl,
      mimeType: item.attachment?.mimeType,
      size: item.attachment?.size,
      createdAt: item.createdAt
    });
  }

  for (const item of attachments) {
    if (!item.fileUrl || byUrl.has(item.fileUrl)) continue;
    byUrl.set(item.fileUrl, {
      id: item.id,
      url: item.fileUrl,
      mimeType: item.mimeType,
      size: item.size,
      createdAt: item.createdAt
    });
  }

  return NextResponse.json({
    ok: true,
    data: Array.from(byUrl.values()).slice(0, 80).map((item) => ({
      id: item.id,
      url: item.url,
      mimeType: item.mimeType,
      size: item.size,
      createdAt: item.createdAt
    }))
  });
}
