"use client";

import axios from "axios";
import { useState } from "react";

import { Modal } from "@/components/modal";
import { ChamadaSheet } from "@/components/ui/frequencias/ChamadaSheet";
import { ChamadasHistoryFilterCard } from "@/components/ui/frequencias/ChamadasHistoryFilterCard";
import { ChamadasHistoryTable } from "@/components/ui/frequencias/ChamadasHistoryTable";
import {
  buildChamadaHistoryParams,
  type ChamadaHistoryFilters,
  EMPTY_CHAMADA_HISTORY_FILTERS,
} from "@/components/ui/frequencias/chamadaHistoryPresentation";
import {
  formatCallDate,
  localDateIso,
} from "@/components/ui/frequencias/frequenciaPresentation";
import { useAuthz } from "@/hooks/use-authz";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { frequenciaService } from "@/services/api/modules/frequencia";
import {
  chamadasQuery,
  frequenciaLinhasQuery,
} from "@/services/api/page-queries";
import type { Chamada, PaginatedChamadas } from "@/types/frequencia";

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
  const { can } = useAuthz();
  const canDelete = can("frequencias.delete");
  const [filters, setFilters] = useState<ChamadaHistoryFilters>({
    ...EMPTY_CHAMADA_HISTORY_FILTERS,
  });
  const [appliedFilters, setAppliedFilters] = useState<ChamadaHistoryFilters>({
    ...EMPTY_CHAMADA_HISTORY_FILTERS,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PerPage>(10);
  const result = useCachedQuery(
    chamadasQuery,
    buildChamadaHistoryParams(appliedFilters, page, perPage),
  );
  const response = result.data ?? EMPTY_RESPONSE;
  const loadChamadas = result.refresh;
  const linhasResult = useCachedQuery(frequenciaLinhasQuery, localDateIso());
  const linhas = linhasResult.data ?? [];
  const [activeChamada, setActiveChamada] = useState<Chamada | null>(null);
  const [deleting, setDeleting] = useState<Chamada | null>(null);
  const loading = result.isLoading;
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const loadError = result.error
    ? errorMessage(result.error, "Não foi possível carregar o histórico.")
    : "";
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
    <section>
      {successMessage && (
        <output className="mb-5 block rounded-lg border border-green-600/20 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {successMessage}
        </output>
      )}
      {actionError && !deleting && (
        <p
          className="mb-5 rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
          role="alert"
        >
          {actionError}
        </p>
      )}

      <div className="mb-6">
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
      </div>

      <ChamadasHistoryTable
        canDelete={canDelete}
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
    </section>
  );
}
