import type { Linha } from "@/types/inscricao";
import type { SystemUser } from "@/types/user";

export type LinhasViewMode = "grid" | "list";

export function horaParaInput(valor?: string | null) {
  return valor ? valor.slice(0, 5) : "";
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
  users: SystemUser[],
  currentDriver?: { id: number; name: string } | null,
) {
  const drivers = users
    .filter((user) => user.ativo && user.roles.includes("motorista"))
    .map(({ id, name }) => ({ id, name }));

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
