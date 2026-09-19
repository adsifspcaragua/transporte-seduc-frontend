import type {
  PeriodoRecadastro,
  SolicitacaoRecadastro,
} from "@/types/recadastro";

export type PeriodoSortOrder = "recentes" | "antigos";

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function sortPeriodos(
  periodos: PeriodoRecadastro[],
  order: PeriodoSortOrder,
) {
  return [...periodos].sort((first, second) => {
    const firstReference = first.ano * 10 + first.semestre;
    const secondReference = second.ano * 10 + second.semestre;

    return order === "recentes"
      ? secondReference - firstReference
      : firstReference - secondReference;
  });
}

export function filterSolicitacoes(
  solicitacoes: SolicitacaoRecadastro[],
  search: string,
  status: string,
) {
  const normalizedSearch = normalizeSearchValue(search);

  return solicitacoes.filter((solicitacao) => {
    const matchesStatus = status === "todos" || solicitacao.status === status;
    const searchableContent = normalizeSearchValue(
      [
        solicitacao.estudante.name,
        solicitacao.estudante.cpf ?? "",
        solicitacao.periodo.referencia,
      ].join(" "),
    );

    return matchesStatus && searchableContent.includes(normalizedSearch);
  });
}

export function formatRecadastroDate(value: string | null | undefined) {
  if (!value) return "Data não informada";

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatRecadastroDateTime(value: string | null | undefined) {
  if (!value) return "Envio não informado";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getRecadastroBadgeClass(status: string) {
  if (status === "Aprovado" || status === "Aberto") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "Rejeitado") {
    return "bg-danger-600/10 text-danger-700";
  }

  if (status === "Em analise") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-amber-100 text-amber-700";
}

export function getRecadastroStatusLabel(status: string) {
  if (status === "Em analise") return "Em análise";
  if (status === "Pendencia") return "Com pendência";

  return status;
}
