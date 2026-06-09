"use client";

import { useEffect, useState } from "react";

type ThemeKey = "hot" | "calm";

const THEMES: { key: ThemeKey; label: string; desc: string; swatch: string[] }[] = [
  { key: "hot", label: "热血红", desc: "黑 · 红 · 白，运动热血感", swatch: ["#ef4444", "#dc2626", "#fca5a5"] },
  { key: "calm", label: "冷静青", desc: "深色 · 科技冷感（原版）", swatch: ["#22d3ee", "#06b6d4", "#67e8f9"] }
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeKey>("hot");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "hot" || saved === "calm") setTheme(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function apply(t: ThemeKey) {
    setTheme(t);
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.theme = t;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {THEMES.map((t) => {
        const active = theme === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => apply(t.key)}
            className={`rounded-2xl border p-4 text-left transition ${
              active ? "border-accent-500 bg-accent-500/10" : "border-white/10 bg-slate-950/55 hover:border-white/20"
            }`}
          >
            <div className="mb-3 flex gap-1.5">
              {t.swatch.map((c) => (
                <span key={c} className="h-5 w-5 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{t.label}</span>
              {active && <span className="text-xs text-accent-400">✓ 当前</span>}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">{t.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
