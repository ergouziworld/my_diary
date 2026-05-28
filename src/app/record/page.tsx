import Link from "next/link";

const modules = [
  {
    href: "/mood",
    icon: "◉",
    label: "情绪",
    description: "AI 提取的情绪记录与强度分析",
    accent: "border-purple-400/30 hover:border-purple-400/50 hover:bg-purple-400/5",
    iconColor: "text-purple-300",
  },
  {
    href: "/finance",
    icon: "◈",
    label: "收支",
    description: "从日记自动提取的收入与支出",
    accent: "border-emerald-400/30 hover:border-emerald-400/50 hover:bg-emerald-400/5",
    iconColor: "text-emerald-300",
  },
  {
    href: "/album",
    icon: "◻",
    label: "相册",
    description: "图片与视觉记忆整理",
    accent: "border-amber-400/30 hover:border-amber-400/50 hover:bg-amber-400/5",
    iconColor: "text-amber-300",
  },
  {
    href: "/work",
    icon: "◆",
    label: "工作学习",
    description: "项目、任务与学习记录",
    accent: "border-blue-400/30 hover:border-blue-400/50 hover:bg-blue-400/5",
    iconColor: "text-blue-300",
  },
];

export default function RecordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">记录</h1>
        <p className="mt-1 text-sm text-slate-400">按类型查看从日记中提取的结构化数据。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`group rounded-3xl border bg-white/5 p-6 transition ${m.accent}`}
          >
            <span className={`text-3xl leading-none ${m.iconColor}`}>{m.icon}</span>
            <h2 className="mt-4 text-lg font-semibold text-white">{m.label}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">{m.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
