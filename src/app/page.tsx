import { BigInputBox } from "@/components/entry/BigInputBox";
import { TodaySummary } from "@/components/dashboard/TodaySummary";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold">今日输入</h1>
        <p className="text-slate-400">快速记录文字、图片、音频、视频和链接。</p>
      </section>
      <BigInputBox />
      <TodaySummary />
    </div>
  );
}
