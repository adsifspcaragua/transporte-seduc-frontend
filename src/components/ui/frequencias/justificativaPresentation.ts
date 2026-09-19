import type {
  Justificativa,
  JustificativaStatus,
  ListarJustificativasParams,
} from "@/types/frequencia";

export type JustificativaFilters = {
  status: JustificativaStatus | "";
  linhaId: string;
  de: string;
  ate: string;
};

export const EMPTY_JUSTIFICATIVA_FILTERS: JustificativaFilters = {
  status: "Em analise",
  linhaId: "",
  de: "",
  ate: "",
};

export type JustificativaStatusTone = "pending" | "approved" | "rejected";

export function buildJustificativaParams(
  filters: JustificativaFilters,
  page: number,
  perPage: 10 | 15 | 20 | 30,
): ListarJustificativasParams {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.linhaId ? { linha_id: Number(filters.linhaId) } : {}),
    ...(filters.de ? { de: filters.de } : {}),
    ...(filters.ate ? { ate: filters.ate } : {}),
    page,
    per_page: perPage,
  };
}

export function validateAnalysis(
  decision: "Aprovada" | "Rejeitada",
  opinion: string,
) {
  if (decision === "Aprovada") return "";

  const normalizedOpinion = opinion.trim();
  if (!normalizedOpinion) return "Informe o parecer da rejeição.";
  if (normalizedOpinion.length > 1000) {
    return "O parecer deve ter no máximo 1.000 caracteres.";
  }
  return "";
}

export function canAnalyzeJustificativa(
  justificativa: Pick<Justificativa, "status">,
) {
  return justificativa.status === "Em analise";
}

export function getJustificativaStatusTone(
  status: JustificativaStatus,
): JustificativaStatusTone {
  if (status === "Aprovada") return "approved";
  if (status === "Rejeitada") return "rejected";
  return "pending";
}

export function formatJustificativaDateTime(
  value: string | null | undefined,
  timeZone?: string,
) {
  if (!value) return "Não informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

export function validateJustificativaDateRange(de: string, ate: string) {
  if (!de || !ate || ate >= de) return "";
  return "A data final deve ser igual ou posterior à data inicial.";
}
