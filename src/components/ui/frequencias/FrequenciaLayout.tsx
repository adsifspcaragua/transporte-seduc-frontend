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
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-content-muted">
          Controle de frequência
        </p>
        <h1 className="mt-1 text-2xl font-bold text-brand-600">Frequência</h1>
        <p className="mt-2 max-w-3xl text-sm text-content-secondary">
          Registre chamadas, consulte o histórico, analise justificativas e
          acompanhe os indicadores dos estudantes.
        </p>
      </header>

      <nav
        aria-label="Seções de frequência"
        className="mb-6 overflow-x-auto border-b border-border-subtle"
      >
        <div className="flex min-w-max gap-1">
          {getVisibleFrequencyTabs(permissions).map((tab) => {
            const Icon = TAB_ICONS[tab.href as keyof typeof TAB_ICONS];
            const active = isFrequencyTabActive(pathname, tab.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-2 rounded-t-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600",
                  active
                    ? "bg-white text-brand-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-600"
                    : "text-content-muted hover:bg-white/70 hover:text-brand-600",
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

      {children}
    </div>
  );
}
