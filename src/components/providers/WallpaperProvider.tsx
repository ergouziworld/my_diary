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

// 模块级缓存：避免每次切页都重新请求接口（那会造成切页卡顿 + 背景跳变闪烁）
let cachedMap: WallpaperMap | null = null;
let cachedUserId: string | undefined;
let lastBackground = "";
let lastOverlay = "";
let layerSeq = 0;
const preloadedImages = new Set<string>();

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

// 预加载映射里所有图片壁纸，让切页时背景图已在缓存中，避免切换闪烁
function preloadAllImages(map: WallpaperMap) {
  for (const value of Object.values(map)) {
    const wallpaper = getWallpaper(value);
    if (wallpaper.imageUrl) preloadImage(wallpaper.imageUrl);
  }
}

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // 用两层背景做淡入淡出：切壁纸时新层淡入覆盖旧层，避免生硬闪烁
  const [layers, setLayers] = useState<Layer[]>(() =>
    lastBackground ? [{ id: ++layerSeq, background: lastBackground, overlay: lastOverlay }] : []
  );

  const applyFromMap = useCallback((path: string, map: WallpaperMap) => {
    const wallpaper = getWallpaper(map[path] ?? DEFAULT_WALLPAPER);
    if (wallpaper.imageUrl) preloadImage(wallpaper.imageUrl);

    // 壁纸没变就不动，避免无谓重绘
    if (wallpaper.background === lastBackground && wallpaper.overlay === lastOverlay) return;
    lastBackground = wallpaper.background;
    lastOverlay = wallpaper.overlay;

    setLayers((prev) => {
      const base = prev.length ? [prev[prev.length - 1]] : [];
      return [...base, { id: ++layerSeq, background: wallpaper.background, overlay: wallpaper.overlay }];
    });
  }, []);

  // 切页：命中缓存瞬时应用；缓存缺失或换用户才拉一次
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
      applyFromMap(pathname, map);
      preloadAllImages(map);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, status, userId, applyFromMap]);

  // 用户在悬浮窗里改了壁纸：刷新缓存并重应用当前页
  useEffect(() => {
    if (status !== "authenticated") return;

    function refresh() {
      void fetchWallpaperMap().then((map) => {
        cachedMap = map;
        cachedUserId = userId;
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

  // 新层淡入完成后，移除它下面的旧层
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
