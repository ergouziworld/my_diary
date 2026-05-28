"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
      redirect: false
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("邮箱或密码不正确");
      return;
    }

    window.location.href = result?.url ?? "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h1 className="text-2xl font-semibold">登录</h1>
          <p className="mt-2 text-sm text-slate-400">进入你的 AI Diary</p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">邮箱</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">密码</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          className="w-full rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "登录中..." : "登录"}
        </button>

        <p className="text-center text-sm text-slate-400">
          还没有账号？{" "}
          <Link className="text-cyan-300 hover:text-cyan-200" href="/register">
            注册
          </Link>
        </p>
      </form>
    </main>
  );
}
