"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

type Tab = "password" | "sms";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("password");

  // 密码登录
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // 短信登录
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startCountdown() {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendCode() {
    setError("");
    const res = await fetch("/api/auth/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "发送失败");
      return;
    }
    setCodeSent(true);
    startCountdown();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    let result;
    if (tab === "password") {
      result = await signIn("credentials", { username, password, callbackUrl: "/", redirect: false });
    } else {
      result = await signIn("sms", { phone, code, callbackUrl: "/", redirect: false });
    }

    setIsSubmitting(false);

    if (result?.error) {
      setError(tab === "password" ? "用户名或密码不正确" : "验证码错误或已过期");
      return;
    }

    window.location.href = result?.url ?? "/";
  }

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border-2 border-[#272332] bg-[#fffdf9] shadow-[10px_10px_0_#272332] md:grid-cols-[1.05fr_.95fr]">
        <aside className="manga-dots relative hidden min-h-[620px] overflow-hidden border-r-2 border-[#272332] p-10 md:flex md:flex-col md:justify-between">
          <div><span className="inline-block -rotate-2 border-2 border-[#272332] bg-[#fffdf9] px-3 py-1 text-xs font-black tracking-[.18em]">MORI DIARY</span></div>
          <div className="relative z-10">
            <p className="text-5xl font-black leading-[1.08] tracking-[-.06em] text-[#272332]">欢迎回来，<br />继续写你的<br /><span className="text-[#c92f61]">今日篇章。</span></p>
            <p className="mt-5 max-w-xs text-sm leading-6 text-[#564d58]">不用写得完整。一个瞬间、一句话，也足够成为今天的坐标。</p>
          </div>
          <div className="absolute -bottom-16 -right-12 h-64 w-64 rotate-12 rounded-[42%] border-2 border-[#272332] bg-[#f7d774]" />
        </aside>
        <form onSubmit={handleSubmit} className="w-full space-y-5 p-6 text-[#272332] sm:p-10 md:p-12">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[.18em] text-[#c92f61]">WELCOME BACK</p>
          <h1 className="text-3xl font-black tracking-[-.05em]">登录</h1>
          <p className="mt-2 text-sm text-[#766d73]">回到只属于你的日记空间</p>
        </div>

        <div className="flex rounded-xl bg-[#eee8e3] p-1 text-sm">
          <button
            type="button"
            onClick={() => { setTab("password"); setError(""); }}
            className={`tap-button flex-1 rounded-lg px-3 py-2 transition ${tab === "password" ? "bg-[#272332] text-white" : "text-[#766d73] hover:text-[#272332]"}`}
          >
            账号登录
          </button>
          <button
            type="button"
            onClick={() => { setTab("sms"); setError(""); }}
            className={`tap-button flex-1 rounded-lg px-3 py-2 transition ${tab === "sms" ? "bg-[#272332] text-white" : "text-[#766d73] hover:text-[#272332]"}`}
          >
            手机登录
          </button>
        </div>

        {tab === "password" ? (
          <>
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[#4c444c]">用户名</span>
              <input
                className="field-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[#4c444c]">密码</span>
              <input
                className="field-input"
                type="password"
                autoComplete="current-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </>
        ) : (
          <>
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[#4c444c]">手机号</span>
              <input
                className="field-input"
                type="tel"
                autoComplete="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[#4c444c]">验证码</span>
              <div className="flex gap-2">
                <input
                  className="field-input"
                  type="text"
                  autoComplete="one-time-code"
                  placeholder="6位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || !phone}
                  className="tap-button shrink-0 rounded-xl border border-[#c9c0bd] px-3 py-2 text-sm text-[#4c444c] transition hover:bg-[#eee8e3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {countdown > 0 ? `${countdown}s` : codeSent ? "重新发送" : "发送验证码"}
                </button>
              </div>
            </label>
          </>
        )}

        {error ? <p role="alert" className="rounded-xl bg-[#ffe1e8] px-3 py-2 text-sm text-[#a61f4a]">{error}</p> : null}

        <button
          className="tap-button w-full rounded-xl border-2 border-[#272332] bg-[#e34b78] px-4 py-2.5 font-bold text-white shadow-[4px_4px_0_#272332] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#272332] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "登录中..." : "登录"}
        </button>

        <p className="text-center text-sm text-[#766d73]">
          还没有账号？{" "}
          <Link className="font-semibold text-[#c92f61] hover:underline" href="/register">
            注册
          </Link>
        </p>
        </form>
      </div>
    </main>
  );
}
