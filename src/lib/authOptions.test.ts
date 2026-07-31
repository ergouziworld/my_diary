import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  compare: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  smsFindFirst: vi.fn(),
  smsUpdate: vi.fn(),
}));

vi.mock("bcryptjs", () => ({ default: { compare: mocks.compare } }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      create: mocks.userCreate,
    },
    smsCode: {
      findFirst: mocks.smsFindFirst,
      update: mocks.smsUpdate,
    },
  },
}));

import { authOptions } from "./authOptions";

type Authorize = (credentials: Record<string, string> | undefined) => Promise<unknown>;

type CredentialsProviderConfig = { options: { authorize: Authorize } };

const passwordAuthorize = (authOptions.providers[0] as unknown as CredentialsProviderConfig).options.authorize;
const smsAuthorize = (authOptions.providers[1] as unknown as CredentialsProviderConfig).options.authorize;

describe("CredentialsProvider authorize", () => {
  beforeEach(() => {
    mocks.smsUpdate.mockResolvedValue({});
  });

  it("returns the user when the password is correct and calls bcrypt.compare", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      password: "hashed-password",
    });
    mocks.compare.mockResolvedValue(true);

    const result = await passwordAuthorize({ username: " Alice@Example.com ", password: "secret" });

    expect(mocks.userFindUnique).toHaveBeenCalledWith({ where: { email: "alice@example.com" } });
    expect(mocks.compare).toHaveBeenCalledWith("secret", "hashed-password");
    expect(result).toEqual({ id: "user-1", name: "Alice", email: "alice@example.com" });
  });

  it("returns null when the password is wrong", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
      password: "hashed-password",
    });
    mocks.compare.mockResolvedValue(false);

    await expect(passwordAuthorize({ username: "alice@example.com", password: "wrong" })).resolves.toBeNull();
  });

  it("rejects an expired SMS code by querying only codes whose expiry is in the future", async () => {
    mocks.smsFindFirst.mockResolvedValue(null);

    await expect(smsAuthorize({ phone: "13800138000", code: "123456" })).resolves.toBeNull();

    expect(mocks.smsFindFirst).toHaveBeenCalledWith({
      where: {
        phone: "13800138000",
        code: "123456",
        used: false,
        expiresAt: { gt: expect.any(Date) },
      },
    });
    expect(mocks.smsUpdate).not.toHaveBeenCalled();
  });

  it("rejects a used SMS code by querying only used=false records", async () => {
    mocks.smsFindFirst.mockResolvedValue(null);

    await expect(smsAuthorize({ phone: "13800138000", code: "654321" })).resolves.toBeNull();

    expect(mocks.smsFindFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ used: false }),
    });
  });

  it("marks a valid SMS code as used to prevent replay", async () => {
    mocks.smsFindFirst.mockResolvedValue({ id: "sms-1" });
    mocks.userFindUnique.mockResolvedValue({ id: "user-1", name: "Alice", email: null });

    const result = await smsAuthorize({ phone: "13800138000", code: "123456" });

    expect(mocks.smsUpdate).toHaveBeenCalledWith({
      where: { id: "sms-1" },
      data: { used: true },
    });
    expect(result).toEqual({ id: "user-1", name: "Alice", email: "13800138000" });
  });

  it("creates a user on the first successful phone login", async () => {
    mocks.smsFindFirst.mockResolvedValue({ id: "sms-1" });
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue({ id: "user-new", name: "new-user", email: null });

    const result = await smsAuthorize({ phone: "13800138000", code: "123456" });

    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: { phone: "13800138000", name: expect.any(String) },
    });
    expect(result).toEqual({ id: "user-new", name: "new-user", email: "13800138000" });
  });
});
