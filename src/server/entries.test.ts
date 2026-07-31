import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserId: vi.fn(),
  unlink: vi.fn(),
  prisma: {
    entry: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    attachment: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ getUserId: mocks.getUserId }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("fs/promises", () => ({ unlink: mocks.unlink }));

import { createEntry, deleteEntry } from "./entries";

const deletionModels = [
  "vectorDocument",
  "entryEmotion",
  "task",
  "workItem",
  "financeItem",
  "moodRecord",
  "timelineEvent",
  "albumItem",
  "entryTag",
  "entryPerson",
  "attachment",
  "aiAnalysis",
  "entryAnalysis",
] as const;

type DeletionModel = (typeof deletionModels)[number];
type TransactionMock = {
  [Model in DeletionModel]: { deleteMany: ReturnType<typeof vi.fn> };
} & {
  entry: { delete: ReturnType<typeof vi.fn> };
};

function createTransactionMock() {
  const tx = {
    entry: { delete: vi.fn().mockResolvedValue({ id: "entry-1" }) },
  } as TransactionMock;

  for (const model of deletionModels) {
    tx[model] = { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) };
  }
  return tx;
}

describe("entries core business logic", () => {
  beforeEach(() => {
    mocks.getUserId.mockResolvedValue("user-a");
    mocks.unlink.mockResolvedValue(undefined);
  });

  it("createEntry creates an entry and only binds unbound attachments owned by the current user", async () => {
    mocks.prisma.entry.create.mockResolvedValue({
      id: "entry-1",
      userId: "user-a",
      rawContent: "today",
      createdAt: new Date("2026-07-23T00:00:00Z"),
      updatedAt: new Date("2026-07-23T00:00:00Z"),
    });
    mocks.prisma.attachment.updateMany.mockResolvedValue({ count: 1 });
    mocks.prisma.attachment.findMany.mockResolvedValue([
      { id: "attachment-a", fileUrl: "/uploads/a.jpg", fileType: "image", mimeType: "image/jpeg" },
    ]);

    const result = await createEntry({
      rawContent: "today",
      type: "text",
      attachmentIds: ["attachment-a", "attachment-from-user-b"],
    });

    expect(mocks.prisma.entry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-a",
        rawContent: "today",
        inputType: "mixed",
      }),
    });
    expect(mocks.prisma.attachment.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["attachment-a", "attachment-from-user-b"] },
        userId: "user-a",
        entryId: null,
      },
      data: { entryId: "entry-1" },
    });
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].id).toBe("attachment-a");
  });

  it("deleteEntry removes all 13 related models and the entry inside one transaction", async () => {
    const tx = createTransactionMock();
    mocks.prisma.entry.findFirst.mockResolvedValue({ id: "entry-1" });
    mocks.prisma.attachment.findMany.mockResolvedValue([
      { fileUrl: "/uploads/a.jpg" },
      { fileUrl: "https://example.com/remote.jpg" },
    ]);
    mocks.prisma.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<void>) => callback(tx));

    await deleteEntry("entry-1");

    expect(mocks.prisma.entry.findFirst).toHaveBeenCalledWith({
      where: { id: "entry-1", userId: "user-a" },
      select: { id: true },
    });
    for (const model of deletionModels) {
      expect(tx[model].deleteMany).toHaveBeenCalledWith({ where: { entryId: "entry-1" } });
    }
    expect(tx.entry.delete).toHaveBeenCalledWith({ where: { id: "entry-1" } });
    expect(mocks.unlink).toHaveBeenCalledTimes(1);
    expect(mocks.unlink).toHaveBeenCalledWith(expect.stringContaining("uploads"));
  });

  it("deleteEntry stops the transaction when an intermediate cleanup fails", async () => {
    const tx = createTransactionMock();
    tx.financeItem.deleteMany.mockRejectedValue(new Error("database failure"));
    mocks.prisma.entry.findFirst.mockResolvedValue({ id: "entry-1" });
    mocks.prisma.attachment.findMany.mockResolvedValue([]);
    mocks.prisma.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<void>) => callback(tx));

    await expect(deleteEntry("entry-1")).rejects.toThrow("database failure");

    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.entry.delete).not.toHaveBeenCalled();
    expect(tx.moodRecord.deleteMany).not.toHaveBeenCalled();
    expect(mocks.unlink).not.toHaveBeenCalled();
  });

  it("does not allow user A to delete an entry owned by user B", async () => {
    mocks.prisma.entry.findFirst.mockResolvedValue(null);

    await expect(deleteEntry("entry-b")).rejects.toThrow();

    expect(mocks.prisma.entry.findFirst).toHaveBeenCalledWith({
      where: { id: "entry-b", userId: "user-a" },
      select: { id: true },
    });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.prisma.attachment.findMany).not.toHaveBeenCalled();
  });
});
