import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { sharePendingRequest } from "@/services/api/pending-request";
import type { SystemUser } from "@/types/user";

export const userService = {
  list: sharePendingRequest(async () => {
    const { data } = await api.get<{ data: SystemUser[] }>(
      API_ENDPOINTS.USERS.BASE,
    );
    return data.data;
  }),
};
