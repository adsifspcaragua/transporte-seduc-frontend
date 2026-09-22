import type { Linha } from "@/types/inscricao";
import type { DriverOption } from "@/types/user";

export type LinhasViewMode = "grid" | "list";

export function horaParaInput(valor?: string | null) {
  return valor ? valor.slice(0, 5) : "";
}

export function formatLastPresence(value?: string | null) {
  if (!value) return "Sem presença registrada";

  const [year, month, day] = value.slice(0, 10).split("-");

  return `${day}/${month}/${year}`;
}

export function ocupacaoDe(linha: Linha) {
  const ocupacao = linha.ocupacao ?? 0;
  const capacidade = linha.max_capacity ?? 0;
  const proporcao = capacidade > 0 ? ocupacao / capacidade : 0;

  return {
    ocupacao,
    capacidade,
    vagas: linha.vagas_restantes ?? Math.max(0, capacidade - ocupacao),
    lotada: capacidade > 0 && ocupacao >= capacidade,
    proporcao: Math.min(1, proporcao),
  };
}

export function getAvailableDrivers(
  availableDrivers: DriverOption[],
  currentDriver?: DriverOption | null,
) {
  const drivers = [...availableDrivers];

  if (
    currentDriver &&
    !drivers.some((driver) => driver.id === currentDriver.id)
  ) {
    drivers.push(currentDriver);
  }

  return drivers.sort((first, second) =>
    first.name.localeCompare(second.name, "pt-BR"),
  );
}
