"use client";

import axios from "axios";
import {
  Bus,
  ClipboardEdit,
  GraduationCap,
  MapPinOff,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { DashboardSkeleton } from "@/components/ui/dashboard/DashboardSkeleton";
import { useMinimumVisibleLoading } from "@/hooks/use-minimum-visible-loading";
import { dashboardService } from "@/services/api/modules/dashboard";
import type { DashboardLinha, DashboardResumo } from "@/types/dashboard";

type ApiError = { message?: string };

function errorMessage(error: unknown) {
  if (!axios.isAxiosError<ApiError>(error)) {
    return "Não foi possível carregar o resumo.";
  }
  return error.response?.data?.message ?? "Não foi possível carregar o resumo.";
}

/**
 * Estado do meter de ocupação.
 *
 * A cor sozinha nunca carrega a informação: cada meter mostra o número de
 * lugares e uma etiqueta em texto. O âmbar tem contraste baixo sobre o branco,
 * e é justamente o rótulo visível que o torna aceitável — escurecê-lo o
 * deixaria indistinguível do vermelho de "lotada".
 */
function estadoDaLinha(linha: DashboardLinha) {
  const capacidade = linha.max_capacity || 0;
  const proporcao = capacidade > 0 ? linha.ocupacao / capacidade : 0;

  if (capacidade > 0 && linha.ocupacao >= capacidade) {
    return { rotulo: "Lotada", cor: "bg-danger-600", proporcao: 1 };
  }

  if (proporcao >= 0.85) {
    return {
      rotulo: `${linha.vagas_restantes} vaga(s)`,
      cor: "bg-amber-500",
      proporcao,
    };
  }

  return {
    rotulo: `${linha.vagas_restantes} vaga(s)`,
    cor: "bg-brand-600",
    proporcao,
  };
}

/** Cartão de pendência: um número que exige ação e leva para onde agir. */
function PendenciaTile({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: number;
}) {
  const vazio = value === 0;

  return (
    <Link
      className="flex items-start gap-3 rounded-lg bg-white p-5 shadow-sm transition-colors hover:bg-brand-600/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      href={href}
    >
      <span
        className={`mt-0.5 [&>svg]:size-5 ${vazio ? "text-content-muted" : "text-brand-600"}`}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span
          className={`text-2xl font-semibold ${vazio ? "text-content-muted" : "text-slate-800"}`}
        >
          {value}
        </span>
        <span className="text-sm font-medium text-content-secondary">
          {label}
        </span>
      </span>
    </Link>
  );
}

/** Linha de panorama: rótulo e valor, sem disputar atenção com as pendências. */
function ResumoItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm font-medium text-content-secondary">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-slate-800">
        {value}
      </span>
    </div>
  );
}

export function DashboardWorkspace() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const showPageSkeleton = useMinimumVisibleLoading(loading);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");
      setResumo(await dashboardService.resumo());
    } catch (error) {
      setErro(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (showPageSkeleton) {
    return <DashboardSkeleton />;
  }

  if (erro || !resumo) {
    return (
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <p className="rounded-md bg-danger-600/10 px-3 py-2 text-sm font-medium text-danger-600">
          {erro || "Não foi possível carregar o resumo."}
        </p>
      </main>
    );
  }

  const { estudantes, inscricoes, recadastro, linhas } = resumo;
  const periodo = recadastro.periodo;
  const ocupacaoGeral =
    linhas.capacidade_total > 0
      ? Math.round((linhas.ocupacao_total / linhas.capacidade_total) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-content-secondary">
          Estudantes com transporte ativo
        </p>
        <p className="mt-1 text-5xl font-semibold text-brand-700">
          {estudantes.ativos}
        </p>
        <p className="mt-2 text-sm text-content-muted">
          {estudantes.total} cadastrado(s) no total · {estudantes.em_espera} em
          espera · {estudantes.inativos} inativo(s)
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-content-secondary">
          Precisa da sua atenção
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PendenciaTile
            href="/solicitacoes"
            icon={<ClipboardEdit />}
            label="Inscrições aguardando análise"
            value={inscricoes.em_analise}
          />
          <PendenciaTile
            href="/recadastramento"
            icon={<RotateCcw />}
            label="Recadastros aguardando análise"
            value={recadastro.em_analise}
          />
          <PendenciaTile
            href="/estudantes"
            icon={<MapPinOff />}
            label="Estudantes ativos sem linha"
            value={estudantes.sem_linha}
          />
          <PendenciaTile
            href="/recadastramento"
            icon={<GraduationCap />}
            label={
              periodo
                ? "Ativos sem recadastro no período"
                : "Sem período de recadastro aberto"
            }
            value={recadastro.ausentes}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-brand-700">
              <Bus className="size-5" />
              <h2 className="text-lg font-bold">Ocupação das linhas</h2>
            </div>
            <Link
              className="text-sm font-semibold text-brand-600 hover:underline"
              href="/linhas"
            >
              Gerenciar linhas
            </Link>
          </div>
          <p className="mb-4 text-sm text-content-muted">
            {linhas.ocupacao_total} de {linhas.capacidade_total} lugares
            ocupados ({ocupacaoGeral}%). Conta apenas estudantes ativos.
          </p>

          {linhas.lista.length === 0 ? (
            <p className="text-sm font-medium text-slate-700">
              Nenhuma linha cadastrada.
            </p>
          ) : (
            <ul className="space-y-4">
              {linhas.lista.map((linha) => {
                const { rotulo, cor, proporcao } = estadoDaLinha(linha);

                return (
                  <li key={linha.id}>
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {linha.name}
                      </span>
                      <span className="text-sm tabular-nums text-content-muted">
                        {linha.ocupacao} de {linha.max_capacity} · {rotulo}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-brand-100">
                      <div
                        className={`h-full rounded-full ${cor}`}
                        style={{ width: `${Math.min(1, proporcao) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-brand-700">
              Inscrições
            </h2>
            <div className="divide-y divide-border-subtle">
              <ResumoItem label="Em análise" value={inscricoes.em_analise} />
              <ResumoItem
                label="Incompletas (lista de espera)"
                value={inscricoes.incompletas}
              />
              <ResumoItem label="Aprovadas" value={inscricoes.aprovadas} />
              <ResumoItem label="Rejeitadas" value={inscricoes.rejeitadas} />
            </div>
          </section>

          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-brand-700">
              Recadastro
            </h2>
            {periodo ? (
              <>
                <p className="mb-2 text-sm text-content-muted">
                  Período {periodo.referencia} · {periodo.status}
                  {periodo.data_fim ? ` · até ${periodo.data_fim}` : ""}
                </p>
                <div className="divide-y divide-border-subtle">
                  <ResumoItem
                    label="Aguardando análise"
                    value={recadastro.em_analise}
                  />
                  <ResumoItem
                    label="Devolvidos para correção"
                    value={recadastro.pendencias}
                  />
                  <ResumoItem
                    label="Ativos que não recadastraram"
                    value={recadastro.ausentes}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm font-medium text-slate-700">
                Nenhum período de recadastro aberto.{" "}
                <Link
                  className="font-semibold text-brand-600 hover:underline"
                  href="/recadastramento"
                >
                  Abrir um período
                </Link>
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
