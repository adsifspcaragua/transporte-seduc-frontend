export const API_ENDPOINTS = {
  AUTH: {
    CSRF_COOKIE: "/sanctum/csrf-cookie",
    LOGIN: "/login",
    LOGOUT: "/logout",
    ME: "/me",
  },
  INSCRICOES: {
    BASE: "/inscricoes",
    ANALISE: (id: number | string) => `/inscricoes/analise/${id}`,
    VALIDATE_STEP: "/inscricoes/validar-step",
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
  RECADASTRO: {
    CONSULTA: "/reecadastro/consulta",
    SOLICITACOES: "/reecadastro/solicitacoes",
    SOLICITACAO_BY_ID: (id: number | string) =>
      `/reecadastro/solicitacoes/${id}`,
    DOCUMENTOS: (id: number | string) =>
      `/reecadastro/solicitacoes/${id}/documentos`,
    FINALIZAR: (id: number | string) =>
      `/reecadastro/solicitacoes/${id}/finalizar`,
    ANALISE: (id: number | string) =>
      `/reecadastro/solicitacoes/${id}/analise`,
    PERIODOS: "/reecadastro/periodos",
    PERIODO_BY_ID: (id: number | string) => `/reecadastro/periodos/${id}`,
    ABRIR_PERIODO: (id: number | string) =>
      `/reecadastro/periodos/${id}/abrir`,
    FECHAR_PERIODO: (id: number | string) =>
      `/reecadastro/periodos/${id}/fechar`,
    DOWNLOAD_DOCUMENTO: (id: number | string) =>
      `/reecadastro/documentos/${id}/download`,
    ATUALIZAR_DADOS: (id: number | string) =>
      `/reecadastro/solicitacoes/${id}/dados`,
  },
  AREA_ESTUDANTE: {
    ACESSO: "/area-estudante/acesso",
  },
  INSTITUICOES: {
    BASE: "/instituicao",
  },
  CURSOS: {
    BASE: "/curso",
  },
  LINHAS: {
    BASE: "/linha",
  },
  ESTUDANTES: {
    BASE: "/estudantes",
    COUNT: "/contar-estudantes",
    BY_ID: (id: number | string) => `/estudantes/${id}`,
  },
} as const;
