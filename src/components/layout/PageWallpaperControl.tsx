"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DEFAULT_WALLPAPER,
  WALLPAPERS,
  imageWallpaperValue,
  type WallpaperValue
} from "@/lib/wallpapers";

type WallpaperMap = Record<string, WallpaperValue>;

type AlbumImage = {
  id: string;
  url: string;
  title: string | null;
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

export function PageWallpaperControl() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [open, setOpen] = useState(false);
  const [wallpaperMap, setWallpaperMap] = useState<WallpaperMap>({});
  const [albumImages, setAlbumImages] = useState<AlbumImage[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    async function load() {
      const map = await loadServerWallpaperMap();
      if (!cancelled) setWallpaperMap(map);
    }

    void load();

    function handleChange() {
      void load();
    }
    window.addEventListener("wallpaperchange", handleChange);
    return () => {
      cancelled = true;
      window.removeEventListener("wallpaperchange", handleChange);
    };
  }, [status, userId]);

  useEffect(() => {
    if (status !== "authenticated" || !open || albumImages.length) return;
    let cancelled = false;

    async function loadImages() {
      try {
        const res = await fetch("/api/wallpaper-images", { cache: "no-store" });
        const data = (await res.json()) as { ok?: boolean; images?: AlbumImage[] };
        if (!cancelled) setAlbumImages(data.ok ? data.images ?? [] : []);
      } catch {
        if (!cancelled) setAlbumImages([]);
      }
    }

    void loadImages();
    return () => {
      cancelled = true;
    };
  }, [status, open, albumImages.length]);

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
      return;
    }
    window.dispatchEvent(new Event("wallpaperchange"));
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
        <div className="mt-2.5 max-h-[min(70vh,560px)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/12 bg-slate-950/95 p-3 shadow-[0_18px_48px_rgb(0_0_0/0.4)] backdrop-blur-lg">
          <div className="text-sm font-semibold text-white">当前页面壁纸</div>
          <div className="mb-3 truncate text-xs text-slate-400">{pathname}</div>

          {albumImages.length > 0 && (
            <div className="mb-3">
              <div className="mb-2 text-xs font-medium text-slate-300">相册图片</div>
              <div className="grid grid-cols-3 gap-2">
                {albumImages.slice(0, 9).map((image) => {
                  const value = imageWallpaperValue(image.url);
                  const active = selected === value;
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => void apply(value)}
                      className={`overflow-hidden rounded-lg border transition ${
                        active ? "border-accent-500" : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.title ?? ""} className="h-14 w-full object-cover" loading="lazy" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-2 text-xs font-medium text-slate-300">预设</div>
          <div className="grid grid-cols-2 gap-2">
            {WALLPAPERS.map((wallpaper) => {
              const active = selected === wallpaper.key;
              return (
                <button
                  key={wallpaper.key}
                  type="button"
                  onClick={() => void apply(wallpaper.key)}
                  className={`rounded-xl border p-2 text-left transition ${
                    active ? "border-accent-500 bg-accent-500/15" : "border-white/10 bg-white/5 hover:border-white/25"
                  }`}
                >
                  <span
                    className="block h-12 rounded-lg border border-white/10"
                    style={{ background: wallpaper.preview }}
                  />
                  <span className="mt-1.5 block text-xs text-white">{wallpaper.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void apply(null)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:border-white/25"
          >
            恢复默认壁纸
          </button>
        </div>
      )}
    </div>
  );
}
