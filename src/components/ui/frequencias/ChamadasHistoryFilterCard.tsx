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
    <section className="rounded-lg border border-border-subtle bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Select
          disabled={disabled}
          label="Status"
          onChange={(event) => onChange("status", event.target.value)}
          options={[
            { value: "", label: "Todos os status" },
            { value: "Aberta", label: "Aberta" },
            { value: "Fechada", label: "Fechada" },
          ]}
          value={filters.status}
        />
        <Select
          disabled={disabled}
          label="Linha"
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
        <DateInput
          disabled={disabled}
          label="Chamadas a partir de"
          max={filters.ate || undefined}
          onChange={(event) => onChange("de", event.target.value)}
          value={filters.de}
        />
        <DateInput
          disabled={disabled}
          error={dateRangeError}
          label="Chamadas até"
          min={filters.de || undefined}
          onChange={(event) => onChange("ate", event.target.value)}
          value={filters.ate}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
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
