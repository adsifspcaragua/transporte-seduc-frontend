"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/buttons";
import { Input } from "@/components/form/inputs";
import { TextSkeleton } from "@/components/loading";
import { formatLastPresence } from "@/components/ui/linhas/linhaPresentation";
import { useAuthz } from "@/hooks/use-authz";
import { linhaService } from "@/services/api/modules/linha";
import type { Linha } from "@/types/inscricao";
import type { PaginatedLinhaEstudantes } from "@/types/linha";
import { TransporteResourcePanel } from "./TransporteResourcePanel";
import { transporteConfigs } from "./transporteConfig";

export function LinhaEstudantesSection({ linha }: { linha: Linha }) {
  const { can } = useAuthz();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PaginatedLinhaEstudantes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!can("estudantes.view")) return;
    let active = true;
    linhaService
      .listEstudantes(linha.id, page, 15)
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("Não foi possível consultar estudantes da linha.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [can, linha.id, page]);
  if (!can("estudantes.view"))
    return <p role="alert">Seu perfil não permite consultar estudantes.</p>;
  const students =
    data?.data.filter((student) =>
      `${student.name} ${student.course ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
    ) ?? [];
  const authorization = transporteConfigs.find(
    (item) => item.key === "autorizacoes",
  );
  return (
    <div className="space-y-5">
      <p className="text-sm text-content-muted">
        Ocupação ativa: {linha.ocupacao ?? "Não consultada"} de{" "}
        {linha.max_capacity ?? "Não informada"} lugares.
      </p>
      <Input
        label="Pesquisar nesta página"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Nome ou curso"
      />
      {loading ? (
        <TextSkeleton />
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <article
              key={student.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-white p-4 text-sm"
            >
              <div>
                <strong className="text-brand-700">{student.name}</strong>
                <p>
                  {student.course || "Curso não informado"} ·{" "}
                  {student.instituicao_name || "Instituição não informada"}
                </p>
                <p className="text-content-muted">
                  {student.situacao ||
                    student.status ||
                    "Situação não informada"}
                </p>
                <p className="text-content-muted">
                  {student.email || "E-mail não informado"} ·{" "}
                  {student.phone || "Telefone não informado"}
                </p>
                <p className="text-content-muted">
                  Última presença: {formatLastPresence(student.ultima_presenca)}
                </p>
              </div>
              <Link
                className="font-semibold text-brand-700 underline"
                href={`/estudantes?id=${student.id}`}
              >
                Abrir cadastro
              </Link>
            </article>
          ))}
          {!students.length && (
            <p className="rounded-lg bg-white p-4 text-sm">
              Nenhum estudante nesta página corresponde à pesquisa.
            </p>
          )}
          {data && (
            <div className="flex items-center gap-3 text-sm">
              <Button
                size="sm"
                variant="secondary"
                fullWidth={false}
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage(page - 1);
                }}
              >
                Anterior
              </Button>
              <span>
                Página {page} de {data.meta.last_page} · {data.meta.total}{" "}
                estudantes
              </span>
              <Button
                size="sm"
                variant="secondary"
                fullWidth={false}
                disabled={page >= data.meta.last_page}
                onClick={() => {
                  setLoading(true);
                  setPage(page + 1);
                }}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      )}
      {authorization && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-brand-700">
            Autorizações temporárias de outras linhas
          </h2>
          <TransporteResourcePanel config={authorization} />
        </section>
      )}
    </div>
  );
}
