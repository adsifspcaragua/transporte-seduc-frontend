export const API_ENDPOINTS = {
  AUTH: {
    CSRF_COOKIE: "/sanctum/csrf-cookie",
    LOGIN: "/login",
    LOGOUT: "/logout",
    ME: "/me",
  },
  USERS: {
    BASE: "/users",
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
    ANALISE: (id: number | string) => `/reecadastro/solicitacoes/${id}/analise`,
    PERIODOS: "/reecadastro/periodos",
    PERIODO_BY_ID: (id: number | string) => `/reecadastro/periodos/${id}`,
    AUSENTES: (id: number | string) => `/reecadastro/periodos/${id}/ausentes`,
    INATIVAR_AUSENTES: (id: number | string) =>
      `/reecadastro/periodos/${id}/inativar-ausentes`,
    ABRIR_PERIODO: (id: number | string) => `/reecadastro/periodos/${id}/abrir`,
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
  DASHBOARD: "/dashboard",
  LINHAS: {
    BASE: "/linha",
    BY_ID: (id: number | string) => `/linha/${id}`,
    ESTUDANTES: (id: number | string) => `/linha/${id}/estudantes`,
  },
  FREQUENCIAS: {
    LINHAS: "/frequencias/linhas",
    CHAMADAS: "/frequencias/chamadas",
    CHAMADA_BY_ID: (id: number | string) => `/frequencias/chamadas/${id}`,
    FECHAR: (id: number | string) => `/frequencias/chamadas/${id}/fechar`,
    REABRIR: (id: number | string) => `/frequencias/chamadas/${id}/reabrir`,
    JUSTIFICATIVAS: "/frequencias/justificativas",
    JUSTIFICATIVA_BY_ID: (id: number | string) =>
      `/frequencias/justificativas/${id}`,
    ANALISAR_JUSTIFICATIVA: (id: number | string) =>
      `/frequencias/justificativas/${id}/analise`,
    RELATORIO: "/frequencias/relatorio",
    RELATORIO_ESTUDANTE: (id: number | string) =>
      `/frequencias/estudantes/${id}/relatorio`,
  },
  ESTUDANTES: {
    BASE: "/estudantes",
    COUNT: "/contar-estudantes",
    BY_ID: (id: number | string) => `/estudantes/${id}`,
  },
} as const;
