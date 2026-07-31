"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type NavIconName } from "@/components/layout/NavIcon";

const links: ReadonlyArray<{ href: string; label: string; icon: NavIconName; primary?: boolean }> = [
  { href: "/record", label: "记录", icon: "write" },
  { href: "/tasks", label: "任务", icon: "tasks" },
  { href: "/", label: "今日", icon: "home", primary: true },
  { href: "/chat", label: "聊聊", icon: "chat" },
  { href: "/settings", label: "设置", icon: "settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 flex rounded-[1.35rem] border border-white/10 bg-[#171723]/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-md md:hidden">
      {links.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 text-[10px] transition ${item.primary ? "text-white" : active ? "text-accent-300" : "text-slate-500"}`}>
            <span className={item.primary ? "-mt-7 grid h-12 w-12 place-items-center rounded-2xl bg-accent-500 shadow-[3px_3px_0_#f9a8d4]" : ""}><NavIcon name={item.icon} className="h-5 w-5" /></span>
            <span className={item.primary ? "-mt-0.5" : ""}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
