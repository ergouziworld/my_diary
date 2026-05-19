import { Panel } from "@/components/common/Panel";
import { Pill } from "@/components/common/Pill";
import { SectionHeader } from "@/components/common/SectionHeader";

const suggestions = ["我最近为什么焦虑？", "我最近主要在忙什么？", "我过去一个月成长了什么？", "我项目推进卡在哪？"];

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="大 AI"
        description="这里是长期记忆问答入口，会结合全部长期数据做语义检索、上下文整合和深度回答。"
      />

      <Panel title="长期记忆问答" subtitle="先检索，再总结，再回答。所有答案都应该尽量带来源。">
        <div className="space-y-4">
          <textarea
            className="min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
            placeholder="输入你的问题，例如：我最近为什么焦虑？"
            defaultValue="我最近为什么焦虑？"
          />
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">长期记忆</Pill>
            <Pill tone="neutral">向量检索</Pill>
            <Pill tone="neutral">语义搜索</Pill>
            <Pill tone="neutral">上下文整合</Pill>
          </div>
          <button className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950">开始回答</button>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="快捷提问" subtitle="常用深度问题可直接一键发起。">
          <div className="space-y-3">
            {suggestions.map((item) => (
              <button key={item} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white">
                {item}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="回答草稿" subtitle="系统会给出结论、证据和下一步建议。">
          <div className="space-y-4 text-sm leading-6 text-slate-300">
            <p>你最近的焦虑主要来自三件事：任务密度上升、目标边界不清晰、以及晚间反复回看未完成事项。</p>
            <p>证据来源会包含最近 7 天的情绪记录、任务列表和几条高相关时间线事件。</p>
            <p>下一步建议是先把高优先级任务降噪，再把长期问题拆成可以一周内验证的小问题。</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

