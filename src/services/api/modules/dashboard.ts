import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { sharePendingRequest } from "@/services/api/pending-request";
import type { DashboardResumo } from "@/types/dashboard";

export const dashboardService = {
  resumo: sharePendingRequest(async () => {
    const { data } = await api.get<{ data: DashboardResumo }>(
      API_ENDPOINTS.DASHBOARD,
    );
    return data.data;
  }),
};
