import { MetricCard } from "@/components/common/MetricCard";
import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";

const quickActions = ["帮我总结", "提取任务", "分析情绪", "润色记录", "拆解计划"];
const recentItems = [
  {
    title: "凌晨回家后写下的会议复盘",
    meta: "工作 · 2 小时前",
    summary: "今天的复盘很完整，但对技术决策的结论还不够明确。",
  },
  {
    title: "和朋友聊到转型焦虑",
    meta: "人际 · 昨晚",
    summary: "核心情绪是焦虑夹杂期待，触发点来自不确定的未来安排。",
  },
  {
    title: "整理课程笔记与下一步行动",
    meta: "学习 · 昨天",
    summary: "已经形成 3 个可执行任务，适合按周拆分推进。",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.82))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.25)] md:p-8">
        <div className="max-w-4xl space-y-5">
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">AI 日记</Pill>
            <Pill tone="good">快速输入</Pill>
            <Pill tone="neutral">长期记忆</Pill>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">把生活变成可检索的第二大脑</h1>
            <p className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              记录一次，自动沉淀为摘要、标签、情绪、任务、时间线和人物关系。首页只做一件事：让你最低成本地输入。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="今日记录" value="12" hint="文字、图片、链接混合输入" />
        <MetricCard label="待办任务" value="7" hint="其中 2 项需要今天处理" />
        <MetricCard label="情绪波动" value="中等" hint="焦虑在上午升高，傍晚回落" />
        <MetricCard label="AI 总结" value="1 次" hint="已生成今日摘要草稿" />
      </section>

      <Panel
        title="快速记录"
        subtitle="超大输入框支持文字、图片、音频、视频、链接和文件。先写下来，后面的整理交给 AI。"
      >
        <div className="space-y-4">
          <textarea
            className="min-h-44 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
            placeholder="今天发生了什么？可以直接记录一句话、贴一段链接、或者留一个非常粗糙的想法。"
            defaultValue="今天把项目架构和数据模型重新整理了一遍，感觉方向更清晰了。晚上想把任务页面和大 AI 页面也补出来。"
          />
          <div className="flex flex-wrap gap-2 text-sm text-slate-400">
            <Pill>文字</Pill>
            <Pill>图片</Pill>
            <Pill>音频</Pill>
            <Pill>视频</Pill>
            <Pill>链接</Pill>
            <Pill>文件</Pill>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950">快速记录</button>
            <button className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white">
              AI 快速整理
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel title="最近记录预览" subtitle="先看最近发生了什么，再决定要不要深入整理。">
          <div className="space-y-4">
            {recentItems.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-white">{item.title}</h4>
                    <p className="mt-1 text-xs text-slate-400">{item.meta}</p>
                  </div>
                  <Pill tone="accent">待整理</Pill>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="小 AI 助手" subtitle="不读取长期记忆，只做即时问答和单条内容处理。">
          <div className="space-y-3">
            {quickActions.map((item, index) => (
              <button
                key={item}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-left text-sm text-white transition hover:border-cyan-400/40"
              >
                <span>{item}</span>
                <span className="text-slate-500">{index + 1}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

