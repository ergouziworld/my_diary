"use client";

import { RichInputBox } from "./RichInputBox";

export function HomeInputSection() {
  return (
    <div className="flex h-[32rem] flex-col overflow-anchor-none rounded-[2rem] border border-red-500/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(239,68,68,0.09),_transparent_55%),linear-gradient(180deg,_rgba(2,6,23,0.97),_rgba(15,23,42,0.92))] p-6 shadow-[0_0_60px_rgba(239,68,68,0.06),inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="mb-4 shrink-0">
        <h2 className="text-2xl font-semibold text-white">今天</h2>
        <p className="mt-0.5 text-sm text-slate-500">支持图片 · 文档 · 链接</p>
      </div>
      <RichInputBox />
    </div>
  );
}
