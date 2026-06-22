"use client";

import axios from "axios";
import { Check, Clock3, Eye, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/buttons";
import { SearchInput, Textarea } from "@/components/form/inputs";
import { Skeleton } from "@/components/loading";
import { Modal, ModalSection, ModalSectionContent } from "@/components/modal";
import {
  DataTable,
  type DataTableColumn,
  TableActionButton,
} from "@/components/table";
import {
  EMPTY_SOLICITATION_FILTERS,
  type SolicitationFilters,
  SolicitationsFilterDropdown,
} from "@/components/ui/solicitacoes/SolicitationsFilterDropdown";
import { inscricaoService } from "@/services/api/modules/inscricao";
import type {
  Inscricao,
  InscricaoDocumento,
  InscricaoInstituicao,
  Instituicao,
} from "@/types/inscricao";
import { cn } from "@/utils/cn";

type ApiErrorPayload = {
  message?: string;
};

type EnrichedInscricao = Inscricao & {
  documentos: InscricaoDocumento[];
  instituicaoAcademica: InscricaoInstituicao | null;
};

const SOLICITACOES_TABLE_GRID_CLASS =
  "md:grid-cols-[1.35fr_1fr_0.85fr_0.65fr_0.75fr]";

const SOLICITACOES_TABLE_COLUMNS: DataTableColumn[] = [
  { key: "name", label: "Nome / Email" },
  { key: "course", label: "Curso / Semestre" },
  { key: "institution", label: "Instituição" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Ações" },
];

const ITEMS_PER_PAGE = 10;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getStatusKey(status: string | null) {
  const normalizedStatus = normalizeText(status ?? "");

  if (!normalizedStatus) return "sem_status";
  if (
    normalizedStatus.includes("reprov") ||
    normalizedStatus.includes("rejeit")
  )
    return "reprovado";
  if (normalizedStatus.includes("lista")) return "lista_espera";
  if (normalizedStatus.includes("aprov")) return "aprovado";
  if (normalizedStatus.includes("analise")) return "em_analise";
  if (normalizedStatus.includes("pendente")) return "pendente";
  if (normalizedStatus.includes("incompleto")) return "incompleto";

  return normalizedStatus.replace(/\s+/g, "_");
}

function getStatusLabel(status: string | null) {
  const statusKey = getStatusKey(status);

  const labels: Record<string, string> = {
    aprovado: "Aprovada",
    em_analise: "Lista de espera",
    incompleto: "Lista de espera",
    lista_espera: "Lista de espera",
    pendente: "Lista de espera",
    reprovado: "Rejeitada",
    sem_status: "Sem status",
  };

  return (
    labels[statusKey] ??
    (status ?? "Sem status")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/^\p{L}/u, (letter) => letter.toUpperCase())
  );
}

function formatHistoryDate(value?: string | null) {
  if (!value) return "Data não informada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatusBadgeClass(status: string | null) {
  const statusKey = getStatusKey(status);

  if (statusKey === "aprovado") {
    return "bg-approve-default/10 text-approve-default";
  }

  if (statusKey === "reprovado") {
    return "bg-danger-600/10 text-danger-600";
  }

  return "bg-amber-100 text-amber-700";
}

function isHistoricalStatus(status: string | null) {
  const statusKey = getStatusKey(status);

  return ["aprovado", "reprovado"].includes(statusKey);
}

function getCourseLabel(inscricao: EnrichedInscricao) {
  return (
    inscricao.instituicaoAcademica?.course?.trim() || "Curso não informado"
  );
}

function getSemesterLabel(inscricao: EnrichedInscricao) {
  const semester = inscricao.instituicaoAcademica?.semester?.trim();

  return semester ? `${semester}º semestre` : "Semestre não informado";
}

function getInstitutionLabel(
  inscricao: EnrichedInscricao,
  institutionNamesById: Map<number, string>,
) {
  const institution = inscricao.instituicaoAcademica?.instituicao;
  const institutionId = inscricao.instituicaoAcademica?.instituicao_id;

  if (institution?.name) return institution.name;
  if (institutionId) {
    return (
      institutionNamesById.get(institutionId) ?? "Instituição não carregada"
    );
  }

  return "Instituição não informada";
}

function getAddressLabel(inscricao: Inscricao) {
  return [
    inscricao.address,
    inscricao.number,
    inscricao.neighborhood,
    inscricao.city,
    inscricao.cep,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatBoolean(value: boolean | null) {
  if (value === null || value === undefined) return "Não informado";

  return value ? "Sim" : "Não";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
}

function buildFilterOptions(
  solicitacoes: EnrichedInscricao[],
  getValue: (solicitacao: EnrichedInscricao) => string,
  getLabel: (solicitacao: EnrichedInscricao) => string,
) {
  const options = new Map<string, string>();

  for (const solicitacao of solicitacoes) {
    const value = getValue(solicitacao);

    if (!value) continue;

    options.set(value, getLabel(solicitacao));
  }

  return Array.from(options, ([value, label]) => ({ label, value })).sort(
    (firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label, "pt-BR", {
        numeric: true,
      }),
  );
}

function SolicitacoesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }, (_, index) => (
        <article
          className="grid gap-3 border-b border-brand-600/15 px-5 py-3 last:border-b-0 md:min-h-16 md:grid-cols-[1.35fr_1fr_0.85fr_0.65fr_0.75fr] md:items-center"
          key={index.toString()}
        >
          <div>
            <Skeleton className="h-4 w-52 max-w-full rounded-full bg-skeleton" />
            <Skeleton className="mt-2 h-3 w-40 max-w-full rounded-full bg-skeleton" />
          </div>
          <div>
            <Skeleton className="h-4 w-36 max-w-full rounded-full bg-skeleton" />
            <Skeleton className="mt-2 h-3 w-28 max-w-full rounded-full bg-skeleton" />
          </div>
          <Skeleton className="h-7 w-28 rounded bg-skeleton" />
          <Skeleton className="h-7 w-24 rounded bg-skeleton" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-md bg-skeleton" />
            <Skeleton className="size-8 rounded-md bg-skeleton" />
            <Skeleton className="size-8 rounded-md bg-skeleton" />
          </div>
        </article>
      ))}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase text-brand-600">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">
        {value || "Não informado"}
      </dd>
    </div>
  );
}

export function SolicitacoesWorkspace() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<EnrichedInscricao[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SolicitationFilters>(
    EMPTY_SOLICITATION_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [selectedSolicitacao, setSelectedSolicitacao] =
    useState<EnrichedInscricao | null>(null);
  const [approveTarget, setApproveTarget] = useState<EnrichedInscricao | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<EnrichedInscricao | null>(
    null,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  const institutionNamesById = useMemo(
    () =>
      new Map(
        instituicoes.map((instituicao) => [instituicao.id, instituicao.name]),
      ),
    [instituicoes],
  );

  const loadSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [nextInscricoes, nextInstituicoes] = await Promise.all([
        inscricaoService.listInscricoes(),
        inscricaoService.listInstituicoes(),
      ]);

      const enrichedSolicitacoes = await Promise.all(
        nextInscricoes.map(async (inscricao) => {
          const [instituicoesAcademicas, documentos] = await Promise.all([
            inscricaoService
              .listInscricaoInstituicoes(inscricao.id)
              .catch(() => []),
            inscricaoService.listDocumentos(inscricao.id).catch(() => []),
          ]);

          return {
            ...inscricao,
            documentos,
            instituicaoAcademica: instituicoesAcademicas[0] ?? null,
          };
        }),
      );

      setInstituicoes(nextInstituicoes);
      setSolicitacoes(enrichedSolicitacoes);
    } catch (currentError) {
      setSolicitacoes([]);
      setError(
        getErrorMessage(
          currentError,
          "Não foi possível carregar as solicitações.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSolicitacoes();
  }, [loadSolicitacoes]);

  const currentSolicitacoes = useMemo(
    () =>
      solicitacoes.filter(
        (solicitacao) => !isHistoricalStatus(solicitacao.status),
      ),
    [solicitacoes],
  );

  const historySolicitacoes = useMemo(
    () =>
      solicitacoes.filter((solicitacao) =>
        isHistoricalStatus(solicitacao.status),
      ),
    [solicitacoes],
  );

  const statusOptions = useMemo(
    () =>
      buildFilterOptions(
        currentSolicitacoes,
        (solicitacao) => getStatusKey(solicitacao.status),
        (solicitacao) => getStatusLabel(solicitacao.status),
      ),
    [currentSolicitacoes],
  );

  const institutionOptions = useMemo(
    () =>
      buildFilterOptions(
        currentSolicitacoes,
        (solicitacao) =>
          solicitacao.instituicaoAcademica?.instituicao_id
            ? String(solicitacao.instituicaoAcademica.instituicao_id)
            : "",
        (solicitacao) => getInstitutionLabel(solicitacao, institutionNamesById),
      ),
    [currentSolicitacoes, institutionNamesById],
  );

  const filteredSolicitacoes = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return currentSolicitacoes.filter((solicitacao) => {
      const statusKey = getStatusKey(solicitacao.status);
      const institutionId = solicitacao.instituicaoAcademica?.instituicao_id
        ? String(solicitacao.instituicaoAcademica.instituicao_id)
        : "";

      const matchesQuery =
        !normalizedQuery ||
        [
          solicitacao.name,
          solicitacao.email,
          getCourseLabel(solicitacao),
          getSemesterLabel(solicitacao),
          getInstitutionLabel(solicitacao, institutionNamesById),
          getStatusLabel(solicitacao.status),
        ].some((value) => normalizeText(value ?? "").includes(normalizedQuery));

      const matchesStatus =
        filters.statuses.length === 0 || filters.statuses.includes(statusKey);
      const matchesInstitution =
        filters.institutionIds.length === 0 ||
        filters.institutionIds.includes(institutionId);

      return matchesQuery && matchesStatus && matchesInstitution;
    });
  }, [currentSolicitacoes, filters, institutionNamesById, query]);

  const paginatedSolicitacoes = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;

    return filteredSolicitacoes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSolicitacoes, page]);

  const lastPage = Math.max(
    1,
    Math.ceil(filteredSolicitacoes.length / ITEMS_PER_PAGE),
  );
  const paginationFrom =
    filteredSolicitacoes.length === 0 ? null : (page - 1) * ITEMS_PER_PAGE + 1;
  const paginationTo =
    filteredSolicitacoes.length === 0
      ? null
      : Math.min(page * ITEMS_PER_PAGE, filteredSolicitacoes.length);

  function closeApproveModal() {
    if (actionLoading) return;

    setActionError("");
    setApproveTarget(null);
  }

  function closeRejectModal() {
    if (actionLoading) return;

    setActionError("");
    setRejectReason("");
    setRejectReasonError("");
    setRejectTarget(null);
  }

  async function handleApprove() {
    if (!approveTarget) return;

    try {
      setActionLoading(true);
      setActionError("");
      await inscricaoService.analisarInscricao(approveTarget.id, {
        decisao: "Aprovado",
        documentos: null,
        motivo: null,
      });
      await loadSolicitacoes();
      setApproveTarget(null);
    } catch (currentError) {
      setActionError(
        getErrorMessage(currentError, "Não foi possível aprovar a inscrição."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;

    if (!rejectReason.trim()) {
      setRejectReasonError("Informe o motivo da rejeição.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");
      await inscricaoService.analisarInscricao(rejectTarget.id, {
        decisao: "Rejeitado",
        documentos: null,
        motivo: rejectReason.trim(),
      });
      await loadSolicitacoes();
      closeRejectModal();
    } catch (currentError) {
      setActionError(
        getErrorMessage(currentError, "Não foi possível rejeitar a inscrição."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-brand-600">Solicitações</h1>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-[calc(36rem+3.25rem)] items-center gap-3">
          <SearchInput
            containerClassName="max-w-xl"
            onClear={() => {
              setQuery("");
              setPage(1);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Pesquise por estudante, curso, instituição ou status..."
            value={query}
          />
          <SolicitationsFilterDropdown
            filters={filters}
            institutionOptions={institutionOptions}
            onFiltersChange={(nextFilters) => {
              setFilters(nextFilters);
              setPage(1);
            }}
            statusOptions={statusOptions}
          />
        </div>

        <Button
          className="h-11 px-4"
          fullWidth={false}
          leftIcon={<Clock3 />}
          onClick={() => setHistoryOpen(true)}
          variant="primary"
        >
          Histórico
        </Button>
      </div>

      <DataTable
        columns={SOLICITACOES_TABLE_COLUMNS}
        data={paginatedSolicitacoes}
        emptyMessage="Nenhuma solicitação encontrada."
        errorMessage={error}
        errorTitle="Não foi possível carregar as solicitações"
        getRowKey={(solicitacao) => solicitacao.id}
        gridClassName={SOLICITACOES_TABLE_GRID_CLASS}
        loading={loading}
        onRetry={loadSolicitacoes}
        pagination={{
          currentPage: page,
          disabled: loading || Boolean(error),
          from: paginationFrom,
          lastPage,
          onPageChange: setPage,
          onPerPageChange: () => undefined,
          perPage: ITEMS_PER_PAGE,
          to: paginationTo,
          total: filteredSolicitacoes.length,
        }}
        renderRow={(solicitacao) => (
          <article className="grid gap-3 border-b border-brand-600/15 px-5 py-3 last:border-b-0 md:min-h-16 md:grid-cols-[1.35fr_1fr_0.85fr_0.65fr_0.75fr] md:items-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                {solicitacao.name}
              </h3>
              <p className="text-xs text-slate-600">
                {solicitacao.email ?? "Email não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {getCourseLabel(solicitacao)}
              </p>
              <p className="text-xs text-slate-600">
                {getSemesterLabel(solicitacao)}
              </p>
            </div>
            <div>
              <span className="inline-flex rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white">
                {getInstitutionLabel(solicitacao, institutionNamesById)}
              </span>
            </div>
            <div>
              <span
                className={cn(
                  "inline-flex rounded px-2 py-1 text-xs font-semibold",
                  getStatusBadgeClass(solicitacao.status),
                )}
              >
                {getStatusLabel(solicitacao.status)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TableActionButton
                ariaLabel={`Visualizar ${solicitacao.name}`}
                icon={<Eye />}
                onClick={() => setSelectedSolicitacao(solicitacao)}
                tooltip="Visualizar solicitação"
                variant="primary"
              />
              <TableActionButton
                ariaLabel={`Aprovar ${solicitacao.name}`}
                icon={<Check />}
                onClick={() => setApproveTarget(solicitacao)}
                tooltip="Aprovar inscrição"
                variant="approved"
              />
              <TableActionButton
                ariaLabel={`Rejeitar ${solicitacao.name}`}
                icon={<X />}
                onClick={() => setRejectTarget(solicitacao)}
                tooltip="Rejeitar inscrição"
                variant="danger"
              />
            </div>
          </article>
        )}
        skeleton={<SolicitacoesTableSkeleton />}
      />

      <SolicitacaoDetailsModal
        institutionNamesById={institutionNamesById}
        onClose={() => setSelectedSolicitacao(null)}
        open={Boolean(selectedSolicitacao)}
        solicitacao={selectedSolicitacao}
      />

      <Modal
        cancelLabel="Cancelar"
        onClose={closeApproveModal}
        onSave={handleApprove}
        open={Boolean(approveTarget)}
        saveLabel="Aprovar inscrição"
        saveLoading={actionLoading}
        saveVariant="primary"
        title="Confirmar aprovação"
      >
        <p className="text-sm font-medium text-slate-800">
          Deseja aprovar a inscrição de {approveTarget?.name}? A inscrição será
          movida para lista de espera.
        </p>
        {actionError && (
          <p className="mt-3 rounded-md bg-danger-600/10 px-3 py-2 text-sm font-medium text-danger-600">
            {actionError}
          </p>
        )}
      </Modal>

      <Modal
        cancelLabel="Cancelar"
        onClose={closeRejectModal}
        onSave={handleReject}
        open={Boolean(rejectTarget)}
        saveLabel="Salvar e enviar"
        saveLoading={actionLoading}
        saveVariant="danger"
        title="Rejeitar inscrição"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-800">
            Informe o motivo da rejeição da inscrição de {rejectTarget?.name}.
          </p>
          <Textarea
            error={rejectReasonError}
            label="Motivo da rejeição"
            onChange={(event) => {
              setRejectReason(event.target.value);
              setRejectReasonError("");
            }}
            required
            rows={5}
            value={rejectReason}
          />
          {actionError && (
            <p className="rounded-md bg-danger-600/10 px-3 py-2 text-sm font-medium text-danger-600">
              {actionError}
            </p>
          )}
        </div>
      </Modal>

      <HistoricoSolicitacoesModal
        historySolicitacoes={historySolicitacoes}
        institutionNamesById={institutionNamesById}
        onClose={() => setHistoryOpen(false)}
        open={historyOpen}
      />
    </>
  );
}

function SolicitacaoDetailsModal({
  institutionNamesById,
  onClose,
  open,
  solicitacao,
}: {
  institutionNamesById: Map<number, string>;
  onClose: () => void;
  open: boolean;
  solicitacao: EnrichedInscricao | null;
}) {
  return (
    <Modal
      cancelLabel="Fechar"
      className="max-w-4xl"
      contentClassName="space-y-4 bg-slate-50/80"
      hideSave
      onClose={onClose}
      open={open}
      title="Detalhes da solicitação"
    >
      {solicitacao && (
        <>
          <ModalSection className="bg-white">
            <ModalSectionContent>
              <h3 className="text-lg font-bold text-brand-600">
                {solicitacao.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {getAddressLabel(solicitacao) || "Endereço não informado"}
              </p>
              <dl className="mt-5 grid gap-4 md:grid-cols-4">
                <DetailItem label="CPF" value={solicitacao.cpf} />
                <DetailItem label="RG" value={solicitacao.rg} />
                <DetailItem
                  label="Data de nascimento"
                  value={solicitacao.birth_date}
                />
                <DetailItem label="Mãe" value={solicitacao.mother_name} />
                <DetailItem label="Pai" value={solicitacao.father_name} />
                <DetailItem label="E-mail" value={solicitacao.email} />
                <DetailItem label="Telefone" value={solicitacao.phone} />
                <DetailItem
                  label="Status"
                  value={getStatusLabel(solicitacao.status)}
                />
              </dl>
            </ModalSectionContent>
          </ModalSection>

          <ModalSection className="bg-white">
            <ModalSectionContent>
              <h3 className="text-lg font-bold text-brand-600">
                {getCourseLabel(solicitacao)}
              </h3>
              <dl className="mt-5 grid gap-4 md:grid-cols-4">
                <DetailItem
                  label="Instituição"
                  value={getInstitutionLabel(solicitacao, institutionNamesById)}
                />
                <DetailItem
                  label="Cidade de destino"
                  value={solicitacao.instituicaoAcademica?.city_destination}
                />
                <DetailItem
                  label="Semestre"
                  value={getSemesterLabel(solicitacao)}
                />
                <DetailItem
                  label="Turno"
                  value={solicitacao.instituicaoAcademica?.shift_label}
                />
                <DetailItem
                  label="Previsão de conclusão"
                  value={solicitacao.instituicaoAcademica?.expected_completion}
                />
                <DetailItem
                  label="Já utiliza transporte"
                  value={formatBoolean(
                    solicitacao.instituicaoAcademica?.used_transport ?? null,
                  )}
                />
                <DetailItem
                  label="Possui bolsa"
                  value={formatBoolean(
                    solicitacao.instituicaoAcademica?.has_scholarship ?? null,
                  )}
                />
                <DetailItem
                  label="Tipo de bolsa"
                  value={solicitacao.instituicaoAcademica?.scholarship_type}
                />
              </dl>
            </ModalSectionContent>
          </ModalSection>

          <ModalSection className="bg-white">
            <ModalSectionContent>
              <h3 className="text-lg font-bold text-brand-600">Documentos</h3>
              {solicitacao.documentos.length === 0 ? (
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Nenhum documento enviado.
                </p>
              ) : (
                <div className="mt-4 overflow-hidden rounded-md border border-border-subtle">
                  {solicitacao.documentos.map((documento) => (
                    <div
                      className="grid gap-2 border-b border-border-subtle px-4 py-3 last:border-b-0 md:grid-cols-[1fr_0.75fr_0.5fr]"
                      key={documento.id}
                    >
                      <a
                        className={cn(
                          "text-sm font-semibold text-brand-600 underline-offset-2",
                          documento.file_path && "hover:underline",
                        )}
                        href={documento.file_path || undefined}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {documento.name}
                      </a>
                      <span className="text-sm text-slate-700">
                        {documento.type}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {getStatusLabel(documento.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ModalSectionContent>
          </ModalSection>
        </>
      )}
    </Modal>
  );
}

function HistoricoSolicitacoesModal({
  historySolicitacoes,
  institutionNamesById,
  onClose,
  open,
}: {
  historySolicitacoes: EnrichedInscricao[];
  institutionNamesById: Map<number, string>;
  onClose: () => void;
  open: boolean;
}) {
  return (
    <Modal
      cancelLabel="Fechar"
      className="max-w-4xl"
      contentClassName="bg-slate-50/80"
      hideSave
      onClose={onClose}
      open={open}
      title="Histórico de inscrições"
    >
      {historySolicitacoes.length === 0 ? (
        <p className="rounded-md bg-white px-4 py-6 text-center text-sm font-medium text-slate-600">
          Nenhuma inscrição finalizada no histórico.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border-subtle bg-white">
          {historySolicitacoes.map((solicitacao) => (
            <article
              className="grid gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0 md:grid-cols-[1.2fr_1fr_0.8fr_0.65fr] md:items-center"
              key={solicitacao.id}
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-950">
                  {solicitacao.name}
                </h3>
                <p className="text-xs text-slate-600">
                  {solicitacao.email ?? "Email não informado"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {getCourseLabel(solicitacao)}
                </p>
                <p className="text-xs text-slate-600">
                  {getInstitutionLabel(solicitacao, institutionNamesById)}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex w-fit rounded px-2 py-1 text-xs font-semibold",
                  getStatusBadgeClass(solicitacao.status),
                )}
              >
                {getStatusLabel(solicitacao.status)}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {formatHistoryDate(
                  solicitacao.updated_at ?? solicitacao.created_at,
                )}
              </span>
            </article>
          ))}
        </div>
      )}
    </Modal>
  );
}
