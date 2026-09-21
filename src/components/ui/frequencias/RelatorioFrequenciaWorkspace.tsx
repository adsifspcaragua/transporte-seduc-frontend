"use client";

import axios from "axios";
import { BarChart3 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { findAbsenceFrequencyId } from "@/components/ui/frequencias/justificativaPresentation";
import { RelatorioEstudanteModal } from "@/components/ui/frequencias/RelatorioEstudanteModal";
import { RelatorioFrequenciaFilterCard } from "@/components/ui/frequencias/RelatorioFrequenciaFilterCard";
import { RelatorioFrequenciaSummary } from "@/components/ui/frequencias/RelatorioFrequenciaSummary";
import { RelatorioFrequenciaTable } from "@/components/ui/frequencias/RelatorioFrequenciaTable";
import {
  buildRelatorioParams,
  EMPTY_RELATORIO_FILTERS,
  formatReportPeriod,
  type RelatorioFrequenciaFilters,
} from "@/components/ui/frequencias/relatorioFrequenciaPresentation";
import { frequenciaService } from "@/services/api/modules/frequencia";
import type {
  FrequenciaLinha,
  HistoricoFrequenciaItem,
  RelatorioEstudanteResponse,
  RelatorioFrequenciaItem,
  RelatorioFrequenciaResponse,
} from "@/types/frequencia";

type ApiError = { message?: string; errors?: Record<string, string[]> };

function errorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiError>(error)) return fallback;
  if (error.response?.status === 403) {
    return "Você não tem permissão para consultar este relatório.";
  }

  return (
    Object.values(error.response?.data?.errors ?? {})[0]?.[0] ??
    error.response?.data?.message ??
    fallback
  );
}

export function RelatorioFrequenciaWorkspace() {
  const [filters, setFilters] = useState<RelatorioFrequenciaFilters>({
    ...EMPTY_RELATORIO_FILTERS,
  });
  const [appliedFilters, setAppliedFilters] =
    useState<RelatorioFrequenciaFilters>({ ...EMPTY_RELATORIO_FILTERS });
  const [response, setResponse] = useState<RelatorioFrequenciaResponse | null>(
    null,
  );
  const [linhas, setLinhas] = useState<FrequenciaLinha[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailReport, setDetailReport] =
    useState<RelatorioEstudanteResponse | null>(null);
  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  const loadReport = useCallback(async () => {
    const requestId = ++listRequestIdRef.current;

    try {
      setLoading(true);
      setLoadError("");
      const nextResponse = await frequenciaService.report(
        buildRelatorioParams(appliedFilters),
      );
      if (requestId === listRequestIdRef.current) setResponse(nextResponse);
    } catch (error) {
      if (requestId === listRequestIdRef.current) {
        setLoadError(
          errorMessage(error, "Não foi possível carregar o relatório."),
        );
      }
    } finally {
      if (requestId === listRequestIdRef.current) setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  useEffect(() => {
    let active = true;
    void frequenciaService
      .listLinhas()
      .then((data) => {
        if (active) setLinhas(data);
      })
      .catch(() => {
        if (active) setLinhas([]);
      });

    return () => {
      active = false;
    };
  }, []);

  function applyFilters() {
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    const emptyFilters = { ...EMPTY_RELATORIO_FILTERS };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  async function openStudentDetail(item: RelatorioFrequenciaItem) {
    const requestId = ++detailRequestIdRef.current;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailReport(null);

    try {
      const period = response?.periodo;
      const report = await frequenciaService.studentReport(
        item.estudante.id,
        period ? { de: period.de, ate: period.ate } : {},
      );
      if (requestId === detailRequestIdRef.current) setDetailReport(report);
    } catch (error) {
      if (requestId === detailRequestIdRef.current) {
        setDetailError(
          errorMessage(error, "Não foi possível carregar o histórico."),
        );
      }
    } finally {
      if (requestId === detailRequestIdRef.current) setDetailLoading(false);
    }
  }

  function closeStudentDetail() {
    detailRequestIdRef.current += 1;
    setDetailOpen(false);
    setDetailLoading(false);
    setDetailError("");
    setDetailReport(null);
  }

  async function justifyAbsence(
    entry: HistoricoFrequenciaItem,
    reason: string,
  ) {
    const currentDetail = detailReport;
    if (!currentDetail) {
      throw new Error("O histórico do estudante não está mais disponível.");
    }

    try {
      const chamada = await frequenciaService.show(entry.chamada_id);
      const frequencyId = findAbsenceFrequencyId(
        chamada.data,
        currentDetail.data.estudante.id,
      );
      if (!frequencyId) {
        throw new Error(
          "A falta não está mais disponível para justificativa. Atualize o relatório.",
        );
      }

      await frequenciaService.createJustificativa({
        frequencia_id: frequencyId,
        motivo: reason,
      });

      const listRequestId = ++listRequestIdRef.current;
      const period = currentDetail.periodo;
      const [nextDetail, nextReport] = await Promise.all([
        frequenciaService.studentReport(currentDetail.data.estudante.id, {
          de: period.de,
          ate: period.ate,
        }),
        frequenciaService.report(buildRelatorioParams(appliedFilters)),
      ]);
      setDetailReport(nextDetail);
      if (listRequestId === listRequestIdRef.current) setResponse(nextReport);
    } catch (error) {
      if (error instanceof Error && !axios.isAxiosError(error)) throw error;
      throw new Error(
        errorMessage(error, "Não foi possível enviar a justificativa."),
      );
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-content-muted">
            Controle de frequência
          </p>
          <h1 className="mt-1 text-2xl font-bold text-brand-700">
            Relatório de frequência
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">
            Acompanhe presença, faltas e risco de perda do benefício por
            estudante.
          </p>
        </div>
        {response && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-050 px-4 py-2 text-sm font-bold text-brand-700">
            <BarChart3 aria-hidden="true" className="size-4" />
            {formatReportPeriod(response.periodo)}
          </div>
        )}
      </header>

      <RelatorioFrequenciaFilterCard
        disabled={loading}
        filters={filters}
        linhas={linhas}
        onApply={applyFilters}
        onChange={(field, value) =>
          setFilters((current) => ({ ...current, [field]: value }))
        }
        onClear={clearFilters}
      />

      {response && <RelatorioFrequenciaSummary totals={response.totais} />}

      <RelatorioFrequenciaTable
        data={response?.data ?? []}
        errorMessage={loadError}
        loading={loading}
        onRetry={() => void loadReport()}
        onView={(item) => void openStudentDetail(item)}
      />

      <RelatorioEstudanteModal
        error={detailError}
        loading={detailLoading}
        onClose={closeStudentDetail}
        onJustify={justifyAbsence}
        open={detailOpen}
        report={detailReport}
      />
    </main>
  );
}
