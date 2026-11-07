"use client";

import { Button } from "@/components/buttons";
import type { Linha } from "@/types/inscricao";
import type {
  TransportePeriod,
  TransporteSnapshot,
} from "@/types/transporte-operacao";
import { summarizeLinha } from "./transporteOperacaoPresentation";
import { formatTransporteValue, weekDays } from "./transportePresentation";

export function TransporteLinhaResumo({
  linha,
  snapshot,
  period,
  detailed = false,
  onCorrect,
}: {
  linha: Linha;
  snapshot: TransporteSnapshot;
  period: TransportePeriod;
  detailed?: boolean;
  onCorrect?: (step: number) => void;
}) {
  const summary = summarizeLinha(linha, snapshot, period);
  const vehiclesKnown = !!snapshot.atribuicoes.data && !!snapshot.veiculos.data;
  const names = [
    ...new Set(
      summary.calendar.map((d) => d.vehicle?.identificacao).filter(Boolean),
    ),
  ];
  const tripVehicles = [
    ...new Set(
      summary.viagens.map((t) => t.veiculo?.identificacao).filter(Boolean),
    ),
  ];
  const status = summary.unavailable.length
    ? "Conferência incompleta"
    : summary.issues.length
      ? "Com pendências identificadas"
      : "Sem pendências identificadas nas consultas";
  return (
    <div className="space-y-4">
      <p
        className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${summary.issues.length || summary.unavailable.length ? "bg-amber-50 text-amber-800" : "bg-surface-muted text-brand-700"}`}
      >
        {status}
      </p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-content-muted">Motorista responsável</dt>
          <dd>
            {linha.motorista?.name ??
              (linha.motorista_id ? "Nome não disponível" : "Não informado")}
          </dd>
        </div>
        <div>
          <dt className="text-content-muted">
            Capacidade da linha / estudantes ativos
          </dt>
          <dd>
            {linha.max_capacity ?? "Não informada"} /{" "}
            {linha.ocupacao ?? "Não consultado"}
          </dd>
        </div>
        <div>
          <dt className="text-content-muted">Veículos alocados no período</dt>
          <dd>
            {vehiclesKnown
              ? names.join(", ") || "Nenhum veículo ativo alocado"
              : "Não foi possível conferir"}
          </dd>
          {tripVehicles.length > 0 && (
            <dd className="text-xs text-content-muted">
              Veículos das viagens: {tripVehicles.join(", ")}. Substituições
              podem diferir da alocação.
            </dd>
          )}
        </div>
        <div>
          <dt className="text-content-muted">Pontos ativos: ida / volta</dt>
          <dd>
            {summary.points.Ida ?? "Não conferido"} /{" "}
            {summary.points.Volta ?? "Não conferido"}
          </dd>
        </div>
        <div>
          <dt className="text-content-muted">Viagens no período</dt>
          <dd>
            {summary.trips == null
              ? "Não foi possível conferir"
              : `${summary.trips} cadastrada(s), ${summary.cancelled} cancelada(s)`}
          </dd>
        </div>
        <div>
          <dt className="text-content-muted">
            Ocorrências previstas pela programação
          </dt>
          <dd>
            {summary.expected ?? "Não foi possível conferir"}
            {summary.missing != null
              ? ` · ${summary.missing} ainda não gerada(s)`
              : ""}
          </dd>
        </div>
      </dl>
      {summary.unavailable.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {summary.unavailable.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      )}
      {summary.issues.length > 0 && (
        <ul className="space-y-2 text-sm">
          {summary.issues.map((issue) => (
            <li
              key={issue.text}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span>{issue.text}</span>
              {onCorrect && (
                <Button
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onClick={() => onCorrect(issue.step)}
                >
                  Conferir
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {detailed && (
        <>
          <div className="rounded-lg bg-surface-muted p-3 text-sm">
            <h3 className="font-bold text-brand-700">Horários cadastrados</h3>
            {snapshot.horarios.data ? (
              summary.horarios.length ? (
                <ul className="mt-2 space-y-2">
                  {summary.horarios.map((h) => (
                    <li key={h.id}>
                      {h.sentido} · {h.horario_saida.slice(0, 5)} ·{" "}
                      {h.dias_semana.map((d) => weekDays[Number(d)]).join(", ")}{" "}
                      · {h.ativo ? "Ativo" : "Inativo"}
                      <span className="block text-xs text-content-muted">
                        Vigência:{" "}
                        {h.vigencia_inicio
                          ? formatTransporteValue(h.vigencia_inicio)
                          : "Sem início definido"}{" "}
                        até{" "}
                        {h.vigencia_fim
                          ? formatTransporteValue(h.vigencia_fim)
                          : "Sem prazo final"}
                        . Registro: {h.janela_efetiva?.antes_min ?? "padrão"}{" "}
                        min antes / {h.janela_efetiva?.depois_min ?? "padrão"}{" "}
                        min depois.
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum horário cadastrado.</p>
              )
            ) : (
              <p>Consulta não disponível.</p>
            )}
          </div>
          <section className="space-y-2">
            <h3 className="font-bold text-brand-700">Calendário do período</h3>
            {summary.calendar.map((day) => (
              <article
                key={day.day}
                className="rounded-lg border border-border-subtle p-3 text-sm"
              >
                <h4 className="font-semibold">
                  {formatTransporteValue(day.day)} ·{" "}
                  {day.expected == null
                    ? "Programação não conferida"
                    : day.suspended
                      ? "Dia sem operação"
                      : day.expected.length
                        ? `${day.expected.length} saída(s) prevista(s)`
                        : "Sem saída prevista"}
                </h4>
                {snapshot.dias.data
                  ?.filter(
                    (d) =>
                      d.data === day.day &&
                      (d.linha_id == null || d.linha_id === linha.id),
                  )
                  .map((d) => (
                    <p key={d.id}>
                      Suspensão {d.linha_id == null ? "geral" : "desta linha"}:{" "}
                      {d.motivo}
                    </p>
                  ))}
                <p className="text-content-muted">
                  Alocação:{" "}
                  {vehiclesKnown
                    ? (day.vehicle?.identificacao ?? "Sem veículo ativo")
                    : "Não conferida"}
                </p>
                {day.trips == null ? (
                  <p>Viagens não conferidas.</p>
                ) : day.trips.length ? (
                  <ul>
                    {day.trips.map((t) => (
                      <li key={t.id}>
                        {t.sentido} {t.horario_saida?.slice(0, 5)} · {t.status}{" "}
                        · {t.veiculo?.identificacao ?? "Sem veículo"} ·{" "}
                        {formatTransporteValue(t.janela_inicio)} até{" "}
                        {formatTransporteValue(t.janela_fim)}
                        {t.veiculo_substituido &&
                          " · Veículo substituído só nesta viagem"}
                        {t.motivo_alteracao && ` · ${t.motivo_alteracao}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhuma viagem cadastrada nesta data.</p>
                )}
              </article>
            ))}
          </section>
          {summary.conflicts.length > 0 && (
            <section
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"
              role="alert"
            >
              <h3 className="font-bold">Possíveis conflitos de veículo</h3>
              <p>
                Inclui janelas que se tocam, pois o embarque aceita os limites.
                A verificação não calcula duração do trajeto.
              </p>
              <ul className="mt-2 space-y-3">
                {summary.conflicts.map((pair) => (
                  <li key={pair.map((t) => t.id).join("-")}>
                    {pair.map((t) => (
                      <p key={t.id}>
                        {t.linha?.name ??
                          snapshot.linhas.data?.find((l) => l.id === t.linha_id)
                            ?.name ??
                          "Linha não identificada"}{" "}
                        ·{" "}
                        {t.veiculo?.identificacao ??
                          snapshot.veiculos.data?.find(
                            (v) => v.id === t.veiculo_id,
                          )?.identificacao ??
                          "Veículo não identificado"}{" "}
                        · {t.sentido} · {formatTransporteValue(t.janela_inicio)}{" "}
                        até {formatTransporteValue(t.janela_fim)}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      <p className="text-xs leading-5 text-content-muted">
        Conferência dos cadastros no período consultado. Não comprova
        circulação, QR afixado, compatibilidade de todos os pontos, credenciais
        dos estudantes ou disponibilidade física de frota. A chamada diária
        permanece separada do QR.
      </p>
    </div>
  );
}
