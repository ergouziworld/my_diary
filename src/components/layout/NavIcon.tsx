export type NavIconName = "home" | "timeline" | "mood" | "tasks" | "finance" | "album" | "world" | "work" | "chat" | "memory" | "settings" | "write";

const paths: Record<NavIconName, React.ReactNode> = {
  home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9 20v-6h6v6"/></>,
  timeline: <><path d="M6 3v18M6 7h11l2 2-2 2H6M6 15h8l2 2-2 2H6"/></>,
  mood: <><circle cx="12" cy="12" r="8.5"/><path d="M8.5 10h.01M15.5 10h.01M8.5 15c1.8 1.5 5.2 1.5 7 0"/></>,
  tasks: <><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 2.5 2.5L16 9"/></>,
  finance: <><path d="M4 7.5h16v11H4zM4 10h16M15.5 14h2"/></>,
  album: <><rect x="3.5" y="4" width="17" height="16" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="m5 17 4-4 3 3 2-2 5 4"/></>,
  world: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></>,
  work: <><path d="M8 6V4h8v2M4 7h16v12H4zM4 12h16M10 12v2h4v-2"/></>,
  chat: <><path d="M4 5h16v12H9l-5 3V5Z"/><path d="M8 9h8M8 13h5"/></>,
  memory: <><path d="M7 4h10a2 2 0 0 1 2 2v14l-7-3-7 3V6a2 2 0 0 1 2-2Z"/><path d="M9 8h6M9 11h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/></>,
  write: <><path d="M5 19h4l10-10-4-4L5 15v4Z"/><path d="m13.5 6.5 4 4M4 21h16"/></>,
};

export function NavIcon({ name, className = "h-5 w-5" }: { name: NavIconName; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name]}</svg>;
}
