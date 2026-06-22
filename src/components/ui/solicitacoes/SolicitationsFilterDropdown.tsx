"use client";

import { ChevronDown, Filter } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/buttons";
import { Checkbox, SearchInput } from "@/components/form/inputs";
import { cn } from "@/utils/cn";

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
  lineOptions: SolicitationFilterOption[];
  onFiltersChange: (filters: SolicitationFilters) => void;
  semesterOptions: SolicitationFilterOption[];
  statusOptions: SolicitationFilterOption[];
};

type FilterSectionProps = {
  emptyMessage: string;
  options: SolicitationFilterOption[];
  searchPlaceholder?: string;
  searchable?: boolean;
  selectedValues: string[];
  title: string;
  onToggle: (value: string) => void;
};

type MultiSelectSectionProps = {
  emptyMessage: string;
  options: SolicitationFilterOption[];
  placeholder: string;
  selectedValues: string[];
  title: string;
  onToggle: (value: string) => void;
};

export const EMPTY_SOLICITATION_FILTERS: SolicitationFilters = {
  courseValues: [],
  institutionIds: [],
  lineIds: [],
  semesterValues: [],
  statuses: [],
};

function hasActiveFilters(filters: SolicitationFilters) {
  return (
    filters.statuses.length > 0 ||
    filters.institutionIds.length > 0 ||
    filters.courseValues.length > 0 ||
    filters.semesterValues.length > 0 ||
    filters.lineIds.length > 0
  );
}

function toggleFilterValue(values: string[], value: string) {
  if (values.includes(value)) {
    return values.filter((currentValue) => currentValue !== value);
  }

  return [...values, value];
}

function FilterSection({
  emptyMessage,
  options,
  searchable = false,
  searchPlaceholder = "Pesquisar...",
  selectedValues,
  title,
  onToggle,
}: FilterSectionProps) {
  const [query, setQuery] = useState("");

  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  return (
    <section className="border-t border-border-default/80 pt-4 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-brand-600/80">
          {title}
        </h3>
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-opacity",
            selectedValues.length > 0
              ? "bg-brand-100 text-brand-600 opacity-100"
              : "opacity-0",
          )}
        >
          {selectedValues.length}
        </span>
      </div>

      {searchable && (
        <SearchInput
          className="text-xs"
          containerClassName="mb-3 h-11"
          onClear={() => setQuery("")}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          value={query}
        />
      )}

      <div
        className={cn(
          "space-y-2 pr-1",
          searchable && "max-h-44 overflow-y-auto",
        )}
      >
        {visibleOptions.length === 0 ? (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-content-muted">
            {emptyMessage}
          </p>
        ) : (
          visibleOptions.map((option) => (
            <Checkbox
              checked={selectedValues.includes(option.value)}
              containerClassName="gap-0"
              key={option.value}
              label={option.label}
              labelClassName="w-full rounded-md px-2 py-1.5 text-sm hover:bg-brand-100/45"
              onChange={() => onToggle(option.value)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function MultiSelectSection({
  emptyMessage,
  options,
  placeholder,
  selectedValues,
  title,
  onToggle,
}: MultiSelectSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  return (
    <section className="border-t border-border-default/80 pt-4 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-brand-600/80">
          {title}
        </h3>
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-opacity",
            selectedValues.length > 0
              ? "bg-brand-100 text-brand-600 opacity-100"
              : "opacity-0",
          )}
        >
          {selectedValues.length}
        </span>
      </div>

      <div className="relative">
        <button
          className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border-2 border-border-default bg-white px-3 text-left text-sm font-medium text-content-primary transition-colors hover:border-brand-600 focus:border-brand-600 focus:outline-none"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          type="button"
        >
          <span className="min-w-0 truncate">
            {selectedLabels.length > 0
              ? selectedLabels.join(", ")
              : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-brand-600 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-10 max-h-48 overflow-y-auto rounded-lg border border-brand-600/15 bg-white p-2 shadow-lg">
            {options.length === 0 ? (
              <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-content-muted">
                {emptyMessage}
              </p>
            ) : (
              <div className="space-y-1">
                {options.map((option) => (
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    containerClassName="gap-0"
                    key={option.value}
                    label={option.label}
                    labelClassName="w-full rounded-md px-2 py-1.5 text-sm hover:bg-brand-100/45"
                    onChange={() => onToggle(option.value)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function SolicitationsFilterDropdown({
  courseOptions,
  filters,
  institutionOptions,
  lineOptions,
  onFiltersChange,
  semesterOptions,
  statusOptions,
}: SolicitationsFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<SolicitationFilters>(filters);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (!dropdownRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleToggleOpen() {
    setIsOpen((currentValue) => {
      if (!currentValue) {
        setDraftFilters(filters);
      }

      return !currentValue;
    });
  }

  function updateDraftFilters(
    key: keyof SolicitationFilters,
    nextValues: string[],
  ) {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [key]: nextValues,
    }));
  }

  function handleApplyFilters() {
    onFiltersChange(draftFilters);
    setIsOpen(false);
  }

  function handleClearFilters() {
    setDraftFilters(EMPTY_SOLICITATION_FILTERS);
    onFiltersChange(EMPTY_SOLICITATION_FILTERS);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="h-11 px-4"
        fullWidth={false}
        leftIcon={<Filter />}
        onClick={handleToggleOpen}
        variant="primary"
      >
        Filtrar
      </Button>

      {isOpen && (
        <div
          aria-label="Filtros de solicitações"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 flex max-h-[min(42rem,calc(100vh-8rem))] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-brand-600/10 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
          role="dialog"
        >
          <div className="border-b border-border-default px-5 py-4">
            <h2 className="text-base font-bold text-brand-600">Filtros</h2>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <FilterSection
              emptyMessage="Nenhum status disponível."
              onToggle={(value) =>
                updateDraftFilters(
                  "statuses",
                  toggleFilterValue(draftFilters.statuses, value),
                )
              }
              options={statusOptions}
              selectedValues={draftFilters.statuses}
              title="Status"
            />

            <FilterSection
              emptyMessage="Nenhuma instituição encontrada."
              onToggle={(value) =>
                updateDraftFilters(
                  "institutionIds",
                  toggleFilterValue(draftFilters.institutionIds, value),
                )
              }
              options={institutionOptions}
              searchable
              searchPlaceholder="Buscar instituição..."
              selectedValues={draftFilters.institutionIds}
              title="Instituição"
            />

            <FilterSection
              emptyMessage="Nenhum curso encontrado."
              onToggle={(value) =>
                updateDraftFilters(
                  "courseValues",
                  toggleFilterValue(draftFilters.courseValues, value),
                )
              }
              options={courseOptions}
              searchable
              searchPlaceholder="Buscar curso..."
              selectedValues={draftFilters.courseValues}
              title="Curso"
            />

            <MultiSelectSection
              emptyMessage="Nenhum semestre encontrado."
              onToggle={(value) =>
                updateDraftFilters(
                  "semesterValues",
                  toggleFilterValue(draftFilters.semesterValues, value),
                )
              }
              options={semesterOptions}
              placeholder="Selecione os semestres"
              selectedValues={draftFilters.semesterValues}
              title="Semestre"
            />

            <FilterSection
              emptyMessage="Nenhuma linha encontrada."
              onToggle={(value) =>
                updateDraftFilters(
                  "lineIds",
                  toggleFilterValue(draftFilters.lineIds, value),
                )
              }
              options={lineOptions}
              searchable={lineOptions.length > 6}
              searchPlaceholder="Buscar linha..."
              selectedValues={draftFilters.lineIds}
              title="Linha"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border-default bg-white px-5 py-4">
            <Button
              className="h-11 px-4 text-sm"
              disabled={
                !hasActiveFilters(filters) && !hasActiveFilters(draftFilters)
              }
              fullWidth={false}
              onClick={handleClearFilters}
              size="sm"
              variant="secondary"
            >
              Limpar
            </Button>
            <Button
              className="h-11 px-4 text-sm"
              fullWidth={false}
              onClick={handleApplyFilters}
              size="sm"
              variant="primary"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
