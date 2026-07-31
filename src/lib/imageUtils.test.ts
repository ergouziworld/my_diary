import { afterEach, describe, expect, it, vi } from "vitest";
import { convertToStaticImage } from "./imageUtils";

describe("convertToStaticImage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("converts a supported image to a JPEG File", async () => {
    const close = vi.fn();
    const drawImage = vi.fn();
    const jpegBlob = new Blob(["jpeg-data"], { type: "image/jpeg" });

    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 640, height: 480, close }));
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue({
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({ drawImage }),
        toBlob: (callback: (blob: Blob | null) => void, type: string, quality: number) => {
          expect(type).toBe("image/jpeg");
          expect(quality).toBe(0.92);
          callback(jpegBlob);
        },
      }),
    });

    const input = new File(["png-data"], "photo.png", { type: "image/png" });
    const result = await convertToStaticImage(input);

    expect(result).not.toBe(input);
    expect(result.name).toBe("photo.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(drawImage).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it("returns the original file when createImageBitmap does not support the format", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("unsupported image")));
    const input = new File(["heic-data"], "photo.heic", { type: "image/heic" });

    await expect(convertToStaticImage(input)).resolves.toBe(input);
  });
});
