import { api, publicApi } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type {
  AnaliseRecadastroPayload,
  AcessoEstudanteResponse,
  CadastroRecadastro,
  DocumentoRecadastroTipo,
  FinalizarRecadastroPayload,
  PeriodoRecadastro,
  PeriodoRecadastroPayload,
  SituacaoRecadastro,
  SolicitacaoRecadastro,
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
  async acessar(cpf: string) {
    const { data } = await publicApi.post<AcessoEstudanteResponse>(
      API_ENDPOINTS.AREA_ESTUDANTE.ACESSO,
      { cpf },
    );
    return data;
  },
  async consultar(cpf: string) {
    const { data } = await publicApi.post<DataResponse<SituacaoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.CONSULTA,
      { cpf },
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

  async listSolicitacoes() {
    const { data } = await api.get<CollectionResponse<SolicitacaoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.SOLICITACOES,
    );
    return unwrapCollection(data);
  },

  async analisar(id: number, payload: AnaliseRecadastroPayload) {
    const { data } = await api.put<DataResponse<SolicitacaoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.ANALISE(id),
      payload,
    );
    return data;
  },

  async listPeriodos() {
    const { data } = await api.get<CollectionResponse<PeriodoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.PERIODOS,
    );
    return unwrapCollection(data);
  },

  async createPeriodo(payload: PeriodoRecadastroPayload) {
    const { data } = await api.post<DataResponse<PeriodoRecadastro>>(
      API_ENDPOINTS.RECADASTRO.PERIODOS,
      payload,
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
