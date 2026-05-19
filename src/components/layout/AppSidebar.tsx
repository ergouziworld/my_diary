import Link from "next/link";
import { sidebarLinks } from "@/components/layout/navigation";

export function AppSidebar() {
  return (
    <aside className="w-60 border-r border-white/10 p-4 text-sm text-slate-300">
      <div className="mb-6 text-lg font-semibold text-white">My Diary</div>
      <nav className="space-y-2">
        {sidebarLinks.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 hover:bg-white/5">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
