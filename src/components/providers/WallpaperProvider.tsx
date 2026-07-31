"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DEFAULT_WALLPAPER,
  getWallpaper,
  type WallpaperValue
} from "@/lib/wallpapers";

type WallpaperMap = Record<string, WallpaperValue>;
type Layer = { id: number; background: string; overlay: string };
type WallpaperContextValue = {
  refreshWallpaper: () => Promise<void>;
};

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

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

function preloadImage(url: string): Promise<void> {
  if (preloadedImages.has(url)) return Promise.resolve();
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    const finish = () => {
      preloadedImages.add(url);
      resolve();
    };
    image.onload = finish;
    image.onerror = finish;
    image.src = url;
  });
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
  const applyVersionRef = useRef(0);

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
    const wallpaper = getWallpaper(DEFAULT_WALLPAPER);
    lastBackground = wallpaper.background;
    lastOverlay = wallpaper.overlay;
    return [{ id: ++layerSeq, background: wallpaper.background, overlay: wallpaper.overlay }];
  });

  const applyFromMap = useCallback(async (path: string, map: WallpaperMap) => {
    const version = ++applyVersionRef.current;
    const wallpaper = getWallpaper(map[path] ?? DEFAULT_WALLPAPER);
    if (wallpaper.imageUrl) await preloadImage(wallpaper.imageUrl);
    if (version !== applyVersionRef.current) return;

    if (wallpaper.background === lastBackground && wallpaper.overlay === lastOverlay) return;
    lastBackground = wallpaper.background;
    lastOverlay = wallpaper.overlay;

    // 图片准备好后一次性替换，避免旧层/新层/深色 overlay 叠加造成移动端闪黑。
    setLayers([{ id: ++layerSeq, background: wallpaper.background, overlay: wallpaper.overlay }]);
  }, []);

  const refreshWallpaper = useCallback(async () => {
    if (status !== "authenticated") return;
    const map = await fetchWallpaperMap();
    cachedMap = map;
    cachedUserId = userId;
    saveToLocalStorage(map, userId);
    await applyFromMap(pathname, map);
    preloadAllImages(map);
  }, [applyFromMap, pathname, status, userId]);

  useEffect(() => {
    if (status !== "authenticated") return;

    if (cachedMap && cachedUserId === userId) {
      void applyFromMap(pathname, cachedMap);
      return;
    }

    let cancelled = false;
    void fetchWallpaperMap().then((map) => {
      if (cancelled) return;
      cachedMap = map;
      cachedUserId = userId;
      saveToLocalStorage(map, userId);
      void applyFromMap(pathname, map);
      preloadAllImages(map);
    });
    return () => { cancelled = true; };
  }, [pathname, status, userId, applyFromMap]);

  useEffect(() => {
    if (status !== "authenticated") return;

    function handleStorageChange() {
      void refreshWallpaper();
    }

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshWallpaper, status]);

  const contextValue = useMemo(
    () => ({ refreshWallpaper }),
    [refreshWallpaper],
  );

  return (
    <WallpaperContext.Provider value={contextValue}>
      <div aria-hidden className="wp-backdrop">
        {layers.map((layer) => {
          return (
            <div
              key={layer.id}
              className="wp-layer"
              style={{ background: `${layer.overlay}, ${layer.background}, #020617` }}
            />
          );
        })}
      </div>
      {children}
    </WallpaperContext.Provider>
  );
}

export function useWallpaper() {
  const context = useContext(WallpaperContext);
  if (!context) {
    throw new Error("useWallpaper must be used within WallpaperProvider");
  }
  return context;
}
