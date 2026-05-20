import { Panel } from "@/components/common/Panel";
import { SectionHeader } from "@/components/common/SectionHeader";

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader title="财务" description="当前先保留轻量展示，后续接入 AI 财务摘要。"/>
      <Panel title="财务概览" subtitle="暂未启用统计图和预算系统。">
        <p className="text-sm text-slate-400">记录收入、支出和消费习惯，后续可继续扩展为 AI 财务摘要。</p>
      </Panel>
    </div>
  );
}
