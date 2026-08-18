import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { Linha, LinhaPayload } from "@/types/inscricao";

type DataResponse<T> = { data: T; message?: string };
type CollectionResponse<T> = T[] | { data?: T[] | { data?: T[] } };

function unwrapCollection<T>(payload: CollectionResponse<T>) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return payload.data?.data ?? [];
}

export const linhaService = {
  async list() {
    const { data } = await api.get<CollectionResponse<Linha>>(
      API_ENDPOINTS.LINHAS.BASE,
    );
    return unwrapCollection(data);
  },

  async create(payload: LinhaPayload) {
    const { data } = await api.post<DataResponse<Linha>>(
      API_ENDPOINTS.LINHAS.BASE,
      payload,
    );
    return data;
  },

  async update(id: number, payload: LinhaPayload) {
    const { data } = await api.put<DataResponse<Linha>>(
      API_ENDPOINTS.LINHAS.BY_ID(id),
      payload,
    );
    return data;
  },

  async remove(id: number) {
    const { data } = await api.delete<DataResponse<Linha>>(
      API_ENDPOINTS.LINHAS.BY_ID(id),
    );
    return data;
  },
};
