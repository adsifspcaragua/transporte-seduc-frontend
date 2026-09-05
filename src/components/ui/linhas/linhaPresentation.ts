import type { Linha } from "@/types/inscricao";

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
