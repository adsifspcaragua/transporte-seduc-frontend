"use client";

import { Check, Eye, X } from "lucide-react";

import { Button } from "@/components/buttons";
import { DataTable, type DataTablePaginationProps } from "@/components/table";
import { formatCallDate } from "@/components/ui/frequencias/frequenciaPresentation";
import { JustificativasTableSkeleton } from "@/components/ui/frequencias/JustificativasSkeleton";
import {
  canAnalyzeJustificativa,
  getJustificativaStatusTone,
} from "@/components/ui/frequencias/justificativaPresentation";
import type { Justificativa } from "@/types/frequencia";
import { cn } from "@/utils/cn";

type JustificativasTableProps = {
  data: Justificativa[];
  errorMessage?: string;
  loading?: boolean;
  onApprove: (justificativa: Justificativa) => void;
  onReject: (justificativa: Justificativa) => void;
  onRetry: () => void;
  onView: (justificativa: Justificativa) => void;
  pagination?: DataTablePaginationProps;
};

const columns = [
  { key: "estudante", label: "Estudante" },
  { key: "falta", label: "Linha e falta" },
  { key: "motivo", label: "Motivo" },
  { key: "status", label: "Status" },
  { key: "acoes", label: "Ações" },
];

const gridClassName =
  "md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.4fr)_8rem_12rem] md:gap-3";

function statusClassName(justificativa: Justificativa) {
  const tone = getJustificativaStatusTone(justificativa.status);
  return cn(
    "inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold",
    tone === "pending" && "bg-amber-100 text-amber-800",
    tone === "approved" && "bg-green-100 text-green-800",
    tone === "rejected" && "bg-danger-600/10 text-danger-700",
  );
}

export function JustificativasTable({
  data,
  errorMessage = "",
  loading = false,
  onApprove,
  onReject,
  onRetry,
  onView,
  pagination,
}: JustificativasTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhuma justificativa encontrada para os filtros selecionados."
      errorMessage={errorMessage}
      errorTitle="Não foi possível carregar as justificativas"
      getRowKey={(justificativa) => justificativa.id}
      gridClassName={gridClassName}
      loading={loading}
      onRetry={onRetry}
      pagination={pagination}
      skeleton={<JustificativasTableSkeleton />}
      renderRow={(justificativa) => {
        const canAnalyze = canAnalyzeJustificativa(justificativa);
        const studentName =
          justificativa.estudante?.name ?? "Estudante não encontrado";

        return (
          <article
            className={cn(
              "grid gap-4 border-b border-border-subtle px-5 py-4 last:border-b-0 md:items-center",
              gridClassName,
            )}
          >
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase text-content-muted md:hidden">
                Estudante
              </span>
              <p className="truncate text-sm font-bold text-slate-900">
                {studentName}
              </p>
              <p className="truncate text-xs text-content-muted">
                {justificativa.estudante?.cpf ?? "CPF não informado"}
              </p>
            </div>

            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase text-content-muted md:hidden">
                Linha e falta
              </span>
              <p className="truncate text-sm font-semibold text-content-secondary">
                {justificativa.falta.linha?.name ?? "Linha não informada"}
              </p>
              <p className="text-xs text-content-muted">
                {formatCallDate(justificativa.falta.data)}
              </p>
            </div>

            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase text-content-muted md:hidden">
                Motivo
              </span>
              <p className="line-clamp-2 text-sm text-content-secondary">
                {justificativa.motivo}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-content-muted md:hidden">
                Status
              </span>
              <span className={statusClassName(justificativa)}>
                {justificativa.status === "Em analise"
                  ? "Em análise"
                  : justificativa.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                aria-label={`Ver detalhes da justificativa de ${studentName}`}
                className="h-9 px-3"
                fullWidth={false}
                leftIcon={<Eye />}
                onClick={() => onView(justificativa)}
                size="sm"
                variant="ghost"
              >
                Detalhes
              </Button>
              {canAnalyze && (
                <>
                  <Button
                    aria-label={`Aprovar justificativa de ${studentName}`}
                    className="h-9 px-3"
                    fullWidth={false}
                    onClick={() => onApprove(justificativa)}
                    size="icon"
                    title="Aprovar"
                    variant="approved"
                    leftIcon={<Check />}
                  />
                  <Button
                    aria-label={`Rejeitar justificativa de ${studentName}`}
                    className="h-9 px-3"
                    fullWidth={false}
                    onClick={() => onReject(justificativa)}
                    size="icon"
                    title="Rejeitar"
                    variant="danger"
                    leftIcon={<X />}
                  />
                </>
              )}
            </div>
          </article>
        );
      }}
    />
  );
}
