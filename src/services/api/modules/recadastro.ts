import { api, publicApi } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { sharePendingRequest } from "@/services/api/pending-request";
import type {
  AcessoEstudanteResponse,
  AnaliseRecadastroPayload,
  AusentesRecadastro,
  CadastroRecadastro,
  CodigoAcessoEnviado,
  DocumentoRecadastroTipo,
  FinalizarRecadastroPayload,
  PaginatedSolicitacoesRecadastro,
  PeriodoRecadastro,
  PeriodoRecadastroPayload,
  SituacaoRecadastro,
  SolicitacaoRecadastro,
  SolicitacoesRecadastroParams,
} from "@/types/recadastro";

type DataResponse<T> = { data: T; message?: string };
type CollectionResponse<T> =
  | T[]
  | { data?: T[] | { data?: T[] }; meta?: { last_page?: number } };

function unwrapCollection<T>(payload: CollectionResponse<T>) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return payload.data?.data ?? [];
}

export const recadastroService = {
  /** Primeira etapa: CPF novo segue para a inscricao; com cadastro, so envia o codigo. */
  async acessar(cpf: string) {
    const { data } = await publicApi.post<
      AcessoEstudanteResponse | CodigoAcessoEnviado
    >(API_ENDPOINTS.AREA_ESTUDANTE.ACESSO, { cpf });
    return data;
  },
  /** Segunda etapa: com o codigo do e-mail, devolve o fluxo e os dados. */
  async verificarAcesso(cpf: string, codigo: string) {
    const { data } = await publicApi.post<AcessoEstudanteResponse>(
      API_ENDPOINTS.AREA_ESTUDANTE.ACESSO_VERIFICAR,
      { cpf, codigo },
    );
    return data;
  },
  async consultar(cpf: string) {
    const { data } = await publicApi.post<CodigoAcessoEnviado>(
      API_ENDPOINTS.RECADASTRO.CONSULTA,
      { cpf },
    );
    return data;
  },
  async verificarConsulta(cpf: string, codigo: string) {
    const { data } = await publicApi.post<DataResponse<SituacaoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.CONSULTA_VERIFICAR,
      { cpf, codigo },
    );
    return data;
  },

  async enviarDocumento(
    solicitacaoId: number,
    token: string,
    type: DocumentoRecadastroTipo,
    arquivo: File,
  ) {
    const formData = new FormData();
    formData.append("token", token);
    formData.append("type", type);
    formData.append("arquivo", arquivo);

    const { data } = await publicApi.post<DataResponse<SituacaoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.DOCUMENTOS(solicitacaoId),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  async finalizar(
    solicitacaoId: number,
    token: string,
    payload: FinalizarRecadastroPayload,
  ) {
    const { data } = await publicApi.post<DataResponse<SituacaoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.FINALIZAR(solicitacaoId),
      { ...payload, token },
    );
    return data;
  },

  async atualizarDados(
    solicitacaoId: number,
    token: string,
    payload: Omit<CadastroRecadastro, "cpf">,
  ) {
    const { data } = await publicApi.put<DataResponse<SituacaoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.ATUALIZAR_DADOS(solicitacaoId),
      { ...payload, token },
    );
    return data;
  },

  listSolicitacoes: sharePendingRequest(
    async (params: SolicitacoesRecadastroParams = {}) => {
      const { data } = await api.get<
        PaginatedSolicitacoesRecadastro | { message: string }
      >(API_ENDPOINTS.RECADASTRO.SOLICITACOES, { params });
      return "data" in data
        ? data
        : {
            data: [],
            meta: {
              current_page: 1,
              from: null,
              last_page: 1,
              per_page: 10,
              to: null,
              total: 0,
            },
          };
    },
  ),

  async analisar(id: number, payload: AnaliseRecadastroPayload) {
    const { data } = await api.put<DataResponse<SolicitacaoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.ANALISE(id),
      payload,
    );
    return data;
  },

  listPeriodos: sharePendingRequest(async () => {
    const { data } = await api.get<CollectionResponse<PeriodoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.PERIODOS,
    );
    return unwrapCollection(data);
  }),

  async createPeriodo(payload: PeriodoRecadastroPayload) {
    const { data } = await api.post<DataResponse<PeriodoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.PERIODOS,
      payload,
    );
    return data;
  },

  // Prorrogar um período é atualizar a data de fim; por isso o payload é
  // parcial, para a responsável mexer só no que precisa mudar.
  async updatePeriodo(id: number, payload: Partial<PeriodoRecadastroPayload>) {
    const { data } = await api.put<DataResponse<PeriodoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.PERIODO_BY_ID(id),
      payload,
    );
    return data;
  },

  listAusentes: sharePendingRequest(async (periodoId: number) => {
    const { data } = await api.get<AusentesRecadastro>(
      API_ENDPOINTS.RECADASTRO.AUSENTES(periodoId),
    );
    return data;
  }),

  async inativarAusentes(periodoId: number, estudantes: number[]) {
    const { data } = await api.post<{ message: string; inativados: number[] }>(
      API_ENDPOINTS.RECADASTRO.INATIVAR_AUSENTES(periodoId),
      { estudantes },
    );
    return data;
  },

  async setPeriodoAberto(id: number, aberto: boolean) {
    const endpoint = aberto
      ? API_ENDPOINTS.RECADASTRO.ABRIR_PERIODO(id)
      : API_ENDPOINTS.RECADASTRO.FECHAR_PERIODO(id);
    const { data } = await api.patch<DataResponse<PeriodoRecadastro>>(endpoint);
    return data;
  },
};
