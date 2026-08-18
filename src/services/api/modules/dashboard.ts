import { api } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { DashboardResumo } from "@/types/dashboard";

export const dashboardService = {
  async resumo() {
    const { data } = await api.get<{ data: DashboardResumo }>(
      API_ENDPOINTS.DASHBOARD,
    );
    return data.data;
  },
};
