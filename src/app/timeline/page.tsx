import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";

const filters = ["全部", "情绪", "工作", "学习", "人际", "项目"];
const timeline = [
  { time: "08:20", title: "晨间整理", tag: "情绪", text: "醒来后记录了对今天工作的焦虑和预期。", tone: "warning" as const },
  { time: "11:10", title: "架构更新", tag: "工作", text: "重新整理了 AI 日记的架构文档和数据边界。", tone: "accent" as const },
  { time: "15:40", title: "课程笔记", tag: "学习", text: "补了一份课程总结，并拆成三条待办任务。", tone: "good" as const },
  { time: "21:00", title: "晚间复盘", tag: "人际", text: "和朋友的聊天触发了对未来规划的反思。", tone: "warning" as const },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="时间线"
        description="按时间展示所有记录，支持按情绪、工作、学习、人际、项目筛选，并自动汇总今日总结。"
        action={<button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">生成今日总结</button>}
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((item, index) => (
          <Pill key={item} tone={index === 0 ? "accent" : "neutral"}>
            {item}
          </Pill>
        ))}
      </div>

      <Panel title="今日时间线" subtitle="把零散片段组织成可以回顾的事件流。">
        <div className="space-y-4">
          {timeline.map((item) => (
            <div key={item.time} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[96px_1fr]">
              <div className="text-sm font-medium text-slate-300">{item.time}</div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-white">{item.title}</h3>
                  <Pill tone={item.tone}>{item.tag}</Pill>
                </div>
                <p className="text-sm leading-6 text-slate-300">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

