export function AppHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
      <span className="text-xl font-black italic tracking-tight text-white">
        AI<span className="text-red-500"> DIARY</span>
      </span>
      <span className="hidden text-[11px] font-bold uppercase tracking-[0.25em] text-red-400/80 sm:inline">
        Ready to fight
      </span>
    </header>
  );
}
