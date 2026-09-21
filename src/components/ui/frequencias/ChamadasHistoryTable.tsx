"use client";

import { Eye, Trash2 } from "lucide-react";

import { Button } from "@/components/buttons";
import { DataTable, type DataTablePaginationProps } from "@/components/table";
import { ChamadasHistoryTableSkeleton } from "@/components/ui/frequencias/ChamadasHistorySkeleton";
import { getChamadaCompletionPercentage } from "@/components/ui/frequencias/chamadaHistoryPresentation";
import { formatCallDate } from "@/components/ui/frequencias/frequenciaPresentation";
import type { Chamada } from "@/types/frequencia";
import { cn } from "@/utils/cn";

type ChamadasHistoryTableProps = {
  data: Chamada[];
  errorMessage?: string;
  loading?: boolean;
  onDelete: (chamada: Chamada) => void;
  onRetry: () => void;
  onView: (chamada: Chamada) => void;
  pagination?: DataTablePaginationProps;
};

const columns = [
  { key: "linha", label: "Linha" },
  { key: "data", label: "Data" },
  { key: "registros", label: "Registros" },
  { key: "status", label: "Status" },
  { key: "acoes", label: "Ações" },
];

const gridClassName =
  "md:grid-cols-[minmax(0,1.1fr)_7rem_minmax(0,1.4fr)_8rem_11rem] md:gap-3";

export function ChamadasHistoryTable({
  data,
  errorMessage = "",
  loading = false,
  onDelete,
  onRetry,
  onView,
  pagination,
}: ChamadasHistoryTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhuma chamada encontrada para os filtros selecionados."
      errorMessage={errorMessage}
      errorTitle="Não foi possível carregar o histórico"
      getRowKey={(chamada) => chamada.id}
      gridClassName={gridClassName}
      loading={loading}
      onRetry={onRetry}
      pagination={pagination}
      skeleton={<ChamadasHistoryTableSkeleton />}
      renderRow={(chamada) => {
        const completion = getChamadaCompletionPercentage(chamada.contadores);

        return (
          <article
            className={cn(
              "grid gap-4 border-b border-border-subtle px-5 py-4 last:border-b-0 md:items-center",
              gridClassName,
            )}
          >
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase text-content-muted md:hidden">
                Linha
              </span>
              <p className="truncate text-sm font-bold text-slate-900">
                {chamada.linha.name}
              </p>
              <p className="truncate text-xs text-content-muted">
                {chamada.linha.motorista?.name ?? "Motorista não informado"}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-content-muted md:hidden">
                Data
              </span>
              <p className="text-sm font-semibold text-content-secondary">
                {formatCallDate(chamada.data)}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-content-muted md:hidden">
                Registros
              </span>
              <p className="text-sm font-semibold text-content-secondary">
                {chamada.contadores.presentes} presentes ·{" "}
                {chamada.contadores.faltas} faltas
              </p>
              <p className="mt-1 text-xs text-content-muted">
                {completion}% concluído · {chamada.contadores.justificadas}{" "}
                justificadas · {chamada.contadores.pendentes} pendentes
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-content-muted md:hidden">
                Status
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                  chamada.status === "Fechada"
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {chamada.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                aria-label={`Visualizar chamada da ${chamada.linha.name} em ${formatCallDate(chamada.data)}`}
                className="h-9 px-3"
                fullWidth={false}
                leftIcon={<Eye />}
                onClick={() => onView(chamada)}
                size="sm"
                variant="ghost"
              >
                Abrir
              </Button>
              <Button
                aria-label={`Excluir chamada da ${chamada.linha.name} em ${formatCallDate(chamada.data)}`}
                className="h-9 px-3"
                fullWidth={false}
                leftIcon={<Trash2 />}
                onClick={() => onDelete(chamada)}
                size="icon"
                title="Excluir chamada"
                variant="danger"
              />
            </div>
          </article>
        );
      }}
    />
  );
}
