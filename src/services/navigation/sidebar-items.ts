import {
  ClipboardCheck,
  ClipboardEdit,
  GraduationCap,
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
    label: "Usuários",
    icon: Users,
    href: "/usuarios",
    permissions: ["users.view"],
  },
];
