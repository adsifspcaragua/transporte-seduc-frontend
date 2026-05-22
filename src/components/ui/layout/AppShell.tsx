"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { AppFooter } from "@/components/ui/layout/AppFooter";
import { AppHeader } from "@/components/ui/layout/AppHeader";
import {
  AppSidebar,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
} from "@/components/ui/layout/AppSidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-slate-950">
      <AppSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((current) => !current)}
      />

      <div
        className="transition-[padding-left] duration-300 ease-in-out lg:pl-[var(--sidebar-width)]"
        style={
          {
            "--sidebar-width": `${
              isSidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH
            }px`,
          } as React.CSSProperties
        }
      >
        <AppHeader />
        <main className="px-5 py-6 lg:px-8">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
