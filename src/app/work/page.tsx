import { MetricCard } from "@/components/common/MetricCard";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";

const items = [
  { title: "项目推进", note: "当前阶段：架构与页面骨架", tag: "project" },
  { title: "学习记录", note: "当前阶段：AI 产品架构思考", tag: "study" },
  { title: "灵感记录", note: "当前阶段：提示词和检索设计", tag: "idea" },
  { title: "编程比赛", note: "当前阶段：可做为专项子项目", tag: "coding" },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="工作 / 学习"
        description="把项目、学习、灵感、课程和比赛统一纳入一个工作记忆层，方便阶段总结。"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="项目数" value="4" hint="可沉淀为阶段性目标" />
        <MetricCard label="学习条目" value="18" hint="支持课程与笔记合并" />
        <MetricCard label="灵感条目" value="9" hint="自动提炼可执行点" />
        <MetricCard label="阶段总结" value="1 份" hint="可按周 / 月生成" />
      </div>

      <Panel title="内容分区" subtitle="工作、学习和灵感先分区，再在 AI 层做汇总。">
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-white">{item.title}</h3>
                <Pill tone="accent">{item.tag}</Pill>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.note}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

