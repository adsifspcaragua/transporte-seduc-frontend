"use client";

import { useState } from "react";
import { Button } from "@/components/buttons";
import { useAuthz } from "@/hooks/use-authz";
import { getQuerySessionVersion } from "@/services/api/query-cache";
import { TransporteIndicadores } from "./TransporteIndicadores";
import { TransporteResourcePanel } from "./TransporteResourcePanel";
import { transporteConfigs } from "./transporteConfig";
import { transporteGroups } from "./transporteNavigation";

export function TransporteManutencao() {
  const { can, canAny } = useAuthz();
  const available = transporteConfigs.filter((config) => canAny(config.view));
  const [selected, setSelected] = useState("");
  const groups = transporteGroups.filter((group) =>
    group.sections.some((key) =>
      key === "indicadores"
        ? can("presencas.view")
        : available.some((config) => config.key === key),
    ),
  );
  const [selectedGroup, setSelectedGroup] = useState("");
  const group = groups.find((item) => item.key === selectedGroup) ?? groups[0];
  const sections = available.filter((config) =>
    group?.sections.includes(config.key),
  );
  const active =
    sections.find((config) => config.key === selected) ?? sections[0];
  const indicatorsSelected =
    group?.sections.includes("indicadores") &&
    can("presencas.view") &&
    (selected === "indicadores" || !active);
  const session = getQuerySessionVersion();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-700">
          Cadastros e manutenção
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          Operação, embarque e acompanhamento das presenças.
        </p>
      </header>
      <nav
        aria-label="Áreas de gestão do transporte"
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
      >
        {groups.map((item) => (
          <Button
            key={item.key}
            size="sm"
            fullWidth={false}
            variant={group?.key === item.key ? "primary" : "secondary"}
            aria-pressed={group?.key === item.key}
            onClick={() => {
              setSelectedGroup(item.key);
              setSelected("");
            }}
          >
            {item.label}
          </Button>
        ))}
      </nav>
      <nav
        aria-label={`Seções de ${group?.label ?? "transporte"}`}
        className="flex flex-wrap gap-2 rounded-xl border border-border-subtle bg-white p-3"
      >
        {sections.map((config) => (
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
        {group?.sections.includes("indicadores") && can("presencas.view") && (
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
