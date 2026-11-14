"use client";

import Link from "next/link";
import { useAuthz } from "@/hooks/use-authz";
import { getQuerySessionVersion } from "@/services/api/query-cache";
import type { TransporteResource } from "@/types/transporte";
import { TransporteIndicadores } from "./TransporteIndicadores";
import { TransporteResourcePanel } from "./TransporteResourcePanel";
import { TransporteSectionNav } from "./TransporteSectionNav";
import { type TransporteConfig, transporteConfigs } from "./transporteConfig";

type Section =
  | "calendario"
  | "recursos"
  | "presencas"
  | "ocorrencias"
  | "dispositivos"
  | "administracao"
  | "embarques";
const sections: Record<
  Section,
  {
    title: string;
    description: string;
    resources: TransporteResource[];
    area?: "gestao" | "embarques";
  }
> = {
  calendario: {
    title: "Calendário geral",
    description:
      "Consulte viagens por período, ajuste ocorrências e programe viagens explicitamente.",
    area: "gestao",
    resources: ["viagens", "dias", "horarios"],
  },
  recursos: {
    title: "Recursos compartilhados",
    description:
      "Cadastre veículos e pontos usados por diferentes linhas. Atribuições e vínculos são gerenciados na página de cada linha.",
    area: "gestao",
    resources: ["veiculos", "pontos"],
  },
  embarques: {
    title: "Embarques e presenças",
    description: "Acompanhe registros, ocorrências e dispositivos autorizados.",
    area: "embarques",
    resources: [],
  },
  presencas: {
    title: "Presenças registradas",
    description:
      "Consulte registros de embarque com filtros e paginação do servidor.",
    area: "embarques",
    resources: ["presencas"],
  },
  ocorrencias: {
    title: "Ocorrências e revisões",
    description: "Analise tentativas negadas, revisões e exceções autorizadas.",
    area: "embarques",
    resources: ["tentativas", "presencas"],
  },
  dispositivos: {
    title: "Dispositivos autorizados",
    description: "Analise solicitações e gerencie credenciais dos estudantes.",
    area: "embarques",
    resources: ["solicitacoes", "dispositivos"],
  },
  administracao: {
    title: "Administração",
    description: "Cargos, instituições e auditoria geral.",
    resources: ["roles", "instituicoes", "auditoria"],
  },
};

export function TransporteSectionWorkspace({ section }: { section: Section }) {
  const { can, canAny } = useAuthz();
  const data = sections[section];
  const session = getQuerySessionVersion();
  const available = data.resources
    .map((key) => transporteConfigs.find((item) => item.key === key))
    .filter((item): item is TransporteConfig =>
      Boolean(item && canAny(item.view)),
    );
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-700">{data.title}</h1>
        <p className="mt-2 text-sm text-content-muted">{data.description}</p>
      </header>
      {data.area && <TransporteSectionNav area={data.area} />}
      {section === "embarques" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Presenças registradas", "/embarques/presencas", "presencas.view"],
            [
              "Ocorrências e revisões",
              "/embarques/ocorrencias",
              "presencas.view",
            ],
            [
              "Dispositivos autorizados",
              "/embarques/dispositivos",
              "dispositivos.view",
            ],
          ]
            .filter(([, , permission]) => can(permission))
            .map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-border-subtle bg-white p-5 font-semibold text-brand-700 focus-visible:outline-2"
              >
                {label} →
              </Link>
            ))}
        </div>
      )}
      {section === "embarques" && can("presencas.view") && (
        <TransporteIndicadores key={`indicadores-${session}`} />
      )}
      {available.map((config) => (
        <TransporteResourcePanel
          config={config}
          key={`${config.key}-${session}`}
        />
      ))}
      {section !== "embarques" && available.length === 0 && (
        <p role="alert" className="rounded-xl bg-white p-5 text-sm">
          Seu perfil não permite consultar esta seção.
        </p>
      )}
    </div>
  );
}
