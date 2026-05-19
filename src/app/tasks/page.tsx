import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";

const tasks = [
  { title: "把 schema 迁移到第二大脑版本", due: "今天", priority: "高", status: "进行中" },
  { title: "补齐大 AI 页面布局", due: "明天", priority: "中", status: "待办" },
  { title: "整理 prompt registry", due: "本周", priority: "高", status: "待办" },
  { title: "验证时间线聚合逻辑", due: "本周", priority: "中", status: "待办" },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="任务"
        description="AI 自动提取任务、补截止时间和优先级，再把任务和来源记录建立关联。"
        action={<button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">AI 自动规划</button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="今日待办" subtitle="任务先进入事实层，再进入看板层。">
          <div className="space-y-3">
            {tasks.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-white">{item.title}</h3>
                  <div className="flex gap-2">
                    <Pill tone={item.priority === "高" ? "warning" : "neutral"}>{item.priority}</Pill>
                    <Pill tone={item.status === "进行中" ? "accent" : "neutral"}>{item.status}</Pill>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-400">截止：{item.due}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI 规划" subtitle="把任务按紧急度、依赖关系和能量成本做简单排序。">
          <div className="space-y-4 text-sm leading-6 text-slate-300">
            <p>1. 先处理会阻塞后续开发的 schema 和页面骨架收口。</p>
            <p>2. 再补齐首页、时间线、情绪、任务和大 AI 的最小交互。</p>
            <p>3. 最后接入真实分析、检索和文件存储。</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

