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

export function validateMinimumConsecutiveAbsences(value: string) {
  if (!value) return "";

  const minimum = Number(value);
  if (!Number.isInteger(minimum)) return "Informe um número inteiro.";
  return minimum >= 1 ? "" : "O mínimo deve ser maior que zero.";
}

export function formatAttendancePercentage(value: number | null) {
  return value === null
    ? "—"
    : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

export type AttendanceTone = "danger" | "success" | "warning";

export function getAttendanceTone(
  summary: Pick<
    import("@/types/frequencia").ResumoFrequencia,
    "faltas" | "faltas_consecutivas"
  >,
): AttendanceTone {
  if (summary.faltas_consecutivas >= 3 || summary.faltas >= 5) {
    return "danger";
  }
  return summary.faltas > 0 ? "warning" : "success";
}

function formatIsoDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function formatReportPeriod(period: { de: string; ate: string }) {
  return `${formatIsoDate(period.de)} a ${formatIsoDate(period.ate)}`;
}
