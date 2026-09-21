import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { sharePendingRequest } from "@/services/api/pending-request";
import type { DriverOption } from "@/types/user";

export const userService = {
  listDrivers: sharePendingRequest(async () => {
    const { data } = await api.get<{ data: DriverOption[] }>(
      API_ENDPOINTS.USERS.DRIVERS,
    );
    return data.data;
  }),
};
