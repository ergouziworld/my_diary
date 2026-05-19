type PillProps = {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warning" | "accent";
};

const toneClasses = {
  neutral: "border-white/10 bg-white/5 text-slate-300",
  good: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  accent: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
};

export function Pill({ children, tone = "neutral" }: PillProps) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${toneClasses[tone]}`}>{children}</span>;
}

