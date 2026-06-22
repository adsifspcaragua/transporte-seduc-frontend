"use client";

import axios from "axios";
import {
  Check,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  IdCard,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/buttons";
import { SearchInput, Textarea } from "@/components/form/inputs";
import { Skeleton } from "@/components/loading";
import {
  Modal,
  ModalSection,
  ModalSectionContent,
  ModalSectionHeader,
} from "@/components/modal";
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
import { useMinimumVisibleLoading } from "@/hooks/use-minimum-visible-loading";
import { inscricaoService } from "@/services/api/modules/inscricao";
import type {
  Curso,
  Inscricao,
  InscricaoDocumento,
  InscricaoInstituicao,
  Instituicao,
  Linha,
} from "@/types/inscricao";
import { formatCep } from "@/utils/cep";
import { cn } from "@/utils/cn";
import { formatCpf } from "@/utils/cpf";
import { formatPhone } from "@/utils/phone";

type ApiErrorPayload = {
  message?: string;
};

type EnrichedInscricao = Inscricao & {
  documentos: InscricaoDocumento[];
  instituicaoAcademica: InscricaoInstituicao | null;
};

type DetailsSectionProps = {
  children: ReactNode;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  subtitle: string;
  title: string;
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

const FILTER_LABEL_CLASS =
  "mb-1.5 block text-xs font-bold text-content-secondary";

const ITEMS_PER_PAGE = 10;

let solicitacoesPageCache: {
  cursos: Curso[];
  instituicoes: Instituicao[];
  linhas: Linha[];
  solicitacoes: EnrichedInscricao[];
} | null = null;

const SEMESTER_FILTER_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const semester = String(index + 1);

  return {
    label: `${semester}º semestre`,
    value: semester,
  };
});

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
  if (
    normalizedStatus.includes("lista") ||
    normalizedStatus.includes("analise") ||
    normalizedStatus.includes("pendente") ||
    normalizedStatus.includes("incompleto")
  ) {
    return "lista_espera";
  }
  if (normalizedStatus.includes("aprov")) return "aprovado";

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

function formatDateLabel(value?: string | null) {
  if (!value) return "Não informado";

  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-");

  if (year && month && day) return `${day}/${month}/${year}`;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatCpfLabel(value?: string | null) {
  if (!value) return "Não informado";

  return formatCpf(value, { eager: false }) || "Não informado";
}

function formatCepLabel(value?: string | null) {
  if (!value) return "Não informado";

  return formatCep(value, { eager: false }) || "Não informado";
}

function formatPhoneLabel(value?: string | null) {
  if (!value) return "Não informado";

  return formatPhone(value, { eager: false }) || "Não informado";
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

function getSemesterFilterValue(inscricao: EnrichedInscricao) {
  return inscricao.instituicaoAcademica?.semester?.match(/\d+/)?.[0] ?? "";
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
  const streetLine = [inscricao.address, inscricao.number]
    .filter(Boolean)
    .join(", ");
  const cityLine = [inscricao.neighborhood, inscricao.city]
    .filter(Boolean)
    .join(", ");
  const cepLine = inscricao.cep ? `CEP ${formatCepLabel(inscricao.cep)}` : "";

  return [streetLine, inscricao.complement, cityLine, cepLine]
    .filter(Boolean)
    .join(" - ");
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

function buildInstitutionOptions(instituicoes: Instituicao[]) {
  return instituicoes
    .map((instituicao) => ({
      label: instituicao.name,
      value: String(instituicao.id),
    }))
    .sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label, "pt-BR", {
        numeric: true,
      }),
    );
}

function buildCourseOptions(cursos: Curso[]) {
  return cursos
    .map((curso) => ({
      label: curso.name,
      value: curso.name,
    }))
    .sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label, "pt-BR", {
        numeric: true,
      }),
    );
}

function buildLineOptions(linhas: Linha[]) {
  return linhas
    .map((linha) => ({
      label: linha.name,
      value: String(linha.id),
    }))
    .sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label, "pt-BR", {
        numeric: true,
      }),
    );
}

function normalizeLineIds(value: Instituicao["linhas_ids"]) {
  if (!Array.isArray(value)) return [];

  return value.map((lineId) => String(lineId)).filter(Boolean);
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

function SolicitacoesPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-40 rounded-full bg-skeleton" />
        <Skeleton className="h-11 w-32 rounded-lg bg-skeleton" />
      </div>

      <div className="mb-6 rounded-lg border border-brand-600/10 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="size-4 rounded bg-skeleton" />
          <Skeleton className="h-5 w-20 rounded-full bg-skeleton" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12 xl:items-end">
          <div className="min-w-0 sm:col-span-2 xl:col-span-4">
            <Skeleton className="mb-1.5 h-3 w-16 rounded-full bg-skeleton" />
            <Skeleton className="h-11 w-full rounded-lg bg-skeleton" />
          </div>
          <div className="min-w-0 xl:col-span-4">
            <Skeleton className="mb-1.5 h-3 w-16 rounded-full bg-skeleton" />
            <Skeleton className="h-11 w-full rounded-lg bg-skeleton" />
          </div>
          <div className="min-w-0 xl:col-span-4">
            <Skeleton className="mb-1.5 h-3 w-16 rounded-full bg-skeleton" />
            <Skeleton className="h-11 w-full rounded-lg bg-skeleton" />
          </div>
          <div className="min-w-0 xl:col-span-4">
            <Skeleton className="mb-1.5 h-3 w-16 rounded-full bg-skeleton" />
            <Skeleton className="h-11 w-full rounded-lg bg-skeleton" />
          </div>
          <div className="min-w-0 xl:col-span-2">
            <Skeleton className="mb-1.5 h-3 w-16 rounded-full bg-skeleton" />
            <Skeleton className="h-11 w-full rounded-lg bg-skeleton" />
          </div>
          <div className="pt-5 xl:col-start-12">
            <Skeleton className="h-11 w-full rounded-lg bg-skeleton" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <div className="grid gap-3 bg-brand-600 px-5 py-4 md:grid-cols-[1.35fr_1fr_0.85fr_0.65fr_0.75fr]">
          {SOLICITACOES_TABLE_COLUMNS.map((column) => (
            <Skeleton
              className="h-4 w-24 rounded-full bg-white/30"
              key={column.key}
            />
          ))}
        </div>
        <SolicitacoesTableSkeleton />
      </div>
    </div>
  );
}

function DetailItem({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value?: ReactNode;
}) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className={className}>
      <dt className="text-[11px] font-bold uppercase text-brand-600">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">
        {hasValue ? value : "Não informado"}
      </dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-md px-2 py-1 text-xs font-bold",
        getStatusBadgeClass(status),
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function DocumentActionLink({
  children,
  download,
  href,
  icon,
}: {
  children: string;
  download?: boolean;
  href: string;
  icon: ReactNode;
}) {
  return (
    <a
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-brand-600/20 bg-surface-primary px-3 text-sm font-semibold text-brand-600 shadow-sm transition-colors hover:bg-brand-600/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      download={download}
      href={href}
      rel="noreferrer"
      target={download ? undefined : "_blank"}
    >
      <span className="[&>svg]:size-4">{icon}</span>
      {children}
    </a>
  );
}

function DetailsSection({
  children,
  icon,
  isOpen,
  onToggle,
  subtitle,
  title,
}: DetailsSectionProps) {
  return (
    <ModalSection className="border-brand-600/15 bg-white">
      <ModalSectionHeader className="p-0">
        <button
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-600/[0.03] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600"
          onClick={onToggle}
          type="button"
        >
          <span className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 [&>svg]:size-5">
              {icon}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-brand-700">
                {title}
              </span>
              <span className="mt-0.5 block text-sm font-medium text-content-muted">
                {subtitle}
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-brand-700 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </ModalSectionHeader>

      {isOpen && <ModalSectionContent>{children}</ModalSectionContent>}
    </ModalSection>
  );
}

function DetailGroup({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-bold uppercase text-brand-600">{title}</h3>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>
      {children}
    </div>
  );
}

export function SolicitacoesWorkspace() {
  const hasCachedPage = Boolean(solicitacoesPageCache);
  const [loading, setLoading] = useState(!hasCachedPage);
  const [actionLoading, setActionLoading] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<EnrichedInscricao[]>(
    () => solicitacoesPageCache?.solicitacoes ?? [],
  );
  const [cursos, setCursos] = useState<Curso[]>(
    () => solicitacoesPageCache?.cursos ?? [],
  );
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>(
    () => solicitacoesPageCache?.instituicoes ?? [],
  );
  const [linhas, setLinhas] = useState<Linha[]>(
    () => solicitacoesPageCache?.linhas ?? [],
  );
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
  const showPageSkeleton = useMinimumVisibleLoading(
    loading && !solicitacoesPageCache,
  );

  const institutionNamesById = useMemo(
    () =>
      new Map(
        instituicoes.map((instituicao) => [instituicao.id, instituicao.name]),
      ),
    [instituicoes],
  );

  const lineNamesById = useMemo(
    () => new Map(linhas.map((linha) => [linha.id, linha.name])),
    [linhas],
  );

  const institutionLineIdsById = useMemo(
    () =>
      new Map(
        instituicoes.map((instituicao) => [
          instituicao.id,
          normalizeLineIds(instituicao.linhas_ids),
        ]),
      ),
    [instituicoes],
  );

  const loadSolicitacoes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");

      const [nextInscricoes, nextCursos, nextInstituicoes, nextLinhas] =
        await Promise.all([
          inscricaoService.listInscricoes(),
          inscricaoService.listCursos(),
          inscricaoService.listInstituicoes(),
          inscricaoService.listLinhas().catch(() => []),
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

      setCursos(nextCursos);
      setInstituicoes(nextInstituicoes);
      setLinhas(nextLinhas);
      setSolicitacoes(enrichedSolicitacoes);
      solicitacoesPageCache = {
        cursos: nextCursos,
        instituicoes: nextInstituicoes,
        linhas: nextLinhas,
        solicitacoes: enrichedSolicitacoes,
      };
    } catch (currentError) {
      setSolicitacoes([]);
      setError(
        getErrorMessage(
          currentError,
          "Não foi possível carregar as solicitações.",
        ),
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadSolicitacoes(!solicitacoesPageCache);
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

  const institutionOptions = useMemo(
    () => buildInstitutionOptions(instituicoes),
    [instituicoes],
  );

  const courseOptions = useMemo(() => buildCourseOptions(cursos), [cursos]);

  const lineOptions = useMemo(() => buildLineOptions(linhas), [linhas]);

  const filteredSolicitacoes = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return currentSolicitacoes.filter((solicitacao) => {
      const statusKey = getStatusKey(solicitacao.status);
      const institutionId = solicitacao.instituicaoAcademica?.instituicao_id
        ? String(solicitacao.instituicaoAcademica.instituicao_id)
        : "";
      const courseValue =
        solicitacao.instituicaoAcademica?.course?.trim() ?? "";
      const semesterValue = getSemesterFilterValue(solicitacao);
      const solicitationLineIds = solicitacao.instituicaoAcademica
        ?.instituicao_id
        ? (institutionLineIdsById.get(
            solicitacao.instituicaoAcademica.instituicao_id,
          ) ?? [])
        : [];
      const solicitationLineLabels = solicitationLineIds
        .map((lineId) => lineNamesById.get(Number(lineId)))
        .filter(Boolean);

      const matchesQuery =
        !normalizedQuery ||
        [
          solicitacao.name,
          solicitacao.email,
          getCourseLabel(solicitacao),
          getSemesterLabel(solicitacao),
          getInstitutionLabel(solicitacao, institutionNamesById),
          getStatusLabel(solicitacao.status),
          ...solicitationLineLabels,
        ].some((value) => normalizeText(value ?? "").includes(normalizedQuery));

      const matchesStatus =
        filters.statuses.length === 0 || filters.statuses.includes(statusKey);
      const matchesInstitution =
        filters.institutionIds.length === 0 ||
        filters.institutionIds.includes(institutionId);
      const matchesCourse =
        filters.courseValues.length === 0 ||
        filters.courseValues.includes(courseValue);
      const matchesSemester =
        filters.semesterValues.length === 0 ||
        filters.semesterValues.includes(semesterValue);
      const matchesLine =
        filters.lineIds.length === 0 ||
        filters.lineIds.some((lineId) => solicitationLineIds.includes(lineId));

      return (
        matchesQuery &&
        matchesStatus &&
        matchesInstitution &&
        matchesCourse &&
        matchesSemester &&
        matchesLine
      );
    });
  }, [
    currentSolicitacoes,
    filters,
    institutionLineIdsById,
    institutionNamesById,
    lineNamesById,
    query,
  ]);

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

  if (showPageSkeleton) {
    return <SolicitacoesPageSkeleton />;
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-600">Solicitações</h1>
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

      <section className="mb-6 rounded-lg border border-brand-600/10 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-brand-600">
          <Filter className="size-4" />
          <h2 className="text-base font-bold">Filtros</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12 xl:items-end">
          <div className="min-w-0 sm:col-span-2 xl:col-span-4">
            <span className={FILTER_LABEL_CLASS}>Buscar</span>
            <SearchInput
              onClear={() => {
                setQuery("");
                setPage(1);
              }}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Pesquise por estudante, curso ou instituição..."
              value={query}
            />
          </div>

          <SolicitationsFilterDropdown
            courseOptions={courseOptions}
            filters={filters}
            institutionOptions={institutionOptions}
            labelClassName={FILTER_LABEL_CLASS}
            lineOptions={lineOptions}
            onFiltersChange={(nextFilters) => {
              setFilters(nextFilters);
              setPage(1);
            }}
            semesterOptions={SEMESTER_FILTER_OPTIONS}
          />
        </div>
      </section>

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
                variant="secondary"
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
          Deseja aprovar a inscrição de {approveTarget?.name}? O status será
          atualizado para aprovado.
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
            className="min-h-36 max-h-64"
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
  const [openSections, setOpenSections] = useState({
    academic: true,
    documents: true,
    personal: true,
  });

  useEffect(() => {
    if (!open) return;

    setOpenSections({
      academic: true,
      documents: true,
      personal: true,
    });
  }, [open]);

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

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
          <DetailsSection
            icon={<IdCard />}
            isOpen={openSections.personal}
            onToggle={() => toggleSection("personal")}
            subtitle="Dados básicos, contato e endereço principal."
            title="Dados pessoais"
          >
            <div className="space-y-7">
              <DetailGroup title="Identificação">
                <dl className="grid gap-x-6 gap-y-4 md:grid-cols-12">
                  <DetailItem
                    className="md:col-span-6"
                    label="Nome completo"
                    value={solicitacao.name}
                  />
                  <DetailItem
                    className="md:col-span-3"
                    label="Data de nascimento"
                    value={formatDateLabel(solicitacao.birth_date)}
                  />
                  <DetailItem
                    className="md:col-span-3"
                    label="Status"
                    value={<StatusBadge status={solicitacao.status} />}
                  />
                  <DetailItem
                    className="md:col-span-6"
                    label="CPF"
                    value={formatCpfLabel(solicitacao.cpf)}
                  />
                  <DetailItem
                    className="md:col-span-6"
                    label="RG"
                    value={solicitacao.rg}
                  />
                </dl>
              </DetailGroup>

              <DetailGroup title="Filiação">
                <dl className="grid gap-x-6 gap-y-4 md:grid-cols-12">
                  <DetailItem
                    className="md:col-span-6"
                    label="Nome da mãe"
                    value={solicitacao.mother_name}
                  />
                  <DetailItem
                    className="md:col-span-6"
                    label="Nome do pai"
                    value={solicitacao.father_name}
                  />
                </dl>
              </DetailGroup>

              <DetailGroup title="Endereço">
                <dl className="grid gap-x-6 gap-y-4 md:grid-cols-12">
                  <DetailItem
                    className="md:col-span-3"
                    label="CEP"
                    value={formatCepLabel(solicitacao.cep)}
                  />
                  <DetailItem
                    className="md:col-span-4"
                    label="Cidade"
                    value={solicitacao.city}
                  />
                  <DetailItem
                    className="md:col-span-5"
                    label="Bairro"
                    value={solicitacao.neighborhood}
                  />
                  <DetailItem
                    className="md:col-span-5"
                    label="Logradouro"
                    value={solicitacao.address}
                  />
                  <DetailItem
                    className="md:col-span-2"
                    label="Número"
                    value={
                      solicitacao.number === null
                        ? null
                        : String(solicitacao.number)
                    }
                  />
                  <DetailItem
                    className="md:col-span-5"
                    label="Complemento"
                    value={solicitacao.complement}
                  />
                  <DetailItem
                    className="md:col-span-12"
                    label="Endereço completo"
                    value={getAddressLabel(solicitacao)}
                  />
                </dl>
              </DetailGroup>

              <DetailGroup title="Contato">
                <dl className="grid gap-x-6 gap-y-4 md:grid-cols-12">
                  <DetailItem
                    className="md:col-span-6"
                    label="E-mail"
                    value={solicitacao.email}
                  />
                  <DetailItem
                    className="md:col-span-6"
                    label="Telefone"
                    value={formatPhoneLabel(solicitacao.phone)}
                  />
                </dl>
              </DetailGroup>
            </div>
          </DetailsSection>

          <DetailsSection
            icon={<GraduationCap />}
            isOpen={openSections.academic}
            onToggle={() => toggleSection("academic")}
            subtitle="Curso, instituição, transporte e bolsa."
            title="Dados acadêmicos"
          >
            <div className="space-y-7">
              <DetailGroup title="Instituição e curso">
                <dl className="grid gap-x-6 gap-y-4 md:grid-cols-12">
                  <DetailItem
                    className="md:col-span-6"
                    label="Instituição"
                    value={getInstitutionLabel(
                      solicitacao,
                      institutionNamesById,
                    )}
                  />
                  <DetailItem
                    className="md:col-span-2"
                    label="Turno"
                    value={solicitacao.instituicaoAcademica?.shift_label}
                  />
                  <DetailItem
                    className="md:col-span-4"
                    label="Cidade de destino"
                    value={solicitacao.instituicaoAcademica?.city_destination}
                  />
                  <DetailItem
                    className="md:col-span-6"
                    label="Curso"
                    value={getCourseLabel(solicitacao)}
                  />
                  <DetailItem
                    className="md:col-span-3"
                    label="Semestre"
                    value={getSemesterLabel(solicitacao)}
                  />
                  <DetailItem
                    className="md:col-span-3"
                    label="Previsão de conclusão"
                    value={formatDateLabel(
                      solicitacao.instituicaoAcademica?.expected_completion,
                    )}
                  />
                </dl>
              </DetailGroup>

              <DetailGroup title="Transporte e bolsa">
                <dl className="grid gap-x-6 gap-y-4 md:grid-cols-12">
                  <DetailItem
                    className="md:col-span-4"
                    label="Já utiliza transporte"
                    value={formatBoolean(
                      solicitacao.instituicaoAcademica?.used_transport ?? null,
                    )}
                  />
                  <DetailItem
                    className="md:col-span-4"
                    label="Possui bolsa"
                    value={formatBoolean(
                      solicitacao.instituicaoAcademica?.has_scholarship ?? null,
                    )}
                  />
                  <DetailItem
                    className="md:col-span-4"
                    label="Tipo de bolsa"
                    value={solicitacao.instituicaoAcademica?.scholarship_type}
                  />
                </dl>
              </DetailGroup>
            </div>
          </DetailsSection>

          <DetailsSection
            icon={<FileText />}
            isOpen={openSections.documents}
            onToggle={() => toggleSection("documents")}
            subtitle="Arquivos enviados para análise da solicitação."
            title="Documentos"
          >
            {solicitacao.documentos.length === 0 ? (
              <p className="text-sm font-medium text-slate-600">
                Nenhum documento enviado.
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-md border border-border-subtle">
                <div className="hidden grid-cols-[1fr_0.65fr_0.65fr_0.8fr] gap-3 border-b border-border-subtle bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-brand-600 md:grid">
                  <span>Documento</span>
                  <span>Tipo</span>
                  <span>Status</span>
                  <span>Ações</span>
                </div>
                {solicitacao.documentos.map((documento) => (
                  <div
                    className="grid gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0 md:grid-cols-[1fr_0.65fr_0.65fr_0.8fr] md:items-center"
                    key={documento.id}
                  >
                    <span className="text-sm font-semibold text-brand-600">
                      {documento.name}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {documento.type}
                    </span>
                    <StatusBadge status={documento.status} />
                    <div className="flex flex-wrap gap-2">
                      {documento.file_path ? (
                        <>
                          <DocumentActionLink
                            href={documento.file_path}
                            icon={<ExternalLink />}
                          >
                            Visualizar
                          </DocumentActionLink>
                          <DocumentActionLink
                            download
                            href={documento.file_path}
                            icon={<Download />}
                          >
                            Baixar
                          </DocumentActionLink>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-slate-500">
                          Arquivo indisponível
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailsSection>
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
