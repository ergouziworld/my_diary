"use client";

import dynamic from "next/dynamic";
import type { MemoryWorldData } from "@/server/world";

const MemoryWorld = dynamic(
  () => import("@/components/world/MemoryWorld").then((module) => module.MemoryWorld),
  {
    ssr: false,
    loading: () => <MemoryWorldSkeleton />,
  },
);

function MemoryWorldSkeleton() {
  return (
    <div
      className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-white/10 bg-slate-950/70"
      role="status"
      aria-label="正在加载记忆世界"
    >
      <div className="space-y-3 text-center">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-accent-500/50" />
        <p className="text-sm text-slate-300">正在加载记忆世界…</p>
      </div>
    </div>
  );
}

export function MemoryWorldClient({ data }: { data: MemoryWorldData }) {
  return <MemoryWorld data={data} />;
}
