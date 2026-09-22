"use client";

import axios from "axios";
import { Check, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/buttons";
import { Select, Textarea } from "@/components/form/inputs";
import { Modal } from "@/components/modal";
import { useAuthz } from "@/hooks/use-authz";
import { recadastroService } from "@/services/api/modules/recadastro";
import type {
  AusentesRecadastro,
  DocumentoRecadastroTipo,
  PeriodoRecadastro,
  SolicitacaoRecadastro,
} from "@/types/recadastro";
import {
  type PeriodoFormState,
  RecadastroPeriodosSection,
} from "./RecadastroPeriodosSection";
import { RecadastroSolicitacoesSection } from "./RecadastroSolicitacoesSection";

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

const initialPeriodo: PeriodoFormState = {
  ano: String(new Date().getFullYear()),
  semestre: "1",
  data_inicio: "",
  data_fim: "",
  observacoes: "",
};

// Espelha SolicitacaoReecadastro::CAMPOS_CORRIGIVEIS no backend: só os campos
// que o estudante consegue editar no recadastro. Apontar um campo que ele não
// pode mexer geraria uma pendência sem saída.
const CAMPOS_CORRIGIVEIS: { campo: string; label: string }[] = [
  { campo: "name", label: "Nome completo" },
  { campo: "rg", label: "RG" },
  { campo: "father_name", label: "Nome do pai" },
  { campo: "mother_name", label: "Nome da mãe" },
  { campo: "birth_date", label: "Data de nascimento" },
  { campo: "phone", label: "Telefone" },
  { campo: "email", label: "E-mail" },
  { campo: "cep", label: "CEP" },
  { campo: "address", label: "Endereço" },
  { campo: "number", label: "Número" },
  { campo: "complement", label: "Complemento" },
  { campo: "neighborhood", label: "Bairro" },
  { campo: "city", label: "Cidade" },
  { campo: "instituicao_id", label: "Instituição" },
  { campo: "course", label: "Curso" },
  { campo: "semester", label: "Semestre" },
  { campo: "expected_completion", label: "Previsão de conclusão" },
  { campo: "shift", label: "Turno" },
  { campo: "city_destination", label: "Cidade de destino" },
];

// `noopener` e não `noreferrer`: a rota do documento identifica a responsável
// pela sessão, e o Sanctum só a carrega quando reconhece a requisição como vinda
// do frontend — checagem que depende do Referer, que `noreferrer` removeria.
function DocumentoRecadastroLink({
  children,
  download,
  href,
}: {
  children: string;
  download?: boolean;
  href: string;
}) {
  return (
    <a
      className="inline-flex h-8 items-center justify-center rounded-md border border-brand-600/20 bg-surface-primary px-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-600/5"
      download={download}
      href={href}
      rel="noopener"
      target={download ? undefined : "_blank"}
    >
      {children}
    </a>
  );
}

export function RecadastroAdminWorkspace() {
  const { can } = useAuthz();
  const canViewPeriodos = can("periodos.view");
  const canWritePeriodos = can("periodos.write");
  const canViewSolicitacoes = can("solicitacoes.view");
  const canAnalyzeSolicitacoes = can("solicitacoes.analise");
  const [periodos, setPeriodos] = useState<PeriodoRecadastro[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRecadastro[]>([]);
  const [periodoForm, setPeriodoForm] = useState(initialPeriodo);
  // null = o formulário está criando; com id = está editando aquele período.
  const [periodoEmEdicao, setPeriodoEmEdicao] = useState<number | null>(null);
  const [selected, setSelected] = useState<SolicitacaoRecadastro | null>(null);
  const [decision, setDecision] = useState<Decision>("Aprovado");
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState<DocumentoRecadastroTipo[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [ausentes, setAusentes] = useState<AusentesRecadastro | null>(null);
  const [ausentesSelecionados, setAusentesSelecionados] = useState<number[]>(
    [],
  );
  const [confirmandoInativacao, setConfirmandoInativacao] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback("");
      const [nextPeriodos, nextSolicitacoes] = await Promise.all([
        canViewPeriodos
          ? recadastroService.listPeriodos()
          : Promise.resolve([] as PeriodoRecadastro[]),
        canViewSolicitacoes
          ? recadastroService.listSolicitacoes()
          : Promise.resolve([] as SolicitacaoRecadastro[]),
      ]);
      setPeriodos(nextPeriodos);
      setSolicitacoes(nextSolicitacoes);
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [canViewPeriodos, canViewSolicitacoes]);

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

  function editarPeriodo(periodo: PeriodoRecadastro) {
    setPeriodoEmEdicao(periodo.id);
    setPeriodoForm({
      ano: String(periodo.ano),
      semestre: String(periodo.semestre),
      data_inicio: periodo.data_inicio,
      data_fim: periodo.data_fim,
      observacoes: periodo.observacoes ?? "",
    });
    setFeedback("");
  }

  function cancelarEdicao() {
    setPeriodoEmEdicao(null);
    setPeriodoForm(initialPeriodo);
    setFeedback("");
  }

  function updatePeriodoForm(field: keyof PeriodoFormState, value: string) {
    setPeriodoForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function salvarPeriodo() {
    if (periodoEmEdicao === null) {
      await createPeriodo();
      return;
    }

    try {
      setActionLoading(true);
      setFeedback("");
      await recadastroService.updatePeriodo(periodoEmEdicao, {
        ano: Number(periodoForm.ano),
        semestre: Number(periodoForm.semestre) as 1 | 2,
        data_inicio: periodoForm.data_inicio,
        data_fim: periodoForm.data_fim,
        observacoes: periodoForm.observacoes || null,
      });
      cancelarEdicao();
      await loadData();
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function verAusentes(periodo: PeriodoRecadastro) {
    try {
      setActionLoading(true);
      setFeedback("");
      setAusentesSelecionados([]);
      setConfirmandoInativacao(false);
      setAusentes(await recadastroService.listAusentes(periodo.id));
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function inativarAusentes() {
    if (!ausentes || ausentesSelecionados.length === 0) return;

    try {
      setActionLoading(true);
      setFeedback("");
      const resultado = await recadastroService.inativarAusentes(
        ausentes.periodo.id,
        ausentesSelecionados,
      );
      setFeedback(resultado.message);
      setConfirmandoInativacao(false);
      setAusentesSelecionados([]);
      setAusentes(await recadastroService.listAusentes(ausentes.periodo.id));
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
                campos: fields,
              },
      );
      setSelected(null);
      setReason("");
      setDocuments([]);
      setFields([]);
      await loadData();
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary lg:text-3xl">
            Recadastramento
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            Gerencie períodos e homologue os documentos enviados pelos
            estudantes.
          </p>
        </div>
        <Button
          fullWidth={false}
          leftIcon={<RefreshCw />}
          loading={loading}
          onClick={() => void loadData()}
          size="sm"
          variant="ghost"
        >
          Atualizar
        </Button>
      </header>

      {feedback && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {feedback}
        </p>
      )}

      {canViewPeriodos && (
        <RecadastroPeriodosSection
          actionLoading={actionLoading}
          canWrite={canWritePeriodos}
          editingId={periodoEmEdicao}
          form={periodoForm}
          onCancelEdit={cancelarEdicao}
          onEdit={editarPeriodo}
          onFormChange={updatePeriodoForm}
          onSave={() => void salvarPeriodo()}
          onShowMissing={(periodo) => void verAusentes(periodo)}
          onToggle={(periodo) => void togglePeriodo(periodo)}
          periodos={periodos}
        />
      )}

      {canViewPeriodos && ausentes && (
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-700">
              Sem recadastro em {ausentes.periodo.referencia}
            </h2>
            <Button
              fullWidth={false}
              onClick={() => setAusentes(null)}
              size="sm"
              variant="secondary"
            >
              Fechar
            </Button>
          </div>
          <p className="mb-4 text-sm text-content-muted">
            Estudantes ativos que não concluíram o recadastro. Quem está em
            análise não aparece aqui: a solicitação dele está com você, não com
            ele.
          </p>
          {ausentes.periodo.status === "Aberto" && (
            <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
              Este período ainda está aberto — eles ainda podem recadastrar.
            </p>
          )}

          {ausentes.data.length === 0 ? (
            <p className="text-sm font-medium text-slate-700">
              Todos os estudantes ativos concluíram o recadastro deste período.
            </p>
          ) : (
            <>
              <div className="divide-y divide-border-subtle">
                {ausentes.data.map((estudante) => (
                  <label
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                    key={estudante.id}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        checked={ausentesSelecionados.includes(estudante.id)}
                        disabled={!canWritePeriodos}
                        onChange={(event) =>
                          setAusentesSelecionados((current) =>
                            event.target.checked
                              ? [...current, estudante.id]
                              : current.filter((id) => id !== estudante.id),
                          )
                        }
                        type="checkbox"
                      />
                      <span className="font-semibold text-slate-800">
                        {estudante.name}
                      </span>
                    </span>
                    <span className="text-sm text-content-muted">
                      {estudante.situacao}
                    </span>
                  </label>
                ))}
              </div>

              {canWritePeriodos &&
                (confirmandoInativacao ? (
                  <div className="mt-4 rounded-md border border-danger-600/30 bg-danger-600/5 p-4">
                    <p className="text-sm font-bold text-slate-800">
                      Inativar {ausentesSelecionados.length} estudante(s)?
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Eles perdem o direito ao transporte até serem reativados
                      na tela de estudantes.
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                      {ausentes.data
                        .filter((estudante) =>
                          ausentesSelecionados.includes(estudante.id),
                        )
                        .map((estudante) => (
                          <li key={estudante.id}>{estudante.name}</li>
                        ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        fullWidth={false}
                        loading={actionLoading}
                        onClick={() => void inativarAusentes()}
                        size="sm"
                        variant="danger"
                      >
                        Confirmar inativação
                      </Button>
                      <Button
                        fullWidth={false}
                        onClick={() => setConfirmandoInativacao(false)}
                        size="sm"
                        variant="secondary"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="mt-4"
                    disabled={ausentesSelecionados.length === 0}
                    fullWidth={false}
                    onClick={() => setConfirmandoInativacao(true)}
                    size="sm"
                    variant="danger"
                  >
                    Inativar selecionados
                  </Button>
                ))}
            </>
          )}
        </section>
      )}

      {canViewSolicitacoes && (
        <RecadastroSolicitacoesSection
          canAnalyze={canAnalyzeSolicitacoes}
          loading={loading}
          onAnalyze={setSelected}
          solicitacoes={solicitacoes}
        />
      )}

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
          {selected && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">
                Documentos enviados
              </p>
              {selected.documentos.map((documento) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle px-3 py-2"
                  key={documento.id}
                >
                  <div className="flex items-center gap-2 text-sm">
                    {decision === "Pendencia" && (
                      <input
                        aria-label={`Pedir reenvio de ${documento.label}`}
                        checked={documents.includes(documento.type)}
                        onChange={(event) =>
                          setDocuments((current) =>
                            event.target.checked
                              ? [...current, documento.type]
                              : current.filter(
                                  (type) => type !== documento.type,
                                ),
                          )
                        }
                        type="checkbox"
                      />
                    )}
                    <span className="font-semibold text-slate-700">
                      {documento.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DocumentoRecadastroLink
                      href={
                        documento.preview_url ?? documento.download_url ?? "#"
                      }
                    >
                      Visualizar
                    </DocumentoRecadastroLink>
                    <DocumentoRecadastroLink
                      download
                      href={documento.download_url ?? "#"}
                    >
                      Baixar
                    </DocumentoRecadastroLink>
                  </div>
                </div>
              ))}
              {decision === "Pendencia" && (
                <p className="text-sm text-content-muted">
                  Marque os documentos que precisam ser reenviados.
                </p>
              )}
            </div>
          )}
          {decision === "Pendencia" && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">
                Campos do cadastro para corrigir
              </p>
              <p className="text-sm text-content-muted">
                Marque onde está o erro. O estudante vê exatamente estes campos
                destacados na tela dele.
              </p>
              <div className="grid gap-1 sm:grid-cols-2">
                {CAMPOS_CORRIGIVEIS.map((item) => (
                  <label
                    className="flex items-center gap-2 text-sm"
                    key={item.campo}
                  >
                    <input
                      checked={fields.includes(item.campo)}
                      onChange={(event) =>
                        setFields((current) =>
                          event.target.checked
                            ? [...current, item.campo]
                            : current.filter((campo) => campo !== item.campo),
                        )
                      }
                      type="checkbox"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
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
