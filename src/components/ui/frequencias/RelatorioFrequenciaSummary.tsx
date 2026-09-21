import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  UsersRound,
} from "lucide-react";

import type { RelatorioFrequenciaResponse } from "@/types/frequencia";

type RelatorioFrequenciaSummaryProps = {
  totals: RelatorioFrequenciaResponse["totais"];
};

export function RelatorioFrequenciaSummary({
  totals,
}: RelatorioFrequenciaSummaryProps) {
  const metrics = [
    { label: "Estudantes", value: totals.estudantes, icon: UsersRound },
    { label: "Presenças", value: totals.presencas, icon: CheckCircle2 },
    { label: "Faltas", value: totals.faltas, icon: CircleAlert },
    { label: "Justificadas", value: totals.justificadas, icon: FileCheck2 },
    { label: "Pendentes", value: totals.pendentes, icon: Clock3 },
  ];

  return (
    <section
      aria-label="Totais do relatório"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
    >
      {metrics.map(({ icon: Icon, label, value }) => (
        <article
          className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white p-4 shadow-sm"
          key={label}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-050 text-brand-600">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-content-muted">
              {label}
            </p>
            <p className="mt-0.5 text-xl font-bold text-content-primary">
              {value}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
