"use client";

import { Eye } from "lucide-react";

import { Button } from "@/components/buttons";
import { DataTable } from "@/components/table";
import { RelatorioFrequenciaTableSkeleton } from "@/components/ui/frequencias/RelatorioFrequenciaSkeleton";
import {
  formatAttendancePercentage,
  getAttendanceTone,
} from "@/components/ui/frequencias/relatorioFrequenciaPresentation";
import type { RelatorioFrequenciaItem } from "@/types/frequencia";
import { cn } from "@/utils/cn";

type RelatorioFrequenciaTableProps = {
  data: RelatorioFrequenciaItem[];
  errorMessage?: string;
  loading?: boolean;
  onRetry: () => void;
  onView: (item: RelatorioFrequenciaItem) => void;
};

const columns = [
  { key: "estudante", label: "Estudante" },
  { key: "linha", label: "Linha atual" },
  { key: "presenca", label: "Presença" },
  { key: "faltas", label: "Faltas" },
  { key: "justificadas", label: "Justificadas" },
  { key: "sequencia", label: "Seguidas" },
  { key: "acoes", label: "Ações" },
];

const gridClassName =
  "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6rem_6rem_6rem_7rem_6rem] md:gap-3";

export function RelatorioFrequenciaTable({
  data,
  errorMessage = "",
  loading = false,
  onRetry,
  onView,
}: RelatorioFrequenciaTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhum estudante possui registros para os filtros selecionados."
      errorMessage={errorMessage}
      errorTitle="Não foi possível carregar o relatório"
      getRowKey={(item) => item.estudante.id}
      gridClassName={gridClassName}
      loading={loading}
      onRetry={onRetry}
      skeleton={<RelatorioFrequenciaTableSkeleton />}
      renderRow={(item) => {
        const tone = getAttendanceTone(item);
        const studentName = item.estudante.name ?? "Estudante não encontrado";

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
              <p className="truncate text-sm font-bold text-content-primary">
                {studentName}
              </p>
              <p className="truncate text-xs text-content-muted">
                {item.estudante.cpf ?? "CPF não informado"}
              </p>
            </div>
            <p className="truncate text-sm text-content-secondary">
              <span className="block text-xs font-semibold uppercase text-content-muted md:hidden">
                Linha atual
              </span>
              {item.estudante.linha?.name ?? "Sem linha atual"}
            </p>
            <span
              className={cn(
                "w-fit rounded-full px-2.5 py-1 text-xs font-bold",
                tone === "success" && "bg-green-100 text-green-800",
                tone === "warning" && "bg-amber-100 text-amber-800",
                tone === "danger" && "bg-danger-600/10 text-danger-700",
              )}
            >
              {formatAttendancePercentage(item.percentual_presenca)}
            </span>
            <Metric label="Faltas" value={item.faltas} />
            <Metric label="Justificadas" value={item.justificadas} />
            <Metric label="Faltas seguidas" value={item.faltas_consecutivas} />
            <Button
              aria-label={`Ver histórico de ${studentName}`}
              fullWidth={false}
              leftIcon={<Eye />}
              onClick={() => onView(item)}
              size="sm"
              variant="ghost"
            >
              Detalhes
            </Button>
          </article>
        );
      }}
    />
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <p className="text-sm font-semibold text-content-secondary">
      <span className="block text-xs font-semibold uppercase text-content-muted md:hidden">
        {label}
      </span>
      {value}
    </p>
  );
}
