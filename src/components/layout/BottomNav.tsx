"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const bottomLinks = [
  { href: "/", label: "首页", icon: "⊞" },
  { href: "/record", label: "记录", icon: "◉" },
  { href: "/tasks", label: "任务", icon: "☑" },
  { href: "/chat", label: "大 AI", icon: "✦" },
  { href: "/settings", label: "设置", icon: "⚙" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex transform-gpu border-t border-white/10 bg-slate-950 pb-[env(safe-area-inset-bottom)] md:hidden">
      {bottomLinks.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
              active ? "text-cyan-400" : "text-slate-400"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
