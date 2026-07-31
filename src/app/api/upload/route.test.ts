import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserId: vi.fn(),
  attachmentCreate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getUserId: mocks.getUserId }));
vi.mock("@/lib/prisma", () => ({
  prisma: { attachment: { create: mocks.attachmentCreate } },
}));
vi.mock("fs/promises", () => ({ writeFile: vi.fn(), mkdir: vi.fn() }));

import { POST } from "./route";

function uploadRequest(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return new Request("http://localhost/api/upload", { method: "POST", body: formData });
}

describe("POST /api/upload validation", () => {
  beforeEach(() => {
    mocks.getUserId.mockResolvedValue("user-1");
  });

  it("returns 401 before processing the upload when the user is not signed in", async () => {
    mocks.getUserId.mockRejectedValue(new Error("Unauthorized"));
    const request = uploadRequest(new File(["data"], "photo.jpg", { type: "image/jpeg" }));

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Unauthorized" });
  });

  it("rejects files larger than 10 MB", async () => {
    const oversized = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      "large.jpg",
      { type: "image/jpeg" },
    );

    const response = await POST(uploadRequest(oversized));

    expect(response.status).toBe(400);
    expect(mocks.attachmentCreate).not.toHaveBeenCalled();
  });

  it("rejects MIME types outside the server allowlist", async () => {
    const executable = new File(["malicious"], "payload.exe", {
      type: "application/x-msdownload",
    });

    const response = await POST(uploadRequest(executable));

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Unsupported file type" });
    expect(mocks.attachmentCreate).not.toHaveBeenCalled();
  });
});
