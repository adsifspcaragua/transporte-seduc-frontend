"use client";

import axios from "axios";
import { ClipboardList } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  JustificativaAnalysisModal,
  type JustificativaModalMode,
} from "@/components/ui/frequencias/JustificativaAnalysisModal";
import { JustificativasFilterCard } from "@/components/ui/frequencias/JustificativasFilterCard";
import { JustificativasTable } from "@/components/ui/frequencias/JustificativasTable";
import {
  buildJustificativaParams,
  EMPTY_JUSTIFICATIVA_FILTERS,
  type JustificativaFilters,
} from "@/components/ui/frequencias/justificativaPresentation";
import { useAuthz } from "@/hooks/use-authz";
import { frequenciaService } from "@/services/api/modules/frequencia";
import type {
  AnaliseJustificativaPayload,
  FrequenciaLinha,
  Justificativa,
  PaginatedJustificativas,
} from "@/types/frequencia";

type ApiError = { message?: string; errors?: Record<string, string[]> };
type PerPage = 10 | 15 | 20 | 30;

const EMPTY_RESPONSE: PaginatedJustificativas = {
  data: [],
  em_analise: 0,
  meta: {
    current_page: 1,
    from: null,
    last_page: 1,
    per_page: 10,
    to: null,
    total: 0,
  },
};

function errorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiError>(error)) return fallback;
  if (error.response?.status === 403) {
    return "Você não tem permissão para realizar esta ação.";
  }

  return (
    Object.values(error.response?.data?.errors ?? {})[0]?.[0] ??
    error.response?.data?.message ??
    fallback
  );
}

function isPerPage(value: number): value is PerPage {
  return [10, 15, 20, 30].includes(value);
}

export function JustificativasWorkspace() {
  const { can } = useAuthz();
  const canAnalyze = can("justificativas.analise");
  const [filters, setFilters] = useState<JustificativaFilters>({
    ...EMPTY_JUSTIFICATIVA_FILTERS,
  });
  const [appliedFilters, setAppliedFilters] = useState<JustificativaFilters>({
    ...EMPTY_JUSTIFICATIVA_FILTERS,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PerPage>(10);
  const [response, setResponse] =
    useState<PaginatedJustificativas>(EMPTY_RESPONSE);
  const [linhas, setLinhas] = useState<FrequenciaLinha[]>([]);
  const [selected, setSelected] = useState<Justificativa | null>(null);
  const [modalMode, setModalMode] = useState<JustificativaModalMode | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const requestIdRef = useRef(0);

  const loadJustificativas = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setLoadError("");
      const nextResponse = await frequenciaService.listJustificativas(
        buildJustificativaParams(appliedFilters, page, perPage),
      );
      if (requestId === requestIdRef.current) setResponse(nextResponse);
      return nextResponse;
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setLoadError(
          errorMessage(error, "Não foi possível carregar as justificativas."),
        );
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [appliedFilters, page, perPage]);

  useEffect(() => {
    void loadJustificativas();
  }, [loadJustificativas]);

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
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    const emptyFilters = { ...EMPTY_JUSTIFICATIVA_FILTERS };
    setFilters(emptyFilters);
    setPage(1);
    setAppliedFilters(emptyFilters);
  }

  async function openModal(
    justificativa: Justificativa,
    mode: JustificativaModalMode,
  ) {
    setSelected(justificativa);
    setModalMode(mode);
    setModalError("");

    try {
      const detail = await frequenciaService.showJustificativa(
        justificativa.id,
      );
      setSelected((current) =>
        current?.id === justificativa.id ? detail.data : current,
      );
    } catch (error) {
      setModalError(
        errorMessage(error, "Não foi possível atualizar os detalhes."),
      );
    }
  }

  function closeModal() {
    if (actionLoading) return;
    setSelected(null);
    setModalMode(null);
    setModalError("");
  }

  async function analyzeJustificativa(payload: AnaliseJustificativaPayload) {
    if (!selected || actionLoading) return;

    try {
      setActionLoading(true);
      setModalError("");
      setSuccessMessage("");
      setAlertMessage("");
      const result = await frequenciaService.analyzeJustificativa(
        selected.id,
        payload,
      );
      setSuccessMessage(
        result.message ?? "Justificativa analisada com sucesso.",
      );
      setAlertMessage(result.alerta ?? "");
      setSelected(null);
      setModalMode(null);

      if (response.data.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await loadJustificativas();
      }
    } catch (error) {
      setModalError(
        errorMessage(error, "Não foi possível analisar a justificativa."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  const { meta } = response;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-content-muted">
            Controle de frequência
          </p>
          <h1 className="mt-1 text-2xl font-bold text-brand-700">
            Justificativas de faltas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">
            Consulte os pedidos enviados e registre a decisão administrativa.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
          <ClipboardList aria-hidden="true" className="size-4" />
          {response.em_analise} em análise
        </div>
      </header>

      {successMessage && (
        <output className="block rounded-lg border border-green-600/20 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          <span className="block">{successMessage}</span>
          {alertMessage && <span className="mt-1 block">{alertMessage}</span>}
        </output>
      )}

      <JustificativasFilterCard
        disabled={loading}
        filters={filters}
        linhas={linhas}
        onApply={applyFilters}
        onChange={(field, value) =>
          setFilters((current) => ({ ...current, [field]: value }))
        }
        onClear={clearFilters}
      />

      <JustificativasTable
        allowAnalysis={canAnalyze}
        data={response.data}
        errorMessage={loadError}
        loading={loading}
        onApprove={(justificativa) => void openModal(justificativa, "approve")}
        onReject={(justificativa) => void openModal(justificativa, "reject")}
        onRetry={() => void loadJustificativas()}
        onView={(justificativa) => void openModal(justificativa, "view")}
        pagination={{
          currentPage: meta.current_page,
          disabled: loading,
          from: meta.from,
          lastPage: meta.last_page,
          onPageChange: setPage,
          onPerPageChange: (value) => {
            if (!isPerPage(value)) return;
            setPage(1);
            setPerPage(value);
          },
          perPage: meta.per_page,
          to: meta.to,
          total: meta.total,
        }}
      />

      <JustificativaAnalysisModal
        error={modalError}
        justificativa={selected}
        loading={actionLoading}
        mode={modalMode}
        onClose={closeModal}
        onConfirm={(payload) => void analyzeJustificativa(payload)}
      />
    </main>
  );
}
