"use client";

import { BusFront, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/buttons";
import { DateInput, Input } from "@/components/form/inputs";
import { TextSkeleton } from "@/components/loading";
import { Modal } from "@/components/modal";
import { useAuthz } from "@/hooks/use-authz";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { transporteOperacaoQuery } from "@/services/api/modules/transporte-operacao";
import { getQuerySessionVersion } from "@/services/api/query-cache";
import type { TransportePeriod } from "@/types/transporte-operacao";
import { TransporteConfiguracaoWorkspace } from "./TransporteConfiguracaoWorkspace";
import { TransporteLinhaResumo } from "./TransporteLinhaResumo";
import { TransporteManutencao } from "./TransporteManutencao";
import { operationToday, periodDates } from "./transporteOperacaoPresentation";

export function TransportesWorkspace() {
  const { can, permissions } = useAuthz();
  const [view, setView] = useState<"overview" | "wizard" | "maintenance">(
    "overview",
  );
  const [period, setPeriod] = useState<TransportePeriod>(() => ({
    de: operationToday(),
    ate: operationToday(),
  }));
  const [dates, setDates] = useState(period);
  const [dateError, setDateError] = useState("");
  const [search, setSearch] = useState("");
  const [wizard, setWizard] = useState<{
    initialLinhaId: number | null;
    period: TransportePeriod;
    version: number;
  } | null>(null);
  const [pendingWizard, setPendingWizard] = useState<number | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const result = useCachedQuery(transporteOperacaoQuery, permissions, period);
  const snapshot = result.data;
  const session = getQuerySessionVersion();
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const line = Number(query.get("linha"));
    if (
      query.get("configurar") === "1" &&
      Number.isSafeInteger(line) &&
      line > 0
    ) {
      const today = operationToday();
      setWizard({
        initialLinhaId: line,
        period: { de: today, ate: today },
        version: 1,
      });
      setView("wizard");
    }
  }, []);
  function start(lineId: number | null) {
    if (wizard) {
      if (lineId != null && lineId === wizard.initialLinhaId) {
        setView("wizard");
        return;
      }
      setPendingWizard(lineId);
      setReplaceOpen(true);
      return;
    }
    setWizard({ initialLinhaId: lineId, period, version: 1 });
    setView("wizard");
  }
  const lines =
    snapshot?.linhas.data?.filter((l) =>
      `${l.name} ${l.description ?? ""}`
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
            Prepare o atendimento e confira as pendências de cada linha.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("linhas.view") && (
            <Button
              fullWidth={false}
              leftIcon={<BusFront />}
              onClick={() => start(null)}
            >
              Configurar transporte
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            fullWidth={false}
            leftIcon={<Settings2 />}
            onClick={() =>
              setView(view === "maintenance" ? "overview" : "maintenance")
            }
          >
            {view === "maintenance" ? "Visão geral" : "Cadastros e manutenção"}
          </Button>
        </div>
      </header>
      <div hidden={view !== "overview"} className="space-y-5">
        {wizard && (
          <Button
            size="sm"
            variant="secondary"
            fullWidth={false}
            onClick={() => setView("wizard")}
          >
            Retomar configuração nesta aba
          </Button>
        )}
        <form
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!periodDates(dates).length) {
              setDateError(
                "Informe um período válido, com até 62 dias de diferença entre início e fim.",
              );
              return;
            }
            setDateError("");
            setPeriod(dates);
          }}
        >
          <DateInput
            label="Conferir de"
            required
            value={dates.de}
            onChange={(e) => setDates((d) => ({ ...d, de: e.target.value }))}
          />
          <DateInput
            label="Até"
            required
            value={dates.ate}
            onChange={(e) => setDates((d) => ({ ...d, ate: e.target.value }))}
          />
          <Button size="sm" type="submit" fullWidth={false}>
            Conferir período
          </Button>
          <Button
            size="sm"
            variant="secondary"
            fullWidth={false}
            loading={result.isFetching}
            onClick={() => void result.refresh()}
          >
            Atualizar consulta
          </Button>
        </form>
        {dateError && (
          <p role="alert" className="text-sm text-danger-600">
            {dateError}
          </p>
        )}
        <Input
          label="Pesquisar linha"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome ou descrição"
        />
        <p className="text-xs text-content-muted">
          Abrir e atualizar esta visão apenas consulta os cadastros. Nenhuma
          viagem é gerada automaticamente. Cada resumo se refere ao período
          confirmado acima.
        </p>
        {result.isLoading ? (
          <div className="space-y-4">
            <TextSkeleton />
            <TextSkeleton />
          </div>
        ) : snapshot?.linhas.error ? (
          <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm">
            Linhas: {snapshot.linhas.error} Os recursos permitidos continuam em
            Cadastros e manutenção.
          </p>
        ) : !snapshot ? (
          <p role="alert">Não foi possível consultar a operação.</p>
        ) : lines.length ? (
          <div className="grid items-start gap-4 xl:grid-cols-2">
            {lines.map((linha) => (
              <article
                key={linha.id}
                className="space-y-4 rounded-xl border border-border-subtle bg-white p-4 sm:p-5"
              >
                <header>
                  <h2 className="text-lg font-bold text-brand-700">
                    {linha.name}
                  </h2>
                  {linha.description && (
                    <p className="text-sm text-content-muted">
                      {linha.description}
                    </p>
                  )}
                </header>
                <TransporteLinhaResumo
                  linha={linha}
                  snapshot={snapshot}
                  period={period}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    fullWidth={false}
                    onClick={() => start(linha.id)}
                  >
                    Configurar ou corrigir
                  </Button>
                  <details className="w-full text-sm">
                    <summary className="cursor-pointer py-2 font-semibold text-brand-700">
                      Visualizar programação e calendário
                    </summary>
                    <div className="mt-3">
                      <TransporteLinhaResumo
                        linha={linha}
                        snapshot={snapshot}
                        period={period}
                        detailed
                      />
                    </div>
                  </details>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-5 text-sm">
            {search
              ? "Nenhuma linha corresponde à pesquisa."
              : "Nenhuma linha cadastrada. Inicie a configuração para cadastrar um atendimento."}
          </p>
        )}
      </div>
      {wizard && (
        <div hidden={view !== "wizard"}>
          <TransporteConfiguracaoWorkspace
            key={`${session}-${wizard.version}`}
            initialLinhaId={wizard.initialLinhaId}
            period={wizard.period}
            onExit={() => setView("overview")}
            onMaintenance={() => setView("maintenance")}
          />
        </div>
      )}
      {view === "maintenance" && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              fullWidth={false}
              onClick={() => setView("overview")}
            >
              Voltar à visão geral
            </Button>
            {wizard && (
              <Button
                size="sm"
                fullWidth={false}
                onClick={() => setView("wizard")}
              >
                Retornar à configuração nesta aba
              </Button>
            )}
          </div>
          <TransporteManutencao />
        </section>
      )}
      <Modal
        open={replaceOpen}
        title="Iniciar outra configuração?"
        saveLabel="Iniciar outra linha"
        onClose={() => setReplaceOpen(false)}
        onSave={() => {
          setWizard((current) => ({
            initialLinhaId: pendingWizard,
            period,
            version: (current?.version ?? 0) + 1,
          }));
          setReplaceOpen(false);
          setView("wizard");
        }}
      >
        <p className="text-sm">
          Os valores ainda não enviados da configuração anterior serão perdidos.
          Os cadastros já gravados continuarão no servidor. Volte para retomar a
          configuração atual, se necessário.
        </p>
      </Modal>
    </div>
  );
}
