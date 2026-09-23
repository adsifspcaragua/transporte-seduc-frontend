export type FrequenciaTab = {
  label: string;
  href: string;
  permission: "frequencias.view" | "justificativas.view";
};

export const FREQUENCIA_TABS: FrequenciaTab[] = [
  {
    label: "Chamada diária",
    href: "/frequencias",
    permission: "frequencias.view",
  },
  {
    label: "Histórico",
    href: "/frequencias/chamadas",
    permission: "frequencias.view",
  },
  {
    label: "Justificativas",
    href: "/frequencias/justificativas",
    permission: "justificativas.view",
  },
  {
    label: "Relatórios",
    href: "/frequencias/relatorio",
    permission: "frequencias.view",
  },
];

export function getVisibleFrequencyTabs(permissions: string[]) {
  return FREQUENCIA_TABS.filter(({ permission }) =>
    permissions.includes(permission),
  );
}

export function getFrequencyLandingPath(permissions: string[]) {
  return getVisibleFrequencyTabs(permissions)[0]?.href ?? "/frequencias";
}

export function isFrequencyTabActive(pathname: string, href: string) {
  if (href === "/frequencias") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
