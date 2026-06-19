"use client";

import {
  ClipboardEdit,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
  MapIcon,
  Menu,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utils/cn";

export const SIDEBAR_COLLAPSED_WIDTH = 80;
export const SIDEBAR_EXPANDED_WIDTH = 240;

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Estudantes", icon: GraduationCap, href: "/estudantes" },
  { label: "Linhas", icon: MapIcon },
  { label: "Solicitações", icon: ClipboardEdit },
  { label: "Recadastramento", icon: ClipboardEdit },
];

type AppSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

function isPathActive(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/") return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 hidden flex-col bg-brand-600 text-white shadow-xl transition-[width] duration-300 ease-in-out lg:flex"
      style={{
        width: isOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
      }}
    >
      <div className="flex h-full flex-col px-4 py-10">
        <div className="mb-12 flex h-10 items-center">
          <button
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            className="flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md text-white transition-colors duration-300 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={onToggle}
            type="button"
          >
            <Menu className="size-6" />
          </button>
          <span
            className={cn(
              "ml-3 overflow-hidden whitespace-nowrap text-3xl font-bold tracking-wide transition-all duration-300",
              isOpen
                ? "max-w-[130px] translate-x-0 opacity-100"
                : "max-w-0 -translate-x-2 opacity-0",
            )}
          >
            SIGTU
          </span>
        </div>

        <nav>
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = isPathActive(pathname, item.href);
              const className = cn(
                "group relative flex h-11 w-full cursor-pointer items-center overflow-hidden rounded-md px-3 text-left text-[15px] font-medium transition-colors hover:bg-brand-700",
                isActive && "bg-brand-700",
              );
              const content = (
                <>
                  <Icon className="size-5 shrink-0" />
                  <span
                    className={cn(
                      "ml-2 overflow-hidden whitespace-nowrap transition-all duration-300",
                      isOpen
                        ? "max-w-[140px] translate-x-0 opacity-100"
                        : "max-w-0 -translate-x-2 opacity-0",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "absolute inset-y-0 right-0 w-[6px] bg-white transition-opacity group-hover:opacity-100",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                </>
              );

              if (item.href) {
                return (
                  <Link
                    className={className}
                    href={item.href}
                    key={item.label}
                    title={isOpen ? undefined : item.label}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  className={className}
                  key={item.label}
                  title={isOpen ? undefined : item.label}
                  type="button"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </nav>

        <div
          className={cn(
            "mt-auto w-[180px] shrink-0 transition-all duration-300 ease-in-out will-change-transform",
            isOpen ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0",
          )}
        >
          <Image
            alt="Governo Municipal de Caraguatatuba - Educação"
            className="h-auto w-full"
            height={96}
            src="/logo_educacao_w.svg"
            width={180}
          />
        </div>
      </div>
    </aside>
  );
}
