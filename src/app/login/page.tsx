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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-slate-950/55 p-6">
        <div>
          <h1 className="text-2xl font-semibold">登录</h1>
          <p className="mt-2 text-sm text-slate-400">进入你的 AI Diary</p>
        </div>

        <div className="flex rounded-xl border border-white/10 p-1 text-sm">
          <button
            type="button"
            onClick={() => { setTab("password"); setError(""); }}
            className={`flex-1 rounded-lg py-1.5 transition ${tab === "password" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
          >
            账号登录
          </button>
          <button
            type="button"
            onClick={() => { setTab("sms"); setError(""); }}
            className={`flex-1 rounded-lg py-1.5 transition ${tab === "sms" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
          >
            手机登录
          </button>
        </div>

        {tab === "password" ? (
          <>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">用户名</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-accent-500"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">密码</span>
              <input
                className="input-mask w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-accent-500"
                type="text"
                autoComplete="off"
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
              <span className="text-slate-300">手机号</span>
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-accent-500"
                type="tel"
                autoComplete="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">验证码</span>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-accent-500"
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
                  className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {countdown > 0 ? `${countdown}s` : codeSent ? "重新发送" : "发送验证码"}
                </button>
              </div>
            </label>
          </>
        )}

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          className="w-full rounded-xl bg-accent-500 px-4 py-2 font-semibold text-white transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "登录中..." : "登录"}
        </button>

        <p className="text-center text-sm text-slate-400">
          还没有账号？{" "}
          <Link className="text-accent-400 hover:text-accent-300" href="/register">
            注册
          </Link>
        </p>
      </form>
    </main>
  );
}
