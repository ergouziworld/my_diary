import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSmsCode } from "@/lib/sms";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json() as { phone?: string };

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 });
  }

  // 同一手机号 60 秒内只能发一次
  const recent = await prisma.smsCode.findFirst({
    where: {
      phone,
      createdAt: { gt: new Date(Date.now() - 60_000) },
    },
  });
  if (recent) {
    return NextResponse.json({ error: "发送太频繁，请稍后再试" }, { status: 429 });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60_000);

  await prisma.smsCode.create({ data: { phone, code, expiresAt } });

  try {
    await sendSmsCode(phone, code);
  } catch (err) {
    console.error("[send-sms] error:", err);
    return NextResponse.json({ error: "短信发送失败，请稍后重试" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
