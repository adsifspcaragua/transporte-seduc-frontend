"use client";

import { X } from "lucide-react";

import { Button } from "@/components/buttons";
import { Select } from "@/components/form/inputs";

export type StudentFilterOption = {
  label: string;
  value: string;
};

export type StudentFilters = {
  courseValues: string[];
  institutionIds: string[];
  lineIds: string[];
  semesterValues: string[];
  statuses: string[];
};

type StudentsFilterDropdownProps = {
  filters: StudentFilters;
  courseOptions: StudentFilterOption[];
  institutionOptions: StudentFilterOption[];
  labelClassName?: string;
  lineOptions: StudentFilterOption[];
  onFiltersChange: (filters: StudentFilters) => void;
  semesterOptions: StudentFilterOption[];
};

type FilterSelectProps = {
  allLabel: string;
  containerClassName?: string;
  label: string;
  labelClassName?: string;
  options: StudentFilterOption[];
  value: string[];
  onChange: (nextValue: string[]) => void;
};

const ALL_FILTER_VALUE = "__all__";

export const EMPTY_STUDENT_FILTERS: StudentFilters = {
  courseValues: [],
  institutionIds: [],
  lineIds: [],
  semesterValues: [],
  statuses: [],
};

export const STUDENT_STATUS_OPTIONS: StudentFilterOption[] = [
  { label: "Lista de espera", value: "lista_espera" },
  { label: "Aprovado", value: "aprovado" },
  { label: "Rejeitado", value: "rejeitado" },
  { label: "Ativo", value: "ativo" },
  { label: "Inativo", value: "inativo" },
];

function hasActiveFilters(filters: StudentFilters) {
  return Boolean(
    filters.statuses.length ||
      filters.institutionIds.length ||
      filters.lineIds.length ||
      filters.courseValues.length ||
      filters.semesterValues.length,
  );
}

function FilterSelect({
  allLabel,
  containerClassName = "",
  label,
  labelClassName,
  options,
  value,
  onChange,
}: FilterSelectProps) {
  return (
    <div className={containerClassName || "min-w-0"}>
      <span className={labelClassName}>{label}</span>
      <Select
        className="px-3 pr-10"
        containerClassName="min-w-0 gap-0"
        onChange={(event) => {
          const nextValue = event.target.value;

          onChange(nextValue === ALL_FILTER_VALUE ? [] : [nextValue]);
        }}
        options={[{ label: allLabel, value: ALL_FILTER_VALUE }, ...options]}
        value={value[0] ?? ALL_FILTER_VALUE}
      />
    </div>
  );
}

export function StudentsFilterDropdown({
  courseOptions,
  filters,
  institutionOptions,
  labelClassName = "mb-1.5 block text-xs font-bold text-content-secondary",
  lineOptions,
  onFiltersChange,
  semesterOptions,
}: StudentsFilterDropdownProps) {
  const hasFilters = hasActiveFilters(filters);

  function updateFilters(key: keyof StudentFilters, nextValue: string[]) {
    onFiltersChange({
      ...filters,
      [key]: nextValue,
    });
  }

  function handleClearFilters() {
    onFiltersChange(EMPTY_STUDENT_FILTERS);
  }

  return (
    <>
      <FilterSelect
        allLabel="Todas"
        containerClassName="min-w-0 xl:col-span-4"
        labelClassName={labelClassName}
        label="Instituição"
        onChange={(nextValue) => updateFilters("institutionIds", nextValue)}
        options={institutionOptions}
        value={filters.institutionIds}
      />

      <FilterSelect
        allLabel="Todas"
        containerClassName="min-w-0 xl:col-span-2"
        labelClassName={labelClassName}
        label="Linha"
        onChange={(nextValue) => updateFilters("lineIds", nextValue)}
        options={lineOptions}
        value={filters.lineIds}
      />

      <FilterSelect
        allLabel="Todos"
        containerClassName="min-w-0 xl:col-span-2"
        labelClassName={labelClassName}
        label="Status"
        onChange={(nextValue) => updateFilters("statuses", nextValue)}
        options={STUDENT_STATUS_OPTIONS}
        value={filters.statuses}
      />

      <FilterSelect
        allLabel="Todos"
        containerClassName="min-w-0 xl:col-span-4"
        labelClassName={labelClassName}
        label="Curso"
        onChange={(nextValue) => updateFilters("courseValues", nextValue)}
        options={courseOptions}
        value={filters.courseValues}
      />

      <FilterSelect
        allLabel="Todos"
        containerClassName="min-w-0 xl:col-span-2"
        labelClassName={labelClassName}
        label="Semestre"
        onChange={(nextValue) => updateFilters("semesterValues", nextValue)}
        options={semesterOptions}
        value={filters.semesterValues}
      />

      <div className="pt-5 xl:col-start-12">
        <Button
          className="px-4 text-sm"
          disabled={!hasFilters}
          fullWidth={false}
          leftIcon={<X />}
          onClick={handleClearFilters}
          size="sm"
          variant="secondary"
        >
          Limpar
        </Button>
      </div>
    </>
  );
}
