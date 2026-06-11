"use client";

import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/buttons";
import { Skeleton } from "@/components/loading";
import { Modal } from "@/components/modal";
import { StudentsSearchInput } from "@/components/ui/estudantes/StudentsSearchInput";
import { estudanteService } from "@/services/api/modules/estudante";
import type { Estudante } from "@/types/estudante";
import { cn } from "@/utils/cn";

function getLineLabel(estudante: Estudante) {
  return estudante.linha_id ? `Linha ${estudante.linha_id}` : "Sem linha";
}

function getInstitutionLabel(estudante: Estudante) {
  return estudante.instituicao_id ? `Inst. ${estudante.instituicao_id}` : "N/I";
}

function StudentsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }, (_, index) => (
        <article
          className="grid gap-4 border-b border-brand-600/30 px-5 py-6 last:border-b-0 md:min-h-20 md:grid-cols-[1.4fr_1fr_0.7fr_0.6fr_0.7fr] md:items-center"
          key={index.toString()}
        >
          <div>
            <Skeleton className="h-4 w-52 max-w-full rounded-full bg-skeleton" />
            <Skeleton className="mt-3 h-3 w-40 max-w-full rounded-full bg-skeleton" />
          </div>
          <div>
            <Skeleton className="h-4 w-36 max-w-full rounded-full bg-skeleton" />
            <Skeleton className="mt-3 h-3 w-28 max-w-full rounded-full bg-skeleton" />
          </div>
          <Skeleton className="h-7 w-20 rounded bg-skeleton" />
          <Skeleton className="h-3 w-16 rounded-full bg-skeleton" />
          <div className="flex flex-wrap gap-2 md:flex-col md:items-start">
            <Skeleton className="h-7 w-20 rounded bg-skeleton" />
            <Skeleton className="h-7 w-20 rounded bg-skeleton" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function StudentsWorkspace() {
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [students, setStudents] = useState<Estudante[]>([]);
  const [studentToDelete, setStudentToDelete] = useState<Estudante | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [query, setQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return students;

    return students.filter((student) =>
      [
        student.name,
        student.email,
        getLineLabel(student),
        getInstitutionLabel(student),
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [students, query]);

  const loadStudents = useCallback(
    async (currentPage = page) => {
      try {
        setStudentsLoading(true);

        const studentsResponse = await estudanteService.list(currentPage);

        setStudents(studentsResponse.data);
        setLastPage(studentsResponse.meta?.last_page ?? 1);
      } finally {
        setStudentsLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    void loadStudents(page);
  }, [loadStudents, page]);

  function openDeleteModal(student: Estudante) {
    setStudentToDelete(student);
  }

  function closeDeleteModal() {
    if (deleteLoadingId) return;

    setStudentToDelete(null);
  }

  async function handleConfirmDelete() {
    if (!studentToDelete) return;

    try {
      setDeleteLoadingId(studentToDelete.id);
      await estudanteService.remove(studentToDelete.id);
      await loadStudents(page);
      setStudentToDelete(null);
    } finally {
      setDeleteLoadingId(null);
    }
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-brand-600">Estudantes</h1>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full max-w-[calc(36rem+3.25rem)] items-center gap-3">
          <StudentsSearchInput
            onChange={(event) => setQuery(event.target.value)}
            value={query}
          />
          <button
            aria-label="Filtrar estudantes"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-brand-600 text-white shadow-[0_2px_8px_rgba(0,0,0,0.22)] transition-colors hover:bg-brand-700"
            type="button"
          >
            <Filter className="size-4" />
          </button>
        </div>

        <button
          aria-label="Mais opções"
          className="hidden size-10 items-center justify-center rounded-md bg-brand-600 text-white shadow-[0_2px_8px_rgba(0,0,0,0.22)] md:flex"
          type="button"
        >
          <MoreVertical className="size-5" />
        </button>
      </div>

      <section className="overflow-hidden rounded-md bg-white shadow-[0_3px_12px_rgba(0,0,0,0.2)]">
        <div className="hidden bg-brand-600 px-5 py-4 text-xs font-semibold text-white md:grid md:grid-cols-[1.4fr_1fr_0.7fr_0.6fr_0.7fr]">
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
            {filteredStudents.length === 0 ? (
              <div className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                Nenhum estudante encontrado.
              </div>
            ) : (
              filteredStudents.map((student) => (
                <article
                  className="grid gap-4 border-b border-brand-600/30 px-5 py-6 last:border-b-0 md:min-h-20 md:grid-cols-[1.4fr_1fr_0.7fr_0.6fr_0.7fr] md:items-center"
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
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-start">
                    <Button
                      className="min-h-7 rounded px-3 py-1 text-xs"
                      fullWidth={false}
                      leftIcon={<Pencil />}
                      size="sm"
                      uppercase={false}
                      variant="primary"
                    >
                      Editar
                    </Button>
                    <Button
                      className="min-h-7 rounded px-3 py-1 text-xs"
                      fullWidth={false}
                      leftIcon={<Trash2 />}
                      loading={deleteLoadingId === student.id}
                      onClick={() => openDeleteModal(student)}
                      size="sm"
                      uppercase={false}
                      variant="danger"
                    >
                      Deletar
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </Skeleton>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-brand-600">
        <button
          aria-label="Página anterior"
          className="flex size-8 items-center justify-center rounded-md hover:bg-brand-100 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage((currentPage) => currentPage - 1)}
          type="button"
        >
          <ChevronLeft className="size-5" />
        </button>
        {Array.from({ length: lastPage }, (_, index) => index + 1)
          .slice(0, 5)
          .map((pageNumber) => (
            <button
              className={cn(
                "size-8 rounded-md text-xs hover:bg-brand-100",
                pageNumber === page && "bg-brand-600 font-bold text-white",
              )}
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
        <button
          aria-label="Próxima página"
          className="flex size-8 items-center justify-center rounded-md hover:bg-brand-100 disabled:opacity-40"
          disabled={page >= lastPage}
          onClick={() => setPage((currentPage) => currentPage + 1)}
          type="button"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

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
      </Modal>
    </>
  );
}
