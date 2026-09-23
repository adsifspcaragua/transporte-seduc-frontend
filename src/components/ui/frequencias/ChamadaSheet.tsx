"use client";

import axios from "axios";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Save,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/buttons";
import { Textarea } from "@/components/form/inputs";
import {
  type ChamadaDraft,
  type ChamadaDraftErrors,
  createChamadaDraft,
  formatCallDate,
  getChangedEntries,
  hasPendingEntries,
  isRegistroLocked,
  validateDraft,
} from "@/components/ui/frequencias/frequenciaPresentation";
import { useAuthz } from "@/hooks/use-authz";
import { frequenciaService } from "@/services/api/modules/frequencia";
import type {
  Chamada,
  FrequenciaRegistro,
  FrequenciaSituacao,
} from "@/types/frequencia";
import { cn } from "@/utils/cn";

type ChamadaSheetProps = {
  chamada: Chamada;
  backLabel?: string;
  onBack: () => void;
  onChamadaChange: (chamada: Chamada) => void;
};

type ApiError = { message?: string; errors?: Record<string, string[]> };

const situationOptions: {
  value: Exclude<FrequenciaSituacao, "Pendente">;
  label: string;
  icon: typeof Check;
}[] = [
  { value: "Presente", label: "Presente", icon: Check },
  { value: "Falta", label: "Falta", icon: X },
  { value: "Justificada", label: "Justificada", icon: FileCheck2 },
];

function errorMessage(error: unknown) {
  if (!axios.isAxiosError<ApiError>(error)) {
    return "Não foi possível concluir a operação.";
  }

  return (
    Object.values(error.response?.data?.errors ?? {})[0]?.[0] ??
    error.response?.data?.message ??
    "Não foi possível concluir a operação."
  );
}

function decisionLabel(registro: FrequenciaRegistro) {
  if (!registro.justificativa) return null;
  if (registro.justificativa.status === "Em analise") {
    return "Justificativa aguardando análise";
  }
  return `Justificativa ${registro.justificativa.status.toLowerCase()}`;
}

export function ChamadaSheet({
  chamada,
  backLabel = "Voltar às linhas",
  onBack,
  onChamadaChange,
}: ChamadaSheetProps) {
  const { can } = useAuthz();
  const canWrite = can("frequencias.write");
  const [draft, setDraft] = useState<ChamadaDraft>(() =>
    createChamadaDraft(chamada),
  );
  const [fieldErrors, setFieldErrors] = useState<ChamadaDraftErrors>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isClosed = chamada.status === "Fechada";

  useEffect(() => {
    setDraft(createChamadaDraft(chamada));
    setFieldErrors({});
  }, [chamada]);

  const validationErrors = useMemo(() => validateDraft(draft), [draft]);
  const pending = hasPendingEntries(draft);
  const changedCount = getChangedEntries(chamada, draft).length;

  function updateEntry(
    estudanteId: number,
    patch: Partial<ChamadaDraft[number]>,
  ) {
    setDraft((current) => ({
      ...current,
      [estudanteId]: { ...current[estudanteId], ...patch },
    }));
    setFieldErrors((current) => ({
      ...current,
      [estudanteId]: undefined,
    }));
    setActionError("");
    setSuccessMessage("");
  }

  async function saveChanges() {
    const nextErrors = validateDraft(draft);
    setFieldErrors(nextErrors);
    setSuccessMessage("");

    if (Object.keys(nextErrors).length > 0) return false;

    const frequencias = getChangedEntries(chamada, draft);
    if (frequencias.length === 0) return true;

    try {
      setActionLoading(true);
      setActionError("");
      const response = await frequenciaService.update(chamada.id, {
        frequencias,
      });
      onChamadaChange(response.data);
      setSuccessMessage(response.message ?? "Chamada salva com sucesso.");
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClose() {
    if (pending || Object.keys(validationErrors).length > 0) return;
    if (!(await saveChanges())) return;

    try {
      setActionLoading(true);
      setActionError("");
      const response = await frequenciaService.close(chamada.id);
      onChamadaChange(response.data);
      setSuccessMessage(response.message ?? "Chamada fechada com sucesso.");
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReopen() {
    try {
      setActionLoading(true);
      setActionError("");
      setSuccessMessage("");
      const response = await frequenciaService.reopen(chamada.id);
      onChamadaChange(response.data);
      setSuccessMessage(response.message ?? "Chamada reaberta com sucesso.");
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          fullWidth={false}
          leftIcon={<ArrowLeft />}
          onClick={onBack}
          variant="ghost"
        >
          {backLabel}
        </Button>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-bold",
            isClosed
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800",
          )}
        >
          {chamada.status}
        </span>
      </div>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-content-muted">
              {formatCallDate(chamada.data)}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-brand-700">
              {chamada.linha.name}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-content-secondary">
              <Clock3 aria-hidden="true" className="size-4" />
              {chamada.registrada_por?.name
                ? `Registrada por ${chamada.registrada_por.name}`
                : "Responsável não informado"}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm sm:grid-cols-5">
            {[
              ["Total", chamada.contadores.total],
              ["Presentes", chamada.contadores.presentes],
              ["Faltas", chamada.contadores.faltas],
              ["Justificadas", chamada.contadores.justificadas],
              ["Pendentes", chamada.contadores.pendentes],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-content-muted">{label}</dt>
                <dd className="text-lg font-bold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {actionError && (
        <p
          className="rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
          role="alert"
        >
          {actionError}
        </p>
      )}
      {successMessage && (
        <output className="rounded-lg border border-green-700/20 bg-green-100 px-4 py-3 text-sm font-medium text-green-800">
          {successMessage}
        </output>
      )}

      <section aria-label="Estudantes da chamada" className="space-y-3">
        {chamada.frequencias.map((registro) => {
          const estudanteId = registro.estudante_id;
          const entry = draft[estudanteId];
          const locked = isRegistroLocked(registro);
          const disabled = !canWrite || isClosed || locked || actionLoading;
          const decision = decisionLabel(registro);

          if (!entry) return null;

          return (
            <article
              className="rounded-lg border border-border-subtle bg-white p-4 shadow-sm"
              key={registro.id}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 xl:max-w-xs">
                  <h2 className="font-bold text-slate-900">
                    {registro.estudante?.name ??
                      `Estudante ${registro.estudante_id}`}
                  </h2>
                  <p className="mt-1 text-sm text-content-muted">
                    {registro.estudante?.cpf ?? "CPF não informado"}
                  </p>
                  {decision && (
                    <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-brand-700">
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                      {decision}
                    </p>
                  )}
                  {registro.justificativa?.parecer && (
                    <p className="mt-1 text-xs text-content-muted">
                      Parecer: {registro.justificativa.parecer}
                    </p>
                  )}
                </div>

                <fieldset
                  className="grid gap-2 sm:grid-cols-3"
                  disabled={disabled}
                >
                  <legend className="sr-only">
                    Situação de {registro.estudante?.name ?? "estudante"}
                  </legend>
                  {situationOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = entry.situacao === option.value;
                    return (
                      <button
                        aria-pressed={selected}
                        className={cn(
                          "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-default disabled:opacity-65",
                          selected &&
                            option.value === "Presente" &&
                            "border-green-700 bg-green-700 text-white",
                          selected &&
                            option.value === "Falta" &&
                            "border-danger-600 bg-danger-600 text-white",
                          selected &&
                            option.value === "Justificada" &&
                            "border-amber-600 bg-amber-100 text-amber-900",
                          !selected &&
                            "border-border-default bg-white text-content-secondary hover:border-brand-600 hover:text-brand-600",
                        )}
                        key={option.value}
                        onClick={() =>
                          updateEntry(estudanteId, {
                            situacao: option.value,
                            ...(option.value !== "Justificada"
                              ? { observacao: "" }
                              : {}),
                          })
                        }
                        type="button"
                      >
                        <Icon aria-hidden="true" className="size-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </fieldset>
              </div>

              {entry.situacao === "Justificada" && (
                <Textarea
                  className="mt-4"
                  disabled={disabled}
                  error={fieldErrors[estudanteId]}
                  label={`Motivo da falta de ${registro.estudante?.name ?? "estudante"}`}
                  maxLength={255}
                  onChange={(event) =>
                    updateEntry(estudanteId, {
                      observacao: event.target.value,
                    })
                  }
                  required
                  value={entry.observacao}
                />
              )}
            </article>
          );
        })}
      </section>

      <footer className="sticky bottom-3 flex flex-col gap-3 rounded-lg border border-border-subtle bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-content-secondary">
          {isClosed
            ? "Esta folha está fechada e disponível somente para consulta."
            : pending
              ? "Marque todos os estudantes antes de fechar a chamada."
              : changedCount > 0
                ? `${changedCount} alteração(ões) ainda não salva(s).`
                : "Todas as marcações estão salvas."}
        </p>
        {canWrite && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {isClosed ? (
              <Button
                fullWidth={false}
                leftIcon={<Undo2 />}
                loading={actionLoading}
                onClick={() => void handleReopen()}
                variant="secondary"
              >
                Reabrir chamada
              </Button>
            ) : (
              <>
                <Button
                  disabled={changedCount === 0}
                  fullWidth={false}
                  leftIcon={<Save />}
                  loading={actionLoading}
                  onClick={() => void saveChanges()}
                  variant="secondary"
                >
                  Salvar andamento
                </Button>
                <Button
                  disabled={pending || Object.keys(validationErrors).length > 0}
                  fullWidth={false}
                  leftIcon={<CheckCircle2 />}
                  loading={actionLoading}
                  onClick={() => void handleClose()}
                  variant="approved"
                >
                  Fechar chamada
                </Button>
              </>
            )}
          </div>
        )}
      </footer>
    </section>
  );
}
