import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ ok: false, error: "Email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: name || null,
      email,
      password: passwordHash
    }
  });

  return NextResponse.json({ ok: true });
}
