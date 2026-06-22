"use client";

import { X } from "lucide-react";

import { Button } from "@/components/buttons";
import { Select } from "@/components/form/inputs";

export type SolicitationFilterOption = {
  label: string;
  value: string;
};

export type SolicitationFilters = {
  courseValues: string[];
  institutionIds: string[];
  lineIds: string[];
  semesterValues: string[];
  statuses: string[];
};

type SolicitationsFilterDropdownProps = {
  filters: SolicitationFilters;
  courseOptions: SolicitationFilterOption[];
  institutionOptions: SolicitationFilterOption[];
  labelClassName?: string;
  lineOptions: SolicitationFilterOption[];
  onFiltersChange: (filters: SolicitationFilters) => void;
  semesterOptions: SolicitationFilterOption[];
};

type FilterSelectProps = {
  allLabel: string;
  containerClassName?: string;
  label: string;
  labelClassName?: string;
  options: SolicitationFilterOption[];
  value: string[];
  onChange: (nextValue: string[]) => void;
};

const ALL_FILTER_VALUE = "__all__";

export const EMPTY_SOLICITATION_FILTERS: SolicitationFilters = {
  courseValues: [],
  institutionIds: [],
  lineIds: [],
  semesterValues: [],
  statuses: [],
};

function hasActiveFilters(filters: SolicitationFilters) {
  return Boolean(
    filters.institutionIds.length ||
      filters.courseValues.length ||
      filters.semesterValues.length ||
      filters.lineIds.length,
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

export function SolicitationsFilterDropdown({
  courseOptions,
  filters,
  institutionOptions,
  labelClassName = "mb-1.5 block text-xs font-bold text-content-secondary",
  lineOptions,
  onFiltersChange,
  semesterOptions,
}: SolicitationsFilterDropdownProps) {
  const hasFilters = hasActiveFilters(filters);

  function updateFilters(key: keyof SolicitationFilters, nextValue: string[]) {
    onFiltersChange({
      ...filters,
      [key]: nextValue,
    });
  }

  function handleClearFilters() {
    onFiltersChange(EMPTY_SOLICITATION_FILTERS);
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
        containerClassName="min-w-0 xl:col-span-4"
        labelClassName={labelClassName}
        label="Linha"
        onChange={(nextValue) => updateFilters("lineIds", nextValue)}
        options={lineOptions}
        value={filters.lineIds}
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
