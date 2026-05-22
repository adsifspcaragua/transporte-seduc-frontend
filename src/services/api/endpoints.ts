export const API_ENDPOINTS = {
  AUTH: {
    CSRF_COOKIE: "/sanctum/csrf-cookie",
    LOGIN: "/login",
    LOGOUT: "/logout",
    ME: "/me",
  },
  INSCRICOES: {
    BASE: "/inscricoes",
    BY_ID: (id: number | string) => `/inscricoes/${id}`,
    DOCUMENTOS: (inscricaoId: number | string) =>
      `/inscricoes/${inscricaoId}/documentos`,
    DOCUMENTO_BY_ID: (
      inscricaoId: number | string,
      documentoId: number | string,
    ) => `/inscricoes/${inscricaoId}/documentos/${documentoId}`,
    INSTITUICOES: (inscricaoId: number | string) =>
      `/inscricoes/${inscricaoId}/instituicoes`,
    INSTITUICAO_BY_ID: (
      inscricaoId: number | string,
      instituicaoId: number | string,
    ) => `/inscricoes/${inscricaoId}/instituicoes/${instituicaoId}`,
  },
  INSTITUICOES: {
    BASE: "/instituicao",
  },
  ESTUDANTES: {
    BASE: "/estudantes",
    COUNT: "/contar-estudantes",
    BY_ID: (id: number | string) => `/estudantes/${id}`,
  },
} as const;
