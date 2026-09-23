"use client";

import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/buttons";
import { DateInput, Select } from "@/components/form/inputs";
import {
  type ChamadaHistoryFilters,
  validateChamadaHistoryDateRange,
} from "@/components/ui/frequencias/chamadaHistoryPresentation";
import type { FrequenciaLinha } from "@/types/frequencia";

type ChamadasHistoryFilterCardProps = {
  disabled?: boolean;
  filters: ChamadaHistoryFilters;
  linhas: FrequenciaLinha[];
  onApply: () => void;
  onChange: (field: keyof ChamadaHistoryFilters, value: string) => void;
  onClear: () => void;
};

const FILTER_LABEL_CLASS =
  "mb-1.5 block text-xs font-bold text-content-secondary";

export function ChamadasHistoryFilterCard({
  disabled = false,
  filters,
  linhas,
  onApply,
  onChange,
  onClear,
}: ChamadasHistoryFilterCardProps) {
  const dateRangeError = validateChamadaHistoryDateRange(
    filters.de,
    filters.ate,
  );

  return (
    <section className="rounded-lg border border-brand-600/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-brand-600">
        <Filter aria-hidden="true" className="size-4" />
        <h2 className="text-base font-bold">Filtros</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0">
          <span className={FILTER_LABEL_CLASS}>Status</span>
          <Select
            disabled={disabled}
            onChange={(event) => onChange("status", event.target.value)}
            options={[
              { value: "", label: "Todos os status" },
              { value: "Aberta", label: "Aberta" },
              { value: "Fechada", label: "Fechada" },
            ]}
            value={filters.status}
          />
        </div>
        <div className="min-w-0">
          <span className={FILTER_LABEL_CLASS}>Linha</span>
          <Select
            disabled={disabled}
            onChange={(event) => onChange("linhaId", event.target.value)}
            options={[
              { value: "", label: "Todas as linhas" },
              ...linhas.map((linha) => ({
                value: String(linha.id),
                label: linha.name,
              })),
            ]}
            value={filters.linhaId}
          />
        </div>
        <div className="min-w-0">
          <label className={FILTER_LABEL_CLASS} htmlFor="chamadas-de">
            Chamadas a partir de
          </label>
          <DateInput
            disabled={disabled}
            id="chamadas-de"
            label=""
            max={filters.ate || undefined}
            onChange={(event) => onChange("de", event.target.value)}
            value={filters.de}
            variant="white"
          />
        </div>
        <div className="min-w-0">
          <label className={FILTER_LABEL_CLASS} htmlFor="chamadas-ate">
            Chamadas até
          </label>
          <DateInput
            disabled={disabled}
            error={dateRangeError}
            id="chamadas-ate"
            label=""
            min={filters.de || undefined}
            onChange={(event) => onChange("ate", event.target.value)}
            value={filters.ate}
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
          disabled={disabled || Boolean(dateRangeError)}
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
