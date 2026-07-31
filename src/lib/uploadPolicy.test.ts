import { describe, expect, it } from "vitest";
import { isAllowedUploadMimeType } from "./uploadPolicy";

describe("isAllowedUploadMimeType", () => {
  it.each([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ])("allows supported uploads: %s", (mimeType) => {
    expect(isAllowedUploadMimeType(mimeType)).toBe(true);
  });

  it.each([
    "image/svg+xml",
    "text/html",
    "application/javascript",
    "application/octet-stream",
    "",
  ])("rejects unsupported uploads: %s", (mimeType) => {
    expect(isAllowedUploadMimeType(mimeType)).toBe(false);
  });
});
