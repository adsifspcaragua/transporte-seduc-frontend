"use client";

import axios from "axios";
import { CalendarDays, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/buttons";
import { DateInput } from "@/components/form/inputs";
import { ChamadaSheet } from "@/components/ui/frequencias/ChamadaSheet";
import { FrequenciaLinhaCard } from "@/components/ui/frequencias/FrequenciaLinhaCard";
import { FrequenciasPageSkeleton } from "@/components/ui/frequencias/FrequenciaRouteSkeletons";
import { localDateIso } from "@/components/ui/frequencias/frequenciaPresentation";
import { useAuthz } from "@/hooks/use-authz";
import { useMinimumVisibleLoading } from "@/hooks/use-minimum-visible-loading";
import { frequenciaService } from "@/services/api/modules/frequencia";
import type { Chamada, FrequenciaLinha } from "@/types/frequencia";

type ApiError = { message?: string; errors?: Record<string, string[]> };

function errorMessage(error: unknown) {
  if (!axios.isAxiosError<ApiError>(error)) {
    return "Não foi possível carregar as linhas para chamada.";
  }

  return (
    Object.values(error.response?.data?.errors ?? {})[0]?.[0] ??
    error.response?.data?.message ??
    "Não foi possível carregar as linhas para chamada."
  );
}

export function FrequenciasWorkspace() {
  const { can } = useAuthz();
  const canWrite = can("frequencias.write");
  const today = useMemo(() => localDateIso(), []);
  const [date, setDate] = useState(today);
  const [linhas, setLinhas] = useState<FrequenciaLinha[]>([]);
  const [chamada, setChamada] = useState<Chamada | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [openingLineId, setOpeningLineId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [openError, setOpenError] = useState("");
  const showPageSkeleton = useMinimumVisibleLoading(loading && !hasLoaded);

  const loadLinhas = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      setLinhas(await frequenciaService.listLinhas());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadLinhas();
  }, [loadLinhas]);

  async function openChamada(linha: FrequenciaLinha) {
    if (!date || openingLineId !== null) return;

    try {
      setOpeningLineId(linha.id);
      setOpenError("");
      const response =
        date === today && linha.chamada_hoje
          ? await frequenciaService.show(linha.chamada_hoje.id)
          : await frequenciaService.open({ linha_id: linha.id, data: date });
      setChamada(response.data);
    } catch (error) {
      setOpenError(errorMessage(error));
    } finally {
      setOpeningLineId(null);
    }
  }

  function backToLinhas() {
    setChamada(null);
    void loadLinhas();
  }

  if (showPageSkeleton) return <FrequenciasPageSkeleton />;

  if (chamada) {
    return (
      <ChamadaSheet
        chamada={chamada}
        onBack={backToLinhas}
        onChamadaChange={setChamada}
      />
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-content-muted">
            Controle de frequência
          </p>
          <h1 className="mt-1 text-2xl font-bold text-brand-700">
            Chamada diária
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">
            Selecione a data e a linha para iniciar ou continuar a folha de
            presença.
          </p>
        </div>
        <DateInput
          containerClassName="w-full sm:w-64"
          label="Data da chamada"
          max={today}
          onChange={(event) => {
            setDate(event.target.value);
            setOpenError("");
          }}
          required
          value={date}
        />
      </div>

      {openError && (
        <p
          className="rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
          role="alert"
        >
          {openError}
        </p>
      )}

      {loadError ? (
        <section
          className="flex flex-col items-center gap-4 rounded-lg bg-white px-5 py-14 text-center shadow-sm"
          role="alert"
        >
          <CalendarDays aria-hidden="true" className="size-10 text-brand-600" />
          <div>
            <h2 className="font-bold text-slate-900">
              Não foi possível carregar as linhas
            </h2>
            <p className="mt-1 text-sm text-content-muted">{loadError}</p>
          </div>
          <Button
            fullWidth={false}
            leftIcon={<RefreshCw />}
            onClick={() => void loadLinhas()}
            variant="secondary"
          >
            Tentar novamente
          </Button>
        </section>
      ) : linhas.length === 0 && !loading ? (
        <section className="rounded-lg bg-white px-5 py-14 text-center shadow-sm">
          <CalendarDays
            aria-hidden="true"
            className="mx-auto size-10 text-content-muted"
          />
          <h2 className="mt-4 font-bold text-slate-900">
            Nenhuma linha disponível
          </h2>
          <p className="mt-1 text-sm text-content-muted">
            Seu usuário não possui linhas liberadas para chamada.
          </p>
        </section>
      ) : (
        <section
          aria-label="Linhas disponíveis para chamada"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {linhas.map((linha) => (
            <FrequenciaLinhaCard
              actionLoading={openingLineId === linha.id}
              date={date}
              key={linha.id}
              linha={linha}
              onOpen={
                canWrite ? (selected) => void openChamada(selected) : undefined
              }
            />
          ))}
        </section>
      )}
    </main>
  );
}
