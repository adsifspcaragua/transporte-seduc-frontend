"use client";

import { LogOut, Menu, Moon } from "lucide-react";

import { Button } from "@/components/buttons";
import { useAuth } from "@/hooks/use-auth";

type AppHeaderProps = {
  onOpenMobileSidebar?: () => void;
};

export function AppHeader({ onOpenMobileSidebar }: AppHeaderProps) {
  const { signOut, user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-[70px] items-center justify-between bg-brand-100 px-5 shadow-sm lg:justify-end lg:px-8">
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
          className="flex size-10 cursor-pointer items-center justify-center rounded-full text-brand-600 transition-colors hover:bg-white/50"
          type="button"
        >
          <Moon className="size-5 fill-brand-600" />
        </button>
        <div className="size-9 rounded-full bg-white" />
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-brand-600">
            {user?.name ?? "Gestor SIGTU"}
          </p>
          <p className="text-xs font-medium text-brand-600/80">Admin</p>
        </div>
        <Button
          aria-label="Sair"
          className="size-9 rounded-md"
          fullWidth={false}
          onClick={() => void signOut()}
          size="icon"
          title="Sair"
          variant="ghost"
        >
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
