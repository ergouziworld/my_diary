import type { NavIconName } from "@/components/layout/NavIcon";

export const sidebarLinks: ReadonlyArray<{ href: string; label: string; icon: NavIconName }> = [
  { href: "/", label: "今日", icon: "home" },
  { href: "/timeline", label: "时光轴", icon: "timeline" },
  { href: "/mood", label: "心情", icon: "mood" },
  { href: "/tasks", label: "计划", icon: "tasks" },
  { href: "/finance", label: "账本", icon: "finance" },
  { href: "/album", label: "相册", icon: "album" },
  { href: "/world", label: "记忆星球", icon: "world" },
  { href: "/work", label: "学习", icon: "work" },
  { href: "/chat", label: "聊聊", icon: "chat" },
  { href: "/memory", label: "记忆库", icon: "memory" },
  { href: "/settings", label: "设置", icon: "settings" },
];
