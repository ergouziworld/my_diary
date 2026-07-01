"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DEFAULT_WALLPAPER,
  getWallpaper,
  type WallpaperValue
} from "@/lib/wallpapers";

type WallpaperMap = Record<string, WallpaperValue>;
type Layer = { id: number; background: string; overlay: string };

const LS_MAP_KEY = "wp-map";
const LS_UID_KEY = "wp-uid";

let cachedMap: WallpaperMap | null = null;
let cachedUserId: string | undefined;
let lastBackground = "";
let lastOverlay = "";
let layerSeq = 0;
const preloadedImages = new Set<string>();

// 模块加载时从 localStorage 恢复缓存，让首屏立刻拿到上次的壁纸
if (typeof window !== "undefined" && !cachedMap) {
  try {
    const stored = localStorage.getItem(LS_MAP_KEY);
    if (stored) {
      cachedMap = JSON.parse(stored) as WallpaperMap;
      cachedUserId = localStorage.getItem(LS_UID_KEY) ?? undefined;
    }
  } catch {}
}

async function fetchWallpaperMap(): Promise<WallpaperMap> {
  try {
    const res = await fetch("/api/wallpapers/settings", { cache: "no-store" });
    const data = (await res.json()) as { ok?: boolean; data?: WallpaperMap };
    if (!res.ok || !data.ok || !data.data) return {};
    return data.data;
  } catch {
    return {};
  }
}

function preloadImage(url: string) {
  if (preloadedImages.has(url)) return;
  const image = new Image();
  image.decoding = "async";
  image.onload = () => preloadedImages.add(url);
  image.src = url;
}

function preloadAllImages(map: WallpaperMap) {
  for (const value of Object.values(map)) {
    const wallpaper = getWallpaper(value);
    if (wallpaper.imageUrl) preloadImage(wallpaper.imageUrl);
  }
}

function saveToLocalStorage(map: WallpaperMap, uid: string | undefined) {
  try {
    localStorage.setItem(LS_MAP_KEY, JSON.stringify(map));
    localStorage.setItem(LS_UID_KEY, uid ?? "");
  } catch {}
}

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [layers, setLayers] = useState<Layer[]>(() => {
    // 优先用模块缓存（页内导航场景）
    if (lastBackground) {
      return [{ id: ++layerSeq, background: lastBackground, overlay: lastOverlay }];
    }
    // 其次用 localStorage 预填充（刷新 / 首次打开）
    if (cachedMap && typeof window !== "undefined") {
      const wallpaper = getWallpaper(cachedMap[window.location.pathname] ?? DEFAULT_WALLPAPER);
      lastBackground = wallpaper.background;
      lastOverlay = wallpaper.overlay;
      return [{ id: ++layerSeq, background: wallpaper.background, overlay: wallpaper.overlay }];
    }
    return [];
  });

  const applyFromMap = useCallback((path: string, map: WallpaperMap) => {
    const wallpaper = getWallpaper(map[path] ?? DEFAULT_WALLPAPER);
    if (wallpaper.imageUrl) preloadImage(wallpaper.imageUrl);

    if (wallpaper.background === lastBackground && wallpaper.overlay === lastOverlay) return;
    lastBackground = wallpaper.background;
    lastOverlay = wallpaper.overlay;

    setLayers((prev) => {
      const base = prev.length ? [prev[prev.length - 1]] : [];
      return [...base, { id: ++layerSeq, background: wallpaper.background, overlay: wallpaper.overlay }];
    });
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    if (cachedMap && cachedUserId === userId) {
      applyFromMap(pathname, cachedMap);
      return;
    }

    let cancelled = false;
    void fetchWallpaperMap().then((map) => {
      if (cancelled) return;
      cachedMap = map;
      cachedUserId = userId;
      saveToLocalStorage(map, userId);
      applyFromMap(pathname, map);
      preloadAllImages(map);
    });
    return () => { cancelled = true; };
  }, [pathname, status, userId, applyFromMap]);

  useEffect(() => {
    if (status !== "authenticated") return;

    function refresh() {
      void fetchWallpaperMap().then((map) => {
        cachedMap = map;
        cachedUserId = userId;
        saveToLocalStorage(map, userId);
        applyFromMap(pathname, map);
        preloadAllImages(map);
      });
    }

    window.addEventListener("wallpaperchange", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wallpaperchange", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [pathname, status, userId, applyFromMap]);

  function handleEntered(id: number) {
    setLayers((prev) => (prev.length > 1 ? prev.filter((layer) => layer.id >= id) : prev));
  }

  return (
    <>
      <div aria-hidden className="wp-backdrop">
        {layers.map((layer, index) => {
          const isTop = index === layers.length - 1;
          return (
            <div
              key={layer.id}
              className={`wp-layer${isTop && layers.length > 1 ? " wp-layer-enter" : ""}`}
              style={{ background: `${layer.overlay}, ${layer.background}, #020617` }}
              onAnimationEnd={isTop ? () => handleEntered(layer.id) : undefined}
            />
          );
        })}
      </div>
      {children}
    </>
  );
}
