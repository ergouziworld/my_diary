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
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border-2 border-[#272332] bg-[#fffdf9] shadow-[10px_10px_0_#272332] md:grid-cols-[1.05fr_.95fr]">
        <aside className="manga-dots relative hidden min-h-[620px] overflow-hidden border-r-2 border-[#272332] p-10 md:flex md:flex-col md:justify-between">
          <span className="w-fit -rotate-2 border-2 border-[#272332] bg-[#fffdf9] px-3 py-1 text-xs font-black tracking-[.18em]">NEW CHAPTER</span>
          <div className="relative z-10"><p className="text-5xl font-black leading-[1.08] tracking-[-.06em] text-[#272332]">从今天开始，<br />把生活写成<br /><span className="text-[#c92f61]">自己的故事。</span></p><p className="mt-5 max-w-xs text-sm leading-6 text-[#564d58]">这里没有标准答案，只有真实发生过的每一天。</p></div>
          <div className="absolute -bottom-16 -right-12 h-64 w-64 rotate-12 rounded-[42%] border-2 border-[#272332] bg-[#f7d774]" />
        </aside>
        <form onSubmit={handleSubmit} className="w-full space-y-5 p-6 text-[#272332] sm:p-10 md:p-12">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[.18em] text-[#c92f61]">START HERE</p>
          <h1 className="text-3xl font-black tracking-[-.05em]">创建账号</h1>
          <p className="mt-2 text-sm text-[#766d73]">给你的日记取一个专属身份</p>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="font-medium text-[#4c444c]">昵称 <small className="font-normal text-[#9d9491]">（选填）</small></span>
          <input
            className="field-input"
            value={name}
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-medium text-[#4c444c]">用户名</span>
          <input
            className="field-input"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-medium text-[#4c444c]">密码 <small className="font-normal text-[#9d9491]">至少 6 位</small></span>
          <input
            className="field-input"
            type="password"
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>

        {error ? <p role="alert" className="rounded-xl bg-[#ffe1e8] px-3 py-2 text-sm text-[#a61f4a]">{error}</p> : null}

        <button
          className="tap-button w-full rounded-xl border-2 border-[#272332] bg-[#e34b78] px-4 py-2.5 font-bold text-white shadow-[4px_4px_0_#272332] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#272332] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "注册中..." : "注册"}
        </button>

        <p className="text-center text-sm text-[#766d73]">
          已有账号？{" "}
          <Link className="font-semibold text-[#c92f61] hover:underline" href="/login">
            去登录
          </Link>
        </p>
        </form>
      </div>
    </main>
  );
}
