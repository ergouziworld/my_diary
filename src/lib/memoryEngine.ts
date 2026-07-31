import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

const MEMORY_ENGINE_URL = (process.env.MEMORY_ENGINE_CONSOLE_URL ?? "http://127.0.0.1:8780").replace(/\/$/, "");
// The production account is the existing `bocchi` user. Keep the ID fallback
// closed by default; deployments can override it with an environment variable.
const ALLOWED_USER_ID = process.env.MEMORY_IDE_ALLOWED_USER_ID?.trim() || "cmqac60ki0000nw0g1x9dttg4";

export async function assertMemoryEngineAccess() {
  const userId = await getUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, phone: true } });
  if (!user) throw new Error("Unauthorized");

  if (user.id !== ALLOWED_USER_ID) throw new Error("Memory IDE is restricted to the bound account");
  return user;
}

export async function memoryEngineFetch(path: string, init?: RequestInit) {
  return fetch(`${MEMORY_ENGINE_URL}${path}`, { ...init, cache: "no-store" });
}
