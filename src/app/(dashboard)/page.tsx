"use client";

import {
  ChevronLeft,
  ChevronRight,
  ClipboardEdit,
  Filter,
  GraduationCap,
  LogOut,
  MapIcon,
  Menu,
  Moon,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Button from "@/components/ui/Button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { estudanteService } from "@/features/estudantes/services/estudante.service";
import type { Estudante } from "@/features/estudantes/types/estudante.types";
import { cn } from "@/lib/utils/cn";

const sidebarGroups = [
  {
    title: "Principal",
    items: [
      { label: "Estudantes", icon: GraduationCap, active: true },
      { label: "Linhas", icon: MapIcon },
      { label: "Solicitações", icon: ClipboardEdit },
      { label: "Recadastramento", icon: ClipboardEdit },
    ],
  },
];

const SIDEBAR_COLLAPSED_WIDTH = 80;
const SIDEBAR_EXPANDED_WIDTH = 220;

function getLineLabel(estudante: Estudante) {
  return estudante.linha_id ? `Linha ${estudante.linha_id}` : "Sem linha";
}

function getInstitutionLabel(estudante: Estudante) {
  return estudante.instituicao_id ? `Inst. ${estudante.instituicao_id}` : "N/I";
}

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [students, setStudents] = useState<Estudante[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [query, setQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

        const [studentsResponse, countResponse] = await Promise.all([
          estudanteService.list(currentPage),
          estudanteService.count(),
        ]);

        setStudents(studentsResponse.data);
        setTotalStudents(countResponse);
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

  async function handleLogout() {
    try {
      setSignOutLoading(true);
      await signOut();
    } finally {
      setSignOutLoading(false);
    }
  }

  async function handleDelete(student: Estudante) {
    const shouldDelete = window.confirm(
      `Deseja deletar o cadastro de ${student.name}?`,
    );

    if (!shouldDelete) return;

    try {
      setDeleteLoadingId(student.id);
      await estudanteService.remove(student.id);
      await loadStudents(page);
    } finally {
      setDeleteLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-slate-950">
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden flex-col bg-brand-600 text-white shadow-xl transition-[width] duration-300 ease-in-out lg:flex"
        style={{
          width: isSidebarOpen
            ? SIDEBAR_EXPANDED_WIDTH
            : SIDEBAR_COLLAPSED_WIDTH,
        }}
      >
        <div className="flex h-full flex-col px-4 py-10">
          <div className="mb-12 flex h-10 items-center">
            <button
              aria-label={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
              className={cn(
                "flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md text-white transition-colors duration-300 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              )}
              onClick={() => setIsSidebarOpen((current) => !current)}
              type="button"
            >
              <Menu className="size-6" />
            </button>
            <span
              className={cn(
                "ml-3 overflow-hidden whitespace-nowrap text-3xl font-bold tracking-wide transition-all duration-300",
                isSidebarOpen
                  ? "max-w-[130px] translate-x-0 opacity-100"
                  : "max-w-0 -translate-x-2 opacity-0",
              )}
            >
              SIGTU
            </span>
          </div>

          <nav>
            {sidebarGroups.map((group) => (
              <section key={group.title}>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        className={cn(
                          "group relative flex h-11 w-full cursor-pointer items-center overflow-hidden rounded-md px-3 text-left text-[15px] font-medium transition-colors hover:bg-brand-700",
                          item.active && "bg-brand-700",
                        )}
                        key={`${group.title}-${item.label}`}
                        title={isSidebarOpen ? undefined : item.label}
                        type="button"
                      >
                        <Icon className="size-5 shrink-0" />
                        <span
                          className={cn(
                            "ml-2 overflow-hidden whitespace-nowrap transition-all duration-300",
                            isSidebarOpen
                              ? "max-w-[140px] translate-x-0 opacity-100"
                              : "max-w-0 -translate-x-2 opacity-0",
                          )}
                        >
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            "absolute inset-y-0 right-0 w-[6px] bg-white transition-opacity group-hover:opacity-100",
                            item.active ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div
            className={cn(
              "mt-auto w-[180px] shrink-0 transition-all duration-300 ease-in-out will-change-transform",
              isSidebarOpen
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 opacity-0",
            )}
          >
            <Image
              alt="Governo Municipal de Caraguatatuba - Educação"
              className="h-auto w-full"
              height={96}
              src="/logo_educacao_w.svg"
              width={180}
            />
          </div>
        </div>
      </aside>

      <div
        className="transition-[padding-left] duration-300 ease-in-out lg:pl-[var(--sidebar-width)]"
        style={
          {
            "--sidebar-width": `${
              isSidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH
            }px`,
          } as CSSProperties
        }
      >
        <header className="sticky top-0 z-10 flex h-[70px] items-center justify-between bg-brand-100 px-5 shadow-sm lg:justify-end lg:px-8">
          <button
            aria-label="Abrir menu"
            className="flex size-10 items-center justify-center rounded-md bg-brand-600 text-white lg:hidden"
            type="button"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex items-center gap-4">
            <button
              aria-label="Alternar tema"
              className="flex size-10 items-center justify-center rounded-full text-brand-600 transition-colors hover:bg-white/50"
              type="button"
            >
              <Moon className="size-5 fill-brand-600" />
            </button>
            <div className="size-9 rounded-full bg-white" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-brand-600">
                {user?.name ?? "Gestor SIGTU"}
              </p>
              <p className="text-xs font-medium text-brand-600/80">Admin</p>
            </div>
            <Button
              aria-label="Sair"
              className="size-9 rounded-md"
              fullWidth={false}
              loading={signOutLoading}
              onClick={handleLogout}
              size="icon"
              title="Sair"
              variant="ghost"
            >
              <LogOut />
            </Button>
          </div>
        </header>

        <main className="px-5 py-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="mb-2 text-xs font-medium text-brand-600">
                Home / <span className="font-semibold">Estudantes</span>
              </p>
              <h1 className="text-2xl font-bold text-brand-600">Estudantes</h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(180px,240px)_auto]">
              <div className="rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-brand-600/15">
                <p className="text-xs font-semibold text-slate-500">
                  Total de estudantes
                </p>
                <p className="text-2xl font-bold text-brand-600">
                  {studentsLoading ? "..." : totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full max-w-xl items-center rounded-md bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-brand-600/40">
              <span className="flex h-10 w-11 items-center justify-center border-r border-slate-200 text-brand-600">
                <Search className="size-4" />
              </span>
              <input
                className="h-10 min-w-0 flex-1 px-3 text-xs outline-none placeholder:text-slate-400"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Pesquise por alunos, instituições ou linhas..."
                type="search"
                value={query}
              />
              <button
                aria-label="Filtrar estudantes"
                className="mr-1 flex size-8 items-center justify-center rounded-md bg-brand-600 text-white"
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

            <div>
              {studentsLoading ? (
                <div className="px-5 py-14 text-center text-sm font-medium text-slate-500">
                  Carregando estudantes...
                </div>
              ) : filteredStudents.length === 0 ? (
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
                        onClick={() => handleDelete(student)}
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
        </main>
      </div>
    </div>
  );
}
