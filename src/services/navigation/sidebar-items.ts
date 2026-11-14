import {
  BusFront,
  ClipboardEdit,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
  Shield,
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
    label: "Gestão do transporte",
    icon: BusFront,
    href: "/transportes",
    permissions: [
      "linhas.view",
      "veiculos.view",
      "viagens.view",
      "geocercas.view",
    ],
  },
  {
    label: "Embarques e presenças",
    icon: ClipboardEdit,
    href: "/embarques",
    permissions: ["presencas.view", "dispositivos.view"],
  },
  {
    label: "Administração",
    icon: Shield,
    href: "/administracao",
    permissions: [
      "auditoria.view",
      "roles.view",
      "instituicoes.write",
      "instituicoes.delete",
    ],
  },
];
