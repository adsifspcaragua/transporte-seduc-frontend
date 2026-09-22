import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { sharePendingRequest } from "@/services/api/pending-request";
import type { DriverOption, SystemUser, UserPayload } from "@/types/user";

type DataResponse<T> = { data: T; message?: string };

export const userService = {
  list: sharePendingRequest(async () => {
    const { data } = await api.get<DataResponse<SystemUser[]>>(
      API_ENDPOINTS.USERS.BASE,
    );
    return data.data;
  }),

  listDrivers: sharePendingRequest(async () => {
    const { data } = await api.get<{ data: DriverOption[] }>(
      API_ENDPOINTS.USERS.DRIVERS,
    );
    return data.data;
  }),

  async create(payload: UserPayload) {
    const { data } = await api.post<SystemUser>(
      API_ENDPOINTS.USERS.BASE,
      payload,
    );
    return data;
  },

  async update(id: number, payload: UserPayload) {
    const { data } = await api.put<DataResponse<SystemUser>>(
      API_ENDPOINTS.USERS.BY_ID(id),
      payload,
    );
    return data.data;
  },

  async activate(id: number) {
    const { data } = await api.patch<DataResponse<SystemUser>>(
      API_ENDPOINTS.USERS.ACTIVATE(id),
    );
    return data.data;
  },

  async inactivate(id: number) {
    const { data } = await api.patch<DataResponse<SystemUser>>(
      API_ENDPOINTS.USERS.INACTIVATE(id),
    );
    return data.data;
  },

  async remove(id: number) {
    const { data } = await api.delete<{ message: string }>(
      API_ENDPOINTS.USERS.BY_ID(id),
    );
    return data.message;
  },
};
