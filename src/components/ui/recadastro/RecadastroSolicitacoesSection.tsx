"use client";

import { CheckCircle2, Clock3, FileSearch } from "lucide-react";
import { Button } from "@/components/buttons";
import { SearchInput, Select } from "@/components/form/inputs";
import { Pagination } from "@/components/pagination";
import type {
  PaginatedSolicitacoesRecadastro,
  PeriodoRecadastro,
  SolicitacaoRecadastro,
} from "@/types/recadastro";
import {
  formatRecadastroDateTime,
  getRecadastroBadgeClass,
  getRecadastroStatusLabel,
} from "./recadastroPresentation";

type RecadastroSolicitacoesSectionProps = {
  canAnalyze: boolean;
  loading: boolean;
  solicitacoes: SolicitacaoRecadastro[];
  meta: PaginatedSolicitacoesRecadastro["meta"] | null;
  periodos: PeriodoRecadastro[];
  page: number;
  search: string;
  status: string;
  periodoId: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onPeriodoChange: (id: string) => void;
  onAnalyze: (solicitacao: SolicitacaoRecadastro) => void;
};

const STATUS_OPTIONS = [
  { label: "Todos os status", value: "todos" },
  { label: "Pendente", value: "Pendente" },
  { label: "Em análise", value: "Em analise" },
  { label: "Com pendência", value: "Pendencia" },
  { label: "Aprovado", value: "Aprovado" },
  { label: "Rejeitado", value: "Rejeitado" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-BR"))
    .join("");
}

export function RecadastroSolicitacoesSection({
  canAnalyze,
  loading,
  solicitacoes,
  meta,
  periodos,
  page,
  search,
  status,
  periodoId,
  onPageChange,
  onSearchChange,
  onStatusChange,
  onPeriodoChange,
  onAnalyze,
}: RecadastroSolicitacoesSectionProps) {
  return (
    <section className="@container/solicitacoes min-w-0 rounded-xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
      <div className="flex min-w-0 flex-col gap-5 @min-[68rem]/solicitacoes:flex-row @min-[68rem]/solicitacoes:items-start @min-[68rem]/solicitacoes:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-050 text-brand-600">
            <Clock3 className="size-5" />
          </span>
          <div className="min-w-0 break-words">
            <h2 className="text-lg font-bold text-brand-700">
              Solicitações de recadastro
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              Acompanhe e analise as solicitações enviadas pelos estudantes.
            </p>
          </div>
        </div>

        <div className="grid w-full min-w-0 gap-3 @min-[40rem]/solicitacoes:grid-cols-2 @min-[68rem]/solicitacoes:max-w-xl">
          <SearchInput
            aria-label="Buscar por estudante ou CPF"
            onChange={(event) => onSearchChange(event.target.value)}
            onClear={() => onSearchChange("")}
            placeholder="Estudante ou CPF"
            value={search}
          />
          <Select
            aria-label="Filtrar solicitações por status"
            onChange={(event) => onStatusChange(event.target.value)}
            options={STATUS_OPTIONS}
            value={status}
          />
          {periodos.length > 0 && (
            <Select
              aria-label="Filtrar solicitações por período"
              onChange={(event) => onPeriodoChange(event.target.value)}
              options={[
                { label: "Todos os períodos", value: "" },
                ...periodos.map((periodo) => ({
                  label: periodo.referencia,
                  value: String(periodo.id),
                })),
              ]}
              value={periodoId}
            />
          )}
        </div>
      </div>

      <div className="mt-5 min-w-0 rounded-xl border border-border-subtle">
        {solicitacoes.length === 0 && !loading ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <FileSearch className="size-8 text-content-disabled" />
            <p className="mt-3 font-semibold text-content-secondary">
              Nenhuma solicitação encontrada
            </p>
            <p className="mt-1 text-sm text-content-muted">
              Ajuste a busca ou o filtro de status para ver outros resultados.
            </p>
          </div>
        ) : (
          solicitacoes.map((solicitacao) => (
            <article
              className="flex min-w-0 flex-col gap-4 border-b border-border-subtle px-4 py-4 last:border-b-0 @min-[56rem]/solicitacoes:flex-row @min-[56rem]/solicitacoes:items-center @min-[56rem]/solicitacoes:justify-between"
              key={solicitacao.id}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {getInitials(solicitacao.estudante.name)}
                </span>
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-bold text-content-primary">
                    {solicitacao.estudante.name}
                  </h3>
                  <p className="mt-1 break-words text-xs leading-5 text-content-muted">
                    {solicitacao.estudante.cpf || "CPF não informado"} ·{" "}
                    {solicitacao.periodo.referencia} ·{" "}
                    {solicitacao.documentos.length} documento(s)
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-3 @min-[56rem]/solicitacoes:justify-end">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${getRecadastroBadgeClass(solicitacao.status)}`}
                >
                  {solicitacao.status === "Aprovado" && (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  {getRecadastroStatusLabel(solicitacao.status)}
                </span>
                <div className="text-xs text-content-muted">
                  <span className="block">Enviado em</span>
                  <span className="font-semibold text-content-secondary">
                    {formatRecadastroDateTime(solicitacao.enviada_em)}
                  </span>
                </div>
                {canAnalyze && solicitacao.status === "Em analise" && (
                  <Button
                    fullWidth={false}
                    onClick={() => onAnalyze(solicitacao)}
                    size="sm"
                    variant="primary"
                  >
                    Analisar
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {meta && (
        <Pagination
          currentPage={meta.current_page || page}
          disabled={loading}
          from={meta.from}
          lastPage={meta.last_page}
          onPageChange={onPageChange}
          onPerPageChange={() => {}}
          perPage={10}
          perPageOptions={[10]}
          to={meta.to}
          total={meta.total}
        />
      )}
    </section>
  );
}
