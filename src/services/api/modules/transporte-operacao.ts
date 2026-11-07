import { linhaService } from "@/services/api/modules/linha";
import { transporteService } from "@/services/api/modules/transporte";
import { createCachedQuery } from "@/services/api/query-cache";
import type { Viagem } from "@/types/transporte";
import type {
  TransportePeriod,
  TransporteRead,
  TransporteSnapshot,
} from "@/types/transporte-operacao";

export async function readAllTrips(
  period: TransportePeriod,
): Promise<Viagem[]> {
  const trips: Viagem[] = [];
  for (let page = 1; ; page++) {
    const response = await transporteService.list("viagens", {
      ...period,
      page,
      per_page: 50,
    });
    if (
      !response.meta ||
      response.meta.current_page !== page ||
      response.meta.last_page < page
    ) {
      throw new Error("A paginação das viagens não pôde ser conferida.");
    }
    trips.push(...response.data);
    if (page >= response.meta.last_page) return trips;
  }
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function loadTransporteOperacao(
  permissions: string[],
  period: TransportePeriod,
): Promise<TransporteSnapshot> {
  async function read<T>(
    permission: string,
    request: () => Promise<T[]>,
  ): Promise<TransporteRead<T>> {
    if (!permissions.includes(permission))
      return { error: "Seu perfil não permite esta consulta." };
    try {
      return { data: await request() };
    } catch {
      return {
        error: "Não foi possível consultar. Atualize para tentar novamente.",
      };
    }
  }
  const [
    linhas,
    veiculos,
    atribuicoes,
    horarios,
    pontos,
    vinculos,
    dias,
    viagens,
  ] = await Promise.all([
    read("linhas.view", () => linhaService.list()),
    read(
      "veiculos.view",
      async () => (await transporteService.list("veiculos")).data,
    ),
    read(
      "veiculos.view",
      async () => (await transporteService.list("atribuicoes")).data,
    ),
    read(
      "viagens.view",
      async () => (await transporteService.list("horarios")).data,
    ),
    read(
      "geocercas.view",
      async () => (await transporteService.list("pontos")).data,
    ),
    read(
      "geocercas.view",
      async () => (await transporteService.list("vinculos")).data,
    ),
    read(
      "viagens.view",
      async () => (await transporteService.list("dias", period)).data,
    ),
    // Adjacent operation dates may contain windows that cross midnight.
    read("viagens.view", () =>
      readAllTrips({
        de: shiftDate(period.de, -1),
        ate: shiftDate(period.ate, 1),
      }),
    ),
  ]);
  return {
    linhas,
    veiculos,
    atribuicoes,
    horarios,
    pontos,
    vinculos,
    dias,
    viagens,
  };
}

export const transporteOperacaoQuery = createCachedQuery(
  loadTransporteOperacao,
);
