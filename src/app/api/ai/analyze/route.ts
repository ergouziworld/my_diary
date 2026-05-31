import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { analyzeEntry } from "@/server/ai/aiService";
import { indexEntry } from "@/server/ai/retrieval";
import {
  memoryCreateEntry,
  memoryFindEntry,
  memoryReplaceFinanceItems,
  memoryReplaceEmotions,
  memoryReplaceTasks,
  memoryReplaceWorkItems,
  memoryUpsertAnalysis
} from "@/server/memoryStore";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function mapWorkCategory(type: string, entryTypes: string[] = []) {
  if (type === "development") return "coding";
  if (type === "study" || type === "course" || type === "competition") return type;
  if (type === "other" && (entryTypes.includes("study") || entryTypes.includes("life"))) return "study";
  return "work";
}

function normalizeAmountText(amountText: string) {
  return amountText.trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { entryId?: string; content?: string };
    const entryId = typeof body.entryId === "string" ? body.entryId.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!entryId) return jsonError("entryId is required");
    if (!content) return jsonError("content cannot be empty");

    const userId = await getUserId();
    let entry = null;
    try {
      entry = await prisma.entry.findFirst({ where: { id: entryId, userId } });
    } catch {
      entry = null;
    }

    const fallbackEntry = entry ?? memoryFindEntry(entryId, userId);
    if (!fallbackEntry) {
      memoryCreateEntry({
        id: entryId,
        userId,
        rawContent: content,
        contentText: content,
        type: "text",
        inputType: "text",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const { provider, result } = await analyzeEntry({ entryId, content, type: "text" });

    // 当 AI 识别为 study/work 但 workItems 为空时，从 timelineTitle 自动合成一条
    const needsStudyItem = result.workItems.length === 0 &&
      (result.entryTypes.includes("study") || result.entryTypes.includes("work"));
    if (needsStudyItem && result.timelineTitle) {
      const autoType = result.entryTypes.includes("study") ? "study" : "other";
      result.workItems.push({ project: "", type: autoType as never, title: result.timelineTitle, description: result.summary });
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.entryAnalysis.upsert({
          where: { entryId },
          update: {
            summary: result.summary,
            compressedMemory: result.memoryText,
            timelineType: result.entryTypes[0] ?? "other",
            confidence: result.confidence,
            rawAiResult: result
          },
          create: {
            entryId,
            summary: result.summary,
            compressedMemory: result.memoryText,
            timelineType: result.entryTypes[0] ?? "other",
            confidence: result.confidence,
            rawAiResult: result
          }
        });

        await tx.entryEmotion.deleteMany({ where: { entryId } });
        if (result.emotions.length) {
          await tx.entryEmotion.createMany({
            data: result.emotions.map((emotion) => ({
              entryId,
              name: emotion.name,
              intensity: emotion.intensity,
              reason: emotion.reason || null
            }))
          });
        }

        await tx.task.deleteMany({ where: { entryId } });
        if (result.tasks.length) {
          await tx.task.createMany({
            data: result.tasks.map((task) => ({
              userId,
              entryId,
              title: task.title,
              priority: task.priority,
              deadlineText: task.deadlineText || null,
              sourceText: task.sourceText,
              status: "todo"
            }))
          });
        }

        await tx.entryTag.deleteMany({ where: { entryId } });
        if (result.tags.length) {
          const tags = await Promise.all(
            result.tags.map(async (name) =>
              tx.tag.upsert({
                where: { userId_name: { userId, name } },
                update: {},
                create: { userId, name }
              })
            )
          );
          await tx.entryTag.createMany({
            data: tags.map((tag) => ({
              entryId,
              tagId: tag.id,
              confidence: result.confidence
            }))
          });
        }

        await tx.workItem.deleteMany({ where: { entryId } });
        if (result.workItems.length) {
          await tx.workItem.createMany({
            data: result.workItems.map((item) => ({
              userId,
              entryId,
              category: mapWorkCategory(item.type, result.entryTypes),
              projectName: item.project || null,
              title: item.title,
              description: item.description || null,
              status: "todo"
            }))
          });
        }

        await tx.financeItem.deleteMany({ where: { entryId } });
        if (result.financeItems.length) {
          await tx.financeItem.createMany({
            data: result.financeItems.map((item) => ({
              userId,
              entryId,
              title: item.title,
              amountText: item.amountText,
              type: item.type,
              category: item.category || null,
              sourceText: item.sourceText || null
            }))
          });
        }
      });
    } catch {
      memoryUpsertAnalysis(entryId, {
        summary: result.summary,
        compressedMemory: result.memoryText,
        timelineType: result.entryTypes[0] ?? "other",
        timelineTitle: result.timelineTitle,
        confidence: result.confidence,
        rawAiResult: result
      });
      memoryReplaceEmotions(
        entryId,
        result.emotions.map((emotion) => ({
          name: emotion.name,
          intensity: emotion.intensity,
          reason: emotion.reason || null
        }))
      );
      memoryReplaceTasks(
        entryId,
        result.tasks.map((task) => ({
          userId,
          entryId,
          title: task.title,
          priority: task.priority,
          deadlineText: task.deadlineText || null,
          sourceText: task.sourceText,
          status: "todo"
        }))
      );
      memoryReplaceWorkItems(
        entryId,
        result.workItems.map((item) => ({
          userId,
          entryId,
          category: mapWorkCategory(item.type, result.entryTypes) as never,
          projectName: item.project || null,
          title: item.title,
          description: item.description || null,
          status: "todo"
        }))
      );
      memoryReplaceFinanceItems(
        entryId,
        result.financeItems.map((item) => ({
          entryId,
          title: item.title,
          amountText: normalizeAmountText(item.amountText),
          type: item.type,
          category: item.category,
          sourceText: item.sourceText
        }))
      );
    }

    // 分析落库后，更新该条日记的语义检索索引（失败不影响主流程）
    try {
      await indexEntry(entryId);
    } catch (err) {
      console.error("[indexEntry] failed", err);
    }

    return NextResponse.json({ ok: true, provider, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyze failed";
    return jsonError(message, 500);
  }
}
