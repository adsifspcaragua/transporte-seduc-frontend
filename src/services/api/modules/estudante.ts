import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { PaginatedEstudantes } from "@/types/estudante";

type EmptyMessageResponse = {
  message: string;
};

type CountResponse =
  | number
  | {
      data?: number;
      message?: string;
    };

function isEmptyMessageResponse(
  payload: PaginatedEstudantes | EmptyMessageResponse,
): payload is EmptyMessageResponse {
  return "message" in payload && !("data" in payload);
}

export const estudanteService = {
  async list(page = 1) {
    const { data } = await api.get<PaginatedEstudantes | EmptyMessageResponse>(
      API_ENDPOINTS.ESTUDANTES.BASE,
      {
        params: { page },
      },
    );

    if (isEmptyMessageResponse(data)) {
      return {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
        },
      } satisfies PaginatedEstudantes;
    }

    return data;
  },

  async count() {
    const { data } = await api.get<CountResponse>(
      API_ENDPOINTS.ESTUDANTES.COUNT,
    );

    if (typeof data === "number") return data;
    return data.data ?? 0;
  },

  async remove(id: number) {
    await api.delete<{ message?: string }>(API_ENDPOINTS.ESTUDANTES.BY_ID(id));
  },
};
