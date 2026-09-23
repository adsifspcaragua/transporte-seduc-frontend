"use client";

import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/buttons";
import { DateInput, Input, Select } from "@/components/form/inputs";
import {
  type RelatorioFrequenciaFilters,
  validateMinimumConsecutiveAbsences,
  validateReportPeriod,
} from "@/components/ui/frequencias/relatorioFrequenciaPresentation";
import type { FrequenciaLinha } from "@/types/frequencia";

type RelatorioFrequenciaFilterCardProps = {
  disabled?: boolean;
  filters: RelatorioFrequenciaFilters;
  linhas: FrequenciaLinha[];
  onApply: () => void;
  onChange: (field: keyof RelatorioFrequenciaFilters, value: string) => void;
  onClear: () => void;
};

const FILTER_LABEL_CLASS =
  "mb-1.5 block text-xs font-bold text-content-secondary";

export function RelatorioFrequenciaFilterCard({
  disabled = false,
  filters,
  linhas,
  onApply,
  onChange,
  onClear,
}: RelatorioFrequenciaFilterCardProps) {
  const periodError = validateReportPeriod(filters.de, filters.ate);
  const minimumError = validateMinimumConsecutiveAbsences(
    filters.faltasConsecutivasMin,
  );

  return (
    <section className="rounded-lg border border-brand-600/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-brand-600">
        <Filter aria-hidden="true" className="size-4" />
        <h2 className="text-base font-bold">Filtros</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0">
          <label className={FILTER_LABEL_CLASS} htmlFor="relatorio-de">
            Período inicial
          </label>
          <DateInput
            disabled={disabled}
            id="relatorio-de"
            label=""
            max={filters.ate || undefined}
            onChange={(event) => onChange("de", event.target.value)}
            value={filters.de}
            variant="white"
          />
        </div>
        <div className="min-w-0">
          <label className={FILTER_LABEL_CLASS} htmlFor="relatorio-ate">
            Período final
          </label>
          <DateInput
            disabled={disabled}
            error={periodError}
            id="relatorio-ate"
            label=""
            min={filters.de || undefined}
            onChange={(event) => onChange("ate", event.target.value)}
            value={filters.ate}
            variant="white"
          />
        </div>
        <div className="min-w-0">
          <span className={FILTER_LABEL_CLASS}>Linha</span>
          <Select
            disabled={disabled}
            onChange={(event) => onChange("linhaId", event.target.value)}
            options={[
              { label: "Todas as linhas", value: "" },
              ...linhas.map((linha) => ({
                label: linha.name,
                value: String(linha.id),
              })),
            ]}
            value={filters.linhaId}
          />
        </div>
        <div className="min-w-0">
          <label className={FILTER_LABEL_CLASS} htmlFor="relatorio-minimo">
            Mínimo de faltas seguidas
          </label>
          <Input
            disabled={disabled}
            error={minimumError}
            id="relatorio-minimo"
            min="1"
            onChange={(event) =>
              onChange("faltasConsecutivasMin", event.target.value)
            }
            placeholder="Sem mínimo"
            type="number"
            value={filters.faltasConsecutivasMin}
            variant="white"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          disabled={disabled}
          fullWidth={false}
          leftIcon={<RotateCcw />}
          onClick={onClear}
          variant="ghost"
        >
          Limpar
        </Button>
        <Button
          disabled={disabled || Boolean(periodError || minimumError)}
          fullWidth={false}
          leftIcon={<Filter />}
          onClick={onApply}
          variant="primary"
        >
          Filtrar
        </Button>
      </div>
    </section>
  );
}
