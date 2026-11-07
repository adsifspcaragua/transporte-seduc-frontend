import type { Linha } from "./inscricao";
import type { TransporteResources } from "./transporte";

export type TransportePeriod = { de: string; ate: string };
export type TransporteRead<T> = { data?: T[]; error?: string };
export type OperacaoResource =
  | "veiculos"
  | "atribuicoes"
  | "horarios"
  | "pontos"
  | "vinculos"
  | "dias"
  | "viagens";
export type TransporteSnapshot = {
  linhas: TransporteRead<Linha>;
} & { [K in OperacaoResource]: TransporteRead<TransporteResources[K]> };
export type TransporteIssue = { text: string; step: number };
export type TransporteSaveNotice = { text: string; confirmed: boolean };
