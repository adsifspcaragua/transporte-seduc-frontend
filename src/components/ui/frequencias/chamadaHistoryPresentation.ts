import type { ChamadaStatus, ListarChamadasParams } from "@/types/frequencia";

export type ChamadaHistoryFilters = {
  linhaId: string;
  status: "" | ChamadaStatus;
  de: string;
  ate: string;
};

export const EMPTY_CHAMADA_HISTORY_FILTERS: ChamadaHistoryFilters = {
  linhaId: "",
  status: "",
  de: "",
  ate: "",
};

export function buildChamadaHistoryParams(
  filters: ChamadaHistoryFilters,
  page: number,
  perPage: 10 | 15 | 20 | 30,
): ListarChamadasParams {
  return {
    ...(filters.linhaId ? { linha_id: Number(filters.linhaId) } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.de ? { de: filters.de } : {}),
    ...(filters.ate ? { ate: filters.ate } : {}),
    page,
    per_page: perPage,
  };
}

export function validateChamadaHistoryDateRange(de: string, ate: string) {
  if (de && ate && ate < de) {
    return "A data final deve ser igual ou posterior à data inicial.";
  }

  return "";
}

export function getChamadaCompletionPercentage(contadores: {
  total: number;
  pendentes: number;
}) {
  if (contadores.total === 0) return 0;
  return Math.round(
    ((contadores.total - contadores.pendentes) / contadores.total) * 100,
  );
}
