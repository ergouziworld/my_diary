import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

function resolveUploadPath(parts: string[]) {
  const fileName = parts.at(-1);
  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return null;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const fullPath = path.join(uploadDir, fileName);
  const relative = path.relative(uploadDir, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return fullPath;
}

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const fullPath = resolveUploadPath(parts);
  if (!fullPath) return new NextResponse("Not found", { status: 404 });

  try {
    const info = await stat(fullPath);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });

    const body = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    return new NextResponse(body, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
