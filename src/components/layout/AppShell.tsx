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
    <div className="app-frame flex min-h-screen">
      <AppSidebar />
      <div className="min-w-0 flex-1 md:pl-64">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:pb-10 md:pt-7">{children}</main>
      </div>
      <BottomNav />
      <PageWallpaperControl />
      <PetCompanion />
    </div>
  );
}
