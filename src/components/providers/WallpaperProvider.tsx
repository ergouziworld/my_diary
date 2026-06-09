"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DEFAULT_WALLPAPER,
  getWallpaper,
  type WallpaperValue
} from "@/lib/wallpapers";

type WallpaperMap = Record<string, WallpaperValue>;

// 模块级缓存：避免每次切页都重新请求接口（那会造成切页卡顿 + 背景跳变闪烁）
let cachedMap: WallpaperMap | null = null;
let cachedUserId: string | undefined;
let lastBackground = "";
let lastOverlay = "";
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

// 同步应用：仅当壁纸值真的变化时才写 CSS 变量，避免无谓重绘/闪烁
function applyFromMap(pathname: string, map: WallpaperMap) {
  const wallpaper = getWallpaper(map[pathname] ?? DEFAULT_WALLPAPER);
  if (wallpaper.imageUrl) preloadImage(wallpaper.imageUrl);

  if (wallpaper.background !== lastBackground) {
    document.documentElement.style.setProperty("--wallpaper-background", wallpaper.background);
    lastBackground = wallpaper.background;
  }
  if (wallpaper.overlay !== lastOverlay) {
    document.documentElement.style.setProperty("--wallpaper-overlay", wallpaper.overlay);
    lastOverlay = wallpaper.overlay;
  }
}

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // 切页：命中缓存就瞬时应用（零网络等待、零闪烁）；缓存缺失或换了用户才拉一次
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
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, status, userId]);

  // 用户在设置页/浮窗里改了壁纸：刷新缓存并重应用当前页
  useEffect(() => {
    if (status !== "authenticated") return;

    function refresh() {
      void fetchWallpaperMap().then((map) => {
        cachedMap = map;
        cachedUserId = userId;
        applyFromMap(pathname, map);
      });
    }

    window.addEventListener("wallpaperchange", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wallpaperchange", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [pathname, status, userId]);

  return <>{children}</>;
}
