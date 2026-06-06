"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { sidebarLinks } from "@/components/layout/navigation";
import {
  DEFAULT_WALLPAPER,
  WALLPAPERS,
  WALLPAPER_STORAGE_KEY,
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

function saveWallpaperMap(map: WallpaperMap) {
  try {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("wallpaperchange"));
}

export function WallpaperSwitcher() {
  const pathname = usePathname();
  const pageOptions = useMemo(() => [...sidebarLinks], []);
  const [selectedPath, setSelectedPath] = useState(pathname);
  const [wallpaperMap, setWallpaperMap] = useState<WallpaperMap>({});

  useEffect(() => {
    setWallpaperMap(readWallpaperMap());
  }, []);

  const selectedWallpaper = wallpaperMap[selectedPath] ?? DEFAULT_WALLPAPER;

  function apply(path: string, wallpaper: WallpaperKey) {
    const next = { ...wallpaperMap, [path]: wallpaper };
    setWallpaperMap(next);
    saveWallpaperMap(next);
  }

  function reset(path: string) {
    const next = { ...wallpaperMap };
    delete next[path];
    setWallpaperMap(next);
    saveWallpaperMap(next);
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

      <div className="grid gap-3 md:grid-cols-3">
        {WALLPAPERS.map((wallpaper) => {
          const active = selectedWallpaper === wallpaper.key;
          return (
            <button
              key={wallpaper.key}
              type="button"
              onClick={() => apply(selectedPath, wallpaper.key)}
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

      <button
        type="button"
        onClick={() => reset(selectedPath)}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20"
      >
        Use default for this page
      </button>
    </div>
  );
}
