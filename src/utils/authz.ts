type RoutePermission = {
  prefix: string;
  permissions: string[];
};

const routePermissions: RoutePermission[] = [
  {
    prefix: "/frequencias/justificativas",
    permissions: ["justificativas.view"],
  },
  { prefix: "/frequencias", permissions: ["frequencias.view"] },
  { prefix: "/estudantes", permissions: ["estudantes.view"] },
  { prefix: "/linhas", permissions: ["linhas.view"] },
  { prefix: "/solicitacoes", permissions: ["solicitacoes.view"] },
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
