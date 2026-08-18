export type DashboardLinha = {
  id: number;
  name: string;
  ocupacao: number;
  max_capacity: number;
  vagas_restantes: number;
};

export type DashboardResumo = {
  estudantes: {
    ativos: number;
    inativos: number;
    em_espera: number;
    total: number;
    // Ativo sem linha não tem como ser transportado: é pendência, não panorama.
    sem_linha: number;
  };
  inscricoes: {
    em_analise: number;
    incompletas: number;
    aprovadas: number;
    rejeitadas: number;
    total: number;
  };
  recadastro: {
    periodo: {
      id: number;
      referencia: string;
      status: string;
      data_fim: string | null;
    } | null;
    em_analise: number;
    pendencias: number;
    ausentes: number;
  };
  linhas: {
    total: number;
    capacidade_total: number;
    ocupacao_total: number;
    lista: DashboardLinha[];
  };
};
