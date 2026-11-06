"use client";

import {
  CalendarDays,
  Eye,
  LayoutGrid,
  List,
  LockKeyhole,
  Pencil,
  Plus,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/buttons";
import { DateInput, Input, Select } from "@/components/form/inputs";
import type { PeriodoRecadastro } from "@/types/recadastro";
import { cn } from "@/utils/cn";
import {
  formatRecadastroDate,
  getRecadastroBadgeClass,
  type PeriodoSortOrder,
  sortPeriodos,
} from "./recadastroPresentation";

export type PeriodoFormState = {
  ano: string;
  semestre: string;
  data_inicio: string;
  data_fim: string;
  observacoes: string;
};

type PeriodoViewMode = "grid" | "list";

type RecadastroPeriodosSectionProps = {
  canWrite: boolean;
  actionLoading: boolean;
  editingId: number | null;
  form: PeriodoFormState;
  periodos: PeriodoRecadastro[];
  onCancelEdit: () => void;
  onEdit: (periodo: PeriodoRecadastro) => void;
  onFormChange: (field: keyof PeriodoFormState, value: string) => void;
  onSave: () => void;
  onShowMissing: (periodo: PeriodoRecadastro) => void;
  onToggle: (periodo: PeriodoRecadastro) => void;
};

export function RecadastroPeriodosSection({
  canWrite,
  actionLoading,
  editingId,
  form,
  periodos,
  onCancelEdit,
  onEdit,
  onFormChange,
  onSave,
  onShowMissing,
  onToggle,
}: RecadastroPeriodosSectionProps) {
  const [sortOrder, setSortOrder] = useState<PeriodoSortOrder>("recentes");
  const [viewMode, setViewMode] = useState<PeriodoViewMode>("grid");
  const sortedPeriodos = useMemo(
    () => sortPeriodos(periodos, sortOrder),
    [periodos, sortOrder],
  );

  return (
    <section className="@container/periodos min-w-0 space-y-5">
      {canWrite && (
        <div className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-050 text-brand-600">
                <CalendarDays className="size-5" />
              </span>
              <div className="min-w-0 break-words">
                <h2 className="text-lg font-bold text-brand-700">
                  {editingId === null
                    ? "Períodos de recadastro"
                    : "Editar período de recadastro"}
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  {editingId === null
                    ? "Filtre os períodos existentes ou crie um novo."
                    : "Atualize as informações do período selecionado e salve as alterações."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {editingId !== null && (
                <Button
                  fullWidth={false}
                  onClick={onCancelEdit}
                  size="sm"
                  variant="secondary"
                >
                  Cancelar
                </Button>
              )}
              <Button
                fullWidth={false}
                leftIcon={editingId === null ? <Plus /> : <Pencil />}
                loading={actionLoading}
                onClick={onSave}
                size="sm"
                variant="primary"
              >
                {editingId === null ? "Criar período" : "Salvar alterações"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 @min-[32rem]/periodos:grid-cols-2 @min-[68rem]/periodos:grid-cols-12">
            <Input
              containerClassName="@min-[68rem]/periodos:col-span-2"
              label="Ano"
              min="2000"
              onChange={(event) => onFormChange("ano", event.target.value)}
              type="number"
              value={form.ano}
            />
            <Select
              containerClassName="@min-[68rem]/periodos:col-span-2"
              label="Semestre"
              onChange={(event) => onFormChange("semestre", event.target.value)}
              options={[
                { label: "1º semestre", value: "1" },
                { label: "2º semestre", value: "2" },
              ]}
              value={form.semestre}
            />
            <DateInput
              containerClassName="@min-[68rem]/periodos:col-span-2"
              label="Início"
              onChange={(event) =>
                onFormChange("data_inicio", event.target.value)
              }
              value={form.data_inicio}
              variant="white"
            />
            <DateInput
              containerClassName="@min-[68rem]/periodos:col-span-2"
              label="Fim"
              onChange={(event) => onFormChange("data_fim", event.target.value)}
              value={form.data_fim}
              variant="white"
            />
            <Input
              containerClassName="@min-[32rem]/periodos:col-span-2 @min-[68rem]/periodos:col-span-4"
              label="Observações"
              onChange={(event) =>
                onFormChange("observacoes", event.target.value)
              }
              placeholder="Ex.: prazo prorrogado por uma semana"
              value={form.observacoes}
            />
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-base font-bold text-brand-700">
              Períodos cadastrados
            </h2>
            <p className="mt-0.5 text-xs text-content-muted">
              {periodos.length} período(s) encontrado(s)
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 @min-[40rem]/periodos:w-auto">
            <div className="flex min-w-0 basis-full items-center gap-2 @min-[32rem]/periodos:basis-auto">
              <span className="shrink-0 text-xs text-content-muted">
                Ordenar por:
              </span>
              <Select
                aria-label="Ordenar períodos"
                containerClassName="min-w-0 flex-1 @min-[32rem]/periodos:w-44"
                onChange={(event) =>
                  setSortOrder(event.target.value as PeriodoSortOrder)
                }
                options={[
                  { label: "Mais recentes", value: "recentes" },
                  { label: "Mais antigos", value: "antigos" },
                ]}
                value={sortOrder}
              />
            </div>
            <fieldset
              aria-label="Modo de exibição dos períodos"
              className="inline-flex h-10 shrink-0 overflow-hidden rounded-lg border border-brand-600/20 bg-white"
            >
              {(
                [
                  { value: "list", label: "Visualizar em lista", icon: List },
                  {
                    value: "grid",
                    label: "Visualizar em cards",
                    icon: LayoutGrid,
                  },
                ] as const
              ).map((option) => {
                const selected = viewMode === option.value;
                const Icon = option.icon;

                return (
                  <Button
                    aria-label={option.label}
                    aria-pressed={selected}
                    className={cn(
                      "h-full w-14 rounded-none border-0 shadow-none first:border-r first:border-brand-600/20 focus-visible:-outline-offset-2 active:scale-100",
                      selected
                        ? "bg-action-light-default text-brand-700 hover:bg-action-light-hover"
                        : "bg-white text-content-secondary hover:bg-surface-muted",
                    )}
                    key={option.value}
                    leftIcon={<Icon aria-hidden="true" />}
                    onClick={() => setViewMode(option.value)}
                    size="icon"
                    title={option.label}
                    variant="ghost"
                  />
                );
              })}
            </fieldset>
          </div>
        </div>

        {sortedPeriodos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-default bg-white px-5 py-10 text-center text-sm text-content-muted">
            Nenhum período de recadastro foi cadastrado.
          </div>
        ) : (
          <div
            className={cn(
              "grid min-w-0 gap-4",
              viewMode === "grid"
                ? "grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))]"
                : "grid-cols-1",
            )}
          >
            {sortedPeriodos.map((periodo) => (
              <article
                className={cn(
                  "@container/periodo flex min-w-0 flex-col rounded-xl border border-border-subtle bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
                  viewMode === "list" &&
                    "@min-[64rem]/periodos:grid @min-[64rem]/periodos:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @min-[64rem]/periodos:items-center @min-[64rem]/periodos:gap-x-5",
                )}
                key={periodo.id}
              >
                <div
                  className={cn(
                    "flex min-w-0 flex-wrap items-start justify-between gap-3",
                    viewMode === "list" &&
                      "@min-[64rem]/periodos:col-start-1 @min-[64rem]/periodos:row-start-1",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-050 text-brand-600">
                      <CalendarDays className="size-5" />
                    </span>
                    <div className="min-w-0 break-words">
                      <h3 className="font-bold text-content-primary">
                        {periodo.referencia}
                      </h3>
                      <p className="mt-1 text-xs text-content-muted">
                        {formatRecadastroDate(periodo.data_inicio)} a{" "}
                        {formatRecadastroDate(periodo.data_fim)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${getRecadastroBadgeClass(periodo.status)}`}
                  >
                    {periodo.status}
                  </span>
                </div>

                <p
                  className={cn(
                    "mt-3 min-h-5 min-w-0 break-words text-sm leading-5 text-content-muted",
                    viewMode === "list" &&
                      "@min-[64rem]/periodos:col-start-1 @min-[64rem]/periodos:row-start-2",
                  )}
                >
                  {periodo.observacoes || "Nenhuma observação informada."}
                </p>

                <div
                  className={cn(
                    "mt-auto flex min-w-0 flex-wrap gap-2 pt-4",
                    viewMode === "list" &&
                      "@min-[64rem]/periodos:col-start-2 @min-[64rem]/periodos:row-span-2 @min-[64rem]/periodos:row-start-1 @min-[64rem]/periodos:my-auto @min-[64rem]/periodos:pt-0",
                  )}
                >
                  {canWrite && (
                    <>
                      <Button
                        className="flex-1 basis-full px-3 @min-[20rem]/periodo:basis-auto"
                        fullWidth={false}
                        leftIcon={
                          periodo.status === "Aberto" ? (
                            <LockKeyhole />
                          ) : (
                            <Eye />
                          )
                        }
                        onClick={() => onToggle(periodo)}
                        size="sm"
                        variant={
                          periodo.status === "Aberto" ? "danger" : "primary"
                        }
                      >
                        {periodo.status === "Aberto" ? "Fechar" : "Abrir"}
                      </Button>
                      <Button
                        className="flex-1 basis-full px-3 @min-[20rem]/periodo:basis-auto"
                        fullWidth={false}
                        leftIcon={<Pencil />}
                        onClick={() => onEdit(periodo)}
                        size="sm"
                        variant="secondary"
                      >
                        Editar prazo
                      </Button>
                    </>
                  )}
                  <Button
                    className="flex-1 basis-full px-3 @min-[32rem]/periodo:basis-auto"
                    fullWidth={false}
                    leftIcon={<UsersRound />}
                    onClick={() => onShowMissing(periodo)}
                    size="sm"
                    variant="secondary"
                  >
                    Quem não recadastrou
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
