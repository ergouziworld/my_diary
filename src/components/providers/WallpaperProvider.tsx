"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_WALLPAPER,
  WALLPAPER_STORAGE_KEY,
  getWallpaper,
  type WallpaperKey
} from "@/lib/wallpapers";

type WallpaperMap = Record<string, WallpaperKey>;

function readWallpaperMap(): WallpaperMap {
  try {
    const raw = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as WallpaperMap;
  } catch {
    return {};
  }
}

function applyWallpaper(pathname: string) {
  const map = readWallpaperMap();
  const wallpaper = getWallpaper(map[pathname] ?? DEFAULT_WALLPAPER);

  document.documentElement.style.setProperty("--wallpaper-background", wallpaper.background);
  document.documentElement.style.setProperty("--wallpaper-overlay", wallpaper.overlay);
}

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    applyWallpaper(pathname);

    function handleChange() {
      applyWallpaper(pathname);
    }

    window.addEventListener("wallpaperchange", handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener("wallpaperchange", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [pathname]);

  return <>{children}</>;
}
