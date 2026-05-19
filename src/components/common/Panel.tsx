type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, subtitle, children, className = "" }: PanelProps) {
  return (
    <section className={`rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.2)] ${className}`}>
      <div className="mb-4 space-y-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

