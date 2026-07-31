export function AppHeader() {
  const date = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date());
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#10101a]/90 px-4 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        <div className="md:hidden"><b className="tracking-[-0.04em] text-white">MORI</b><span className="ml-1 text-accent-300">日记</span></div>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-white">今天也值得被记住</p>
          <p className="mt-0.5 text-xs text-slate-400">{date}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />已同步
        </div>
      </div>
    </header>
  );
}
