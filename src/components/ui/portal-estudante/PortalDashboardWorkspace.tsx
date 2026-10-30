"use client";

import { BusFront, CalendarCheck2, Smartphone, UserCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useCachedQuery } from "@/hooks/use-cached-query";
import {
  portalDeviceQuery,
  portalTripsQuery,
} from "@/services/api/portal-queries";
import { PortalError, PortalLoading } from "./PortalFeedback";
import { portalDate, portalTime } from "./portalPresentation";

export function PortalDashboardWorkspace() {
  const { user } = useAuth();
  const trips = useCachedQuery(portalTripsQuery);
  const device = useCachedQuery(portalDeviceQuery);
  if (trips.isLoading && device.isLoading) return <PortalLoading />;
  const nextTrip = trips.data?.data.find((trip) => !trip.presenca_registrada);
  const request = device.data?.data.solicitacao;
  const attention =
    request?.status === "Pendente"
      ? "Sua solicitação de dispositivo aguarda análise do atendimento."
      : request?.status === "Aprovada"
        ? "Seu dispositivo foi aprovado. Conclua a autorização neste navegador."
        : request?.status === "Rejeitada"
          ? (request.parecer ??
            "A autorização do dispositivo foi recusada. Procure o atendimento.")
          : device.data && !device.data.data.pode_registrar_presenca
            ? "Autorize este navegador para registrar sua presença na van."
            : null;
  return (
    <>
      <section>
        <h2 className="text-lg font-bold text-brand-700">
          Olá, {user?.name?.split(" ")[0]}
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          Acompanhe suas viagens e registre sua presença com segurança.
        </p>
      </section>
      <PortalError error={trips.error} onRetry={() => void trips.refresh()} />
      <PortalError error={device.error} onRetry={() => void device.refresh()} />
      {attention && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-bold text-amber-900">
            Atenção ao dispositivo
          </h2>
          <p className="mt-2 text-sm text-amber-900">{attention}</p>
          <Link
            className="mt-3 inline-block text-sm font-semibold text-brand-600 underline"
            href="/portal-estudante/dispositivo"
          >
            Ver autorização
          </Link>
        </section>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-brand-600/10 bg-white p-5 shadow-sm">
          <BusFront className="mb-3 size-5 text-brand-600" />
          <h2 className="font-bold text-brand-700">Próxima viagem</h2>
          {nextTrip ? (
            <>
              <p className="mt-2 text-sm font-semibold">
                {nextTrip.linha?.name ?? `Linha ${nextTrip.linha_id}`} ·{" "}
                {nextTrip.sentido}
              </p>
              <p className="mt-1 text-sm text-content-secondary">
                {portalDate(nextTrip.data)} · saída{" "}
                {nextTrip.horario_saida.slice(0, 5)}
              </p>
              <p className="mt-1 text-xs text-content-muted">
                Presença entre {portalTime(nextTrip.janela_inicio)} e{" "}
                {portalTime(nextTrip.janela_fim)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-content-secondary">
              Nenhuma próxima viagem disponível neste momento.
            </p>
          )}
          <Link
            className="mt-4 inline-block text-sm font-semibold text-brand-600 underline"
            href="/portal-estudante/transporte"
          >
            Consultar meu transporte
          </Link>
        </section>
        <section className="rounded-lg border border-brand-600/10 bg-white p-5 shadow-sm">
          <CalendarCheck2 className="mb-3 size-5 text-brand-600" />
          <h2 className="font-bold text-brand-700">Minha frequência</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Consulte seus comprovantes de presença e acompanhe pedidos de
            revisão.
          </p>
          <Link
            className="mt-4 inline-block text-sm font-semibold text-brand-600 underline"
            href="/portal-estudante/frequencia"
          >
            Ver presenças e revisões
          </Link>
        </section>
        <Link
          className="flex items-center gap-3 rounded-lg border border-brand-600/10 bg-white p-5 text-sm font-semibold text-brand-700 shadow-sm hover:bg-surface-muted"
          href="/portal-estudante/dispositivo"
        >
          <Smartphone className="size-5" />
          Meu dispositivo autorizado
        </Link>
        <Link
          className="flex items-center gap-3 rounded-lg border border-brand-600/10 bg-white p-5 text-sm font-semibold text-brand-700 shadow-sm hover:bg-surface-muted"
          href="/portal-estudante/conta"
        >
          <UserCircle className="size-5" />
          Dados da minha conta
        </Link>
      </div>
    </>
  );
}
