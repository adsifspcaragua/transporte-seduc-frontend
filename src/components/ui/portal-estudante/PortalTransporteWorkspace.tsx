"use client";

import { Button } from "@/components/buttons";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { portalTripsQuery } from "@/services/api/portal-queries";
import { PortalError, PortalLoading } from "./PortalFeedback";
import { portalDate, portalTime } from "./portalPresentation";

export function PortalTransporteWorkspace() {
  const result = useCachedQuery(portalTripsQuery);
  if (result.isLoading) return <PortalLoading />;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-700">Meu transporte</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Viagens disponíveis nos próximos sete dias nas suas linhas
            autorizadas.
          </p>
        </div>
        <Button
          fullWidth={false}
          loading={result.isFetching}
          onClick={() => void result.refresh()}
          variant="secondary"
        >
          Atualizar
        </Button>
      </div>
      <PortalError error={result.error} onRetry={() => void result.refresh()} />
      {result.data && result.data.data.length === 0 && (
        <p className="rounded-lg bg-white p-5 text-sm text-content-secondary shadow-sm">
          Não há viagens disponíveis. Em caso de dúvida sobre seu vínculo,
          procure o atendimento do transporte.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {result.data?.data.map((trip) => (
          <article
            className="rounded-lg border border-brand-600/10 bg-white p-5 shadow-sm"
            key={trip.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-bold text-brand-700">
                {trip.linha?.name ?? `Linha ${trip.linha_id}`}
              </h3>
              <span className="rounded-full bg-brand-600/10 px-2 py-1 text-xs font-semibold text-brand-600">
                {trip.sentido}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-content-muted">Data e saída</dt>
                <dd className="font-medium">
                  {portalDate(trip.data)} · {trip.horario_saida.slice(0, 5)}
                </dd>
              </div>
              <div>
                <dt className="text-content-muted">Registro de presença</dt>
                <dd>
                  {portalTime(trip.janela_inicio)} –{" "}
                  {portalTime(trip.janela_fim)}
                </dd>
              </div>
              <div>
                <dt className="text-content-muted">Veículo</dt>
                <dd>
                  {trip.veiculo?.identificacao ?? "Aguardando definição"}
                  {trip.veiculo?.placa ? ` · ${trip.veiculo.placa}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-content-muted">Situação</dt>
                <dd>
                  {trip.presenca_registrada
                    ? "Presença registrada"
                    : trip.status}
                </dd>
              </div>
            </dl>
            {trip.motivo_alteracao && (
              <p className="mt-3 text-sm text-content-secondary">
                {trip.motivo_alteracao}
              </p>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
