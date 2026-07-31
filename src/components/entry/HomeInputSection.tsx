"use client";

import { RichInputBox } from "./RichInputBox";

export function HomeInputSection() {
  return (
    <div className="relative flex h-[28rem] flex-col overflow-hidden overflow-anchor-none rounded-[1.6rem] border border-white/10 bg-[#171723]/95 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.2)] sm:h-[30rem] sm:p-6">
      <span className="absolute right-5 top-4 -rotate-3 rounded-md bg-[#f7d774] px-2 py-1 text-[10px] font-bold tracking-wider text-[#403713]">TODAY</span>
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-bold tracking-[-0.03em] text-white sm:text-2xl">今天想记点什么？</h2>
        <p className="mt-1 text-sm text-slate-500">文字、图片或一段突然冒出的想法</p>
      </div>
      <RichInputBox />
    </div>
  );
}
