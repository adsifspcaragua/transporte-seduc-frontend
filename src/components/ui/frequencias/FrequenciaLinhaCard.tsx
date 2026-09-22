import {
  Bus,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/buttons";
import {
  getLinhaCallAction,
  localDateIso,
} from "@/components/ui/frequencias/frequenciaPresentation";
import type { FrequenciaLinha } from "@/types/frequencia";
import { cn } from "@/utils/cn";

type FrequenciaLinhaCardProps = {
  actionLoading: boolean;
  date: string;
  linha: FrequenciaLinha;
  onOpen?: (linha: FrequenciaLinha) => void;
};

function formatTime(value: string | null) {
  return value?.slice(0, 5) || "Não informado";
}

export function FrequenciaLinhaCard({
  actionLoading,
  date,
  linha,
  onOpen,
}: FrequenciaLinhaCardProps) {
  const isToday = date === localDateIso();
  const status = isToday ? linha.chamada_hoje?.status : null;
  const action = getLinhaCallAction(linha.chamada_hoje, isToday);

  return (
    <article className="flex min-h-64 flex-col rounded-lg border border-border-subtle bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100/70 text-brand-700">
          <Bus aria-hidden="true" className="size-5" />
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            status === "Aberta" && "bg-amber-100 text-amber-800",
            status === "Fechada" && "bg-green-100 text-green-800",
            !status && "bg-surface-muted text-content-muted",
          )}
        >
          {status ?? (isToday ? "Não iniciada" : "Data selecionada")}
        </span>
      </div>

      <h2 className="mt-4 text-lg font-bold text-brand-700">{linha.name}</h2>

      <dl className="mt-3 space-y-2 text-sm text-content-secondary">
        <div className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="size-4 text-brand-600" />
          <dt className="sr-only">Horários</dt>
          <dd>
            {formatTime(linha.departure_time)} — {formatTime(linha.return_time)}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <UserRound aria-hidden="true" className="size-4 text-brand-600" />
          <dt className="sr-only">Motorista</dt>
          <dd>{linha.motorista?.name ?? "Motorista não vinculado"}</dd>
        </div>
        <div className="flex items-center gap-2">
          {status === "Fechada" ? (
            <CheckCircle2
              aria-hidden="true"
              className="size-4 text-green-700"
            />
          ) : (
            <CalendarCheck
              aria-hidden="true"
              className="size-4 text-brand-600"
            />
          )}
          <dt className="sr-only">Situação</dt>
          <dd>
            {isToday
              ? status === "Fechada"
                ? "Chamada de hoje concluída"
                : "Chamada de hoje"
              : "A API retomará uma folha existente nesta data"}
          </dd>
        </div>
      </dl>

      {onOpen && (
        <Button
          className="mt-auto pt-2"
          loading={actionLoading}
          onClick={() => onOpen(linha)}
          variant={status === "Fechada" ? "secondary" : "primary"}
        >
          {action}
        </Button>
      )}
    </article>
  );
}
