import { Suspense } from "react";
import { SectionHeader } from "@/components/common/SectionHeader";
import { listEntries } from "@/server/entries";

export const dynamic = "force-dynamic";

type EmotionItem = {
  id: string;
  name: string;
  intensity: number;
  valence: number;
  arousal: number;
  trigger: string;
  thought: string;
  bodyFeeling: string;
  cognitivePattern: string;
  reframe: string;
  suggestion: string;
  reason: string;
  createdAt: Date;
  entryId: string;
  rawContent: string;
};

export default function Page() {
  return (
    <div className="space-y-6">
      <SectionHeader title="情绪" description="AI 读懂你的感受，不只是打分。" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-slate-950/55" />}>
        <MoodContent />
      </Suspense>
    </div>
  );
}

async function MoodContent() {
  const entries = await listEntries();

  const emotions: EmotionItem[] = entries.flatMap((entry) => {
    if (entry.entryEmotions.length) {
      return entry.entryEmotions.map((e) => {
        const raw = entry.entryAnalysis?.rawAiResult as Record<string, unknown> | null | undefined;
        const rawEmotions = Array.isArray(raw?.emotions) ? raw.emotions as Record<string, unknown>[] : [];
        const rawMatch = rawEmotions.find((r) => r.name === e.name) ?? {};
        return {
          id: e.id,
          name: e.name,
          intensity: e.intensity,
          valence: typeof rawMatch.valence === "number" ? rawMatch.valence : 0,
          arousal: typeof rawMatch.arousal === "number" ? rawMatch.arousal : 0.5,
          trigger: typeof rawMatch.trigger === "string" ? rawMatch.trigger : (e.reason ?? ""),
          thought: typeof rawMatch.thought === "string" ? rawMatch.thought : "",
          bodyFeeling: typeof rawMatch.bodyFeeling === "string" ? rawMatch.bodyFeeling : "",
          cognitivePattern: typeof rawMatch.cognitivePattern === "string" ? rawMatch.cognitivePattern : "",
          reframe: typeof rawMatch.reframe === "string" ? rawMatch.reframe : "",
          suggestion: typeof rawMatch.suggestion === "string" ? rawMatch.suggestion : "",
          reason: e.reason ?? "",
          createdAt: e.createdAt,
          entryId: entry.id,
          rawContent: entry.rawContent ?? "",
        };
      });
    }
    const raw = entry.entryAnalysis?.rawAiResult as { emotions?: unknown[] } | null | undefined;
    return (raw?.emotions ?? [])
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const obj = item as Record<string, unknown>;
        const name = typeof obj.name === "string" ? obj.name : "";
        if (!name) return null;
        return {
          id: `${entry.id}-raw-${index}`,
          name,
          intensity: typeof obj.intensity === "number" ? obj.intensity : 0.5,
          valence: typeof obj.valence === "number" ? obj.valence : 0,
          arousal: typeof obj.arousal === "number" ? obj.arousal : 0.5,
          trigger: typeof obj.trigger === "string" ? obj.trigger : (typeof obj.reason === "string" ? obj.reason : ""),
          thought: typeof obj.thought === "string" ? obj.thought : "",
          bodyFeeling: typeof obj.bodyFeeling === "string" ? obj.bodyFeeling : "",
          cognitivePattern: typeof obj.cognitivePattern === "string" ? obj.cognitivePattern : "",
          reframe: typeof obj.reframe === "string" ? obj.reframe : "",
          suggestion: typeof obj.suggestion === "string" ? obj.suggestion : "",
          reason: typeof obj.reason === "string" ? obj.reason : "",
          createdAt: entry.createdAt,
          entryId: entry.id,
          rawContent: entry.rawContent ?? "",
        };
      })
      .filter((item): item is EmotionItem => item !== null);
  });

  if (!emotions.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-8 text-center">
        <p className="text-slate-400">还没有情绪记录。先去首页写一条日记吧。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emotions.map((emotion) => (
        <EmotionCard key={emotion.id} emotion={emotion} />
      ))}
    </div>
  );
}

function getValenceColor(valence: number): { bg: string; border: string; dot: string } {
  if (valence >= 0.4) return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" };
  if (valence >= 0.1) return { bg: "bg-teal-500/10", border: "border-teal-500/30", dot: "bg-teal-400" };
  if (valence >= -0.1) return { bg: "bg-slate-500/10", border: "border-slate-500/30", dot: "bg-slate-400" };
  if (valence >= -0.4) return { bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400" };
  return { bg: "bg-rose-500/10", border: "border-rose-500/30", dot: "bg-rose-400" };
}

function getQuadrantLabel(valence: number, arousal: number): string {
  if (valence >= 0 && arousal >= 0.5) return "兴奋·激动";
  if (valence >= 0 && arousal < 0.5) return "平静·满足";
  if (valence < 0 && arousal >= 0.5) return "焦虑·紧张";
  return "低落·疲惫";
}

function EmotionCard({ emotion }: { emotion: EmotionItem }) {
  const colors = getValenceColor(emotion.valence);
  const quadrant = getQuadrantLabel(emotion.valence, emotion.arousal);
  const intensityPct = Math.round(emotion.intensity * 100);
  const dateStr = emotion.createdAt.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`rounded-3xl border ${colors.border} ${colors.bg} p-5 space-y-4`}>
      {/* 头部 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${colors.dot}`} />
          <div>
            <h3 className="text-lg font-semibold text-white">{emotion.name}</h3>
            <p className="text-xs text-slate-500">{quadrant} · {dateStr}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-medium text-slate-300">{intensityPct}%</div>
          <div className="mt-1 h-1.5 w-16 rounded-full bg-white/10">
            <div className={`h-full rounded-full ${colors.dot}`} style={{ width: `${intensityPct}%` }} />
          </div>
        </div>
      </div>

      {/* 原文 */}
      {emotion.rawContent && (
        <p className="rounded-xl border border-white/5 bg-slate-950/55 px-4 py-3 text-sm leading-relaxed text-slate-400 whitespace-pre-wrap line-clamp-4">
          {emotion.rawContent}
        </p>
      )}

      {/* 触发 + 想法 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {emotion.trigger && (
          <InfoRow icon="⚡" label="触发" content={emotion.trigger} />
        )}
        {emotion.thought && (
          <InfoRow icon="💭" label="内心想法" content={emotion.thought} />
        )}
      </div>

      {/* 身体感受 */}
      {emotion.bodyFeeling && (
        <InfoRow icon="🫀" label="身体感受" content={emotion.bodyFeeling} />
      )}

      {/* 认知模式 */}
      {emotion.cognitivePattern && (
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
            ⚠ {emotion.cognitivePattern}
          </span>
        </div>
      )}

      {/* 换个角度 + 建议 */}
      {(emotion.reframe || emotion.suggestion) && (
        <div className="space-y-2 rounded-2xl border border-white/5 bg-slate-950/55 p-4">
          {emotion.reframe && (
            <p className="text-sm text-slate-300">
              <span className="font-medium text-accent-500">换个角度 · </span>
              {emotion.reframe}
            </p>
          )}
          {emotion.suggestion && (
            <p className="text-sm text-slate-300">
              <span className="font-medium text-emerald-400">试试看 · </span>
              {emotion.suggestion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, content }: { icon: string; label: string; content: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500">{icon} {label}</p>
      <p className="text-sm leading-relaxed text-slate-300">{content}</p>
    </div>
  );
}
