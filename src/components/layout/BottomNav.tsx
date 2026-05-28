"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const bottomLinks = [
  { href: "/", label: "首页", icon: "⊞" },
  { href: "/timeline", label: "时间线", icon: "◎" },
  { href: "/chat", label: "大 AI", icon: "✦" },
  { href: "/tasks", label: "任务", icon: "☑" },
  { href: "/settings", label: "设置", icon: "⚙" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-slate-950 md:hidden">
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
