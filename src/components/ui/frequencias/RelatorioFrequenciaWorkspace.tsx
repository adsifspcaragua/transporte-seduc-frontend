"use client";

import axios from "axios";
import { useRef, useState } from "react";
import { localDateIso } from "@/components/ui/frequencias/frequenciaPresentation";
import { findAbsenceFrequencyId } from "@/components/ui/frequencias/justificativaPresentation";
import { RelatorioEstudanteModal } from "@/components/ui/frequencias/RelatorioEstudanteModal";
import { RelatorioFrequenciaFilterCard } from "@/components/ui/frequencias/RelatorioFrequenciaFilterCard";
import { RelatorioFrequenciaSummary } from "@/components/ui/frequencias/RelatorioFrequenciaSummary";
import { RelatorioFrequenciaTable } from "@/components/ui/frequencias/RelatorioFrequenciaTable";
import {
  buildRelatorioParams,
  EMPTY_RELATORIO_FILTERS,
  type RelatorioFrequenciaFilters,
} from "@/components/ui/frequencias/relatorioFrequenciaPresentation";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { frequenciaService } from "@/services/api/modules/frequencia";
import {
  frequenciaLinhasQuery,
  relatorioQuery,
} from "@/services/api/page-queries";
import type {
  HistoricoFrequenciaItem,
  RelatorioEstudanteResponse,
  RelatorioFrequenciaItem,
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
  const result = useCachedQuery(
    relatorioQuery,
    buildRelatorioParams(appliedFilters),
  );
  const response = result.data;
  const loadReport = result.refresh;
  const linhasResult = useCachedQuery(frequenciaLinhasQuery, localDateIso());
  const linhas = linhasResult.data ?? [];
  const loading = result.isLoading;
  const loadError = result.error
    ? errorMessage(result.error, "Não foi possível carregar o relatório.")
    : "";
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailReport, setDetailReport] =
    useState<RelatorioEstudanteResponse | null>(null);
  const detailRequestIdRef = useRef(0);

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

      const period = currentDetail.periodo;
      const [nextDetail] = await Promise.all([
        frequenciaService.studentReport(currentDetail.data.estudante.id, {
          de: period.de,
          ate: period.ate,
        }),
        loadReport(),
      ]);
      setDetailReport(nextDetail);
    } catch (error) {
      if (error instanceof Error && !axios.isAxiosError(error)) throw error;
      throw new Error(
        errorMessage(error, "Não foi possível enviar a justificativa."),
      );
    }
  }

  return (
    <section>
      <div className="mb-6">
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
      </div>

      {response && (
        <div className="mb-6">
          <RelatorioFrequenciaSummary totals={response.totais} />
        </div>
      )}

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
    </section>
  );
}
