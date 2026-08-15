"use client";

import axios from "axios";
import { CalendarDays, Check, Clock3, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/buttons";
import { DateInput, Input, Select, Textarea } from "@/components/form/inputs";
import { Modal } from "@/components/modal";
import { recadastroService } from "@/services/api/modules/recadastro";
import type {
  DocumentoRecadastroTipo,
  PeriodoRecadastro,
  SolicitacaoRecadastro,
} from "@/types/recadastro";

type ApiError = { message?: string; errors?: Record<string, string[]> };
type Decision = "Aprovado" | "Rejeitado" | "Pendencia";

function errorMessage(error: unknown) {
  if (!axios.isAxiosError<ApiError>(error)) {
    return "Não foi possível concluir a operação.";
  }
  const validation = Object.values(error.response?.data?.errors ?? {})[0]?.[0];
  return (
    validation ??
    error.response?.data?.message ??
    "Não foi possível concluir a operação."
  );
}

function badgeClass(status: string) {
  if (status === "Aprovado" || status === "Aberto") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "Rejeitado") return "bg-danger-600/10 text-danger-600";
  return "bg-amber-100 text-amber-700";
}

const initialPeriodo = {
  ano: String(new Date().getFullYear()),
  semestre: "1",
  data_inicio: "",
  data_fim: "",
  observacoes: "",
};

export function RecadastroAdminWorkspace() {
  const [periodos, setPeriodos] = useState<PeriodoRecadastro[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRecadastro[]>([]);
  const [periodoForm, setPeriodoForm] = useState(initialPeriodo);
  const [selected, setSelected] = useState<SolicitacaoRecadastro | null>(null);
  const [decision, setDecision] = useState<Decision>("Aprovado");
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState<DocumentoRecadastroTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback("");
      const [nextPeriodos, nextSolicitacoes] = await Promise.all([
        recadastroService.listPeriodos(),
        recadastroService.listSolicitacoes(),
      ]);
      setPeriodos(nextPeriodos);
      setSolicitacoes(nextSolicitacoes);
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function createPeriodo() {
    try {
      setActionLoading(true);
      setFeedback("");
      await recadastroService.createPeriodo({
        ano: Number(periodoForm.ano),
        semestre: Number(periodoForm.semestre) as 1 | 2,
        data_inicio: periodoForm.data_inicio,
        data_fim: periodoForm.data_fim,
        observacoes: periodoForm.observacoes || null,
      });
      setPeriodoForm(initialPeriodo);
      await loadData();
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function togglePeriodo(periodo: PeriodoRecadastro) {
    try {
      setActionLoading(true);
      setFeedback("");
      await recadastroService.setPeriodoAberto(
        periodo.id,
        periodo.status !== "Aberto",
      );
      await loadData();
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function analisar() {
    if (!selected) return;
    if (decision !== "Aprovado" && reason.trim().length < 3) {
      setFeedback("Informe o motivo da devolução ou rejeição.");
      return;
    }
    if (decision === "Pendencia" && documents.length === 0) {
      setFeedback("Selecione ao menos um documento para reenvio.");
      return;
    }
    try {
      setActionLoading(true);
      setFeedback("");
      await recadastroService.analisar(
        selected.id,
        decision === "Aprovado"
          ? { decisao: "Aprovado", motivo: null }
          : decision === "Rejeitado"
            ? { decisao: "Rejeitado", motivo: reason.trim() }
            : {
                decisao: "Pendencia",
                motivo: reason.trim(),
                documentos: documents,
              },
      );
      setSelected(null);
      setReason("");
      setDocuments([]);
      await loadData();
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-600">Recadastramento</h1>
          <p className="mt-1 text-sm text-content-muted">
            Gerencie períodos e homologue os documentos enviados.
          </p>
        </div>
        <Button
          fullWidth={false}
          leftIcon={<RefreshCw className="size-4" />}
          loading={loading}
          onClick={() => void loadData()}
          variant="ghost"
        >
          Atualizar
        </Button>
      </div>

      {feedback && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {feedback}
        </p>
      )}

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 text-brand-700">
          <CalendarDays className="size-5" />
          <h2 className="text-lg font-bold">Períodos de recadastro</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Ano"
            onChange={(event) =>
              setPeriodoForm((current) => ({
                ...current,
                ano: event.target.value,
              }))
            }
            type="number"
            value={periodoForm.ano}
            variant="white"
          />
          <Select
            label="Semestre"
            onChange={(event) =>
              setPeriodoForm((current) => ({
                ...current,
                semestre: event.target.value,
              }))
            }
            options={[
              { label: "1º semestre", value: "1" },
              { label: "2º semestre", value: "2" },
            ]}
            value={periodoForm.semestre}
            variant="white"
          />
          <DateInput
            label="Início"
            onChange={(event) =>
              setPeriodoForm((current) => ({
                ...current,
                data_inicio: event.target.value,
              }))
            }
            value={periodoForm.data_inicio}
            variant="white"
          />
          <DateInput
            label="Fim"
            onChange={(event) =>
              setPeriodoForm((current) => ({
                ...current,
                data_fim: event.target.value,
              }))
            }
            value={periodoForm.data_fim}
            variant="white"
          />
          <div className="flex items-end">
            <Button loading={actionLoading} onClick={createPeriodo}>
              Criar período
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {periodos.map((periodo) => (
            <article
              className="rounded-lg border border-border-subtle p-4"
              key={periodo.id}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-slate-800">{periodo.referencia}</p>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-bold ${badgeClass(periodo.status)}`}
                >
                  {periodo.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-content-muted">
                {periodo.data_inicio} a {periodo.data_fim}
              </p>
              <Button
                className="mt-4"
                fullWidth={false}
                onClick={() => void togglePeriodo(periodo)}
                size="sm"
                variant={periodo.status === "Aberto" ? "danger" : "primary"}
              >
                {periodo.status === "Aberto" ? "Fechar" : "Abrir"}
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 text-brand-700">
          <Clock3 className="size-5" />
          <h2 className="text-lg font-bold">Solicitações de recadastro</h2>
        </div>
        <div className="space-y-3">
          {solicitacoes.length === 0 && !loading && (
            <p className="py-8 text-center text-sm text-content-muted">
              Nenhuma solicitação encontrada.
            </p>
          )}
          {solicitacoes.map((solicitacao) => (
            <article
              className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4 md:flex-row md:items-center md:justify-between"
              key={solicitacao.id}
            >
              <div>
                <p className="font-bold text-slate-800">
                  {solicitacao.estudante.name}
                </p>
                <p className="mt-1 text-sm text-content-muted">
                  {solicitacao.estudante.cpf} · {solicitacao.periodo.referencia}{" "}
                  · {solicitacao.documentos.length} documento(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-md px-2 py-1 text-xs font-bold ${badgeClass(solicitacao.status)}`}
                >
                  {solicitacao.status}
                </span>
                {solicitacao.status === "Em analise" && (
                  <Button
                    fullWidth={false}
                    onClick={() => setSelected(solicitacao)}
                    size="sm"
                  >
                    Analisar
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Modal
        cancelLabel="Cancelar"
        onClose={() => setSelected(null)}
        onSave={analisar}
        open={Boolean(selected)}
        saveLabel="Registrar análise"
        saveLoading={actionLoading}
        title="Homologar recadastro"
      >
        <div className="space-y-4">
          <Select
            label="Decisão"
            onChange={(event) => setDecision(event.target.value as Decision)}
            options={[
              { label: "Aprovar", value: "Aprovado" },
              { label: "Solicitar reenvio", value: "Pendencia" },
              { label: "Rejeitar", value: "Rejeitado" },
            ]}
            value={decision}
            variant="white"
          />
          {decision === "Pendencia" && selected && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">
                Documentos para reenvio
              </p>
              {selected.documentos.map((documento) => (
                <label
                  className="flex items-center gap-2 text-sm"
                  key={documento.id}
                >
                  <input
                    checked={documents.includes(documento.type)}
                    onChange={(event) =>
                      setDocuments((current) =>
                        event.target.checked
                          ? [...current, documento.type]
                          : current.filter((type) => type !== documento.type),
                      )
                    }
                    type="checkbox"
                  />
                  {documento.label}
                </label>
              ))}
            </div>
          )}
          {decision !== "Aprovado" && (
            <Textarea
              label="Motivo"
              onChange={(event) => setReason(event.target.value)}
              required
              value={reason}
            />
          )}
          <div className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm text-content-muted">
            {decision === "Aprovado" ? (
              <Check className="size-5 text-emerald-600" />
            ) : (
              <X className="size-5 text-danger-600" />
            )}
            A decisão será registrada e refletida no status do estudante.
          </div>
        </div>
      </Modal>
    </div>
  );
}
