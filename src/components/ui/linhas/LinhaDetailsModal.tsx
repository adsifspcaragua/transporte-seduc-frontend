"use client";

import axios from "axios";
import { BusFront, GraduationCap, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/loading";
import { Modal } from "@/components/modal";
import { DataTable, type DataTableColumn } from "@/components/table";
import {
  formatLastPresence,
  horaParaInput,
  ocupacaoDe,
} from "@/components/ui/linhas/linhaPresentation";
import { linhaService } from "@/services/api/modules/linha";
import type { Linha } from "@/types/inscricao";
import type { LinhaEstudante, PaginatedLinhaEstudantes } from "@/types/linha";
import { cn } from "@/utils/cn";
import { formatPhone } from "@/utils/phone";

const TABLE_GRID =
  "md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,1.2fr)_minmax(0,0.65fr)_minmax(0,0.8fr)]";
const COLUMNS: DataTableColumn[] = [
  { key: "estudante", label: "Estudante" },
  { key: "formacao", label: "Curso / Instituição" },
  { key: "contato", label: "Contato" },
  { key: "faltas", label: "Faltas" },
  { key: "presenca", label: "Última presença" },
];

function LinhaEstudanteRow({ estudante }: { estudante: LinhaEstudante }) {
  const name = estudante.name || "Nome não informado";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <article
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-5 border-b border-border-subtle px-5 py-5 last:border-b-0 md:items-start",
        TABLE_GRID,
      )}
    >
      <div className="col-span-2 flex min-w-0 items-start gap-3 md:col-span-1">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-sm font-bold text-brand-700"
        >
          {initials}
        </span>
        <div className="min-w-0 space-y-2">
          <h4 className="break-words text-sm font-bold text-brand-700">
            {name}
          </h4>
          <span className="inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
            Ativo
          </span>
        </div>
      </div>
      <div className="min-w-0 space-y-2">
        <span className="block text-xs font-semibold text-content-muted md:sr-only">
          Curso / Instituição
        </span>
        <p className="flex items-start gap-1.5 text-xs font-semibold leading-5 text-content-secondary">
          <GraduationCap
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {estudante.course || "Curso não informado"}
        </p>
        <p className="break-words text-xs leading-5 text-content-muted">
          {estudante.instituicao_name || "Não informada"}
        </p>
        <p className="text-xs text-content-muted">
          {estudante.semester
            ? `${estudante.semester}º semestre`
            : "Semestre não informado"}
        </p>
      </div>
      <div className="min-w-0 space-y-2">
        <span className="mb-1 block text-xs font-semibold text-content-muted md:sr-only">
          Contato
        </span>
        <p className="break-words text-xs leading-5 text-content-secondary [overflow-wrap:anywhere]">
          {estudante.email || "E-mail não informado"}
        </p>
        <p className="text-xs leading-5 text-content-muted">
          {estudante.phone
            ? formatPhone(estudante.phone, { eager: false })
            : "Telefone não informado"}
        </p>
      </div>
      <div>
        <span className="mb-1 block text-xs font-semibold text-content-muted md:sr-only">
          Faltas
        </span>
        <span className="text-xs tabular-nums text-content-muted">
          {estudante.faltas ?? 0}
        </span>
      </div>
      <div>
        <span className="mb-1 block text-xs font-semibold text-content-muted md:sr-only">
          Última presença
        </span>
        <span className="text-xs text-content-muted">
          {formatLastPresence(estudante.ultima_presenca)}
        </span>
      </div>
    </article>
  );
}

export function LinhaDetailsModal({
  linha,
  onClose,
}: {
  linha: Linha;
  onClose: () => void;
}) {
  const [result, setResult] = useState<PaginatedLinhaEstudantes | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);
  const { ocupacao, capacidade, vagas } = ocupacaoDe(linha);

  const carregar = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const next = await linhaService.listEstudantes(linha.id, page, perPage);
      if (version === requestVersion.current) setResult(next);
    } catch (currentError) {
      if (version !== requestVersion.current) return;
      setResult(null);
      setError(
        axios.isAxiosError<{ message?: string }>(currentError)
          ? currentError.response?.data?.message ||
              "Não foi possível carregar os estudantes desta linha."
          : "Não foi possível carregar os estudantes desta linha.",
      );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [linha.id, page, perPage]);

  useEffect(() => {
    void carregar();
    return () => {
      requestVersion.current += 1;
    };
  }, [carregar]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Detalhes da linha"
      hideSave
      cancelLabel="Fechar"
      className="max-w-6xl"
      contentClassName="space-y-6 bg-slate-50/80"
    >
      <section className="rounded-xl border border-brand-600/10 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600">
            <BusFront aria-hidden="true" className="size-7" />
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-lg font-bold text-brand-700">
              {linha.name}
            </h3>
            <p className="mt-1 text-sm text-content-muted">
              {linha.description || "Descrição da rota não informada."}
            </p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            {
              label: "Saída",
              value: horaParaInput(linha.departure_time) || "Não informado",
            },
            {
              label: "Retorno",
              value: horaParaInput(linha.return_time) || "Não informado",
            },
            {
              label: "Motorista",
              value: linha.motorista?.name || "Não vinculado",
            },
            {
              label: "Ocupação ativa",
              value: `${ocupacao} de ${capacidade} lugares`,
            },
            { label: "Vagas disponíveis", value: vagas },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg bg-surface-muted px-4 py-3"
            >
              <dt className="text-xs font-medium text-content-muted">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm font-bold tabular-nums text-brand-700">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="linha-estudantes-title" aria-busy={loading}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3
              id="linha-estudantes-title"
              className="flex items-center gap-2 text-base font-bold text-brand-700"
            >
              <Users aria-hidden="true" className="size-5" />
              Estudantes ativos
            </h3>
            <p className="mt-1 text-xs text-content-muted">
              Estudantes ativos vinculados a esta linha de transporte.
            </p>
          </div>
          {!loading && result && (
            <span className="rounded-full bg-brand-600/10 px-3 py-1 text-xs font-bold text-brand-700">
              {result.meta.total} estudante(s)
            </span>
          )}
        </div>
        <DataTable
          columns={COLUMNS}
          data={result?.data ?? []}
          gridClassName={TABLE_GRID}
          headerClassName="gap-4"
          getRowKey={(estudante) => estudante.id}
          loading={loading}
          errorMessage={error}
          emptyMessage="Nenhum estudante ativo vinculado a esta linha."
          onRetry={() => void carregar()}
          tableClassName="border border-border-subtle shadow-none"
          skeleton={
            <div className="space-y-4 p-5">
              {[1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          }
          renderRow={(estudante) => <LinhaEstudanteRow estudante={estudante} />}
          pagination={
            result && !error
              ? {
                  currentPage: result.meta.current_page,
                  from: result.meta.from,
                  to: result.meta.to,
                  total: result.meta.total,
                  lastPage: result.meta.last_page,
                  perPage,
                  disabled: loading,
                  onPageChange: (nextPage) => {
                    if (nextPage === page) return;
                    setLoading(true);
                    setPage(nextPage);
                  },
                  onPerPageChange: (nextPerPage) => {
                    if (nextPerPage === perPage) return;
                    setLoading(true);
                    setPage(1);
                    setPerPage(nextPerPage);
                  },
                }
              : undefined
          }
        />
      </section>
    </Modal>
  );
}
