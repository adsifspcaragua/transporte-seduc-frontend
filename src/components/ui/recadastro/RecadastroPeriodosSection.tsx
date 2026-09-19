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
    <section className="space-y-5">
      <div className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-050 text-brand-600">
              <CalendarDays className="size-5" />
            </span>
            <div>
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          <Input
            containerClassName="xl:col-span-2"
            label="Ano"
            min="2000"
            onChange={(event) => onFormChange("ano", event.target.value)}
            type="number"
            value={form.ano}
          />
          <Select
            containerClassName="xl:col-span-2"
            label="Semestre"
            onChange={(event) => onFormChange("semestre", event.target.value)}
            options={[
              { label: "1º semestre", value: "1" },
              { label: "2º semestre", value: "2" },
            ]}
            value={form.semestre}
          />
          <DateInput
            containerClassName="xl:col-span-2"
            label="Início"
            onChange={(event) =>
              onFormChange("data_inicio", event.target.value)
            }
            value={form.data_inicio}
            variant="white"
          />
          <DateInput
            containerClassName="xl:col-span-2"
            label="Fim"
            onChange={(event) => onFormChange("data_fim", event.target.value)}
            value={form.data_fim}
            variant="white"
          />
          <Input
            containerClassName="md:col-span-2 xl:col-span-4"
            label="Observações"
            onChange={(event) =>
              onFormChange("observacoes", event.target.value)
            }
            placeholder="Ex.: prazo prorrogado por uma semana"
            value={form.observacoes}
          />
        </div>
      </div>

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
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <span className="shrink-0 text-xs text-content-muted">
                Ordenar por:
              </span>
              <Select
                aria-label="Ordenar períodos"
                containerClassName="min-w-0 flex-1 sm:w-44"
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
            <fieldset className="flex h-10 items-center gap-1 rounded-lg border-2 border-border-default bg-surface-primary p-1">
              <legend className="sr-only">
                Modo de visualização dos períodos
              </legend>
              <Button
                aria-label="Visualizar períodos em grade"
                aria-pressed={viewMode === "grid"}
                className={cn(
                  "size-7 rounded-md border-0 p-0 shadow-none",
                  viewMode !== "grid" && "bg-transparent",
                )}
                fullWidth={false}
                leftIcon={<LayoutGrid />}
                onClick={() => setViewMode("grid")}
                size="icon"
                title="Visualização em grade"
                variant={viewMode === "grid" ? "primary" : "ghost"}
              />
              <Button
                aria-label="Visualizar períodos em lista"
                aria-pressed={viewMode === "list"}
                className={cn(
                  "size-7 rounded-md border-0 p-0 shadow-none",
                  viewMode !== "list" && "bg-transparent",
                )}
                fullWidth={false}
                leftIcon={<List />}
                onClick={() => setViewMode("list")}
                size="icon"
                title="Visualização em lista"
                variant={viewMode === "list" ? "primary" : "ghost"}
              />
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
              "grid gap-4",
              viewMode === "grid"
                ? "md:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-1",
            )}
          >
            {sortedPeriodos.map((periodo) => (
              <article
                className={cn(
                  "flex flex-col rounded-xl border border-border-subtle bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
                  viewMode === "list" &&
                    "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.7fr)] lg:items-center lg:gap-x-5",
                )}
                key={periodo.id}
              >
                <div
                  className={cn(
                    "flex items-start justify-between gap-3",
                    viewMode === "list" && "lg:col-start-1 lg:row-start-1",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-050 text-brand-600">
                      <CalendarDays className="size-5" />
                    </span>
                    <div>
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
                    "mt-3 min-h-5 text-sm leading-5 text-content-muted",
                    viewMode === "list" && "lg:col-start-1 lg:row-start-2",
                  )}
                >
                  {periodo.observacoes || "Nenhuma observação informada."}
                </p>

                <div
                  className={cn(
                    "mt-auto grid grid-cols-1 gap-2 pt-4 sm:grid-cols-3 xl:grid-cols-[0.75fr_1fr_1.45fr]",
                    viewMode === "list" &&
                      "lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-0",
                  )}
                >
                  <Button
                    className="px-3"
                    fullWidth
                    leftIcon={
                      periodo.status === "Aberto" ? <LockKeyhole /> : <Eye />
                    }
                    onClick={() => onToggle(periodo)}
                    size="sm"
                    variant={periodo.status === "Aberto" ? "danger" : "primary"}
                  >
                    {periodo.status === "Aberto" ? "Fechar" : "Abrir"}
                  </Button>
                  <Button
                    className="px-3"
                    fullWidth
                    leftIcon={<Pencil />}
                    onClick={() => onEdit(periodo)}
                    size="sm"
                    variant="secondary"
                  >
                    Editar prazo
                  </Button>
                  <Button
                    className="px-3"
                    fullWidth
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
