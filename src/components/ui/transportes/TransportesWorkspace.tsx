"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/form/inputs";
import { TextSkeleton } from "@/components/loading";
import { useAuthz } from "@/hooks/use-authz";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { transporteOperacaoQuery } from "@/services/api/modules/transporte-operacao";
import { TransporteLinhaResumo } from "./TransporteLinhaResumo";
import { TransporteSectionNav } from "./TransporteSectionNav";
import { operationToday } from "./transporteOperacaoPresentation";

export function TransportesWorkspace() {
  const { can, permissions } = useAuthz();
  const [search, setSearch] = useState("");
  const [period] = useState(() => ({
    de: operationToday(),
    ate: operationToday(),
  }));
  const result = useCachedQuery(transporteOperacaoQuery, permissions, period);
  const snapshot = result.data;
  const lines =
    snapshot?.linhas.data?.filter((line) =>
      `${line.name} ${line.description ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
    ) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">
            Gestão do transporte
          </h1>
          <p className="mt-2 text-sm text-content-muted">
            Gerencie linhas, recursos e programação.
          </p>
        </div>
        {can("linhas.write") && can("linhas.view") && (
          <Link
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/transportes/linhas/nova"
          >
            Nova linha
          </Link>
        )}
      </header>
      <TransporteSectionNav area="gestao" />
      {can("linhas.view") ? (
        <>
          {snapshot?.linhas.data && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border-subtle bg-white p-4">
                <p className="text-sm text-content-muted">Linhas</p>
                <strong className="text-2xl text-brand-700">
                  {snapshot.linhas.data.length}
                </strong>
              </div>
              <div className="rounded-xl border border-border-subtle bg-white p-4">
                <p className="text-sm text-content-muted">
                  Estudantes vinculados
                </p>
                <strong className="text-2xl text-brand-700">
                  {snapshot.linhas.data.reduce(
                    (total, line) => total + (line.ocupacao ?? 0),
                    0,
                  )}
                </strong>
              </div>
              {snapshot.veiculos.data && (
                <div className="rounded-xl border border-border-subtle bg-white p-4">
                  <p className="text-sm text-content-muted">
                    Veículos cadastrados
                  </p>
                  <strong className="text-2xl text-brand-700">
                    {snapshot.veiculos.data.length}
                  </strong>
                </div>
              )}
            </div>
          )}
          <Input
            label="Pesquisar linha"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou descrição"
          />
          {result.isLoading ? (
            <TextSkeleton />
          ) : snapshot?.linhas.error ? (
            <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm">
              {snapshot.linhas.error}
            </p>
          ) : !snapshot ? (
            <p role="alert">Não foi possível consultar as linhas.</p>
          ) : lines.length ? (
            <div className="grid items-start gap-4 xl:grid-cols-2">
              {lines.map((line) => (
                <article
                  key={line.id}
                  className="space-y-4 rounded-xl border border-border-subtle bg-white p-4 sm:p-5"
                >
                  <div>
                    <h2 className="text-lg font-bold text-brand-700">
                      {line.name}
                    </h2>
                    <p className="text-sm text-content-muted">
                      {line.description || "Sem descrição"}
                    </p>
                  </div>
                  <TransporteLinhaResumo
                    linha={line}
                    snapshot={snapshot}
                    period={period}
                  />
                  <Link
                    className="inline-flex rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={`/transportes/linhas/${line.id}`}
                  >
                    Abrir linha
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white p-5 text-sm">
              {search
                ? "Nenhuma linha corresponde à pesquisa."
                : "Nenhuma linha cadastrada."}
            </p>
          )}
        </>
      ) : (
        <p role="alert" className="rounded-xl bg-white p-5 text-sm">
          Seu perfil não permite consultar linhas. Os recursos permitidos
          continuam disponíveis nas seções acima.
        </p>
      )}
    </div>
  );
}
