import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { sharePendingRequest } from "@/services/api/pending-request";
import type {
  AbrirChamadaPayload,
  Chamada,
  DataResponse,
  FrequenciaLinha,
  ListarChamadasParams,
  PaginatedChamadas,
  RegistrarFrequenciasPayload,
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
};
