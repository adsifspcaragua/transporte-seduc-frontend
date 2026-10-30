export type TransporteReferencia = { id: number; name: string };
export type SentidoViagem = "Ida" | "Volta";
export type TransporteMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};
export type TransporteCollection<T> = { data: T[]; meta?: TransporteMeta };
export type QrVeiculo = { token: string; url: string };
export type Veiculo = {
  id: number;
  identificacao: string;
  placa: string | null;
  ativo: boolean;
  qr_gerado_em: string | null;
  atribuicoes?: AtribuicaoVeiculo[];
};
export type AtribuicaoVeiculo = {
  id: number;
  veiculo_id: number;
  veiculo?: Pick<Veiculo, "id" | "identificacao" | "placa">;
  linha_id: number;
  linha?: TransporteReferencia;
  inicio: string;
  fim: string | null;
  motivo: string | null;
  criada_por?: TransporteReferencia | null;
};
export type HorarioViagem = {
  id: number;
  linha_id: number;
  linha?: TransporteReferencia;
  sentido: SentidoViagem;
  dias_semana: number[];
  horario_saida: string;
  janela_antes_min: number | null;
  janela_depois_min: number | null;
  janela_efetiva: { antes_min: number; depois_min: number };
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  ativo: boolean;
};
export type Viagem = {
  id: number;
  horario_id: number | null;
  linha_id: number;
  linha?: TransporteReferencia;
  sentido: SentidoViagem;
  data: string;
  horario_saida: string;
  janela_inicio: string;
  janela_fim: string;
  veiculo_id: number | null;
  veiculo?: Pick<Veiculo, "id" | "identificacao" | "placa"> | null;
  veiculo_substituido: boolean;
  status: "Programada" | "Cancelada";
  motivo_alteracao: string | null;
  alterada_por?: TransporteReferencia | null;
  presencas?: number;
};
export type DiaSemOperacao = {
  id: number;
  data: string;
  linha_id: number | null;
  linha?: TransporteReferencia | null;
  motivo: string;
  criado_por?: TransporteReferencia | null;
};
export type PontoEmbarque = {
  id: number;
  nome: string;
  latitude: string | number;
  longitude: string | number;
  raio_metros: number;
  ativo: boolean;
  linhas?: LinhaPonto[];
};
export type LinhaPonto = {
  id: number;
  linha_id: number;
  linha?: TransporteReferencia;
  ponto_id: number;
  ponto?: Omit<PontoEmbarque, "linhas">;
  sentido: SentidoViagem;
  ordem: number | null;
  horario_previsto: string | null;
  janela_antes_min: number | null;
  janela_depois_min: number | null;
};
export type AutorizacaoLinha = {
  id: number;
  estudante_id: number;
  estudante?: TransporteReferencia & { cpf: string; linha_id: number | null };
  linha_id: number;
  linha?: TransporteReferencia;
  inicio: string;
  fim: string | null;
  motivo: string;
  criada_por?: TransporteReferencia | null;
};
export type SolicitacaoDispositivo = {
  id: number;
  estudante_id: number;
  estudante?: TransporteReferencia & { cpf: string; linha_id: number | null };
  tipo: "Vinculacao" | "Troca";
  status:
    | "Pendente"
    | "Aprovada"
    | "Rejeitada"
    | "Concluida"
    | "Cancelada"
    | "Expirada";
  motivo: string | null;
  parecer: string | null;
  analisada_por?: TransporteReferencia | null;
  analisada_em: string | null;
  aprovacao_expira_em: string | null;
  concluida_em: string | null;
  created_at: string;
};
export type DispositivoEstudante = {
  id: string;
  estudante_id: number;
  estudante?: TransporteReferencia & { cpf: string };
  rotulo: string | null;
  status: "Ativo" | "Revogado";
  aprovado_por?: TransporteReferencia | null;
  aprovado_em: string | null;
  ultimo_uso_em: string | null;
  revogado_em: string | null;
  revogado_por?: TransporteReferencia | null;
  motivo_revogacao: string | null;
};
export type PresencaRegistrada = {
  id: number;
  estudante_id: number;
  estudante?: TransporteReferencia & { cpf: string };
  viagem?: Viagem;
  veiculo?: Pick<Veiculo, "id" | "identificacao"> | null;
  ponto?: Pick<PontoEmbarque, "id" | "nome"> | null;
  metodo: "Dispositivo" | "Manual";
  registrada_em: string;
  politica_geo: string | null;
  resultado_geo: string | null;
  distancia_metros: number | null;
  precisao_metros: number | null;
  registrada_por?: TransporteReferencia | null;
  justificativa: string | null;
};
export type TentativaPresenca = {
  id: number;
  estudante_id: number;
  estudante?: TransporteReferencia & { cpf: string };
  viagem?: Viagem | null;
  veiculo?: Pick<Veiculo, "id" | "identificacao"> | null;
  dispositivo_id: string | null;
  presenca_id: number | null;
  etapa: string;
  resultado: "Registrada" | "Negada";
  codigo: string | null;
  mensagem: string | null;
  distancia_metros: number | null;
  precisao_metros: number | null;
  recebida_em: string;
  pode_pedir_revisao: boolean;
  revisao: {
    status: "Pendente" | "Aprovada" | "Rejeitada";
    motivo: string;
    solicitada_em: string;
    analisada_por: TransporteReferencia | number | null;
    analisada_em: string | null;
    parecer: string | null;
  } | null;
};
export type RegistroAuditoria = {
  id: number;
  user?: TransporteReferencia | null;
  acao: string;
  auditavel_type: string | null;
  auditavel_id: string | null;
  dados: Record<string, unknown> | null;
  justificativa: string | null;
  created_at: string;
};
export type IndicadoresPresenca = {
  periodo: { de: string; ate: string };
  presencas_por_linha: {
    linha_id: number;
    linha: string | null;
    total: number;
    manuais: number;
  }[];
  presencas_por_dia: { data: string; total: number }[];
  negadas_por_motivo: { codigo: string | null; total: number }[];
  gps: {
    leituras: number;
    precisao_media_metros: number | null;
    distancia_media_aceita_metros: number | null;
  };
  revisoes: Record<string, number>;
};
export type TransporteResources = {
  veiculos: Veiculo;
  atribuicoes: AtribuicaoVeiculo;
  horarios: HorarioViagem;
  viagens: Viagem;
  dias: DiaSemOperacao;
  pontos: PontoEmbarque;
  vinculos: LinhaPonto;
  autorizacoes: AutorizacaoLinha;
  solicitacoes: SolicitacaoDispositivo;
  dispositivos: DispositivoEstudante;
  presencas: PresencaRegistrada;
  tentativas: TentativaPresenca;
  auditoria: RegistroAuditoria;
  roles: { title: string };
  instituicoes: { id: number; name: string; linhas_ids: number[] | null };
};
export type TransporteResource = keyof TransporteResources;
export type TransporteRegistro = TransporteResources[TransporteResource];
export type TransportePayloads = {
  veiculos: Pick<Veiculo, "identificacao" | "placa" | "ativo">;
  atribuicoes: Pick<
    AtribuicaoVeiculo,
    "veiculo_id" | "linha_id" | "inicio" | "fim" | "motivo"
  >;
  horarios: Omit<HorarioViagem, "id" | "linha" | "janela_efetiva">;
  viagens: {
    motivo: string;
    veiculo_id?: number | null;
    janela_inicio?: string;
    janela_fim?: string;
    status?: Viagem["status"];
  };
  dias: Pick<DiaSemOperacao, "data" | "linha_id" | "motivo">;
  pontos: Pick<
    PontoEmbarque,
    "nome" | "latitude" | "longitude" | "raio_metros" | "ativo"
  >;
  vinculos: Omit<LinhaPonto, "id" | "linha" | "ponto">;
  autorizacoes: Pick<
    AutorizacaoLinha,
    "estudante_id" | "linha_id" | "inicio" | "fim" | "motivo"
  >;
  roles: { title: string };
  instituicoes: { name: string; linhas_ids: number[] };
};
export type TransporteWritable = keyof TransportePayloads;
export type ConflitoViagem = {
  veiculo_id: number;
  data: string;
  viagens: number[];
};
export type TransporteMutation<T = unknown> = {
  data?: T;
  message?: string;
  conflitos?: ConflitoViagem[];
  viagens_canceladas?: number;
};
export type TransporteFiltros = Record<string, string | number | boolean>;
