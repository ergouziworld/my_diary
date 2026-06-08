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

let applyToken = 0;
const preloadedImages = new Set<string>();

async function readServerWallpaperMap(): Promise<WallpaperMap> {
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
  if (preloadedImages.has(url)) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      preloadedImages.add(url);
      resolve();
    };
    image.onerror = () => resolve();
    image.src = url;
  });
}

async function applyWallpaper(pathname: string) {
  const token = ++applyToken;
  const map = await readServerWallpaperMap();
  const wallpaper = getWallpaper(map[pathname] ?? DEFAULT_WALLPAPER);

  if (wallpaper.imageUrl) {
    await preloadImage(wallpaper.imageUrl);
  }

  if (token !== applyToken) return;

  document.documentElement.style.setProperty("--wallpaper-background", wallpaper.background);
  document.documentElement.style.setProperty("--wallpaper-overlay", wallpaper.overlay);
}

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    void applyWallpaper(pathname);

    function handleChange() {
      void applyWallpaper(pathname);
    }

    window.addEventListener("wallpaperchange", handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener("wallpaperchange", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [pathname, status, session?.user?.id]);

  return <>{children}</>;
}
