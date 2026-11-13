export type PortalPessoa = { id: number; name: string };
export type PortalDataResponse<T> = { data: T; message?: string };
export type PortalPaginationParams = {
  page?: number;
  per_page?: 10 | 15 | 20 | 30;
};
export type PortalPaginated<T> = {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    path: string;
    links: { url: string | null; label: string; active: boolean }[];
  };
};
export type PortalViagem = {
  id: number;
  horario_id: number | null;
  linha_id: number;
  linha?: PortalPessoa | null;
  sentido: "Ida" | "Volta";
  data: string;
  horario_saida: string;
  janela_inicio: string;
  janela_fim: string;
  veiculo_id: number | null;
  veiculo?: { id: number; identificacao: string; placa?: string | null } | null;
  veiculo_substituido: boolean;
  status: "Programada" | "Cancelada";
  motivo_alteracao: string | null;
  alterada_por?: PortalPessoa | null;
  presencas?: number;
};
export type PortalMinhaViagem = PortalViagem & { presenca_registrada: boolean };
export type PortalDispositivo = {
  id: string;
  estudante_id: number;
  rotulo: string | null;
  status: "Ativo" | "Revogado";
  estudante?: PortalPessoa & { cpf: string | null };
  aprovado_por?: PortalPessoa | null;
  aprovado_em: string | null;
  ultimo_uso_em: string | null;
  revogado_em: string | null;
  revogado_por?: PortalPessoa | null;
  motivo_revogacao: string | null;
};
export type PortalSolicitacaoDispositivo = {
  id: number;
  estudante_id: number;
  tipo: "Vinculacao" | "Troca";
  status:
    | "Pendente"
    | "Aprovada"
    | "Rejeitada"
    | "Concluida"
    | "Cancelada"
    | "Expirada";
  estudante?: PortalPessoa & { cpf: string | null; linha_id: number | null };
  motivo: string | null;
  parecer: string | null;
  analisada_por?: PortalPessoa | null;
  analisada_em: string | null;
  aprovacao_expira_em: string | null;
  concluida_em: string | null;
  created_at: string | null;
};
export type PortalSituacaoDispositivo = {
  situacao:
    | "sem_dispositivo"
    | "aguardando_aprovacao"
    | "aguardando_conclusao"
    | "ativo";
  pode_registrar_presenca: boolean;
  dispositivo: PortalDispositivo | null;
  solicitacao: PortalSolicitacaoDispositivo | null;
};
export type PortalDesafio = {
  desafio_id: string;
  desafio: string;
  expira_em: string;
};
export type PortalDesafioVinculacao = PortalDesafio & {
  algoritmo: "ECDSA-P256-SHA256";
  formato_chave: "spki";
  formato_assinatura: "p1363";
};
export type PortalVinculacaoPayload = {
  chave_publica: string;
  desafio_id: string;
  desafio: string;
  assinatura: string;
  rotulo?: string;
};
export type PortalExigenciaLocalizacao = {
  obrigatoria: boolean;
  precisao_maxima_metros: number;
};
export type PortalQrResolvido = {
  viagem: PortalViagem;
  localizacao: PortalExigenciaLocalizacao;
};
export type PortalDesafioPresenca = PortalDesafio & PortalQrResolvido;
export type PortalErroLocalizacao =
  | "permissao_negada"
  | "indisponivel"
  | "tempo_esgotado";
export type PortalLocalizacao = {
  latitude: number;
  longitude: number;
  precisao_metros: number;
  timestamp_ms?: number;
};
export type PortalPresencaPayload = {
  qr_token: string;
  desafio_id: string;
  desafio: string;
  assinatura: string;
} & (
  | { localizacao: PortalLocalizacao; erro_localizacao?: null }
  | { erro_localizacao: PortalErroLocalizacao; localizacao?: null }
);
export type PortalPresenca = {
  id: number;
  estudante_id: number;
  estudante?: PortalPessoa & { cpf: string | null };
  viagem: PortalViagem;
  veiculo?: { id: number; identificacao: string } | null;
  ponto?: { id: number; nome: string } | null;
  metodo: "Dispositivo" | "Manual";
  registrada_em: string;
  politica_geo: string | null;
  resultado_geo: string | null;
  distancia_metros: number | null;
  precisao_metros: number | null;
  registrada_por?: PortalPessoa | null;
  justificativa: string | null;
};
export type PortalCodigoPresenca =
  | "STUDENT_NOT_ELIGIBLE"
  | "DEVICE_NOT_ENROLLED"
  | "DEVICE_PENDING_APPROVAL"
  | "DEVICE_REVOKED"
  | "DEVICE_PROOF_INVALID"
  | "QR_INVALID"
  | "NO_MATCHING_TRIP"
  | "LINE_NOT_AUTHORIZED"
  | "OUTSIDE_TIME_WINDOW"
  | "LOCATION_PERMISSION_DENIED"
  | "LOCATION_UNAVAILABLE"
  | "LOCATION_INACCURATE"
  | "OUTSIDE_GEOFENCE"
  | "CHALLENGE_EXPIRED"
  | "CHALLENGE_ALREADY_USED"
  | "ATTENDANCE_ALREADY_RECORDED"
  | "MANUAL_REVIEW_REQUIRED"
  | "OFFLINE_PROOF_EXPIRED"
  | "OFFLINE_CLOCK_INVALID";
export type PortalTentativa = {
  id: number;
  estudante_id: number;
  estudante?: PortalPessoa & { cpf: string | null };
  viagem: PortalViagem | null;
  veiculo?: { id: number; identificacao: string } | null;
  dispositivo_id: string | null;
  presenca_id: number | null;
  etapa: "resolver_qr" | "desafio" | "confirmacao" | "offline";
  /** "Em revisao": comprovante feito sem conexão, aguardando a gestão. */
  resultado: "Negada" | "Registrada" | "Em revisao";
  /** Só nos comprovantes sem conexão: horário do celular na leitura. */
  capturado_em?: string | null;
  comprovante_id?: string | null;
  codigo: PortalCodigoPresenca | null;
  mensagem: string | null;
  distancia_metros: number | null;
  precisao_metros: number | null;
  recebida_em: string;
  pode_pedir_revisao: boolean;
  revisao: {
    status: "Pendente" | "Aprovada" | "Rejeitada";
    motivo: string;
    solicitada_em: string;
    analisada_por: number | PortalPessoa | null;
    analisada_em: string | null;
    parecer: string | null;
  } | null;
};
export type PortalErroResposta = {
  message?: string;
  codigo?: PortalCodigoPresenca;
  tentativa_id?: number;
  pode_pedir_revisao?: boolean;
  errors?: Record<string, string[]>;
};
