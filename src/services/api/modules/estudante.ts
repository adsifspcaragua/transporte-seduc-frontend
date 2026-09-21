import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { sharePendingRequest } from "@/services/api/pending-request";
import type {
  Estudante,
  PaginatedEstudantes,
  UpdateEstudantePayload,
} from "@/types/estudante";

type EmptyMessageResponse = {
  message: string;
};

type CountResponse =
  | number
  | {
      data?: number;
      message?: string;
    };

type LaravelDataResponse<T> = {
  data: T;
  message?: string;
};

function isEmptyMessageResponse(
  payload: PaginatedEstudantes | EmptyMessageResponse,
): payload is EmptyMessageResponse {
  return "message" in payload && !("data" in payload);
}

export const estudanteService = {
  list: sharePendingRequest(async (page = 1, perPage = 10) => {
    const { data } = await api.get<PaginatedEstudantes | EmptyMessageResponse>(
      API_ENDPOINTS.ESTUDANTES.BASE,
      {
        params: {
          page,
          per_page: perPage,
        },
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
  }),

  count: sharePendingRequest(async () => {
    const { data } = await api.get<CountResponse>(
      API_ENDPOINTS.ESTUDANTES.COUNT,
    );

    if (typeof data === "number") return data;
    return data.data ?? 0;
  }),

  async update(id: number, payload: UpdateEstudantePayload) {
    const { data } = await api.put<LaravelDataResponse<Estudante>>(
      API_ENDPOINTS.ESTUDANTES.BY_ID(id),
      payload,
    );

    return data.data;
  },

  async remove(id: number) {
    await api.delete<{ message?: string }>(API_ENDPOINTS.ESTUDANTES.BY_ID(id));
  },

  async export(type: "csv" | "pdf" | "xlsx") {
    const response = await api.get<Blob>(
      API_ENDPOINTS.ESTUDANTES.EXPORT(type),
      {
        responseType: "blob",
      },
    );

    return {
      blob: response.data,
      contentDisposition: response.headers["content-disposition"] as
        | string
        | undefined,
      contentType: response.headers["content-type"] as string | undefined,
    };
  },
};
