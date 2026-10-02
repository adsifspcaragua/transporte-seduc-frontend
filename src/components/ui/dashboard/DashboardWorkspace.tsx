"use client";

import axios from "axios";
import {
  AlertTriangle,
  BusFront,
  CalendarDays,
  ChevronRight,
  ClipboardEdit,
  FileText,
  RefreshCw,
  Settings2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { DashboardSkeleton } from "@/components/ui/dashboard/DashboardSkeleton";
import { useMinimumVisibleLoading } from "@/hooks/use-minimum-visible-loading";
import { dashboardService } from "@/services/api/modules/dashboard";
import type { DashboardLinha, DashboardResumo } from "@/types/dashboard";
import { cn } from "@/utils/cn";

type ApiError = { message?: string };
type Tone = "amber" | "blue" | "purple" | "red";

function errorMessage(error: unknown) {
  if (!axios.isAxiosError<ApiError>(error))
    return "Não foi possível carregar o resumo.";
  return error.response?.data?.message ?? "Não foi possível carregar o resumo.";
}

function estadoDaLinha(linha: DashboardLinha) {
  const capacidade = linha.max_capacity || 0;
  const proportion = capacidade > 0 ? linha.ocupacao / capacidade : 0;
  if (capacidade > 0 && linha.ocupacao >= capacidade)
    return { label: "Lotada", className: "bg-danger-600", proportion: 1 };
  if (proportion >= 0.85)
    return {
      label: `${linha.vagas_restantes} vaga(s)`,
      className: "bg-amber-500",
      proportion,
    };
  return {
    label: `${linha.vagas_restantes} vaga(s)`,
    className: "bg-blue-500",
    proportion,
  };
}

function AttentionTile({
  href,
  icon: Icon,
  label,
  tone,
  value,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: Tone;
  value: number;
}) {
  const styles = {
    amber: [
      "border-amber-200 bg-amber-50/70 hover:bg-amber-50",
      "bg-amber-100 text-amber-600",
      "border-amber-200 text-amber-600",
    ],
    blue: [
      "border-blue-200 bg-blue-50/70 hover:bg-blue-50",
      "bg-blue-100 text-blue-600",
      "border-blue-200 text-blue-600",
    ],
    purple: [
      "border-violet-200 bg-violet-50/70 hover:bg-violet-50",
      "bg-violet-100 text-violet-600",
      "border-violet-200 text-violet-600",
    ],
    red: [
      "border-red-200 bg-red-50/70 hover:bg-red-50",
      "bg-red-100 text-danger-600",
      "border-red-200 text-danger-600",
    ],
  }[tone];

  return (
    <Link
      className={cn(
        "group flex min-h-25 gap-3 rounded-xl border p-4 shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        styles[0],
      )}
      href={href}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          styles[1],
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-2xl font-bold tabular-nums text-content-primary">
          {value}
        </span>
        <span className="mt-1 block text-sm font-medium leading-5 text-content-secondary">
          {label}
        </span>
      </span>
      <span
        className={cn(
          "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border bg-white",
          styles[2],
        )}
      >
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function SummaryItem({
  label,
  tone = "blue",
  value,
}: {
  label: string;
  tone?: "amber" | "blue" | "green" | "red";
  value: number;
}) {
  const color = {
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  }[tone];
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2.5 last:border-b-0 last:pb-0">
      <span className="text-sm font-medium text-content-secondary">
        {label}
      </span>
      <span
        className={cn(
          "min-w-7 rounded-md px-2 py-0.5 text-center text-xs font-bold tabular-nums",
          color,
        )}
      >
        {value}
      </span>
    </div>
  );
}

function PanelHeader({
  action,
  icon,
  title,
}: {
  action: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-brand-700">
        <span className="[&>svg]:size-5">{icon}</span>
        {title}
      </h2>
      {action}
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
  if (showPageSkeleton) return <DashboardSkeleton />;
  if (erro || !resumo)
    return (
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <p className="rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600">
          {erro || "Não foi possível carregar o resumo."}
        </p>
      </main>
    );

  const { estudantes, inscricoes, recadastro, linhas } = resumo;
  const periodo = recadastro.periodo;
  const ocupacaoGeral =
    linhas.capacidade_total > 0
      ? Math.round((linhas.ocupacao_total / linhas.capacidade_total) * 100)
      : 0;
  const actionLink =
    "rounded-lg border border-brand-600/15 bg-brand-050 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100";

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-xl border border-brand-600/10 bg-gradient-to-r from-white via-white to-brand-050 p-5 shadow-sm sm:p-6">
        <div className="relative z-10 flex items-start gap-4">
          <span className="flex size-15 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-sm [&>svg]:size-8">
            <BusFront />
          </span>
          <div>
            <p className="text-sm font-bold text-content-primary">
              Estudantes com transporte ativo
            </p>
            <p className="mt-1 text-5xl font-bold tabular-nums text-brand-700">
              {estudantes.ativos}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-content-muted">
              {estudantes.total} cadastrado(s) no total · {estudantes.aprovados}{" "}
              aprovados · {estudantes.recusados} recusados ·{" "}
              {estudantes.lista_de_espera} em espera · {estudantes.inativos}{" "}
              inativo(s)
            </p>
          </div>
        </div>
        <BusFront
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 bottom-[-2.75rem] size-52 text-blue-500/10 sm:right-14 sm:size-64"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,.9),transparent_25%),linear-gradient(135deg,transparent_40%,rgba(147,197,253,.25))]"
        />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-content-primary">
              Precisa da sua atenção
            </h1>
            <p className="mt-0.5 text-sm text-content-muted">
              Acompanhe os principais itens que necessitam de análise.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-content-secondary shadow-sm">
            <CalendarDays className="size-4 text-brand-600" />
            {periodo ? `Período ${periodo.referencia}` : "Sem período aberto"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AttentionTile
            href="/solicitacoes"
            icon={ClipboardEdit}
            label="Inscrições aguardando análise"
            tone="amber"
            value={inscricoes.em_analise}
          />
          <AttentionTile
            href="/recadastramento"
            icon={RefreshCw}
            label="Recadastros aguardando análise"
            tone="blue"
            value={recadastro.em_analise}
          />
          <AttentionTile
            href="/estudantes"
            icon={UsersRound}
            label="Estudantes ativos sem linha"
            tone="purple"
            value={estudantes.sem_linha}
          />
          <AttentionTile
            href="/recadastramento"
            icon={AlertTriangle}
            label={
              periodo
                ? "Ativos sem recadastro no período"
                : "Sem período de recadastro aberto"
            }
            tone="red"
            value={recadastro.ausentes}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.8fr)]">
        <section className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm sm:p-6">
          <PanelHeader
            action={
              <Link
                className={cn(actionLink, "inline-flex items-center gap-1.5")}
                href="/linhas"
              >
                <Settings2 className="size-3.5" />
                Gerenciar linhas
              </Link>
            }
            icon={<BusFront />}
            title="Ocupação das linhas"
          />
          <p className="mb-5 text-sm text-content-muted">
            {linhas.ocupacao_total} de {linhas.capacidade_total} lugares
            ocupados ({ocupacaoGeral}%). Conta apenas estudantes ativos.
          </p>
          {linhas.lista.length === 0 ? (
            <p className="text-sm font-medium text-content-secondary">
              Nenhuma linha cadastrada.
            </p>
          ) : (
            <ul className="space-y-4">
              {linhas.lista.map((linha) => {
                const { label, className, proportion } = estadoDaLinha(linha);
                return (
                  <li key={linha.id}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                      <span className="font-bold text-content-primary">
                        {linha.name}
                      </span>
                      <span className="text-xs font-medium tabular-nums text-content-muted">
                        {linha.ocupacao} de {linha.max_capacity} vagas · {label}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn("h-full rounded-full", className)}
                        style={{
                          width: `${Math.round(Math.min(1, proportion) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm">
            <PanelHeader
              action={
                <Link className={actionLink} href="/solicitacoes">
                  Ver todas
                </Link>
              }
              icon={<FileText />}
              title="Inscrições"
            />
            <SummaryItem label="Em análise" value={inscricoes.em_analise} />
            <SummaryItem
              label="Incompletas (lista de espera)"
              tone="amber"
              value={inscricoes.incompletas}
            />
            <SummaryItem
              label="Aprovadas"
              tone="green"
              value={inscricoes.aprovadas}
            />
            <SummaryItem
              label="Rejeitadas"
              tone="red"
              value={inscricoes.rejeitadas}
            />
          </section>
          <section className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm">
            <PanelHeader
              action={
                <Link className={actionLink} href="/recadastramento">
                  Detalhes
                </Link>
              }
              icon={<RefreshCw />}
              title="Recadastro"
            />
            {periodo ? (
              <>
                <p className="mb-1 text-xs text-content-muted">
                  Período {periodo.referencia} · {periodo.status}
                  {periodo.data_fim ? ` até ${periodo.data_fim}` : ""}
                </p>
                <SummaryItem
                  label="Aguardando análise"
                  value={recadastro.em_analise}
                />
                <SummaryItem
                  label="Devolvidos para correção"
                  tone="amber"
                  value={recadastro.pendencias}
                />
                <SummaryItem
                  label="Ativos que não recadastraram"
                  tone="red"
                  value={recadastro.ausentes}
                />
              </>
            ) : (
              <p className="text-sm font-medium text-content-secondary">
                Nenhum período de recadastro aberto.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
