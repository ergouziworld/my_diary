import { Panel } from "@/components/common/Panel";

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 md:p-8">
        <div className="max-w-4xl space-y-4">
          <SkeletonLine className="h-6 w-28" />
          <SkeletonLine className="h-10 w-3/4" />
          <SkeletonLine className="h-5 w-full" />
          <SkeletonLine className="h-5 w-2/3" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="h-24 rounded-3xl bg-white/5 animate-pulse" />
        <div className="h-24 rounded-3xl bg-white/5 animate-pulse" />
        <div className="h-24 rounded-3xl bg-white/5 animate-pulse" />
        <div className="h-24 rounded-3xl bg-white/5 animate-pulse" />
      </section>

      <Panel title="加载中" subtitle="正在准备页面数据">
        <div className="space-y-3">
          <SkeletonLine className="h-12 w-full" />
          <SkeletonLine className="h-12 w-5/6" />
          <SkeletonLine className="h-12 w-4/6" />
        </div>
      </Panel>
    </div>
  );
}
