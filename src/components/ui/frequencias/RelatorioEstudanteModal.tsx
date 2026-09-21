"use client";

import { CalendarDays, CircleAlert, Route, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/buttons";
import { Textarea } from "@/components/form/inputs";
import { Skeleton } from "@/components/loading";
import {
  Modal,
  ModalSection,
  ModalSectionContent,
  ModalSectionHeader,
  ModalTitle,
} from "@/components/modal";
import { formatCallDate } from "@/components/ui/frequencias/frequenciaPresentation";
import { validateLateJustificationReason } from "@/components/ui/frequencias/justificativaPresentation";
import {
  formatAttendancePercentage,
  formatReportPeriod,
} from "@/components/ui/frequencias/relatorioFrequenciaPresentation";
import type {
  FrequenciaSituacao,
  HistoricoFrequenciaItem,
  RelatorioEstudanteResponse,
} from "@/types/frequencia";
import { cn } from "@/utils/cn";

type RelatorioEstudanteModalProps = {
  error?: string;
  loading?: boolean;
  onClose: () => void;
  onJustify: (entry: HistoricoFrequenciaItem, reason: string) => Promise<void>;
  open: boolean;
  report: RelatorioEstudanteResponse | null;
};

function situationClassName(situation: FrequenciaSituacao) {
  return cn(
    "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
    situation === "Presente" && "bg-green-100 text-green-800",
    situation === "Falta" && "bg-danger-600/10 text-danger-700",
    situation === "Justificada" && "bg-blue-100 text-blue-800",
    situation === "Pendente" && "bg-amber-100 text-amber-800",
  );
}

export function RelatorioEstudanteModal({
  error = "",
  loading = false,
  onClose,
  onJustify,
  open,
  report,
}: RelatorioEstudanteModalProps) {
  const student = report?.data.estudante;
  const [selectedEntry, setSelectedEntry] =
    useState<HistoricoFrequenciaItem | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetJustification() {
    setSelectedEntry(null);
    setReason("");
    setReasonError("");
    setActionError("");
  }

  function handleClose() {
    if (submitting) return;
    resetJustification();
    onClose();
  }

  async function submitJustification() {
    if (!selectedEntry || submitting) return;

    const validationError = validateLateJustificationReason(reason);
    setReasonError(validationError);
    if (validationError) return;

    try {
      setSubmitting(true);
      setActionError("");
      await onJustify(selectedEntry, reason.trim());
      resetJustification();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a justificativa.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      cancelLabel="Fechar"
      className="max-w-3xl"
      hideSave
      onClose={handleClose}
      open={open}
      title={student?.name ?? "Histórico de frequência"}
    >
      {loading ? (
        <RelatorioEstudanteModalSkeleton />
      ) : error ? (
        <div
          className="rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-4 text-sm font-medium text-danger-700"
          role="alert"
        >
          {error}
        </div>
      ) : report ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-content-muted">
              {report.data.estudante.cpf ?? "CPF não informado"} · Período:{" "}
              {formatReportPeriod(report.periodo)}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryValue label="Chamadas" value={report.data.chamadas} />
              <SummaryValue label="Presenças" value={report.data.presencas} />
              <SummaryValue label="Faltas" value={report.data.faltas} />
              <SummaryValue
                label="Justificadas"
                value={report.data.justificadas}
              />
              <SummaryValue
                label="Seguidas"
                value={report.data.faltas_consecutivas}
              />
              <SummaryValue
                label="Presença"
                value={formatAttendancePercentage(
                  report.data.percentual_presenca,
                )}
              />
            </div>
          </div>

          {report.data.beneficio && (
            <ModalSection>
              <ModalSectionHeader>
                <ModalTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5" /> Situação do benefício
                </ModalTitle>
              </ModalSectionHeader>
              <ModalSectionContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <BenefitValue
                    label="Faltas no mês"
                    value={`${report.data.beneficio.faltas_no_mes}/${report.data.beneficio.limite_no_mes}`}
                  />
                  <BenefitValue
                    label="Sequência atual"
                    value={`${report.data.beneficio.sequencia_atual}/${report.data.beneficio.limite_seguidas}`}
                  />
                  <BenefitValue
                    label="Maior sequência"
                    value={report.data.beneficio.maior_sequencia}
                  />
                  <BenefitValue
                    label="Referência"
                    value={report.data.beneficio.referencia}
                  />
                </div>
              </ModalSectionContent>
            </ModalSection>
          )}

          <ModalSection>
            <ModalSectionHeader>
              <ModalTitle className="flex items-center gap-2">
                <CalendarDays className="size-5" /> Histórico diário
              </ModalTitle>
            </ModalSectionHeader>
            <ModalSectionContent className="p-0">
              {report.data.historico.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-content-muted">
                  Nenhum registro encontrado no período.
                </p>
              ) : (
                report.data.historico.map((entry) => {
                  const entryKey = `${entry.chamada_id}-${entry.data}`;
                  const isSelected =
                    selectedEntry?.chamada_id === entry.chamada_id;

                  return (
                    <div
                      className="border-b border-border-subtle last:border-b-0"
                      key={entryKey}
                    >
                      <article className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-050 text-brand-600">
                            <Route className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-content-primary">
                              {formatCallDate(entry.data)} · {entry.linha.name}
                            </p>
                            <p className="mt-1 text-xs text-content-muted">
                              {entry.observacao || "Sem observação."}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={situationClassName(entry.situacao)}>
                            {entry.situacao}
                          </span>
                          {entry.situacao === "Falta" && !isSelected && (
                            <Button
                              fullWidth={false}
                              onClick={() => {
                                setSelectedEntry(entry);
                                setReason("");
                                setReasonError("");
                                setActionError("");
                              }}
                              size="sm"
                              variant="secondary"
                            >
                              Justificar falta
                            </Button>
                          )}
                        </div>
                      </article>

                      {isSelected && (
                        <div className="border-t border-border-subtle bg-surface-muted px-5 py-4">
                          {actionError && (
                            <p
                              className="mb-3 text-sm font-medium text-danger-700"
                              role="alert"
                            >
                              {actionError}
                            </p>
                          )}
                          <Textarea
                            disabled={submitting}
                            error={reasonError}
                            hint={`${reason.length}/1.000 caracteres`}
                            label="Motivo da justificativa"
                            maxLength={1000}
                            onChange={(event) => {
                              setReason(event.target.value);
                              setReasonError("");
                              setActionError("");
                            }}
                            required
                            value={reason}
                          />
                          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                              disabled={submitting}
                              fullWidth={false}
                              onClick={resetJustification}
                              size="sm"
                              variant="ghost"
                            >
                              Cancelar
                            </Button>
                            <Button
                              fullWidth={false}
                              loading={submitting}
                              onClick={() => void submitJustification()}
                              size="sm"
                            >
                              Enviar para análise
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </ModalSectionContent>
          </ModalSection>
        </div>
      ) : (
        <div className="flex flex-col items-center py-10 text-center">
          <CircleAlert className="size-8 text-content-muted" />
          <p className="mt-3 text-sm text-content-muted">
            Selecione um estudante para consultar o histórico.
          </p>
        </div>
      )}
    </Modal>
  );
}

function SummaryValue({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg bg-surface-muted px-3 py-3 text-center">
      <p className="text-xs font-semibold text-content-muted">{label}</p>
      <p className="mt-1 font-bold text-content-primary">{value}</p>
    </div>
  );
}

function BenefitValue({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-content-muted">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-content-primary">{value}</p>
    </div>
  );
}

function RelatorioEstudanteModalSkeleton() {
  return (
    <output aria-label="Carregando histórico" className="block space-y-4">
      <Skeleton className="h-5 w-64 rounded-full" />
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {["one", "two", "three", "four", "five", "six"].map((key) => (
          <Skeleton className="h-16 rounded-lg" key={key} />
        ))}
      </div>
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </output>
  );
}
