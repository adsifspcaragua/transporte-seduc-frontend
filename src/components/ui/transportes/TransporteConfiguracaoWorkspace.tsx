"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { TextSkeleton } from "@/components/loading";
import { Modal } from "@/components/modal";
import { useAuthz } from "@/hooks/use-authz";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { transporteOperacaoQuery } from "@/services/api/modules/transporte-operacao";
import type { Linha } from "@/types/inscricao";
import type { TransporteResource } from "@/types/transporte";
import type {
  TransportePeriod,
  TransporteSaveNotice,
} from "@/types/transporte-operacao";
import { TransporteLinhaResumo } from "./TransporteLinhaResumo";
import { TransporteLinhaStep } from "./TransporteLinhaStep";
import { TransporteResourcePanel } from "./TransporteResourcePanel";
import { transporteConfigs } from "./transporteConfig";
import { formatTransporteValue } from "./transportePresentation";

const steps = [
  "Linha",
  "Veículo",
  "Horários",
  "Pontos de embarque",
  "Calendário e viagens",
  "Revisão",
];
const instructions = [
  "Selecione uma linha existente ou cadastre um atendimento novo.",
  "Confira qual veículo atende a linha em cada período.",
  "Organize os dias, os sentidos e as saídas recorrentes. Os horários existentes podem ser usados como estão.",
  "Selecione os locais de embarque para cada sentido. Reutilize os pontos existentes antes de cadastrar outro.",
  "Confira o calendário. Gerar viagens é uma ação explícita e grava dados no servidor.",
  "Confira os registros consultados e as ações feitas nesta aba. Não há publicação ou aplicação de todas as etapas em conjunto.",
];

export function TransporteConfiguracaoWorkspace({
  initialLinhaId,
  period,
  onExit,
  onMaintenance,
}: {
  initialLinhaId: number | null;
  period: TransportePeriod;
  onExit: () => void;
  onMaintenance: () => void;
}) {
  const { canAny, permissions } = useAuthz();
  const result = useCachedQuery(transporteOperacaoQuery, permissions, period);
  const [linhaId, setLinhaId] = useState<number | null>(initialLinhaId);
  const [step, setStep] = useState(0);
  const [notices, setNotices] = useState<
    (TransporteSaveNotice & { id: number })[]
  >([]);
  const [pendingLine, setPendingLine] = useState<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const noticeSequence = useRef(0);
  const currentLines = result.data?.linhas.data;
  const [lastLinha, setLastLinha] = useState<Linha | undefined>();
  const linha = currentLines
    ? currentLines.find((l) => l.id === linhaId)
    : lastLinha?.id === linhaId
      ? lastLinha
      : undefined;
  useEffect(() => {
    if (currentLines) setLastLinha(currentLines.find((l) => l.id === linhaId));
  }, [currentLines, linhaId]);
  useEffect(() => {
    void step;
    titleRef.current?.focus();
  }, [step]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  function onSaved(notice: TransporteSaveNotice) {
    setNotices((current) => [
      ...current,
      { ...notice, id: ++noticeSequence.current },
    ]);
    void result.refresh();
  }
  function selectLine(id: number) {
    if (!id || id === linhaId) return;
    if (linhaId) setPendingLine(id);
    else setLinhaId(id);
  }
  function panel(key: TransporteResource, label: string, hideList = false) {
    const base = transporteConfigs.find((c) => c.key === key);
    if (!base || !linha || !canAny(base.view))
      return (
        <p className="rounded-lg bg-surface-muted p-4 text-sm">
          Seu perfil não permite consultar {label.toLocaleLowerCase("pt-BR")}. A
          etapa ficará com conferência incompleta.
        </p>
      );
    return (
      <TransporteResourcePanel
        key={`${linha.id}-${key}`}
        config={{
          ...base,
          ...(!currentLines ? { write: undefined, remove: undefined } : {}),
          label,
          filters: [],
          columns: base.columns.filter((c) => c.key !== "linha.name"),
        }}
        guided={{
          linhaId: linha.id,
          period,
          hideList,
          defaults: { inicio: period.de },
          onSaved,
        }}
      />
    );
  }
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-700">
            Configurar transporte{linha ? ` · ${linha.name}` : ""}
          </h2>
          <p className="mt-1 text-sm text-content-muted">
            Conferir de {formatTransporteValue(period.de)} a{" "}
            {formatTransporteValue(period.ate)}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={onExit}
        >
          Voltar à visão geral
        </Button>
      </div>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Valores preenchidos ficam somente nesta aba. Cada confirmação grava
        imediatamente no cadastro compartilhado. Sair ou voltar não desfaz
        gravações; recarregar a página perde os valores ainda não enviados.
      </p>
      <nav
        aria-label="Etapas da configuração"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
      >
        {steps.map((label, index) => (
          <Button
            key={label}
            size="sm"
            fullWidth
            variant={step === index ? "primary" : "secondary"}
            aria-current={step === index ? "step" : undefined}
            disabled={index > 0 && !linha}
            onClick={() => setStep(index)}
          >
            {index + 1}. {label}
          </Button>
        ))}
      </nav>
      <div className="rounded-xl border border-border-subtle bg-white p-4 sm:p-5">
        <h3
          className="text-lg font-bold text-brand-700 outline-none"
          tabIndex={-1}
          ref={titleRef}
        >
          Etapa {step + 1} de 6 · {steps[step]}
        </h3>
        <p className="mb-5 mt-2 text-sm text-content-secondary">
          {instructions[step]}
        </p>
        {result.data?.linhas.error && linha && (
          <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm">
            Não foi possível conferir os dados atuais da linha. Seus valores
            nesta aba foram mantidos, mas novas gravações estão bloqueadas até
            atualizar a consulta.{" "}
            <Button
              size="sm"
              variant="secondary"
              fullWidth={false}
              onClick={() => void result.refresh()}
            >
              Atualizar consulta
            </Button>
          </p>
        )}
        {result.isLoading ? (
          <div className="space-y-4">
            <TextSkeleton />
            <TextSkeleton />
          </div>
        ) : !result.data ? (
          <p role="alert">
            Não foi possível consultar a operação.{" "}
            <Button size="sm" onClick={() => void result.refresh()}>
              Tentar novamente
            </Button>
          </p>
        ) : (
          <>
            <div hidden={step !== 0}>
              <TransporteLinhaStep
                linhas={result.data.linhas}
                selected={linhaId}
                onSelect={selectLine}
                onSaved={onSaved}
                refresh={() => void result.refresh()}
              />
              {linhaId && !linha && (
                <p role="alert" className="mt-3 text-sm text-danger-600">
                  A linha selecionada não está disponível nesta consulta.
                  Selecione um cadastro válido ou confira a permissão.
                </p>
              )}
            </div>
            {linha && (
              <div key={linha.id} className="space-y-4">
                <div hidden={step !== 1} className="space-y-5">
                  {panel("atribuicoes", "Veículos que atendem esta linha")}
                  <details className="rounded-lg border border-border-subtle p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-brand-700">
                      Não encontrou o veículo? Cadastrar um novo
                    </summary>
                    <div className="mt-4">
                      {panel("veiculos", "Cadastro de veículo", true)}
                    </div>
                  </details>
                </div>
                <div hidden={step !== 2} className="space-y-4">
                  <p className="text-sm">
                    Não é necessário cadastrar novamente horários já listados.
                    Mudanças podem gerar hoje e descartar viagens futuras
                    regeneráveis. Horários de ida e volta são regras separadas.
                  </p>
                  {panel("horarios", "Dias e horários de saída")}
                </div>
                <div hidden={step !== 3} className="space-y-4">
                  <p className="text-sm">
                    Cadastre o uso do ponto por sentido. Sem ponto ativo
                    aplicável, o QR não aprova automaticamente o embarque.
                    Passagens previstas são compartilhadas por todas as saídas
                    do mesmo sentido.
                  </p>
                  {panel("vinculos", "Locais de embarque desta linha")}
                  <details className="rounded-lg border border-border-subtle p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-brand-700">
                      Não encontrou o local? Cadastrar um novo ponto
                    </summary>
                    <div className="mt-4">
                      {panel("pontos", "Cadastro de ponto de embarque", true)}
                    </div>
                  </details>
                  <p className="text-xs text-content-muted">
                    Posição e raio precisam de validação em campo. Ajustar ponto
                    compartilhado ou remover vínculo fica em Cadastros e
                    manutenção, para conferir o impacto em outras linhas.
                  </p>
                </div>
                <div hidden={step !== 4} className="space-y-5">
                  {panel("dias", "Datas sem operação")}
                  {panel("viagens", "Viagens do período")}
                  {step === 4 && (
                    <TransporteLinhaResumo
                      linha={linha}
                      snapshot={result.data}
                      period={period}
                      detailed
                      onCorrect={setStep}
                    />
                  )}
                </div>
                <div hidden={step !== 5} className="space-y-4">
                  {step === 5 && (
                    <TransporteLinhaResumo
                      linha={linha}
                      snapshot={result.data}
                      period={period}
                      detailed
                      onCorrect={setStep}
                    />
                  )}
                  <section className="space-y-3 border-t border-border-subtle pt-4">
                    <h4 className="font-bold text-brand-700">
                      O que foi enviado nesta configuração
                    </h4>
                    {notices.length ? (
                      <ul className="space-y-2 text-sm">
                        {notices.map((n) => (
                          <li
                            key={n.id}
                            className={
                              n.confirmed
                                ? "text-content-secondary"
                                : "text-amber-800"
                            }
                          >
                            {n.confirmed
                              ? "Conferido no servidor: "
                              : "A conferir: "}
                            {n.text}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm">
                        Nenhuma gravação feita por este assistente nesta aba. Os
                        dados acima vêm dos cadastros existentes.
                      </p>
                    )}
                    <p className="text-sm text-content-muted">
                      Campos ainda abertos e seleções não confirmadas não foram
                      gravados. Atualize a consulta antes de encerrar a
                      conferência.
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      fullWidth={false}
                      loading={result.isFetching}
                      onClick={() => void result.refresh()}
                    >
                      Conferir novamente no servidor
                    </Button>
                  </section>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {notices.length > 0 && (
        <output className="block rounded-lg bg-surface-muted p-3 text-sm">
          {notices[notices.length - 1].text}
        </output>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          fullWidth={false}
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          Voltar etapa
        </Button>
        <Button
          variant="ghost"
          size="sm"
          fullWidth={false}
          onClick={onMaintenance}
        >
          Cadastros e manutenção
        </Button>
        {step < 5 ? (
          <Button
            fullWidth={false}
            disabled={!linha || result.isLoading}
            onClick={() => setStep((s) => s + 1)}
          >
            Continuar
          </Button>
        ) : (
          <Button fullWidth={false} onClick={onExit}>
            Encerrar conferência e voltar
          </Button>
        )}
      </footer>
      <Modal
        open={pendingLine != null}
        title="Trocar a linha desta configuração?"
        onClose={() => setPendingLine(null)}
        onSave={() => {
          setLinhaId(pendingLine);
          setPendingLine(null);
          setStep(0);
        }}
        saveLabel="Trocar linha"
      >
        <p className="text-sm">
          Os formulários ainda não enviados da linha anterior serão descartados.
          Gravações já feitas continuarão no servidor e no histórico desta aba.
          Para evitar associações incorretas, os próximos formulários usarão
          somente a nova linha.
        </p>
      </Modal>
    </section>
  );
}
