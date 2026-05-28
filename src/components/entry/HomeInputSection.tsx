"use client";

import { useRef, useState } from "react";
import { RichInputBox } from "./RichInputBox";

export function HomeInputSection() {
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleFocusChange(v: boolean) {
    setFocused(v);
    if (v) {
      // 等键盘弹起动画完成后，让容器顶部对齐视口顶部
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 300);
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col rounded-[2rem] border border-cyan-400/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(34,211,238,0.09),_transparent_55%),linear-gradient(180deg,_rgba(2,6,23,0.97),_rgba(15,23,42,0.92))] p-6 shadow-[0_0_60px_rgba(34,211,238,0.06),inset_0_1px_0_rgba(255,255,255,0.05)] transition-[min-height] duration-300 ease-in-out"
      style={{ minHeight: focused ? "30vh" : "calc(100svh - 8rem)" }}
    >
      <div
        className={`shrink-0 overflow-hidden transition-all duration-300 ${
          focused ? "max-h-0 opacity-0 mb-0" : "max-h-20 opacity-100 mb-4"
        }`}
      >
        <h2 className="text-2xl font-semibold text-white">今天</h2>
        <p className="mt-0.5 text-sm text-slate-500">支持图片 · 文档 · 链接</p>
      </div>
      <RichInputBox onFocusChange={handleFocusChange} />
    </div>
  );
}
