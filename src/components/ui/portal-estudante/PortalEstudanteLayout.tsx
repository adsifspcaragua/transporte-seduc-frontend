"use client";

import {
  BusFront,
  CalendarCheck2,
  House,
  LogOut,
  QrCode,
  Smartphone,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/buttons";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/utils/cn";

const navigation = [
  { href: "/portal-estudante", label: "Início", icon: House },
  { href: "/portal-estudante/transporte", label: "Transporte", icon: BusFront },
  {
    href: "/portal-estudante/frequencia",
    label: "Frequência",
    icon: CalendarCheck2,
  },
  {
    href: "/portal-estudante/dispositivo",
    label: "Dispositivo",
    icon: Smartphone,
  },
  { href: "/portal-estudante/conta", label: "Minha conta", icon: UserCircle },
];

export function PortalEstudanteLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const allowed = user?.permissions.includes("presencas.registrar");
  return (
    <div className="min-h-screen bg-app-surface text-content-primary">
      <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between gap-3 bg-white px-4 shadow-sm sm:px-6">
        <Link
          aria-label="Início do Portal do Estudante"
          href="/portal-estudante"
        >
          <Image
            alt="Prefeitura Municipal de Caraguatatuba"
            className="h-11 w-40 object-contain object-left"
            src="/logo_caraguatatuba.svg"
            height={176}
            width={622}
          />
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden max-w-48 truncate text-sm font-semibold text-brand-600 sm:block">
            {user?.name}
          </span>
          <Button
            aria-label="Sair do portal"
            fullWidth={false}
            leftIcon={<LogOut />}
            onClick={() => void signOut()}
            variant="ghost"
          >
            Sair
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
              UNIBUS
            </p>
            <h1 className="text-xl font-bold text-brand-700">
              Portal do Estudante
            </h1>
          </div>
          {allowed && (
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              href="/portal-estudante/presenca"
            >
              <QrCode className="size-5" />
              Registrar presença
            </Link>
          )}
        </div>
        {allowed ? (
          <>
            <nav
              aria-label="Navegação do estudante"
              className="mb-6 overflow-x-auto rounded-lg border border-brand-600/15 bg-white"
            >
              <div className="flex min-w-max">
                {navigation.map(({ href, label, icon: Icon }) => (
                  <Link
                    aria-current={pathname === href ? "page" : undefined}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 border-b-2 border-transparent px-4 text-sm font-semibold text-content-secondary hover:bg-surface-muted",
                      pathname === href &&
                        "border-brand-600 bg-brand-600/5 text-brand-600",
                    )}
                    href={href}
                    key={href}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
            <main className="space-y-5">{children}</main>
          </>
        ) : (
          <main className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-bold">Acesso ao estudante indisponível</h2>
            <p className="mt-2 text-sm text-content-secondary">
              Esta conta não possui acesso ao Portal do Estudante. Procure a
              equipe responsável pelo transporte.
            </p>
            <Link
              className="mt-4 inline-block text-sm font-semibold text-brand-600 underline"
              href="/"
            >
              Voltar ao sistema
            </Link>
          </main>
        )}
      </div>
    </div>
  );
}
