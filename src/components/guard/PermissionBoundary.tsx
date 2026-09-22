"use client";

import { ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useAuthz } from "@/hooks/use-authz";
import { hasRouteAccess } from "@/utils/authz";

export function PermissionBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { permissions } = useAuthz();

  if (!hasRouteAccess(pathname, permissions)) {
    return (
      <section
        aria-labelledby="access-denied-title"
        className="mx-auto mt-16 max-w-xl rounded-xl border border-amber-200 bg-white p-8 text-center shadow-sm"
      >
        <ShieldAlert
          aria-hidden="true"
          className="mx-auto mb-4 size-10 text-amber-600"
        />
        <h1
          className="text-xl font-semibold text-slate-900"
          id="access-denied-title"
        >
          Acesso negado
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Você não possui permissão para acessar esta página.
        </p>
      </section>
    );
  }

  return children;
}
