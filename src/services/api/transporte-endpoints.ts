import type { TransporteResource } from "@/types/transporte";

export const TRANSPORTE_ENDPOINTS = {
  veiculos: "/veiculos",
  atribuicoes: "/veiculos/atribuicoes",
  horarios: "/horarios-viagem",
  viagens: "/viagens",
  dias: "/dias-sem-operacao",
  pontos: "/pontos-embarque",
  vinculos: "/pontos-embarque/linhas",
  autorizacoes: "/autorizacoes-linha",
  solicitacoes: "/dispositivos/solicitacoes",
  dispositivos: "/dispositivos",
  presencas: "/presencas",
  tentativas: "/presencas/tentativas",
  auditoria: "/auditoria",
  roles: "/roles",
  instituicoes: "/instituicao",
} satisfies Record<TransporteResource, string>;

export function transporteEndpoint(
  resource: TransporteResource,
  id: number | string,
) {
  return `${TRANSPORTE_ENDPOINTS[resource]}/${encodeURIComponent(String(id))}`;
}
