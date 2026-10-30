"use client";

import { useState } from "react";
import { Button } from "@/components/buttons";
import { useAuthz } from "@/hooks/use-authz";
import { getQuerySessionVersion } from "@/services/api/query-cache";
import { TransporteIndicadores } from "./TransporteIndicadores";
import { TransporteResourcePanel } from "./TransporteResourcePanel";
import { transporteConfigs } from "./transporteConfig";

export function TransportesWorkspace() {
  const { can, canAny } = useAuthz();
  const available = transporteConfigs.filter((config) => canAny(config.view));
  const [selected, setSelected] = useState("");
  const active =
    available.find((config) => config.key === selected) ?? available[0];
  const indicatorsSelected =
    selected === "indicadores" && can("presencas.view");
  const session = getQuerySessionVersion();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-700">
          Gestão do transporte
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          Operação, embarque e acompanhamento das presenças.
        </p>
      </header>
      <nav
        aria-label="Áreas de gestão do transporte"
        className="flex flex-wrap gap-2"
      >
        {available.map((config) => (
          <Button
            key={config.key}
            size="sm"
            fullWidth={false}
            variant={
              !indicatorsSelected && active?.key === config.key
                ? "primary"
                : "secondary"
            }
            aria-pressed={!indicatorsSelected && active?.key === config.key}
            onClick={() => setSelected(config.key)}
          >
            {config.label}
          </Button>
        ))}
        {can("presencas.view") && (
          <Button
            size="sm"
            fullWidth={false}
            variant={indicatorsSelected ? "primary" : "secondary"}
            aria-pressed={indicatorsSelected}
            onClick={() => setSelected("indicadores")}
          >
            Indicadores
          </Button>
        )}
      </nav>
      {indicatorsSelected ? (
        <TransporteIndicadores key={`indicadores-${session}`} />
      ) : active ? (
        <TransporteResourcePanel
          config={active}
          key={`${active.key}-${session}`}
        />
      ) : (
        <p
          role="alert"
          className="rounded-xl bg-white p-6 text-sm text-content-secondary"
        >
          Você não tem permissão para consultar esta área.
        </p>
      )}
    </div>
  );
}
