import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-950 text-white">
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex-1">
            <AppHeader />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
