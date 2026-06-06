"use client";

import { signOut } from "next-auth/react";
import { ThemeSwitcher } from "@/components/settings/ThemeSwitcher";
import { WallpaperSwitcher } from "@/components/settings/WallpaperSwitcher";

export default function Page() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">设置</h1>
        <p className="mt-1 text-slate-400">管理 AI 提供商、存储、同步和个人偏好。</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-slate-300">皮肤</h2>
        <p className="mt-1 text-xs text-slate-500">切换全站配色，立即生效。</p>
        <div className="mt-4">
          <ThemeSwitcher />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-slate-300">Wallpaper</h2>
        <p className="mt-1 text-xs text-slate-500">Choose a different background for each page.</p>
        <div className="mt-4">
          <WallpaperSwitcher />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-medium text-slate-300">账号</h2>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-400/20"
          >
            退出登录
          </button>
        </div>
      </div>
    </section>
  );
}
