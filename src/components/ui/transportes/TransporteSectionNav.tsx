"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthz } from "@/hooks/use-authz";

const areas = {
  gestao: [
    { label: "Linhas", href: "/transportes", permissions: ["linhas.view"] },
    {
      label: "Calendário",
      href: "/transportes/calendario",
      permissions: ["viagens.view"],
    },
    {
      label: "Recursos",
      href: "/transportes/recursos",
      permissions: ["veiculos.view", "geocercas.view"],
    },
  ],
  embarques: [
    {
      label: "Visão geral",
      href: "/embarques",
      permissions: ["presencas.view"],
    },
    {
      label: "Presenças registradas",
      href: "/embarques/presencas",
      permissions: ["presencas.view"],
    },
    {
      label: "Ocorrências e revisões",
      href: "/embarques/ocorrencias",
      permissions: ["presencas.view"],
    },
    {
      label: "Dispositivos autorizados",
      href: "/embarques/dispositivos",
      permissions: ["dispositivos.view"],
    },
  ],
} as const;

export function TransporteSectionNav({ area }: { area: keyof typeof areas }) {
  const pathname = usePathname();
  const { canAny } = useAuthz();
  return (
    <nav
      aria-label={
        area === "gestao" ? "Gestão do transporte" : "Embarques e presenças"
      }
      className="flex flex-wrap gap-2 border-b border-border-subtle pb-3"
    >
      {areas[area]
        .filter((item) => canAny([...item.permissions]))
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 ${pathname === item.href ? "bg-brand-700 text-white" : "bg-white text-brand-700"}`}
          >
            {item.label}
          </Link>
        ))}
    </nav>
  );
}
