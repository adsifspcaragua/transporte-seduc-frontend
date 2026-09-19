"use client";

import { CheckCircle2, Clock3, FileSearch } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/buttons";
import { SearchInput, Select } from "@/components/form/inputs";
import type { SolicitacaoRecadastro } from "@/types/recadastro";
import {
  filterSolicitacoes,
  formatRecadastroDateTime,
  getRecadastroBadgeClass,
  getRecadastroStatusLabel,
} from "./recadastroPresentation";

type RecadastroSolicitacoesSectionProps = {
  loading: boolean;
  solicitacoes: SolicitacaoRecadastro[];
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
  loading,
  solicitacoes,
  onAnalyze,
}: RecadastroSolicitacoesSectionProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const filteredSolicitacoes = useMemo(
    () => filterSolicitacoes(solicitacoes, search, status),
    [search, solicitacoes, status],
  );

  return (
    <section className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-050 text-brand-600">
            <Clock3 className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-brand-700">
              Solicitações de recadastro
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              Acompanhe e analise as solicitações enviadas pelos estudantes.
            </p>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-[minmax(16rem,1fr)_13rem] lg:max-w-2xl">
          <SearchInput
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="Buscar por estudante, CPF ou período..."
            value={search}
          />
          <Select
            aria-label="Filtrar solicitações por status"
            onChange={(event) => setStatus(event.target.value)}
            options={STATUS_OPTIONS}
            value={status}
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border-subtle">
        {filteredSolicitacoes.length === 0 && !loading ? (
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
          filteredSolicitacoes.map((solicitacao) => (
            <article
              className="flex flex-col gap-4 border-b border-border-subtle px-4 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between"
              key={solicitacao.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {getInitials(solicitacao.estudante.name)}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-content-primary">
                    {solicitacao.estudante.name}
                  </h3>
                  <p className="mt-1 text-xs text-content-muted">
                    {solicitacao.estudante.cpf || "CPF não informado"} ·{" "}
                    {solicitacao.periodo.referencia} ·{" "}
                    {solicitacao.documentos.length} documento(s)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${getRecadastroBadgeClass(solicitacao.status)}`}
                >
                  {solicitacao.status === "Aprovado" && (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  {getRecadastroStatusLabel(solicitacao.status)}
                </span>
                <div className="min-w-36 text-xs text-content-muted">
                  <span className="block">Enviado em</span>
                  <span className="font-semibold text-content-secondary">
                    {formatRecadastroDateTime(solicitacao.enviada_em)}
                  </span>
                </div>
                {solicitacao.status === "Em analise" && (
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

      {!loading && solicitacoes.length > 0 && (
        <p className="mt-3 text-right text-xs text-content-muted">
          Exibindo {filteredSolicitacoes.length} de {solicitacoes.length}{" "}
          solicitação(ões)
        </p>
      )}
    </section>
  );
}
