import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      create: mocks.create,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: { hash: mocks.hash },
}));

import { POST } from "./route";

function registerRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "user-1" });
    mocks.hash.mockResolvedValue("hashed-password");
  });

  it("registers with the username field sent by the registration page", async () => {
    const response = await POST(
      registerRequest({ name: "Bocchi", username: " 111111 ", password: "123456" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.findUnique).toHaveBeenCalledWith({ where: { email: "111111" } });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        name: "Bocchi",
        email: "111111",
        password: "hashed-password",
      },
    });
  });

  it("keeps accepting email from older clients", async () => {
    const response = await POST(
      registerRequest({ email: "OldClient", password: "123456" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.findUnique).toHaveBeenCalledWith({ where: { email: "oldclient" } });
  });

  it("returns a Chinese validation error when username is missing", async () => {
    const response = await POST(registerRequest({ password: "123456" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "用户名和密码不能为空。",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
