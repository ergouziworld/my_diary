import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  deleteMany: vi.fn(),
  sendSmsCode: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    smsCode: {
      findFirst: mocks.findFirst,
      create: mocks.create,
      deleteMany: mocks.deleteMany,
    },
  },
}));
vi.mock("@/lib/sms", () => ({ sendSmsCode: mocks.sendSmsCode }));

import { POST } from "./route";

function smsRequest(phone: string) {
  return new Request("http://localhost/api/auth/send-sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
}

describe("POST /api/auth/send-sms", () => {
  beforeEach(() => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockResolvedValue({});
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    mocks.sendSmsCode.mockResolvedValue(undefined);
  });

  it.each(["", "12345678901", "23800138000", "1380013800"])(
    "rejects an invalid phone number: %s",
    async (phone) => {
      const response = await POST(smsRequest(phone) as never);
      expect(response.status).toBe(400);
      expect(mocks.findFirst).not.toHaveBeenCalled();
    },
  );

  it("returns 429 when the same phone requested a code during the last 60 seconds", async () => {
    mocks.findFirst.mockResolvedValue({ id: "recent-code" });

    const response = await POST(smsRequest("13800138000") as never);

    expect(response.status).toBe(429);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.sendSmsCode).not.toHaveBeenCalled();
  });

  it("creates and sends a six-digit numeric code", async () => {
    const response = await POST(smsRequest("13800138000") as never);

    expect(response.status).toBe(200);
    const createCall = mocks.create.mock.calls[0][0];
    const code = createCall.data.code as string;
    expect(code).toMatch(/^\d{6}$/);
    expect(createCall.data).toEqual({
      phone: "13800138000",
      code,
      expiresAt: expect.any(Date),
    });
    expect(mocks.sendSmsCode).toHaveBeenCalledWith("13800138000", code);
  });

  it("removes the stored code when Aliyun rejects the send request", async () => {
    mocks.sendSmsCode.mockRejectedValue(new Error("Aliyun rejected request"));

    const response = await POST(smsRequest("13800138000") as never);

    expect(response.status).toBe(500);
    const code = mocks.create.mock.calls[0][0].data.code as string;
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { phone: "13800138000", code },
    });
  });
});
