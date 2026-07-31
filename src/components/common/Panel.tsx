type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, subtitle, children, className = "" }: PanelProps) {
  return (
    <section className={`rounded-[1.4rem] border border-white/10 bg-[#171723]/90 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.18)] ${className}`}>
      <div className="mb-4 space-y-1">
        <h3 className="text-base font-bold tracking-[-0.02em] text-white">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

