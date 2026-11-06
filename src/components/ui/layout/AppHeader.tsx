"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useAuthz } from "@/hooks/use-authz";
import { cn } from "@/utils/cn";

type AppHeaderProps = {
  isMobileSidebarOpen?: boolean;
  onOpenMobileSidebar?: () => void;
};

export function AppHeader({
  isMobileSidebarOpen = false,
  onOpenMobileSidebar,
}: AppHeaderProps) {
  const { signOut, user } = useAuth();
  const { can } = useAuthz();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (!userMenuRef.current?.contains(target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        if (userMenuRef.current?.contains(document.activeElement)) {
          userMenuButtonRef.current?.focus();
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSignOut() {
    setIsUserMenuOpen(false);
    void signOut();
  }

  return (
    <header className="sticky top-0 z-10 flex h-[70px] min-w-0 items-center justify-between gap-3 bg-white px-5 shadow-sm lg:px-8">
      <Image
        alt="Prefeitura Municipal de Caraguatatuba"
        className="h-10 w-36 min-w-0 object-contain object-left sm:h-12 sm:w-44 lg:w-48"
        height={176}
        src="/logo_caraguatatuba.svg"
        width={622}
      />
      <button
        aria-controls="mobile-sidebar"
        aria-expanded={isMobileSidebarOpen}
        aria-label="Abrir menu"
        className="ml-auto flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-brand-600 text-white lg:hidden"
        onClick={onOpenMobileSidebar}
        type="button"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex min-w-0 shrink-0 items-center gap-4">
        <div className="relative h-12" ref={userMenuRef}>
          <button
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            aria-label="Abrir menu do usuário"
            className="col-start-1 row-start-1 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-2 text-brand-600 transition-colors hover:bg-brand-100/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:justify-start"
            onClick={() => setIsUserMenuOpen((current) => !current)}
            ref={userMenuButtonRef}
            type="button"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 ring-1 ring-brand-600/15">
              <UserCircle className="size-6" />
            </span>
            <span className="hidden min-w-0 flex-col justify-center text-left leading-none sm:flex">
              <span className="block max-w-40 truncate text-sm font-bold leading-5">
                {user?.name ?? "Gestor UNIBUS"}
              </span>
              <span className="block text-xs font-medium leading-4 text-brand-600/75">
                Admin
              </span>
            </span>
            <ChevronDown
              className={cn(
                "hidden size-4 shrink-0 text-brand-600/80 transition-transform sm:block",
                isUserMenuOpen && "rotate-180",
              )}
            />
          </button>

          <div
            aria-hidden={!isUserMenuOpen}
            aria-label="Menu do usuário"
            className={cn(
              "absolute right-0 top-[calc(100%+0.5rem)] z-50 w-max min-w-full max-w-[calc(100vw-2.5rem)] rounded-md border border-brand-600/10 bg-white py-2 shadow-[0_12px_30px_rgba(0,0,0,0.16)]",
              !isUserMenuOpen && "pointer-events-none invisible",
            )}
            inert={!isUserMenuOpen}
            role="menu"
          >
            <Link
              className="flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-100/40"
              href="/perfil"
              onClick={() => setIsUserMenuOpen(false)}
              role="menuitem"
            >
              <UserCircle
                aria-hidden="true"
                className="size-4 shrink-0 text-brand-600"
              />
              Meu perfil
            </Link>
            <button
              className="flex w-full cursor-pointer items-center gap-3 whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-100/40"
              role="menuitem"
              type="button"
            >
              <Settings
                aria-hidden="true"
                className="size-4 shrink-0 text-brand-600"
              />
              Configurações
            </button>
            {can("users.view") && (
              <Link
                className="flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-100/40"
                href="/usuarios"
                onClick={() => setIsUserMenuOpen(false)}
                role="menuitem"
              >
                <Users
                  aria-hidden="true"
                  className="size-4 shrink-0 text-brand-600"
                />
                Usuários
              </Link>
            )}
            <div aria-hidden="true" className="my-1 h-px bg-slate-100" />
            <button
              className="flex w-full cursor-pointer items-center gap-3 whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium text-danger-600 transition-colors hover:bg-danger-600/10"
              onClick={handleSignOut}
              role="menuitem"
              type="button"
            >
              <LogOut aria-hidden="true" className="size-4 shrink-0" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
