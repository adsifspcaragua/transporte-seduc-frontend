import {
  BarChart3,
  ClipboardCheck,
  ClipboardEdit,
  FileCheck2,
  GraduationCap,
  History,
  LayoutDashboard,
  type LucideIcon,
  MapIcon,
  Users,
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
    exact: true,
    permissions: ["frequencias.view"],
  },
  {
    label: "Histórico de chamadas",
    icon: History,
    href: "/frequencias/chamadas",
    permissions: ["frequencias.view"],
  },
  {
    label: "Justificativas",
    icon: FileCheck2,
    href: "/frequencias/justificativas",
    permissions: ["justificativas.view"],
  },
  {
    label: "Relatório de frequência",
    icon: BarChart3,
    href: "/frequencias/relatorio",
    permissions: ["frequencias.view"],
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
    label: "Usuários",
    icon: Users,
    href: "/usuarios",
    permissions: ["users.view"],
  },
];
