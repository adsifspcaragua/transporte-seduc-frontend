"use client";

import {
  BarChart3,
  CalendarCheck2,
  ClipboardList,
  History,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  getVisibleFrequencyTabs,
  isFrequencyTabActive,
} from "@/components/ui/frequencias/frequenciaNavigation";
import { useAuthz } from "@/hooks/use-authz";
import { cn } from "@/utils/cn";

const TAB_ICONS = {
  "/frequencias": CalendarCheck2,
  "/frequencias/chamadas": History,
  "/frequencias/justificativas": ClipboardList,
  "/frequencias/relatorio": BarChart3,
};

export function FrequenciaLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { permissions } = useAuthz();

  return (
    <div className="w-full">
      <header className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold text-brand-600">Frequência</h1>
        <nav
          aria-label="Seções de frequência"
          className="overflow-x-auto pb-1 xl:pb-0"
        >
          <div className="inline-flex min-w-max overflow-hidden rounded-lg border border-brand-600/20 bg-white">
            {getVisibleFrequencyTabs(permissions).map((tab) => {
              const Icon = TAB_ICONS[tab.href as keyof typeof TAB_ICONS];
              const active = isFrequencyTabActive(pathname, tab.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 border-r border-brand-600/15 px-4 text-sm font-semibold transition-colors last:border-r-0 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-brand-600",
                    active
                      ? "bg-action-light-default text-brand-700"
                      : "bg-white text-content-secondary hover:bg-surface-muted hover:text-brand-600",
                  )}
                  href={tab.href}
                  key={tab.href}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {children}
    </div>
  );
}
