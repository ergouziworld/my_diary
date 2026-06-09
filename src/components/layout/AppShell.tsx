"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageWallpaperControl } from "@/components/layout/PageWallpaperControl";
import { PetCompanion } from "@/components/pet/PetCompanion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1">
        <AppHeader />
        <main className="overflow-x-hidden p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">{children}</main>
      </div>
      <BottomNav />
      <PageWallpaperControl />
      <PetCompanion />
    </div>
  );
}
