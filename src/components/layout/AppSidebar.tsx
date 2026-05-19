const links = ["/", "/timeline", "/mood", "/tasks", "/finance", "/album", "/work", "/chat", "/settings"];

export function AppSidebar() {
  return (
    <aside className="w-60 border-r border-white/10 p-4 text-sm text-slate-300">
      <div className="mb-6 text-lg font-semibold text-white">My Diary</div>
      <nav className="space-y-2">
        {links.map((href) => (
          <a key={href} href={href} className="block rounded-lg px-3 py-2 hover:bg-white/5">{href}</a>
        ))}
      </nav>
    </aside>
  );
}
