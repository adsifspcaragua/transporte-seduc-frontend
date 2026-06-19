"use client";

import axios from "axios";
import { AlertCircle, Pencil, RefreshCw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/buttons";
import { SearchInput } from "@/components/form/inputs";
import { Skeleton } from "@/components/loading";
import { Modal } from "@/components/modal";
import { Pagination } from "@/components/pagination";
import { StudentsExportDropdown } from "@/components/ui/estudantes/StudentsExportDropdown";
import {
  EMPTY_STUDENT_FILTERS,
  type StudentFilterOption,
  type StudentFilters,
  StudentsFilterDropdown,
} from "@/components/ui/estudantes/StudentsFilterDropdown";
import { estudanteService } from "@/services/api/modules/estudante";
import type { Estudante, PaginatedEstudantes } from "@/types/estudante";

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

function getLineLabel(estudante: Estudante) {
  return estudante.linha_id ? `Linha ${estudante.linha_id}` : "Sem linha";
}

function getInstitutionLabel(estudante: Estudante) {
  return estudante.instituicao_id ? `Inst. ${estudante.instituicao_id}` : "N/I";
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
    normalizedStatus.includes("lista") &&
    normalizedStatus.includes("espera")
  ) {
    return "lista_espera";
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

function buildStudentFilterOptions(
  students: Estudante[],
  getValue: (student: Estudante) => number | null,
  getLabel: (student: Estudante) => string,
): StudentFilterOption[] {
  const options = new Map<string, string>();

  for (const student of students) {
    const value = getValue(student);

    if (!value) continue;

    options.set(String(value), getLabel(student));
  }

  return Array.from(options, ([value, label]) => ({ label, value })).sort(
    (firstOption, secondOption) =>
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

  const matchesStatus =
    filters.statuses.length === 0 || filters.statuses.includes(studentStatus);
  const matchesInstitution =
    filters.institutionIds.length === 0 ||
    filters.institutionIds.includes(institutionId);
  const matchesLine =
    filters.lineIds.length === 0 || filters.lineIds.includes(lineId);

  return matchesStatus && matchesInstitution && matchesLine;
}

function StudentsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }, (_, index) => (
        <article
          className="grid gap-3 border-b border-brand-600/15 px-5 py-3 last:border-b-0 md:min-h-16 md:grid-cols-[1.45fr_1fr_0.65fr_0.55fr_0.55fr] md:items-center"
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
          <Skeleton className="h-7 w-20 rounded bg-skeleton" />
          <Skeleton className="h-3 w-16 rounded-full bg-skeleton" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-md bg-skeleton" />
            <Skeleton className="size-8 rounded-md bg-skeleton" />
          </div>
        </article>
      ))}
    </div>
  );
}

type StudentActionButtonProps = {
  ariaLabel: string;
  icon: ReactNode;
  loading?: boolean;
  onClick?: () => void;
  tooltip: string;
  variant: "primary" | "danger";
};

function StudentActionButton({
  ariaLabel,
  icon,
  loading = false,
  onClick,
  tooltip,
  variant,
}: StudentActionButtonProps) {
  return (
    <span className="group relative inline-flex">
      <Button
        aria-label={ariaLabel}
        className="size-8 rounded-md p-0 [&>span>svg]:size-4"
        fullWidth={false}
        leftIcon={icon}
        loading={loading}
        onClick={onClick}
        size="icon"
        title={tooltip}
        variant={variant}
      />
      <span className="pointer-events-none absolute right-[calc(100%+0.5rem)] top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {tooltip}
      </span>
    </span>
  );
}

export function StudentsWorkspace() {
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [students, setStudents] = useState<Estudante[]>([]);
  const [studentsError, setStudentsError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<Estudante | null>(
    null,
  );
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_STUDENT_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState<StudentsPaginationMeta>(
    DEFAULT_STUDENTS_PAGINATION_META,
  );
  const [query, setQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const normalizedQuery = normalizeFilterText(query);

    return students.filter((student) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          student.name,
          student.email,
          getLineLabel(student),
          getInstitutionLabel(student),
        ]
          .filter(Boolean)
          .some((value) =>
            normalizeFilterText(value ?? "").includes(normalizedQuery),
          );

      return matchesQuery && hasStudentMatchingFilters(student, filters);
    });
  }, [students, query, filters]);

  const institutionOptions = useMemo(
    () =>
      buildStudentFilterOptions(
        students,
        (student) => student.instituicao_id,
        getInstitutionLabel,
      ),
    [students],
  );

  const lineOptions = useMemo(
    () =>
      buildStudentFilterOptions(
        students,
        (student) => student.linha_id,
        getLineLabel,
      ),
    [students],
  );

  const loadStudents = useCallback(
    async (currentPage = page) => {
      try {
        setStudentsLoading(true);
        setStudentsError("");

        const studentsResponse = await estudanteService.list(
          currentPage,
          perPage,
        );

        setStudents(studentsResponse.data);
        setPaginationMeta(
          studentsResponse.meta ?? DEFAULT_STUDENTS_PAGINATION_META,
        );
      } catch (error) {
        setStudents([]);
        setPaginationMeta(DEFAULT_STUDENTS_PAGINATION_META);
        setStudentsError(getStudentsListErrorMessage(error));
      } finally {
        setStudentsLoading(false);
      }
    },
    [page, perPage],
  );

  useEffect(() => {
    void loadStudents(page);
  }, [loadStudents, page]);

  function openDeleteModal(student: Estudante) {
    setDeleteError("");
    setStudentToDelete(student);
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

  function handlePerPageChange(nextPerPage: number) {
    setPerPage(nextPerPage);
    setPage(1);
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-brand-600">Estudantes</h1>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-[calc(36rem+3.25rem)] items-center gap-3">
          <SearchInput
            containerClassName="max-w-xl"
            onClear={() => setQuery("")}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquise por estudantes, instituições ou linhas..."
            value={query}
          />
          <StudentsFilterDropdown
            filters={filters}
            institutionOptions={institutionOptions}
            lineOptions={lineOptions}
            onFiltersChange={setFilters}
          />
        </div>

        <StudentsExportDropdown />
      </div>

      <section className="overflow-hidden rounded-md bg-white shadow-[0_3px_12px_rgba(0,0,0,0.2)]">
        <div className="hidden bg-brand-600 px-5 py-3 text-xs font-semibold text-white md:grid md:grid-cols-[1.45fr_1fr_0.65fr_0.55fr_0.55fr]">
          <span>Nome / Email</span>
          <span>Curso / Semestre</span>
          <span>Instituição</span>
          <span>Linha</span>
          <span>Ações</span>
        </div>

        <Skeleton
          fallback={<StudentsTableSkeleton />}
          loading={studentsLoading}
        >
          <div>
            {studentsError ? (
              <div
                className="flex flex-col items-center gap-4 px-5 py-14 text-center"
                role="alert"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-danger-600/10 text-danger-600">
                  <AlertCircle className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Não foi possível carregar os estudantes
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {studentsError}
                  </p>
                </div>
                <Button
                  className="min-h-9 rounded px-4 py-1 text-sm"
                  fullWidth={false}
                  leftIcon={<RefreshCw />}
                  onClick={() => loadStudents(page)}
                  size="sm"
                  variant="secondary"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                Nenhum estudante encontrado.
              </div>
            ) : (
              filteredStudents.map((student) => (
                <article
                  className="grid gap-3 border-b border-brand-600/15 px-5 py-3 last:border-b-0 md:min-h-16 md:grid-cols-[1.45fr_1fr_0.65fr_0.55fr_0.55fr] md:items-center"
                  key={student.id}
                >
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
                      Não informado
                    </p>
                    <p className="text-xs text-slate-600">
                      Status: {student.status ?? "Sem status"}
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex rounded bg-brand-600 px-2 py-1 text-[10px] font-bold text-white">
                      {getInstitutionLabel(student)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600">
                    {getLineLabel(student)}
                  </p>
                  <div className="flex items-center gap-2">
                    <StudentActionButton
                      ariaLabel={`Editar ${student.name}`}
                      icon={<Pencil />}
                      tooltip="Editar estudante"
                      variant="primary"
                    />
                    <StudentActionButton
                      ariaLabel={`Deletar ${student.name}`}
                      icon={<Trash2 />}
                      loading={deleteLoadingId === student.id}
                      onClick={() => openDeleteModal(student)}
                      tooltip="Deletar estudante"
                      variant="danger"
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </Skeleton>
        <Pagination
          currentPage={page}
          disabled={studentsLoading || Boolean(studentsError)}
          from={paginationMeta.from}
          lastPage={paginationMeta.last_page}
          onPageChange={setPage}
          onPerPageChange={handlePerPageChange}
          perPage={perPage}
          to={paginationMeta.to}
          total={paginationMeta.total}
        />
      </section>

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
