import { MetricCard } from "@/components/common/MetricCard";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";

const moods = [
  { label: "焦虑", value: "42%", hint: "上午和晚间更明显" },
  { label: "平静", value: "31%", hint: "写作和整理时上升" },
  { label: "专注", value: "19%", hint: "工作记录中占比更高" },
  { label: "兴奋", value: "8%", hint: "新想法出现时短暂抬升" },
];

const triggers = [
  "进度不确定",
  "任务堆积",
  "关系沟通压力",
  "睡眠不足",
  "时间碎片化",
];

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="情绪"
        description="看趋势、看触发原因、看人物关联，最终输出能解释而不是只有分数的情绪总结。"
      />

      <section className="grid gap-4 md:grid-cols-4">
        {moods.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="情绪波动分析" subtitle="情绪不是结论本身，而是理解生活状态的切口。">
          <div className="space-y-4">
            <div className="h-56 rounded-3xl border border-dashed border-cyan-400/30 bg-gradient-to-b from-cyan-400/10 to-transparent p-4">
              <div className="flex h-full items-end gap-3">
                {[24, 38, 20, 54, 44, 30, 48].map((value, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-2xl bg-cyan-400/70" style={{ height: `${value}%` }} />
                    <span className="text-xs text-slate-500">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-300">
              当前波动主要来自任务密度提升和晚间沟通压力。整体上，写作和结构化整理会显著降低焦虑感。
            </p>
          </div>
        </Panel>

        <Panel title="触发原因" subtitle="高频触发点与关联人物。">
          <div className="space-y-3">
            {triggers.map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm text-white">{item}</span>
                <Pill tone="warning">高频</Pill>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

