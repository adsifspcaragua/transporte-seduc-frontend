import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { sharePendingRequest } from "@/services/api/pending-request";
import type {
  AbrirChamadaPayload,
  AnaliseJustificativaPayload,
  AnaliseJustificativaResponse,
  Chamada,
  CriarJustificativaPayload,
  DataResponse,
  FrequenciaLinha,
  ListarChamadasParams,
  ListarJustificativasParams,
  PaginatedChamadas,
  PaginatedJustificativas,
  RegistrarFrequenciasPayload,
  RelatorioEstudanteResponse,
  RelatorioFrequenciaParams,
  RelatorioFrequenciaResponse,
  UpdateChamadaResponse,
} from "@/types/frequencia";

export const frequenciaService = {
  listLinhas: sharePendingRequest(async () => {
    const { data } = await api.get<{ data: FrequenciaLinha[] }>(
      API_ENDPOINTS.FREQUENCIAS.LINHAS,
    );
    return data.data;
  }),

  list: sharePendingRequest(async (params: ListarChamadasParams = {}) => {
    const { data } = await api.get<PaginatedChamadas>(
      API_ENDPOINTS.FREQUENCIAS.CHAMADAS,
      { params },
    );
    return data;
  }),

  async open(payload: AbrirChamadaPayload) {
    const { data } = await api.post<DataResponse<Chamada>>(
      API_ENDPOINTS.FREQUENCIAS.CHAMADAS,
      payload,
    );
    return data;
  },

  async show(id: number) {
    const { data } = await api.get<DataResponse<Chamada>>(
      API_ENDPOINTS.FREQUENCIAS.CHAMADA_BY_ID(id),
    );
    return data;
  },

  async update(id: number, payload: RegistrarFrequenciasPayload) {
    const { data } = await api.put<UpdateChamadaResponse>(
      API_ENDPOINTS.FREQUENCIAS.CHAMADA_BY_ID(id),
      payload,
    );
    return data;
  },

  async close(id: number) {
    const { data } = await api.patch<DataResponse<Chamada>>(
      API_ENDPOINTS.FREQUENCIAS.FECHAR(id),
    );
    return data;
  },

  async reopen(id: number) {
    const { data } = await api.patch<DataResponse<Chamada>>(
      API_ENDPOINTS.FREQUENCIAS.REABRIR(id),
    );
    return data;
  },

  async remove(id: number) {
    const { data } = await api.delete<{ message: string }>(
      API_ENDPOINTS.FREQUENCIAS.CHAMADA_BY_ID(id),
    );
    return data;
  },

  listJustificativas: sharePendingRequest(
    async (params: ListarJustificativasParams = {}) => {
      const { data } = await api.get<PaginatedJustificativas>(
        API_ENDPOINTS.FREQUENCIAS.JUSTIFICATIVAS,
        { params },
      );
      return data;
    },
  ),

  showJustificativa: sharePendingRequest(async (id: number) => {
    const { data } = await api.get<AnaliseJustificativaResponse>(
      API_ENDPOINTS.FREQUENCIAS.JUSTIFICATIVA_BY_ID(id),
    );
    return data;
  }),

  async analyzeJustificativa(id: number, payload: AnaliseJustificativaPayload) {
    const { data } = await api.put<AnaliseJustificativaResponse>(
      API_ENDPOINTS.FREQUENCIAS.ANALISAR_JUSTIFICATIVA(id),
      payload,
    );
    return data;
  },

  async createJustificativa(payload: CriarJustificativaPayload) {
    const { data } = await api.post<AnaliseJustificativaResponse>(
      API_ENDPOINTS.FREQUENCIAS.JUSTIFICATIVAS,
      payload,
    );
    return data;
  },

  report: sharePendingRequest(
    async (params: RelatorioFrequenciaParams = {}) => {
      const { data } = await api.get<RelatorioFrequenciaResponse>(
        API_ENDPOINTS.FREQUENCIAS.RELATORIO,
        { params },
      );
      return data;
    },
  ),

  studentReport: sharePendingRequest(
    async (id: number, params: RelatorioFrequenciaParams = {}) => {
      const { data } = await api.get<RelatorioEstudanteResponse>(
        API_ENDPOINTS.FREQUENCIAS.RELATORIO_ESTUDANTE(id),
        { params },
      );
      return data;
    },
  ),
};
