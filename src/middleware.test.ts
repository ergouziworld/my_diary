import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ getToken: vi.fn() }));

vi.mock("next-auth/jwt", () => ({ getToken: mocks.getToken }));

import { middleware } from "./middleware";

describe("authentication middleware", () => {
  beforeEach(() => {
    mocks.getToken.mockResolvedValue(null);
  });

  it.each(["/login", "/register", "/world", "/api/auth/send-sms"])(
    "allows unauthenticated access to public path %s",
    async (pathname) => {
      const response = await middleware(new NextRequest(`http://localhost${pathname}`));

      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(mocks.getToken).not.toHaveBeenCalled();
    },
  );

  it("returns 401 JSON for an unauthenticated private API request", async () => {
    const response = await middleware(new NextRequest("http://localhost/api/entries"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Unauthorized" });
  });

  it("redirects an unauthenticated page request to login with callbackUrl", async () => {
    const response = await middleware(new NextRequest("http://localhost/tasks"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login?callbackUrl=%2Ftasks");
  });

  it("allows an authenticated request to continue", async () => {
    mocks.getToken.mockResolvedValue({ sub: "user-1" });

    const response = await middleware(new NextRequest("http://localhost/tasks"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
