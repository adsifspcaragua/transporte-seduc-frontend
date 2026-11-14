"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/buttons";
import { DateInput } from "@/components/form/inputs";
import { TextSkeleton } from "@/components/loading";
import { useAuthz } from "@/hooks/use-authz";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { transporteOperacaoQuery } from "@/services/api/modules/transporte-operacao";
import type { TransporteResource } from "@/types/transporte";
import { LinhaDadosBasicos } from "./LinhaDadosBasicos";
import { LinhaEstudantesSection } from "./LinhaEstudantesSection";
import { TransporteLinhaResumo } from "./TransporteLinhaResumo";
import { TransporteResourcePanel } from "./TransporteResourcePanel";
import { transporteConfigs } from "./transporteConfig";
import { operationToday, periodDates } from "./transporteOperacaoPresentation";

const tabs = [
  ["resumo", "Resumo"],
  ["veiculo", "Veículo e QR"],
  ["programacao", "Programação"],
  ["pontos", "Pontos de embarque"],
  ["estudantes", "Estudantes"],
] as const;

export function LinhaTransporteWorkspace({
  id,
  tab,
}: {
  id: number;
  tab: string;
}) {
  const router = useRouter();
  const { canAny, permissions } = useAuthz();
  const [period, setPeriod] = useState(() => ({
    de: operationToday(),
    ate: operationToday(),
  }));
  const [dates, setDates] = useState(period);
  const [dateError, setDateError] = useState("");
  const result = useCachedQuery(transporteOperacaoQuery, permissions, period);
  const snapshot = result.data;
  const line = snapshot?.linhas.data?.find((item) => item.id === id);
  const currentTab = tabs.some(([key]) => key === tab) ? tab : "resumo";
  const panel = (key: TransporteResource) => {
    const config = transporteConfigs.find((item) => item.key === key);
    if (!config || !canAny(config.view))
      return (
        <p className="rounded-lg bg-surface-muted p-4 text-sm">
          Seu perfil não permite consultar esta seção.
        </p>
      );
    return (
      <section key={key} className="space-y-3">
        <TransporteResourcePanel
          config={{
            ...config,
            filters: config.filters.filter((field) => field.key !== "linha_id"),
          }}
          guided={
            key === "veiculos" || key === "pontos"
              ? undefined
              : { linhaId: id, period, onSaved: () => void result.refresh() }
          }
        />
      </section>
    );
  };
  return (
    <div className="space-y-6">
      <Link
        href="/transportes"
        className="text-sm font-semibold text-brand-700"
      >
        ← Gestão do transporte
      </Link>
      {!Number.isSafeInteger(id) || id <= 0 ? (
        <p role="alert">Linha inválida.</p>
      ) : result.isLoading ? (
        <TextSkeleton />
      ) : snapshot?.linhas.error ? (
        <p role="alert">{snapshot.linhas.error}</p>
      ) : !line || !snapshot ? (
        <p role="alert">
          Linha não encontrada ou indisponível para seu perfil.
        </p>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-brand-700">{line.name}</h1>
              <p className="mt-1 text-sm text-content-muted">
                {line.description || "Sem descrição"} · {line.ocupacao ?? "?"}{" "}
                de {line.max_capacity ?? "?"} lugares ocupados
              </p>
            </div>
            <LinhaDadosBasicos
              linha={line}
              onSaved={() => void result.refresh()}
            />
          </header>
          <nav
            aria-label="Seções da linha"
            className="flex flex-wrap gap-2 border-b border-border-subtle pb-3"
          >
            {tabs.map(([key, label]) => (
              <Link
                key={key}
                href={`/transportes/linhas/${id}?aba=${key}`}
                aria-current={currentTab === key ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${currentTab === key ? "bg-brand-700 text-white" : "bg-white text-brand-700"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          {(currentTab === "resumo" || currentTab === "programacao") && (
            <form
              className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-white p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!periodDates(dates).length) {
                  setDateError("Informe um período válido de até 62 dias.");
                  return;
                }
                setDateError("");
                setPeriod(dates);
              }}
            >
              <DateInput
                label="De"
                value={dates.de}
                onChange={(event) =>
                  setDates((value) => ({ ...value, de: event.target.value }))
                }
              />
              <DateInput
                label="Até"
                value={dates.ate}
                onChange={(event) =>
                  setDates((value) => ({ ...value, ate: event.target.value }))
                }
              />
              <Button size="sm" fullWidth={false} type="submit">
                Consultar período
              </Button>
              {dateError && (
                <p role="alert" className="text-danger-600">
                  {dateError}
                </p>
              )}
            </form>
          )}
          {currentTab === "resumo" && (
            <div className="space-y-4">
              <TransporteLinhaResumo
                linha={line}
                snapshot={snapshot}
                period={period}
                detailed
                onCorrect={(step) =>
                  router.push(
                    `/transportes/linhas/${id}?aba=${step === 1 ? "veiculo" : step === 3 ? "pontos" : step === 0 ? "resumo" : "programacao"}`,
                  )
                }
              />
              <Link
                href={`/transportes/linhas/${id}?aba=programacao`}
                className="font-semibold text-brand-700 underline"
              >
                Abrir programação
              </Link>
            </div>
          )}
          {currentTab === "veiculo" && (
            <div className="space-y-5">
              {panel("atribuicoes")}
              <details className="rounded-xl border border-border-subtle bg-white p-4">
                <summary className="cursor-pointer font-semibold text-brand-700">
                  Cadastrar ou gerir veículo físico e QR
                </summary>
                <div className="mt-4">{panel("veiculos")}</div>
              </details>
              <Link
                href={`/transportes/linhas/${id}?aba=programacao`}
                className="inline-block font-semibold text-brand-700 underline"
              >
                Próximo: configurar programação →
              </Link>
            </div>
          )}
          {currentTab === "programacao" && (
            <div className="space-y-5">
              {panel("horarios")}
              {panel("viagens")}
              {panel("dias")}
              <Link
                href={`/transportes/linhas/${id}?aba=pontos`}
                className="inline-block font-semibold text-brand-700 underline"
              >
                Próximo: vincular pontos de embarque →
              </Link>
            </div>
          )}
          {currentTab === "pontos" && (
            <div className="space-y-5">
              {panel("vinculos")}
              <details className="rounded-xl border border-border-subtle bg-white p-4">
                <summary className="cursor-pointer font-semibold text-brand-700">
                  Cadastrar ou editar ponto compartilhado
                </summary>
                <div className="mt-4">{panel("pontos")}</div>
              </details>
              <Link
                href={`/transportes/linhas/${id}?aba=resumo`}
                className="inline-block font-semibold text-brand-700 underline"
              >
                Revisar configuração no resumo →
              </Link>
            </div>
          )}
          {currentTab === "estudantes" && (
            <LinhaEstudantesSection linha={line} />
          )}
        </>
      )}
    </div>
  );
}
