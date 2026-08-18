export type RecadastroStatus =
  | "Pendente"
  | "Em analise"
  | "Pendencia"
  | "Aprovado"
  | "Rejeitado";

export type PeriodoRecadastro = {
  id: number;
  ano: number;
  semestre: 1 | 2;
  referencia: string;
  data_inicio: string;
  data_fim: string;
  status: "Aberto" | "Fechado";
  observacoes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DocumentoRecadastroTipo =
  | "declaracao_matricula"
  | "cronograma_aulas"
  | "comprovante_residencia";

export type DocumentoRecadastroSituacao = {
  type: DocumentoRecadastroTipo;
  label: string;
  aceita_prazo: boolean;
  status: string | null;
  nome_original: string | null;
  enviado_em: string | null;
  pendente: boolean;
  observacoes: string | null;
};

export type DocumentoRecadastro = {
  id: number;
  estudante_id: number;
  solicitacao_id: number;
  type: DocumentoRecadastroTipo;
  label: string;
  nome_original: string;
  status: string;
  observacoes: string | null;
  download_url?: string;
  preview_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type EstudanteRecadastro = {
  id: number;
  name: string;
  cpf?: string;
  email: string | null;
  phone: string | null;
  address?: string | null;
  status?: string;
};

export type CampoPendenteRecadastro = {
  campo: string;
  label: string;
};

export type SituacaoRecadastro = {
  solicitacao_id: number;
  token: string | null;
  status: RecadastroStatus;
  observacoes: string | null;
  // Campos do cadastro que a responsável pediu para corrigir, já com o rótulo.
  campos_pendentes: CampoPendenteRecadastro[];
  pode_enviar: boolean;
  prazo_matricula: boolean;
  prazo_cronograma: boolean;
  enviada_em: string | null;
  periodo: Pick<
    PeriodoRecadastro,
    "id" | "referencia" | "data_inicio" | "data_fim" | "status"
  >;
  estudante: EstudanteRecadastro;
  cadastro: CadastroRecadastro;
  documentos: DocumentoRecadastroSituacao[];
};

export type CadastroRecadastro = {
  name: string;
  cpf: string;
  rg: string | null;
  birth_date: string;
  father_name: string | null;
  mother_name: string;
  phone: string;
  email: string;
  cep: string;
  address: string;
  neighborhood: string;
  complement: string | null;
  city: string;
  number: string | number;
  course: string;
  semester: string;
  expected_completion: string;
  instituicao_id: number;
  shift: number;
  city_destination: string;
  used_transport: boolean;
  days_of_week: number[];
  has_scholarship: boolean;
  scholarship_type: string | null;
};

export type AcessoEstudanteResponse =
  | { fluxo: "inscricao"; data: { cpf: string } }
  | {
      fluxo: "lista_espera";
      data: {
        pode_editar: boolean;
        inscricao: import("@/types/inscricao").Inscricao;
        instituicao: import("@/types/inscricao").InscricaoInstituicao | null;
        documentos: import("@/types/inscricao").InscricaoDocumento[];
      };
    }
  | { fluxo: "recadastro"; data: SituacaoRecadastro };

export type SolicitacaoRecadastro = {
  id: number;
  estudante_id: number;
  periodo_id: number;
  status: RecadastroStatus;
  observacoes: string | null;
  campos_pendentes: string[];
  prazo_matricula: boolean;
  prazo_cronograma: boolean;
  aceite_veracidade: boolean;
  aceite_ciencia: boolean;
  enviada_em: string | null;
  analisado_por: number | null;
  analisado_em: string | null;
  estudante: EstudanteRecadastro;
  periodo: PeriodoRecadastro;
  documentos: DocumentoRecadastro[];
  created_at?: string;
  updated_at?: string;
};

export type FinalizarRecadastroPayload = {
  possui_matricula: boolean;
  possui_cronograma: boolean;
  prazo_matricula?: boolean;
  prazo_cronograma?: boolean;
  aceite_veracidade: boolean;
  aceite_ciencia: boolean;
};

export type AnaliseRecadastroPayload =
  | { decisao: "Aprovado"; motivo?: null; documentos?: never }
  | { decisao: "Rejeitado"; motivo: string; documentos?: never }
  | {
      decisao: "Pendencia";
      motivo: string;
      documentos: DocumentoRecadastroTipo[];
      campos?: string[];
    };

export type PeriodoRecadastroPayload = {
  ano: number;
  semestre: 1 | 2;
  data_inicio: string;
  data_fim: string;
  observacoes?: string | null;
};

// Estudante ativo que não concluiu o recadastro do período. A solicitação só
// nasce quando ele acessa pelo CPF, então quem nunca entrou não aparece na tela
// de solicitações — esta lista é a única forma de enxergá-lo.
export type EstudanteAusente = {
  id: number;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  situacao: string;
};

export type AusentesRecadastro = {
  data: EstudanteAusente[];
  periodo: {
    id: number;
    referencia: string;
    status: string;
  };
};
