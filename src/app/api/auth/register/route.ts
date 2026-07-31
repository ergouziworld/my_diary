import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: { name?: unknown; username?: unknown; email?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const usernameSource = typeof body.username === "string" ? body.username : body.email;
  const username = typeof usernameSource === "string" ? usernameSource.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ ok: false, error: "用户名和密码不能为空。" }, { status: 400 });
  }

  if (username.length > 64) {
    return NextResponse.json({ ok: false, error: "用户名不能超过 64 个字符。" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: "密码至少需要 6 位。" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: username } });
  if (existingUser) {
    return NextResponse.json({ ok: false, error: "用户名已存在。" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: name || null,
      email: username,
      password: passwordHash
    }
  });

  return NextResponse.json({ ok: true });
}
