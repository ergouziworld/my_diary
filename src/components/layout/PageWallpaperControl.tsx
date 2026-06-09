"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DEFAULT_WALLPAPER,
  WALLPAPERS,
  imageWallpaperValue,
  type WallpaperValue
} from "@/lib/wallpapers";

type WallpaperMap = Record<string, WallpaperValue>;
type WallpaperImage = { id: string; url: string; size: number | null };

async function loadServerWallpaperMap(): Promise<WallpaperMap> {
  try {
    const res = await fetch("/api/wallpapers/settings", { cache: "no-store" });
    const data = (await res.json()) as { ok?: boolean; data?: WallpaperMap };
    return res.ok && data.ok && data.data ? data.data : {};
  } catch {
    return {};
  }
}

async function saveServerWallpaper(path: string, value: WallpaperValue | null) {
  try {
    const res = await fetch("/api/wallpapers/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, value })
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadWallpaperImages(): Promise<WallpaperImage[]> {
  try {
    const res = await fetch("/api/wallpapers/images", { cache: "no-store" });
    const data = (await res.json()) as { ok?: boolean; data?: WallpaperImage[] };
    return res.ok && data.ok && data.data ? data.data : [];
  } catch {
    return [];
  }
}

export function PageWallpaperControl() {
  const pathname = usePathname();
  const { status } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [wallpaperMap, setWallpaperMap] = useState<WallpaperMap>({});
  const [images, setImages] = useState<WallpaperImage[]>([]);
  const [status_, setStatus] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void loadServerWallpaperMap().then((map) => {
      if (!cancelled) setWallpaperMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  // 打开面板时再拉壁纸图库（懒加载）
  useEffect(() => {
    if (status !== "authenticated" || !open) return;
    let cancelled = false;
    void loadWallpaperImages().then((list) => {
      if (!cancelled) setImages(list);
    });
    return () => {
      cancelled = true;
    };
  }, [status, open]);

  if (status !== "authenticated") return null;

  const selected = wallpaperMap[pathname] ?? DEFAULT_WALLPAPER;

  async function apply(value: WallpaperValue | null) {
    const next = { ...wallpaperMap };
    if (value === null) delete next[pathname];
    else next[pathname] = value;
    setWallpaperMap(next);

    const saved = await saveServerWallpaper(pathname, value);
    if (!saved) {
      setWallpaperMap(await loadServerWallpaperMap());
      setStatus("保存失败，请重试");
      return;
    }
    window.dispatchEvent(new Event("wallpaperchange"));
    setStatus(value === null ? "已恢复默认" : "壁纸已更新");
  }

  async function uploadWallpaper(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("请选择图片文件");
      return;
    }
    setStatus("正在上传…");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/wallpapers/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { ok?: boolean; error?: string; data?: { url?: string } };
      const url = data.data?.url;
      if (!res.ok || !data.ok || !url) {
        setStatus(data.error ?? "上传失败");
        return;
      }
      setImages(await loadWallpaperImages());
      await apply(imageWallpaperValue(url));
      setStatus("已上传并应用");
    } catch {
      setStatus("上传失败");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function deleteImage(image: WallpaperImage) {
    if (!window.confirm("删除这张壁纸图片？")) return;
    try {
      const res = await fetch(`/api/wallpapers/images?id=${encodeURIComponent(image.id)}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        setStatus("删除失败");
        return;
      }
      setImages((list) => list.filter((item) => item.id !== image.id));
      // 删除接口已清掉用到它的页面壁纸设置，这里同步刷新当前页
      setWallpaperMap(await loadServerWallpaperMap());
      window.dispatchEvent(new Event("wallpaperchange"));
      setStatus("已删除");
    } catch {
      setStatus("删除失败");
    }
  }

  return (
    <div className="fixed right-4 top-20 z-[60] font-sans">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-white/15 bg-slate-950/80 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgb(0_0_0/0.28)] backdrop-blur-md transition hover:bg-slate-950"
      >
        壁纸
      </button>

      {open && (
        <div className="mt-2.5 max-h-[min(76vh,640px)] w-[min(23rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/12 bg-slate-950/95 p-3 shadow-[0_18px_48px_rgb(0_0_0/0.4)] backdrop-blur-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-white">当前页面壁纸</div>
              <div className="truncate text-xs text-slate-400">{pathname}</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full border border-white/10 bg-slate-950/55 px-3 py-1 text-xs text-slate-300 transition hover:border-white/25"
            >
              关闭
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadWallpaper(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-3 w-full rounded-xl border border-accent-400/30 bg-accent-500/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-500/20"
          >
            上传图片作为本页壁纸
          </button>

          {images.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 text-xs font-medium text-slate-300">我的壁纸图片</div>
              <div className="grid grid-cols-3 gap-2">
                {images.map((image) => {
                  const value = imageWallpaperValue(image.url);
                  const active = selected === value;
                  return (
                    <div key={image.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => void apply(value)}
                        className={`block w-full overflow-hidden rounded-lg border transition ${
                          active ? "border-accent-500" : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt="" className="h-14 w-full object-cover" loading="lazy" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteImage(image)}
                        aria-label="删除"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-xs leading-none text-white opacity-0 transition group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-2 mt-3 text-xs font-medium text-slate-300">预设</div>
          <div className="grid grid-cols-2 gap-2">
            {WALLPAPERS.map((wallpaper) => {
              const active = selected === wallpaper.key;
              return (
                <button
                  key={wallpaper.key}
                  type="button"
                  onClick={() => void apply(wallpaper.key)}
                  className={`rounded-xl border p-2 text-left transition ${
                    active ? "border-accent-500 bg-accent-500/15" : "border-white/10 bg-slate-950/55 hover:border-white/25"
                  }`}
                >
                  <span className="block h-12 rounded-lg border border-white/10" style={{ background: wallpaper.preview }} />
                  <span className="mt-1.5 block text-xs text-white">{wallpaper.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void apply(null)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-xs text-slate-300 transition hover:border-white/25"
          >
            恢复默认壁纸
          </button>

          {status_ && <p className="mt-2 text-center text-xs text-slate-300">{status_}</p>}
        </div>
      )}
    </div>
  );
}
