import "./globals.css";
import type { Viewport } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { WallpaperProvider } from "@/components/providers/WallpaperProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('theme')||'hot'}catch(e){document.documentElement.dataset.theme='hot'}`
          }}
        />
      </head>
      <body className="bg-slate-950 text-white">
        <SessionProvider>
          <WallpaperProvider>
            <AppShell>{children}</AppShell>
          </WallpaperProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
