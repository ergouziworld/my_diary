export type WallpaperKey = "none" | "aurora" | "paper" | "sunset" | "forest" | "midnight";
export type WallpaperValue = WallpaperKey | `image:${string}`;

export type WallpaperOption = {
  key: WallpaperKey;
  label: string;
  description: string;
  background: string;
  overlay: string;
  preview: string;
  imageUrl?: string;
};

function cssUrl(url: string) {
  // contain：完整显示原图，不裁剪/不过度放大；空白处由 overlay + 底色填充
  return `url(${JSON.stringify(url)}) center / contain no-repeat`;
}

export function imageWallpaperValue(url: string): WallpaperValue {
  return `image:${url}`;
}

export function getWallpaperImageUrl(value: string | null | undefined) {
  if (!value) return null;
  if (value.startsWith("image:")) return value.slice("image:".length).trim() || null;
  if (
    value.startsWith("/uploads/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  ) {
    return value;
  }
  return null;
}

export const WALLPAPERS: WallpaperOption[] = [
  {
    key: "none",
    label: "None",
    description: "Keep the original dark surface.",
    background: "#020617",
    overlay: "linear-gradient(180deg, rgb(2 6 23 / 0.92), rgb(2 6 23 / 0.92))",
    preview: "linear-gradient(135deg, #020617, #111827)"
  },
  {
    key: "aurora",
    label: "Aurora",
    description: "Soft cyan and rose light.",
    background:
      "radial-gradient(circle at 18% 18%, rgb(45 212 191 / 0.38), transparent 32%), radial-gradient(circle at 82% 12%, rgb(244 114 182 / 0.32), transparent 30%), linear-gradient(135deg, #020617, #172554 52%, #111827)",
    overlay: "linear-gradient(180deg, rgb(2 6 23 / 0.72), rgb(2 6 23 / 0.86))",
    preview: "linear-gradient(135deg, #14b8a6, #1d4ed8 52%, #db2777)"
  },
  {
    key: "paper",
    label: "Paper",
    description: "Quiet writing desk texture.",
    background:
      "linear-gradient(120deg, rgb(15 23 42 / 0.96), rgb(30 41 59 / 0.92)), repeating-linear-gradient(0deg, rgb(255 255 255 / 0.08) 0 1px, transparent 1px 28px)",
    overlay: "linear-gradient(180deg, rgb(2 6 23 / 0.68), rgb(2 6 23 / 0.82))",
    preview: "linear-gradient(135deg, #334155, #64748b)"
  },
  {
    key: "sunset",
    label: "Sunset",
    description: "Warm evening light for review pages.",
    background:
      "radial-gradient(circle at 72% 20%, rgb(251 146 60 / 0.45), transparent 28%), radial-gradient(circle at 20% 78%, rgb(244 63 94 / 0.3), transparent 34%), linear-gradient(135deg, #1e1b4b, #7c2d12 62%, #020617)",
    overlay: "linear-gradient(180deg, rgb(2 6 23 / 0.7), rgb(2 6 23 / 0.86))",
    preview: "linear-gradient(135deg, #7c3aed, #f97316, #e11d48)"
  },
  {
    key: "forest",
    label: "Forest",
    description: "Deep green focus mode.",
    background:
      "radial-gradient(circle at 22% 28%, rgb(34 197 94 / 0.34), transparent 30%), radial-gradient(circle at 78% 70%, rgb(20 184 166 / 0.24), transparent 32%), linear-gradient(135deg, #052e16, #0f172a)",
    overlay: "linear-gradient(180deg, rgb(2 6 23 / 0.72), rgb(2 6 23 / 0.88))",
    preview: "linear-gradient(135deg, #14532d, #059669, #0f172a)"
  },
  {
    key: "midnight",
    label: "Midnight",
    description: "Low contrast night palette.",
    background:
      "radial-gradient(circle at 50% 0%, rgb(99 102 241 / 0.24), transparent 34%), linear-gradient(135deg, #020617, #111827 58%, #0f172a)",
    overlay: "linear-gradient(180deg, rgb(2 6 23 / 0.78), rgb(2 6 23 / 0.9))",
    preview: "linear-gradient(135deg, #020617, #312e81, #0f172a)"
  }
];

export const DEFAULT_WALLPAPER: WallpaperKey = "aurora";

export function getWallpaper(value: string | null | undefined): WallpaperOption {
  const imageUrl = getWallpaperImageUrl(value);
  if (imageUrl) {
    return {
      key: "none",
      label: "Custom image",
      description: "Uploaded image wallpaper.",
      background: cssUrl(imageUrl),
      overlay: "linear-gradient(180deg, rgb(2 6 23 / 0.34), rgb(2 6 23 / 0.7))",
      preview: cssUrl(imageUrl),
      imageUrl
    };
  }

  return WALLPAPERS.find((wallpaper) => wallpaper.key === value) ?? WALLPAPERS[0];
}
