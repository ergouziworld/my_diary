"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(result?.error ?? "注册失败");
      return;
    }

    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-slate-950/55 p-6">
        <div>
          <h1 className="text-2xl font-semibold">注册</h1>
          <p className="mt-2 text-sm text-slate-400">创建你的 AI Diary 账号</p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">昵称</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-accent-500"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">用户名</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-accent-500"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
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
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          className="w-full rounded-xl bg-accent-500 px-4 py-2 font-semibold text-white transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "注册中..." : "注册"}
        </button>

        <p className="text-center text-sm text-slate-400">
          已有账号？{" "}
          <Link className="text-accent-400 hover:text-accent-300" href="/login">
            去登录
          </Link>
        </p>
      </form>
    </main>
  );
}
