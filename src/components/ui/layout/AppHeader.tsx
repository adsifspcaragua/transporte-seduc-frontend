"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  SlidersHorizontal,
  UserCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/utils/cn";

type AppHeaderProps = {
  onOpenMobileSidebar?: () => void;
};

export function AppHeader({ onOpenMobileSidebar }: AppHeaderProps) {
  const { signOut, user } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

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
    <header className="sticky top-0 z-10 flex h-[70px] items-center justify-between bg-white px-5 shadow-sm lg:justify-end lg:px-8">
      <button
        aria-label="Abrir menu"
        className="flex size-10 cursor-pointer items-center justify-center rounded-md bg-brand-600 text-white lg:hidden"
        onClick={onOpenMobileSidebar}
        type="button"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex items-center gap-4">
        <button
          aria-label="Alternar tema"
          className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          type="button"
        >
          <Moon className="size-5 fill-white text-white" />
        </button>

        <div className="relative" ref={userMenuRef}>
          <button
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            aria-label="Abrir menu do usuário"
            className="flex h-12 cursor-pointer items-center gap-2 rounded-md px-2 text-brand-600 transition-colors hover:bg-brand-100/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            onClick={() => setIsUserMenuOpen((current) => !current)}
            type="button"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 ring-1 ring-brand-600/15">
              <UserCircle className="size-6" />
            </span>
            <span className="hidden min-w-0 flex-col justify-center text-left leading-none sm:flex">
              <span className="block max-w-40 truncate text-sm font-bold leading-5">
                {user?.name ?? "Gestor SIGTU"}
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

          {isUserMenuOpen && (
            <div
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-md border border-brand-600/10 bg-white py-2 shadow-[0_12px_30px_rgba(0,0,0,0.16)]"
              role="menu"
            >
              <button
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-100/40"
                role="menuitem"
                type="button"
              >
                <Settings className="size-4 text-brand-600" />
                Configurações
              </button>
              <button
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-100/40"
                role="menuitem"
                type="button"
              >
                <SlidersHorizontal className="size-4 text-brand-600" />
                Preferências
              </button>
              <div className="my-1 h-px bg-slate-100" />
              <button
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-danger-600 transition-colors hover:bg-danger-600/10"
                onClick={handleSignOut}
                role="menuitem"
                type="button"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
