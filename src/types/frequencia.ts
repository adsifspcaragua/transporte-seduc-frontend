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
