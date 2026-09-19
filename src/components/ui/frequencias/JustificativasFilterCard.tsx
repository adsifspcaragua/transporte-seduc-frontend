"use client";

import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/buttons";
import { DateInput, Select } from "@/components/form/inputs";
import {
  type JustificativaFilters,
  validateJustificativaDateRange,
} from "@/components/ui/frequencias/justificativaPresentation";
import type { FrequenciaLinha } from "@/types/frequencia";

type JustificativasFilterCardProps = {
  disabled?: boolean;
  filters: JustificativaFilters;
  linhas: FrequenciaLinha[];
  onApply: () => void;
  onChange: (field: keyof JustificativaFilters, value: string) => void;
  onClear: () => void;
};

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "Em analise", label: "Em análise" },
  { value: "Aprovada", label: "Aprovada" },
  { value: "Rejeitada", label: "Rejeitada" },
];

export function JustificativasFilterCard({
  disabled = false,
  filters,
  linhas,
  onApply,
  onChange,
  onClear,
}: JustificativasFilterCardProps) {
  const dateRangeError = validateJustificativaDateRange(
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
          options={statusOptions}
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
          label="Faltas a partir de"
          max={filters.ate || undefined}
          onChange={(event) => onChange("de", event.target.value)}
          value={filters.de}
        />
        <DateInput
          disabled={disabled}
          error={dateRangeError}
          label="Faltas até"
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
