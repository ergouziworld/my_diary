"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/layout/NavIcon";
import { sidebarLinks } from "@/components/layout/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#10101a]/95 p-4 text-sm backdrop-blur-md md:block">
      <Link href="/" className="mb-7 flex items-center gap-3 px-2 py-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent-500 font-black text-white shadow-[3px_3px_0_#f9a8d4]">M</span>
        <span><b className="block text-base tracking-[-0.03em] text-white">MORI 日记</b><small className="text-[11px] text-slate-500">把日子好好收起来</small></span>
      </Link>
      <nav className="space-y-1">
        {sidebarLinks.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 transition ${active ? "bg-accent-500 text-white shadow-[3px_3px_0_rgb(253_164_175_/_0.45)]" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}>
              <NavIcon name={item.icon} className="h-[18px] w-[18px]" /><span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <p className="absolute bottom-5 left-6 text-[10px] tracking-[0.18em] text-slate-600">MORI / YOUR DAYS</p>
    </aside>
  );
}
