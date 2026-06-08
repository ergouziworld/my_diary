import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_WALLPAPER, getWallpaperImageUrl, WALLPAPERS } from "@/lib/wallpapers";

export const runtime = "nodejs";

const PRESET_KEYS = new Set(WALLPAPERS.map((wallpaper) => wallpaper.key));

function isValidPath(path: unknown): path is string {
  return typeof path === "string" && path.startsWith("/") && path.length <= 200;
}

function isValidWallpaperValue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (PRESET_KEYS.has(value as typeof DEFAULT_WALLPAPER)) return true;
  return Boolean(getWallpaperImageUrl(value));
}

export async function GET() {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.pageWallpaper.findMany({
    where: { userId },
    select: { path: true, value: true }
  });

  return NextResponse.json({
    ok: true,
    data: Object.fromEntries(settings.map((item) => [item.path, item.value]))
  });
}

export async function PUT(req: Request) {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as { path?: unknown; value?: unknown };
  if (!isValidPath(payload.path)) {
    return NextResponse.json({ ok: false, error: "Invalid path" }, { status: 400 });
  }

  if (payload.value === null || payload.value === DEFAULT_WALLPAPER) {
    await prisma.pageWallpaper.deleteMany({ where: { userId, path: payload.path } });
    return NextResponse.json({ ok: true });
  }

  if (!isValidWallpaperValue(payload.value)) {
    return NextResponse.json({ ok: false, error: "Invalid wallpaper" }, { status: 400 });
  }

  await prisma.pageWallpaper.upsert({
    where: { userId_path: { userId, path: payload.path } },
    update: { value: payload.value },
    create: { userId, path: payload.path, value: payload.value }
  });

  return NextResponse.json({ ok: true });
}
