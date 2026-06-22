"use client";

import axios from "axios";
import { Eye, Filter, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SearchInput } from "@/components/form/inputs";
import { Skeleton } from "@/components/loading";
import { Modal, ModalSection, ModalSectionContent } from "@/components/modal";
import {
  DataTable,
  type DataTableColumn,
  TableActionButton,
} from "@/components/table";
import { StudentsEditModal } from "@/components/ui/estudantes/StudentsEditModal";
import { StudentsExportDropdown } from "@/components/ui/estudantes/StudentsExportDropdown";
import {
  EMPTY_STUDENT_FILTERS,
  type StudentFilterOption,
  type StudentFilters,
  StudentsFilterDropdown,
} from "@/components/ui/estudantes/StudentsFilterDropdown";
import { useMinimumVisibleLoading } from "@/hooks/use-minimum-visible-loading";
import { estudanteService } from "@/services/api/modules/estudante";
import { inscricaoService } from "@/services/api/modules/inscricao";
import type {
  Estudante,
  PaginatedEstudantes,
  UpdateEstudantePayload,
} from "@/types/estudante";
import type { Curso, Instituicao, Linha } from "@/types/inscricao";
import { cn } from "@/utils/cn";

type ApiErrorPayload = {
  message?: string;
};

type StudentsPaginationMeta = NonNullable<PaginatedEstudantes["meta"]>;

const DEFAULT_STUDENTS_PAGINATION_META: StudentsPaginationMeta = {
  current_page: 1,
  from: null,
  last_page: 1,
  per_page: 10,
  to: null,
  total: 0,
};

const STUDENTS_TABLE_GRID_CLASS =
  "md:grid-cols-[1.35fr_1fr_0.85fr_0.6fr_0.55fr_0.7fr]";

const STUDENTS_TABLE_COLUMNS: DataTableColumn[] = [
  { key: "name", label: "Nome / Email" },
  { key: "course", label: "Curso / Semestre" },
  { key: "institution", label: "Instituição" },
  { key: "status", label: "Status" },
  { key: "line", label: "Linha" },
  { key: "actions", label: "Ações" },
];

const FILTER_LABEL_CLASS =
  "mb-1.5 block text-xs font-bold text-content-secondary";

let studentsPageCache: {
  cursos: Curso[];
  instituicoes: Instituicao[];
  linhas: Linha[];
  meta: StudentsPaginationMeta;
  page: number;
  perPage: number;
  students: Estudante[];
} | null = null;

const SEMESTER_FILTER_OPTIONS: StudentFilterOption[] = Array.from(
  { length: 12 },
  (_, index) => {
    const semester = String(index + 1);

    return {
      label: `${semester}º semestre`,
      value: semester,
    };
  },
);

function getLineLabel(
  estudante: Estudante,
  lineNamesById?: Map<number, string>,
) {
  if (!estudante.linha_id) return "Sem linha";

  return lineNamesById?.get(estudante.linha_id) ?? "Linha não cadastrada";
}

function getInstitutionLabel(
  estudante: Estudante,
  institutionNamesById: Map<number, string>,
) {
  const institutionName =
    estudante.instituicao?.name ??
    estudante.institution?.name ??
    estudante.instituicao_name ??
    estudante.institution_name;

  if (institutionName) return institutionName;

  if (estudante.instituicao_id) {
    return (
      institutionNamesById.get(estudante.instituicao_id) ??
      "Instituição não carregada"
    );
  }

  return "Instituição não informada";
}

function getCourseLabel(estudante: Estudante) {
  return estudante.course?.trim() || "Curso não informado";
}

function getSemesterLabel(estudante: Estudante) {
  if (!estudante.semester?.trim()) return "Semestre não informado";

  return `${estudante.semester}º semestre`;
}

function getAddressLabel(estudante: Estudante) {
  return [
    estudante.address,
    estudante.number,
    estudante.neighborhood,
    estudante.city,
    estudante.cep,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatBoolean(value?: boolean | number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "Não informado";
  }

  if (value === true || value === 1 || value === "1") return "Sim";
  if (value === false || value === 0 || value === "0") return "Não";

  return String(value);
}

function getShiftLabel(value?: number | null) {
  const labels: Record<number, string> = {
    1: "Manhã",
    2: "Tarde",
    3: "Noite",
  };

  if (!value) return "Não informado";

  return labels[value] ?? String(value);
}

function getSemesterFilterValue(semester?: string | null) {
  return semester?.match(/\d+/)?.[0] ?? "";
}

function getStatusLabel(status: string | null) {
  if (!status?.trim()) return "Sem status";

  const normalizedStatus = normalizeFilterText(status);

  if (
    normalizedStatus.includes("lista") ||
    normalizedStatus.includes("espera") ||
    normalizedStatus.includes("pendente") ||
    normalizedStatus.includes("analise") ||
    normalizedStatus.includes("incompleto")
  ) {
    return "Lista de espera";
  }

  if (
    normalizedStatus.includes("reprov") ||
    normalizedStatus.includes("rejeit")
  ) {
    return "Rejeitado";
  }

  if (normalizedStatus.includes("aprov")) {
    return "Aprovado";
  }

  if (
    normalizedStatus.includes("inativo") ||
    normalizedStatus.includes("inactive")
  ) {
    return "Inativo";
  }

  if (
    normalizedStatus.includes("ativo") ||
    normalizedStatus.includes("active")
  ) {
    return "Ativo";
  }

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\p{L}/u, (letter) => letter.toUpperCase());
}

function getStatusBadgeClass(status: string | null) {
  const normalizedStatus = normalizeFilterText(status ?? "");

  if (
    normalizedStatus.includes("aprov") ||
    normalizedStatus.includes("ativo")
  ) {
    return "bg-approve-default/10 text-approve-default";
  }

  if (
    normalizedStatus.includes("reprov") ||
    normalizedStatus.includes("rejeit")
  ) {
    return "bg-danger-600/10 text-danger-600";
  }

  return "bg-amber-100 text-amber-700";
}

function normalizeFilterText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getStudentStatusFilterValue(status: string | null) {
  if (!status) return "";

  const normalizedStatus = normalizeFilterText(status);

  if (
    normalizedStatus.includes("lista") ||
    normalizedStatus.includes("espera") ||
    normalizedStatus.includes("pendente") ||
    normalizedStatus.includes("analise") ||
    normalizedStatus.includes("incompleto")
  ) {
    return "lista_espera";
  }

  if (normalizedStatus.includes("aprov")) {
    return "aprovado";
  }

  if (
    normalizedStatus.includes("reprov") ||
    normalizedStatus.includes("rejeit")
  ) {
    return "rejeitado";
  }

  if (
    normalizedStatus.includes("inativo") ||
    normalizedStatus.includes("inactive")
  ) {
    return "inativo";
  }

  if (
    normalizedStatus.includes("ativo") ||
    normalizedStatus.includes("active")
  ) {
    return "ativo";
  }

  return normalizedStatus.replace(/\s+/g, "_");
}

function getStudentsListErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    if (error.response?.status === 403) {
      return "Você não tem permissão para visualizar os estudantes.";
    }

    if (error.response?.status === 401) {
      return "Sua sessão expirou. Faça login novamente.";
    }

    return (
      error.response?.data?.message ??
      "Não foi possível carregar os estudantes."
    );
  }

  return "Não foi possível carregar os estudantes.";
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

function getStudentDeleteErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    if (error.response?.status === 403) {
      return "Você não tem permissão para deletar este estudante.";
    }

    if (error.response?.status === 404) {
      return "Este estudante não foi encontrado.";
    }

    return (
      error.response?.data?.message ?? "Não foi possível deletar o estudante."
    );
  }

  return "Não foi possível deletar o estudante.";
}

function getStudentUpdateErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    if (error.response?.status === 403) {
      return "Você não tem permissão para editar este estudante.";
    }

    if (error.response?.status === 404) {
      return "Este estudante não foi encontrado.";
    }

    if (error.response?.status === 422) {
      return (
        error.response?.data?.message ??
        "Confira os dados informados antes de salvar."
      );
    }

    return (
      error.response?.data?.message ?? "Não foi possível atualizar o estudante."
    );
  }

  return "Não foi possível atualizar o estudante.";
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

function hasStudentMatchingFilters(
  student: Estudante,
  filters: StudentFilters,
) {
  const studentStatus = getStudentStatusFilterValue(student.status);
  const institutionId = student.instituicao_id
    ? String(student.instituicao_id)
    : "";
  const lineId = student.linha_id ? String(student.linha_id) : "";
  const courseValue = student.course?.trim() ?? "";
  const semesterValue = getSemesterFilterValue(student.semester);

  const matchesStatus =
    filters.statuses.length === 0 || filters.statuses.includes(studentStatus);
  const matchesInstitution =
    filters.institutionIds.length === 0 ||
    filters.institutionIds.includes(institutionId);
  const matchesLine =
    filters.lineIds.length === 0 || filters.lineIds.includes(lineId);
  const matchesCourse =
    filters.courseValues.length === 0 ||
    filters.courseValues.includes(courseValue);
  const matchesSemester =
    filters.semesterValues.length === 0 ||
    filters.semesterValues.includes(semesterValue);

  return (
    matchesStatus &&
    matchesInstitution &&
    matchesLine &&
    matchesCourse &&
    matchesSemester
  );
}

function StudentsPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-40 rounded-full bg-skeleton" />
        <Skeleton className="h-11 w-11 rounded-lg bg-skeleton" />
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
          <div className="min-w-0 xl:col-span-2">
            <Skeleton className="mb-1.5 h-3 w-16 rounded-full bg-skeleton" />
            <Skeleton className="h-11 w-full rounded-lg bg-skeleton" />
          </div>
          <div className="min-w-0 xl:col-span-2">
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
        <div className="grid gap-3 bg-brand-600 px-5 py-4 md:grid-cols-[1.35fr_1fr_0.85fr_0.6fr_0.55fr_0.7fr]">
          {STUDENTS_TABLE_COLUMNS.map((column) => (
            <Skeleton
              className="h-4 w-24 rounded-full bg-white/30"
              key={column.key}
            />
          ))}
        </div>
        <StudentsTableSkeleton />
      </div>
    </div>
  );
}

function StudentsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }, (_, index) => (
        <article
          className="grid gap-3 border-b border-brand-600/15 px-5 py-3 last:border-b-0 md:min-h-16 md:grid-cols-[1.35fr_1fr_0.85fr_0.6fr_0.55fr_0.7fr] md:items-center"
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
          <Skeleton className="h-7 w-20 rounded bg-skeleton" />
          <Skeleton className="h-3 w-16 rounded-full bg-skeleton" />
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

export function StudentsWorkspace() {
  const hasCachedPage = Boolean(studentsPageCache);
  const [studentsLoading, setStudentsLoading] = useState(!hasCachedPage);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [students, setStudents] = useState<Estudante[]>(
    () => studentsPageCache?.students ?? [],
  );
  const [studentsError, setStudentsError] = useState("");
  const [cursos, setCursos] = useState<Curso[]>(
    () => studentsPageCache?.cursos ?? [],
  );
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>(
    () => studentsPageCache?.instituicoes ?? [],
  );
  const [linhas, setLinhas] = useState<Linha[]>(
    () => studentsPageCache?.linhas ?? [],
  );
  const [deleteError, setDeleteError] = useState("");
  const [editError, setEditError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Estudante | null>(
    null,
  );
  const [studentToEdit, setStudentToEdit] = useState<Estudante | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Estudante | null>(
    null,
  );
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_STUDENT_FILTERS);
  const [page, setPage] = useState(() => studentsPageCache?.page ?? 1);
  const [perPage, setPerPage] = useState(
    () => studentsPageCache?.perPage ?? 10,
  );
  const [paginationMeta, setPaginationMeta] = useState<StudentsPaginationMeta>(
    () => studentsPageCache?.meta ?? DEFAULT_STUDENTS_PAGINATION_META,
  );
  const [query, setQuery] = useState("");
  const showPageSkeleton = useMinimumVisibleLoading(
    studentsLoading && !studentsPageCache,
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

  const filteredStudents = useMemo(() => {
    const normalizedQuery = normalizeFilterText(query);

    return students.filter((student) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          student.name,
          student.email,
          student.course,
          student.semester,
          getStatusLabel(student.status),
          getLineLabel(student, lineNamesById),
          getInstitutionLabel(student, institutionNamesById),
        ]
          .filter(Boolean)
          .some((value) =>
            normalizeFilterText(value ?? "").includes(normalizedQuery),
          );

      return matchesQuery && hasStudentMatchingFilters(student, filters);
    });
  }, [students, query, filters, institutionNamesById, lineNamesById]);

  const institutionOptions = useMemo(
    () => buildInstitutionOptions(instituicoes),
    [instituicoes],
  );

  const courseOptions = useMemo(() => buildCourseOptions(cursos), [cursos]);

  const lineOptions = useMemo(() => buildLineOptions(linhas), [linhas]);

  const loadStudents = useCallback(
    async (currentPage = page) => {
      const shouldShowLoading =
        !studentsPageCache ||
        studentsPageCache.page !== currentPage ||
        studentsPageCache.perPage !== perPage;

      try {
        if (shouldShowLoading) {
          setStudentsLoading(true);
        }
        setStudentsError("");

        const studentsResponse = await estudanteService.list(
          currentPage,
          perPage,
        );

        setStudents(studentsResponse.data);
        setPaginationMeta(
          studentsResponse.meta ?? DEFAULT_STUDENTS_PAGINATION_META,
        );
        studentsPageCache = {
          cursos: studentsPageCache?.cursos ?? [],
          instituicoes: studentsPageCache?.instituicoes ?? [],
          linhas: studentsPageCache?.linhas ?? [],
          meta: studentsResponse.meta ?? DEFAULT_STUDENTS_PAGINATION_META,
          page: currentPage,
          perPage,
          students: studentsResponse.data,
        };
      } catch (error) {
        setStudents([]);
        setPaginationMeta(DEFAULT_STUDENTS_PAGINATION_META);
        setStudentsError(getStudentsListErrorMessage(error));
      } finally {
        if (shouldShowLoading) {
          setStudentsLoading(false);
        }
      }
    },
    [page, perPage],
  );

  useEffect(() => {
    void loadStudents(page);
  }, [loadStudents, page]);

  useEffect(() => {
    let ignore = false;

    async function loadFilterOptions() {
      try {
        const [nextCursos, nextInstituicoes, nextLinhas] = await Promise.all([
          inscricaoService.listCursos(),
          inscricaoService.listInstituicoes(),
          inscricaoService.listLinhas().catch(() => []),
        ]);

        if (!ignore) {
          setCursos(nextCursos);
          setInstituicoes(nextInstituicoes);
          setLinhas(nextLinhas);
          studentsPageCache = studentsPageCache
            ? {
                ...studentsPageCache,
                cursos: nextCursos,
                instituicoes: nextInstituicoes,
                linhas: nextLinhas,
              }
            : null;
        }
      } catch {
        if (!ignore) {
          setCursos([]);
          setInstituicoes([]);
          setLinhas([]);
        }
      }
    }

    void loadFilterOptions();

    return () => {
      ignore = true;
    };
  }, []);

  function openDeleteModal(student: Estudante) {
    setDeleteError("");
    setStudentToDelete(student);
  }

  function openEditModal(student: Estudante) {
    setEditError("");
    setStudentToEdit(student);
  }

  function closeEditModal() {
    if (editLoading) return;

    setEditError("");
    setStudentToEdit(null);
  }

  function closeDeleteModal() {
    if (deleteLoadingId) return;

    setDeleteError("");
    setStudentToDelete(null);
  }

  async function handleConfirmDelete() {
    if (!studentToDelete) return;

    try {
      setDeleteError("");
      setDeleteLoadingId(studentToDelete.id);
      await estudanteService.remove(studentToDelete.id);
      await loadStudents(page);
      setStudentToDelete(null);
    } catch (error) {
      setDeleteError(getStudentDeleteErrorMessage(error));
    } finally {
      setDeleteLoadingId(null);
    }
  }

  async function handleSaveStudent(payload: UpdateEstudantePayload) {
    if (!studentToEdit) return;

    try {
      setEditError("");
      setEditLoading(true);

      const updatedStudent = await estudanteService.update(
        studentToEdit.id,
        payload,
      );

      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === updatedStudent.id ? updatedStudent : student,
        ),
      );
      await loadStudents(page);
      setStudentToEdit(null);
    } catch (error) {
      setEditError(getStudentUpdateErrorMessage(error));
    } finally {
      setEditLoading(false);
    }
  }

  function handlePerPageChange(nextPerPage: number) {
    setPerPage(nextPerPage);
    setPage(1);
  }

  if (showPageSkeleton) {
    return <StudentsPageSkeleton />;
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-600">Estudantes</h1>
        <StudentsExportDropdown />
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
              onClear={() => setQuery("")}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquise por estudantes, cursos, instituições ou status..."
              value={query}
            />
          </div>

          <StudentsFilterDropdown
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
        columns={STUDENTS_TABLE_COLUMNS}
        data={filteredStudents}
        emptyMessage="Nenhum estudante encontrado."
        errorMessage={studentsError}
        errorTitle="Não foi possível carregar os estudantes"
        getRowKey={(student) => student.id}
        gridClassName={STUDENTS_TABLE_GRID_CLASS}
        loading={studentsLoading}
        onRetry={() => loadStudents(page)}
        pagination={{
          currentPage: page,
          disabled: studentsLoading || Boolean(studentsError),
          from: paginationMeta.from,
          lastPage: paginationMeta.last_page,
          onPageChange: setPage,
          onPerPageChange: handlePerPageChange,
          perPage,
          to: paginationMeta.to,
          total: paginationMeta.total,
        }}
        renderRow={(student) => (
          <article className="grid gap-3 border-b border-brand-600/15 px-5 py-3 last:border-b-0 md:min-h-16 md:grid-cols-[1.35fr_1fr_0.85fr_0.6fr_0.55fr_0.7fr] md:items-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                {student.name}
              </h3>
              <p className="text-xs text-slate-600">
                {student.email ?? "Email não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {getCourseLabel(student)}
              </p>
              <p className="text-xs text-slate-600">
                {getSemesterLabel(student)}
              </p>
            </div>
            <div>
              <span className="inline-flex rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white">
                {getInstitutionLabel(student, institutionNamesById)}
              </span>
            </div>
            <div>
              <span
                className={cn(
                  "inline-flex rounded px-2 py-1 text-xs font-semibold",
                  getStatusBadgeClass(student.status),
                )}
              >
                {getStatusLabel(student.status)}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600">
              {getLineLabel(student, lineNamesById)}
            </p>
            <div className="flex items-center gap-2">
              <TableActionButton
                ariaLabel={`Visualizar ${student.name}`}
                icon={<Eye />}
                onClick={() => setSelectedStudent(student)}
                tooltip="Visualizar estudante"
                variant="secondary"
              />
              <TableActionButton
                ariaLabel={`Editar ${student.name}`}
                icon={<Pencil />}
                onClick={() => openEditModal(student)}
                tooltip="Editar estudante"
                variant="primary"
              />
              <TableActionButton
                ariaLabel={`Deletar ${student.name}`}
                icon={<Trash2 />}
                loading={deleteLoadingId === student.id}
                onClick={() => openDeleteModal(student)}
                tooltip="Deletar estudante"
                variant="danger"
              />
            </div>
          </article>
        )}
        skeleton={<StudentsTableSkeleton />}
      />

      <StudentDetailsModal
        institutionNamesById={institutionNamesById}
        lineNamesById={lineNamesById}
        onClose={() => setSelectedStudent(null)}
        open={Boolean(selectedStudent)}
        student={selectedStudent}
      />

      <StudentsEditModal
        error={editError}
        loading={editLoading}
        onClose={closeEditModal}
        onSave={handleSaveStudent}
        open={Boolean(studentToEdit)}
        student={studentToEdit}
      />

      <Modal
        cancelLabel="Cancelar"
        contentClassName="space-y-3"
        onClose={closeDeleteModal}
        onSave={handleConfirmDelete}
        open={Boolean(studentToDelete)}
        saveLabel="Deletar estudante"
        saveLoading={Boolean(
          studentToDelete && deleteLoadingId === studentToDelete.id,
        )}
        saveVariant="danger"
        title="Confirmar exclusão"
      >
        <p className="text-sm font-medium text-slate-900">
          Deseja deletar o cadastro de {studentToDelete?.name}?
        </p>
        <p className="text-sm text-slate-600">
          Essa ação não pode ser desfeita.
        </p>
        {deleteError && (
          <p className="rounded-md bg-danger-600/10 px-3 py-2 text-sm font-medium text-danger-600">
            {deleteError}
          </p>
        )}
      </Modal>
    </>
  );
}

function StudentDetailsModal({
  institutionNamesById,
  lineNamesById,
  onClose,
  open,
  student,
}: {
  institutionNamesById: Map<number, string>;
  lineNamesById: Map<number, string>;
  onClose: () => void;
  open: boolean;
  student: Estudante | null;
}) {
  return (
    <Modal
      cancelLabel="Fechar"
      className="max-w-4xl"
      contentClassName="space-y-4 bg-slate-50/80"
      hideSave
      onClose={onClose}
      open={open}
      title="Detalhes do estudante"
    >
      {student && (
        <>
          <ModalSection className="bg-white">
            <ModalSectionContent>
              <h3 className="text-lg font-bold text-brand-600">
                {student.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {getAddressLabel(student) || "Endereço não informado"}
              </p>
              <dl className="mt-5 grid gap-4 md:grid-cols-4">
                <DetailItem label="CPF" value={student.cpf} />
                <DetailItem label="RG" value={student.rg} />
                <DetailItem
                  label="Data de nascimento"
                  value={student.birth_date}
                />
                <DetailItem label="Mãe" value={student.mother_name} />
                <DetailItem label="Pai" value={student.father_name} />
                <DetailItem label="E-mail" value={student.email} />
                <DetailItem label="Telefone" value={student.phone} />
                <DetailItem
                  label="Status"
                  value={getStatusLabel(student.status)}
                />
              </dl>
            </ModalSectionContent>
          </ModalSection>

          <ModalSection className="bg-white">
            <ModalSectionContent>
              <h3 className="text-lg font-bold text-brand-600">
                {getCourseLabel(student)}
              </h3>
              <dl className="mt-5 grid gap-4 md:grid-cols-4">
                <DetailItem
                  label="Instituição"
                  value={getInstitutionLabel(student, institutionNamesById)}
                />
                <DetailItem
                  label="Linha"
                  value={getLineLabel(student, lineNamesById)}
                />
                <DetailItem
                  label="Semestre"
                  value={getSemesterLabel(student)}
                />
                <DetailItem
                  label="Turno"
                  value={getShiftLabel(student.shift)}
                />
                <DetailItem
                  label="Cidade de destino"
                  value={student.city_destination}
                />
                <DetailItem
                  label="Previsão de conclusão"
                  value={student.expected_completion}
                />
                <DetailItem
                  label="Já utiliza transporte"
                  value={formatBoolean(student.used_transport)}
                />
                <DetailItem
                  label="Possui bolsa"
                  value={formatBoolean(student.has_scholarship)}
                />
                <DetailItem
                  label="Tipo de bolsa"
                  value={student.scholarship_type}
                />
              </dl>
            </ModalSectionContent>
          </ModalSection>

          <ModalSection className="bg-white">
            <ModalSectionContent>
              <h3 className="text-lg font-bold text-brand-600">Observações</h3>
              <p className="mt-3 text-sm font-medium text-slate-700">
                {student.observation || "Nenhuma observação cadastrada."}
              </p>
            </ModalSectionContent>
          </ModalSection>
        </>
      )}
    </Modal>
  );
}
