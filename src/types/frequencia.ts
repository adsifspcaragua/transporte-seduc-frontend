export type FrequenciaSituacao =
  | "Pendente"
  | "Presente"
  | "Falta"
  | "Justificada";

export type ChamadaStatus = "Aberta" | "Fechada";

export type FrequenciaPessoa = {
  id: number;
  name: string;
};

export type FrequenciaLinha = {
  id: number;
  name: string;
  departure_time: string | null;
  return_time: string | null;
  motorista: FrequenciaPessoa | null;
  chamada_hoje: {
    id: number;
    status: ChamadaStatus;
  } | null;
};

export type FrequenciaRegistro = {
  id: number;
  estudante: {
    id: number;
    name: string;
    cpf: string | null;
  } | null;
  estudante_id: number;
  situacao: FrequenciaSituacao;
  observacao: string | null;
  marcada_em: string | null;
  justificativa: {
    id: number;
    status: "Em analise" | "Aprovada" | "Rejeitada";
    parecer: string | null;
  } | null;
};

export type Chamada = {
  id: number;
  data: string;
  status: ChamadaStatus;
  observacoes: string | null;
  fechada_em: string | null;
  linha: FrequenciaPessoa & {
    motorista?: FrequenciaPessoa | null;
  };
  registrada_por?: FrequenciaPessoa | null;
  contadores: {
    total: number;
    presentes: number;
    faltas: number;
    justificadas: number;
    pendentes: number;
  };
  frequencias: FrequenciaRegistro[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type AbrirChamadaPayload = {
  linha_id: number;
  data: string;
  observacoes?: string | null;
};

export type ListarChamadasParams = Partial<{
  linha_id: number;
  status: ChamadaStatus;
  data: string;
  de: string;
  ate: string;
  page: number;
  per_page: 10 | 15 | 20 | 30;
}>;

export type PaginatedChamadas = {
  data: Chamada[];
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
};

export type RegistrarFrequenciaItem = {
  estudante_id: number;
  situacao: FrequenciaSituacao;
  observacao?: string | null;
};

export type RegistrarFrequenciasPayload = {
  frequencias: RegistrarFrequenciaItem[];
};

export type DataResponse<T> = {
  data: T;
  message?: string;
};

export type UpdateChamadaResponse = DataResponse<Chamada> & {
  ignorados?: number[];
  bloqueados?: number[];
};

export type JustificativaStatus = "Em analise" | "Aprovada" | "Rejeitada";

export type Justificativa = {
  id: number;
  status: JustificativaStatus;
  motivo: string;
  parecer: string | null;
  estudante: {
    id: number;
    name: string;
    cpf: string | null;
    email: string | null;
    status: string | null;
  } | null;
  falta: {
    frequencia_id: number;
    situacao: FrequenciaSituacao;
    chamada_id: number;
    data: string;
    linha: FrequenciaPessoa | null;
  };
  enviada_por?: FrequenciaPessoa | null;
  analisada_por?: FrequenciaPessoa | null;
  analisada_em: string | null;
  created_at: string | null;
};

export type ListarJustificativasParams = Partial<{
  status: JustificativaStatus;
  estudante_id: number;
  linha_id: number;
  de: string;
  ate: string;
  page: number;
  per_page: 10 | 15 | 20 | 30;
}>;

export type PaginatedJustificativas = {
  data: Justificativa[];
  em_analise: number;
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
};

export type AnaliseJustificativaPayload =
  | { decisao: "Aprovada"; parecer?: null }
  | { decisao: "Rejeitada"; parecer: string };

export type AnaliseJustificativaResponse = DataResponse<Justificativa> & {
  alerta?: string;
};

export type CriarJustificativaPayload = {
  frequencia_id: number;
  motivo: string;
};

export type RelatorioFrequenciaParams = Partial<{
  de: string;
  ate: string;
  linha_id: number;
  faltas_consecutivas_min: number;
}>;

export type ResumoFrequencia = {
  chamadas: number;
  presencas: number;
  faltas: number;
  justificadas: number;
  pendentes: number;
  percentual_presenca: number | null;
  faltas_consecutivas: number;
};

export type RelatorioFrequenciaItem = ResumoFrequencia & {
  estudante: {
    id: number;
    name: string | null;
    cpf: string | null;
    status: string | null;
    linha: FrequenciaPessoa | null;
  };
};

export type RelatorioFrequenciaResponse = {
  data: RelatorioFrequenciaItem[];
  periodo: { de: string; ate: string };
  totais: {
    estudantes: number;
    presencas: number;
    faltas: number;
    justificadas: number;
    pendentes: number;
  };
};

export type HistoricoFrequenciaItem = {
  chamada_id: number;
  data: string;
  linha: FrequenciaPessoa;
  situacao: FrequenciaSituacao;
  observacao: string | null;
};

export type BeneficioFrequencia = {
  referencia: string;
  faltas_no_mes: number;
  maior_sequencia: number;
  sequencia_atual: number;
  limite_no_mes: number;
  limite_seguidas: number;
  datas_das_faltas: string[];
};

export type RelatorioEstudanteResponse = {
  data: RelatorioFrequenciaItem & {
    beneficio: BeneficioFrequencia | null;
    historico: HistoricoFrequenciaItem[];
  };
  periodo: { de: string; ate: string };
};
