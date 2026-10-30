import { api } from "@/services/api/client";
import { createCachedQuery } from "@/services/api/query-cache";
import {
  TRANSPORTE_ENDPOINTS,
  transporteEndpoint,
} from "@/services/api/transporte-endpoints";
import type {
  ConflitoViagem,
  IndicadoresPresenca,
  QrVeiculo,
  TransporteCollection,
  TransporteFiltros,
  TransporteMutation,
  TransportePayloads,
  TransporteResource,
  TransporteResources,
  TransporteWritable,
  Veiculo,
} from "@/types/transporte";

export const transporteService = {
  async list<K extends TransporteResource>(
    resource: K,
    params: TransporteFiltros = {},
  ): Promise<TransporteCollection<TransporteResources[K]>> {
    // Legacy roles/instituicao endpoints return a message-only body when empty.
    const { data } = await api.get<
      TransporteCollection<TransporteResources[K]> | { message: string }
    >(TRANSPORTE_ENDPOINTS[resource], { params });
    return "data" in data ? data : { data: [] };
  },
  async detail<K extends TransporteResource>(resource: K, id: string | number) {
    const { data } = await api.get<{ data: TransporteResources[K] }>(
      transporteEndpoint(resource, id),
    );
    return data.data;
  },
  async save<K extends TransporteWritable>(
    resource: K,
    payload: TransportePayloads[K],
    id?: number,
  ) {
    const endpoint =
      id === undefined
        ? TRANSPORTE_ENDPOINTS[resource]
        : transporteEndpoint(resource, id);
    const { data } =
      id === undefined
        ? await api.post<
            TransporteMutation<TransporteResources[K] & { qr?: QrVeiculo }>
          >(endpoint, payload)
        : await api.patch<TransporteMutation<TransporteResources[K]>>(
            endpoint,
            payload,
          );
    return data;
  },
  async remove(resource: TransporteWritable, id: number) {
    const { data } = await api.delete<TransporteMutation>(
      transporteEndpoint(resource, id),
    );
    return data;
  },
  async rotateQr(id: number, motivo: string) {
    const { data } = await api.post<
      TransporteMutation<Veiculo & { qr: QrVeiculo }>
    >(`${transporteEndpoint("veiculos", id)}/qr`, { motivo });
    return data;
  },
  async generate(payload: {
    de: string;
    ate: string;
    linha_id?: number | null;
  }) {
    const { data } = await api.post<
      TransporteMutation<{ criadas: number; conflitos: ConflitoViagem[] }>
    >(`${TRANSPORTE_ENDPOINTS.viagens}/gerar`, payload);
    return data;
  },
  async decideDevice(
    id: number,
    decision: "aprovar" | "rejeitar",
    parecer: string,
  ) {
    const { data } = await api.patch<
      TransporteMutation<TransporteResources["solicitacoes"]>
    >(`${transporteEndpoint("solicitacoes", id)}/${decision}`, { parecer });
    return data;
  },
  async revokeDevice(id: string, motivo: string) {
    const { data } = await api.patch<
      TransporteMutation<TransporteResources["dispositivos"]>
    >(`${transporteEndpoint("dispositivos", id)}/revogar`, { motivo });
    return data;
  },
  async manual(payload: {
    estudante_id: number;
    viagem_id: number;
    justificativa: string;
  }) {
    const { data } = await api.post<
      TransporteMutation<TransporteResources["presencas"]>
    >(`${TRANSPORTE_ENDPOINTS.presencas}/manual`, payload);
    return data;
  },
  async review(
    id: number,
    payload: { decisao: "Aprovada" | "Rejeitada"; parecer: string },
  ) {
    const { data } = await api.put<
      TransporteMutation<TransporteResources["tentativas"]>
    >(`${transporteEndpoint("tentativas", id)}/revisao`, payload);
    return data;
  },
  async indicators(params: TransporteFiltros = {}) {
    const { data } = await api.get<{ data: IndicadoresPresenca }>(
      `${TRANSPORTE_ENDPOINTS.presencas}/indicadores`,
      { params },
    );
    return data.data;
  },
};

export const transporteQuery = createCachedQuery(
  (resource: TransporteResource, filters: TransporteFiltros) =>
    transporteService.list(resource, filters),
);
export const indicadoresTransporteQuery = createCachedQuery(
  transporteService.indicators,
);
