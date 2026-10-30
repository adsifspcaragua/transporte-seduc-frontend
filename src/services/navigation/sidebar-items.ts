import {
  BusFront,
  ClipboardCheck,
  ClipboardEdit,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
  MapIcon,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
  permissions?: string[];
};

export const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  {
    label: "Estudantes",
    icon: GraduationCap,
    href: "/estudantes",
    permissions: ["estudantes.view"],
  },
  {
    label: "Linhas",
    icon: MapIcon,
    href: "/linhas",
    permissions: ["linhas.view"],
  },
  {
    label: "Frequência",
    icon: ClipboardCheck,
    href: "/frequencias",
    permissions: ["frequencias.view", "justificativas.view"],
  },
  {
    label: "Solicitações",
    icon: ClipboardEdit,
    href: "/solicitacoes",
    permissions: ["inscricoes.view"],
  },
  {
    label: "Recadastramento",
    icon: ClipboardEdit,
    href: "/recadastramento",
    permissions: ["periodos.view", "solicitacoes.view"],
  },
  {
    label: "Transporte e presença",
    icon: BusFront,
    href: "/transportes",
    permissions: [
      "veiculos.view",
      "viagens.view",
      "geocercas.view",
      "estudantes.view",
      "dispositivos.view",
      "presencas.view",
      "auditoria.view",
      "roles.view",
      "instituicoes.write",
      "instituicoes.delete",
    ],
  },
];
