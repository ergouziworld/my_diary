"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { sidebarLinks } from "@/components/layout/navigation";
import {
  DEFAULT_WALLPAPER,
  WALLPAPERS,
  imageWallpaperValue,
  type WallpaperKey,
  type WallpaperValue
} from "@/lib/wallpapers";

type WallpaperMap = Record<string, WallpaperValue>;

type AlbumImage = {
  id: string;
  url: string;
  title: string | null;
  size: number | null;
  createdAt: string;
};

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

function formatSize(size: number | null) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function WallpaperSwitcher() {
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;
  const inputRef = useRef<HTMLInputElement>(null);
  const pageOptions = useMemo(() => [...sidebarLinks], []);
  const [selectedPath, setSelectedPath] = useState(pathname);
  const [wallpaperMap, setWallpaperMap] = useState<WallpaperMap>({});
  const [albumImages, setAlbumImages] = useState<AlbumImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (sessionStatus === "loading") return;
    let cancelled = false;

    async function loadSettings() {
      const map = await loadServerWallpaperMap();
      if (!cancelled) {
        setWallpaperMap(map);
        window.dispatchEvent(new Event("wallpaperchange"));
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, userId]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    let cancelled = false;

    async function loadImages() {
      setLoadingImages(true);
      try {
        const res = await fetch("/api/wallpaper-images", { cache: "no-store" });
        const data = (await res.json()) as { ok?: boolean; images?: AlbumImage[] };
        if (!cancelled) setAlbumImages(data.ok ? data.images ?? [] : []);
      } catch {
        if (!cancelled) setAlbumImages([]);
      } finally {
        if (!cancelled) setLoadingImages(false);
      }
    }

    void loadImages();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, userId]);

  const selectedWallpaper = wallpaperMap[selectedPath] ?? DEFAULT_WALLPAPER;

  async function apply(path: string, wallpaper: WallpaperValue) {
    const next = { ...wallpaperMap, [path]: wallpaper };
    setWallpaperMap(next);

    const saved = await saveServerWallpaper(path, wallpaper);
    if (!saved) {
      setWallpaperMap(await loadServerWallpaperMap());
      setStatus("壁纸保存失败，请刷新后重试");
      return;
    }

    window.dispatchEvent(new Event("wallpaperchange"));
    setStatus("壁纸已更新");
  }

  async function reset(path: string) {
    const next = { ...wallpaperMap };
    delete next[path];
    setWallpaperMap(next);

    const saved = await saveServerWallpaper(path, null);
    if (!saved) {
      setWallpaperMap(await loadServerWallpaperMap());
      setStatus("壁纸保存失败，请刷新后重试");
      return;
    }

    window.dispatchEvent(new Event("wallpaperchange"));
    setStatus("已恢复默认壁纸");
  }

  async function uploadWallpaper(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("请选择图片文件");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setStatus("正在上传...");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { ok?: boolean; error?: string; data?: { id?: string | null; url?: string } };
      const url = data.data?.url;
      if (!res.ok || !data.ok || !url) {
        setStatus(data.error ?? "上传失败");
        return;
      }

      const item: AlbumImage = {
        id: data.data?.id ? `attachment:${data.data.id}` : `upload:${url}`,
        url,
        title: file.name,
        size: file.size,
        createdAt: new Date().toISOString()
      };
      setAlbumImages((items) => [item, ...items.filter((existing) => existing.url !== url)]);
      await apply(selectedPath, imageWallpaperValue(url));
      setStatus("已上传并应用为壁纸");
    } catch {
      setStatus("上传失败");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {pageOptions.map((page) => {
          const active = selectedPath === page.href;
          return (
            <button
              key={page.href}
              type="button"
              onClick={() => setSelectedPath(page.href)}
              className={`rounded-2xl border px-4 py-2 text-sm transition ${
                active
                  ? "border-accent-500 bg-accent-500/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
              }`}
            >
              {page.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-accent-500/25 bg-accent-500/10 p-3">
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
          className="w-full rounded-xl border border-accent-400/30 bg-slate-950/40 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-950/60"
        >
          上传高清图片作为本页壁纸
        </button>
        {status && <p className="mt-2 text-center text-xs text-slate-300">{status}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-white">相册图片</h3>
          <button
            type="button"
            onClick={() => void reset(selectedPath)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-white/20"
          >
            恢复默认
          </button>
        </div>

        {loadingImages ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : albumImages.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {albumImages.map((image) => {
              const value = imageWallpaperValue(image.url);
              const active = selectedWallpaper === value;
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => void apply(selectedPath, value)}
                  className={`rounded-2xl border p-2 text-left transition ${
                    active ? "border-accent-500 bg-accent-500/15" : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <span className="block aspect-[2.2/1] overflow-hidden rounded-xl bg-slate-900">
                    <img src={image.url} alt={image.title ?? ""} className="h-full w-full object-cover" loading="lazy" />
                  </span>
                  <span className="mt-2 block truncate text-xs text-slate-300">{formatSize(image.size) || "图片"}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
            暂时没有可用图片。先上传一张图片，或在日记里添加图片附件。
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white">备用预设</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {WALLPAPERS.map((wallpaper) => {
            const active = selectedWallpaper === wallpaper.key;
            return (
              <button
                key={wallpaper.key}
                type="button"
                onClick={() => void apply(selectedPath, wallpaper.key as WallpaperKey)}
                className={`rounded-2xl border p-3 text-left transition ${
                  active ? "border-accent-500 bg-accent-500/10" : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <span className="block h-20 rounded-xl border border-white/10" style={{ background: wallpaper.preview }} />
                <span className="mt-3 block text-sm font-medium text-white">{wallpaper.label}</span>
                <span className="mt-1 block text-xs text-slate-400">{wallpaper.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
