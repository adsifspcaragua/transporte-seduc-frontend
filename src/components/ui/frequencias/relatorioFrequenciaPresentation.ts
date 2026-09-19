import type { RelatorioFrequenciaParams } from "@/types/frequencia";

export type RelatorioFrequenciaFilters = {
  de: string;
  ate: string;
  linhaId: string;
  faltasConsecutivasMin: string;
};

export const EMPTY_RELATORIO_FILTERS: RelatorioFrequenciaFilters = {
  de: "",
  ate: "",
  linhaId: "",
  faltasConsecutivasMin: "",
};

export function buildRelatorioParams(
  filters: RelatorioFrequenciaFilters,
): RelatorioFrequenciaParams {
  return {
    ...(filters.de ? { de: filters.de } : {}),
    ...(filters.ate ? { ate: filters.ate } : {}),
    ...(filters.linhaId ? { linha_id: Number(filters.linhaId) } : {}),
    ...(filters.faltasConsecutivasMin
      ? { faltas_consecutivas_min: Number(filters.faltasConsecutivasMin) }
      : {}),
  };
}

export function validateReportPeriod(de: string, ate: string) {
  if (!de || !ate) return "";
  if (ate < de) return "A data final deve ser igual ou posterior à inicial.";

  const days =
    (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) /
    86_400_000;
  return days > 366 ? "O intervalo não pode passar de 366 dias." : "";
}

export function formatAttendancePercentage(value: number | null) {
  return value === null
    ? "—"
    : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}
