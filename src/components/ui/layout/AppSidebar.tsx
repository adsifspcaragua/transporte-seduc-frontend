"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAuthz } from "@/hooks/use-authz";
import { sidebarItems } from "@/services/navigation/sidebar-items";
import { cn } from "@/utils/cn";

export const SIDEBAR_COLLAPSED_WIDTH = 80;
export const SIDEBAR_EXPANDED_WIDTH = 240;

type AppSidebarProps = {
  isOpen: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
};

function isPathActive(pathname: string, href: string, exact = false) {
  if (href === "/" || exact) return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  isOpen,
  isMobileOpen,
  onToggle,
  onMobileClose,
}: AppSidebarProps) {
  const pathname = usePathname();
  const mobileDialogRef = useRef<HTMLDialogElement>(null);
  const { canAny } = useAuthz();
  const visibleItems = sidebarItems.filter(
    (item) => !item.permissions || canAny(item.permissions),
  );

  useEffect(() => {
    const dialog = mobileDialogRef.current;
    if (!dialog || !isMobileOpen) return;

    const desktopQuery = window.matchMedia("(min-width: 64rem)");
    if (desktopQuery.matches) {
      onMobileClose();
      return;
    }

    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleResize() {
      if (desktopQuery.matches) onMobileClose();
    }

    desktopQuery.addEventListener("change", handleResize);
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      desktopQuery.removeEventListener("change", handleResize);
    };
  }, [isMobileOpen, onMobileClose]);

  function renderNavigation(expanded: boolean, onNavigate?: () => void) {
    return (
      <nav
        aria-label="Navegação principal"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = isPathActive(pathname, item.href, item.exact);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "group relative flex min-h-11 w-full cursor-pointer items-center rounded-md px-3 py-2.5 text-left text-[15px] font-medium transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white",
                  !expanded && "justify-center px-0",
                  isActive && "bg-brand-700",
                )}
                href={item.href}
                key={item.label}
                onClick={onNavigate}
                title={expanded ? undefined : item.label}
              >
                <Icon className="size-5 shrink-0" />
                {expanded && (
                  <span className="ml-2 min-w-0 flex-1 whitespace-normal break-words pr-1 leading-5">
                    {item.label}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-0 right-0 w-[6px] rounded-r-md bg-white transition-opacity group-hover:opacity-100",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden flex-col bg-brand-600 text-white shadow-xl transition-[width] duration-300 ease-in-out lg:flex"
        style={{
          width: isOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
        }}
      >
        <div className="flex h-full min-h-0 flex-col px-4 py-10">
          <div className="mb-12 flex h-10 shrink-0 items-center">
            <button
              aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isOpen}
              className="flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md text-white transition-colors duration-300 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={onToggle}
              type="button"
            >
              <Menu className="size-6" />
            </button>
            {isOpen && (
              <Link
                aria-label="Ir para dashboard"
                className="ml-3 min-w-0 text-2xl font-bold tracking-wide hover:text-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                href="/"
              >
                UNIBUS
              </Link>
            )}
          </div>

          {renderNavigation(isOpen)}
        </div>
      </aside>
      <dialog
        aria-label="Menu de navegação"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(20rem,calc(100vw-2rem))] max-w-none border-0 bg-brand-600 p-0 text-white shadow-xl backdrop:bg-overlay/45"
        id="mobile-sidebar"
        onCancel={(event) => {
          event.preventDefault();
          onMobileClose();
        }}
        onPointerDown={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.target === event.currentTarget &&
            (event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom)
          ) {
            onMobileClose();
          }
        }}
        ref={mobileDialogRef}
      >
        <div className="flex h-full min-h-0 flex-col px-4 py-6">
          <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
            <Link
              className="text-2xl font-bold tracking-wide focus-visible:outline-2 focus-visible:outline-white"
              href="/"
              onClick={onMobileClose}
            >
              UNIBUS
            </Link>
            <button
              aria-label="Fechar menu"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
              onClick={onMobileClose}
              type="button"
            >
              <X className="size-6" />
            </button>
          </div>
          {renderNavigation(true, onMobileClose)}
        </div>
      </dialog>
    </>
  );
}
