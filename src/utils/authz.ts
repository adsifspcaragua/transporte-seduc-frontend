type RoutePermission = {
  prefix: string;
  permissions: string[];
};

const routePermissions: RoutePermission[] = [
  {
    prefix: "/transportes",
    permissions: [
      "linhas.view",
      "veiculos.view",
      "viagens.view",
      "geocercas.view",
    ],
  },
  {
    prefix: "/embarques",
    permissions: ["presencas.view", "dispositivos.view"],
  },
  {
    prefix: "/administracao",
    permissions: [
      "auditoria.view",
      "roles.view",
      "instituicoes.write",
      "instituicoes.delete",
    ],
  },
  { prefix: "/portal-estudante", permissions: ["presencas.registrar"] },
  { prefix: "/presenca/scan", permissions: ["presencas.registrar"] },
  { prefix: "/estudantes", permissions: ["estudantes.view"] },
  { prefix: "/linhas", permissions: ["linhas.view"] },
  { prefix: "/solicitacoes", permissions: ["inscricoes.view"] },
  {
    prefix: "/recadastramento",
    permissions: ["periodos.view", "solicitacoes.view"],
  },
  { prefix: "/usuarios", permissions: ["users.view"] },
];

export function can(permissions: string[], permission: string) {
  return permissions.includes(permission);
}

export function canAny(permissions: string[], required: string[]) {
  return required.some((permission) => can(permissions, permission));
}

export function hasRouteAccess(pathname: string, permissions: string[]) {
  const requirement = routePermissions.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return requirement ? canAny(permissions, requirement.permissions) : true;
}
