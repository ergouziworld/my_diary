import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { analyzeEntry } from "@/server/ai/aiService";
import {
  memoryFindEntry,
  memoryReplaceEmotions,
  memoryReplaceTasks,
  memoryReplaceWorkItems,
  memoryUpsertAnalysis
} from "@/server/memoryStore";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function mapWorkCategory(type: string) {
  if (type === "development") return "coding";
  if (type === "study" || type === "course" || type === "competition") return type;
  return "work";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { entryId?: string; content?: string; type?: string };
    const entryId = typeof body.entryId === "string" ? body.entryId.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const type = body.type === "text" ? "text" : "text";

    if (!entryId) return jsonError("entryId is required");
    if (!content) return jsonError("content cannot be empty");

    const userId = getUserId();
    let entry = null;
    try {
      entry = await prisma.entry.findFirst({ where: { id: entryId, userId } });
    } catch {
      entry = null;
    }
    const fallbackEntry = entry ?? memoryFindEntry(entryId, userId);
    if (!fallbackEntry) return jsonError("entry not found", 404);

    const { provider, result } = await analyzeEntry({ entryId, content, type });

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
              deadlineText: task.deadlineText === "无" ? null : task.deadlineText,
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
              category: mapWorkCategory(item.type),
              projectName: item.project || null,
              title: item.title,
              description: item.description || null,
              status: "todo"
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
          deadlineText: task.deadlineText === "无" ? null : task.deadlineText,
          sourceText: task.sourceText,
          status: "todo"
        }))
      );
      memoryReplaceWorkItems(
        entryId,
        result.workItems.map((item) => ({
          userId,
          entryId,
          category: mapWorkCategory(item.type) as never,
          projectName: item.project || null,
          title: item.title,
          description: item.description || null,
          status: "todo"
        }))
      );
    }

    return NextResponse.json({ ok: true, provider, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyze failed";
    return jsonError(message, 500);
  }
}
