"use client";

import { useState } from "react";

import { Textarea } from "@/components/form/inputs";
import {
  Modal,
  ModalSection,
  ModalSectionContent,
  ModalSectionHeader,
  ModalTitle,
} from "@/components/modal";
import { formatCallDate } from "@/components/ui/frequencias/frequenciaPresentation";
import {
  formatJustificativaDateTime,
  validateAnalysis,
} from "@/components/ui/frequencias/justificativaPresentation";
import type {
  AnaliseJustificativaPayload,
  Justificativa,
} from "@/types/frequencia";

export type JustificativaModalMode = "view" | "approve" | "reject";

type JustificativaAnalysisModalProps = {
  error?: string;
  justificativa: Justificativa | null;
  loading?: boolean;
  mode: JustificativaModalMode | null;
  onClose: () => void;
  onConfirm: (payload: AnaliseJustificativaPayload) => void;
};

function modalTitle(mode: JustificativaModalMode | null) {
  if (mode === "approve") return "Aprovar justificativa";
  if (mode === "reject") return "Rejeitar justificativa";
  return "Detalhes da justificativa";
}

export function JustificativaAnalysisModal({
  error = "",
  justificativa,
  loading = false,
  mode,
  onClose,
  onConfirm,
}: JustificativaAnalysisModalProps) {
  if (!justificativa || !mode) return null;

  return (
    <JustificativaAnalysisModalContent
      error={error}
      justificativa={justificativa}
      key={`${justificativa.id}-${mode}`}
      loading={loading}
      mode={mode}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function JustificativaAnalysisModalContent({
  error = "",
  justificativa,
  loading = false,
  mode,
  onClose,
  onConfirm,
}: Omit<JustificativaAnalysisModalProps, "justificativa" | "mode"> & {
  justificativa: Justificativa;
  mode: JustificativaModalMode;
}) {
  const [opinion, setOpinion] = useState("");
  const [opinionError, setOpinionError] = useState("");

  function handleConfirm() {
    if (mode === "view") return;

    const decision = mode === "approve" ? "Aprovada" : "Rejeitada";
    const nextError = validateAnalysis(decision, opinion);
    setOpinionError(nextError);
    if (nextError) return;

    onConfirm(
      decision === "Aprovada"
        ? { decisao: "Aprovada" }
        : { decisao: "Rejeitada", parecer: opinion.trim() },
    );
  }

  return (
    <Modal
      cancelLabel={mode === "view" ? "Fechar" : "Cancelar"}
      className="max-w-2xl"
      hideSave={mode === "view"}
      onClose={onClose}
      onSave={handleConfirm}
      open
      saveLabel={mode === "reject" ? "Rejeitar justificativa" : "Aprovar"}
      saveLoading={loading}
      saveVariant={mode === "reject" ? "danger" : "primary"}
      title={modalTitle(mode)}
    >
      <div className="space-y-4">
        {error && (
          <p
            className="rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
            role="alert"
          >
            {error}
          </p>
        )}

        <ModalSection>
          <ModalSectionHeader>
            <ModalTitle>
              {justificativa.estudante?.name ?? "Estudante não encontrado"}
            </ModalTitle>
            <p className="mt-1 text-sm text-content-muted">
              {justificativa.estudante?.cpf ?? "CPF não informado"} · Status do
              benefício: {justificativa.estudante?.status ?? "não informado"}
            </p>
          </ModalSectionHeader>
          <ModalSectionContent className="space-y-3 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-content-muted">Linha</dt>
                <dd className="text-content-primary">
                  {justificativa.falta.linha?.name ?? "Não informada"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-content-muted">
                  Data da falta
                </dt>
                <dd className="text-content-primary">
                  {formatCallDate(justificativa.falta.data)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-content-muted">
                  Enviada por
                </dt>
                <dd className="text-content-primary">
                  {justificativa.enviada_por?.name ?? "Não informado"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-content-muted">Enviada em</dt>
                <dd className="text-content-primary">
                  {formatJustificativaDateTime(justificativa.created_at)}
                </dd>
              </div>
            </dl>
            <div>
              <p className="font-semibold text-content-muted">Motivo</p>
              <p className="mt-1 whitespace-pre-wrap text-content-primary">
                {justificativa.motivo}
              </p>
            </div>
            {justificativa.status !== "Em analise" && (
              <div className="border-t border-border-subtle pt-3">
                <p className="font-semibold text-content-muted">
                  Análise: {justificativa.status}
                </p>
                <p className="mt-1 text-content-primary">
                  {justificativa.parecer || "Sem parecer registrado."}
                </p>
                <p className="mt-2 text-xs text-content-muted">
                  {justificativa.analisada_por?.name ??
                    "Responsável não informado"}
                  {" · "}
                  {formatJustificativaDateTime(justificativa.analisada_em)}
                </p>
              </div>
            )}
          </ModalSectionContent>
        </ModalSection>

        {mode === "approve" && (
          <p className="text-sm text-content-secondary">
            Aprovar retira esta falta da contagem. Se o estudante já estiver
            inativo, a reativação continuará sendo uma decisão administrativa.
          </p>
        )}

        {mode === "reject" && (
          <Textarea
            disabled={loading}
            error={opinionError}
            hint={`${opinion.length}/1.000 caracteres`}
            label="Parecer da rejeição"
            maxLength={1000}
            onChange={(event) => {
              setOpinion(event.target.value);
              setOpinionError("");
            }}
            required
            value={opinion}
          />
        )}
      </div>
    </Modal>
  );
}
