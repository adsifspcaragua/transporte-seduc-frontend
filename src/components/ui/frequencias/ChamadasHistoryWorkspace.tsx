"use client";

import axios from "axios";
import { History } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "@/components/modal";
import { ChamadaSheet } from "@/components/ui/frequencias/ChamadaSheet";
import { ChamadasHistoryFilterCard } from "@/components/ui/frequencias/ChamadasHistoryFilterCard";
import { ChamadasHistoryTable } from "@/components/ui/frequencias/ChamadasHistoryTable";
import {
  buildChamadaHistoryParams,
  type ChamadaHistoryFilters,
  EMPTY_CHAMADA_HISTORY_FILTERS,
} from "@/components/ui/frequencias/chamadaHistoryPresentation";
import { formatCallDate } from "@/components/ui/frequencias/frequenciaPresentation";
import { frequenciaService } from "@/services/api/modules/frequencia";
import type {
  Chamada,
  FrequenciaLinha,
  PaginatedChamadas,
} from "@/types/frequencia";

type ApiError = { message?: string; errors?: Record<string, string[]> };
type PerPage = 10 | 15 | 20 | 30;

const EMPTY_RESPONSE: PaginatedChamadas = {
  data: [],
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

export function ChamadasHistoryWorkspace() {
  const [filters, setFilters] = useState<ChamadaHistoryFilters>({
    ...EMPTY_CHAMADA_HISTORY_FILTERS,
  });
  const [appliedFilters, setAppliedFilters] = useState<ChamadaHistoryFilters>({
    ...EMPTY_CHAMADA_HISTORY_FILTERS,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PerPage>(10);
  const [response, setResponse] = useState<PaginatedChamadas>(EMPTY_RESPONSE);
  const [linhas, setLinhas] = useState<FrequenciaLinha[]>([]);
  const [activeChamada, setActiveChamada] = useState<Chamada | null>(null);
  const [deleting, setDeleting] = useState<Chamada | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const requestIdRef = useRef(0);

  const loadChamadas = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setLoadError("");
      const nextResponse = await frequenciaService.list(
        buildChamadaHistoryParams(appliedFilters, page, perPage),
      );
      if (requestId === requestIdRef.current) setResponse(nextResponse);
      return nextResponse;
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setLoadError(
          errorMessage(error, "Não foi possível carregar o histórico."),
        );
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [appliedFilters, page, perPage]);

  useEffect(() => {
    void loadChamadas();
  }, [loadChamadas]);

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
    const emptyFilters = { ...EMPTY_CHAMADA_HISTORY_FILTERS };
    setFilters(emptyFilters);
    setPage(1);
    setAppliedFilters(emptyFilters);
  }

  async function openChamada(chamada: Chamada) {
    try {
      setDetailLoading(true);
      setActionError("");
      const result = await frequenciaService.show(chamada.id);
      setActiveChamada(result.data);
    } catch (error) {
      setActionError(
        errorMessage(error, "Não foi possível carregar a chamada."),
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function deleteChamada() {
    if (!deleting || actionLoading) return;

    try {
      setActionLoading(true);
      setActionError("");
      setSuccessMessage("");
      const result = await frequenciaService.remove(deleting.id);
      setSuccessMessage(result.message ?? "Chamada excluída com sucesso.");
      setDeleting(null);

      if (response.data.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await loadChamadas();
      }
    } catch (error) {
      setActionError(
        errorMessage(error, "Não foi possível excluir a chamada."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (activeChamada) {
    return (
      <ChamadaSheet
        backLabel="Voltar ao histórico"
        chamada={activeChamada}
        onBack={() => {
          setActiveChamada(null);
          void loadChamadas();
        }}
        onChamadaChange={setActiveChamada}
      />
    );
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
            Histórico de chamadas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">
            Consulte folhas anteriores, acompanhe pendências e gerencie os
            registros das linhas.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-600/10 px-4 py-2 text-sm font-bold text-brand-700">
          <History aria-hidden="true" className="size-4" />
          {response.meta.total} chamada(s)
        </div>
      </header>

      {successMessage && (
        <output className="block rounded-lg border border-green-600/20 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {successMessage}
        </output>
      )}
      {actionError && !deleting && (
        <p
          className="rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
          role="alert"
        >
          {actionError}
        </p>
      )}

      <ChamadasHistoryFilterCard
        disabled={loading || detailLoading}
        filters={filters}
        linhas={linhas}
        onApply={applyFilters}
        onChange={(field, value) =>
          setFilters((current) => ({ ...current, [field]: value }))
        }
        onClear={clearFilters}
      />

      <ChamadasHistoryTable
        data={response.data}
        errorMessage={loadError}
        loading={loading || detailLoading}
        onDelete={(chamada) => {
          setActionError("");
          setDeleting(chamada);
        }}
        onRetry={() => void loadChamadas()}
        onView={(chamada) => void openChamada(chamada)}
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

      <Modal
        onClose={() => {
          if (actionLoading) return;
          setDeleting(null);
          setActionError("");
        }}
        onSave={() => void deleteChamada()}
        open={Boolean(deleting)}
        saveLabel="Excluir chamada"
        saveLoading={actionLoading}
        saveVariant="danger"
        title="Excluir chamada"
      >
        <p className="text-sm font-medium text-slate-800">
          Excluir a chamada da linha {deleting?.linha.name}, de{" "}
          {deleting ? formatCallDate(deleting.data) : ""}?
        </p>
        <p className="mt-2 text-sm text-content-muted">
          Todas as presenças, faltas e justificativas vinculadas a esta folha
          também serão removidas. Esta ação não pode ser desfeita.
        </p>
        {actionError && (
          <div
            className="mt-4 rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
            role="alert"
          >
            {actionError}
          </div>
        )}
      </Modal>
    </main>
  );
}
