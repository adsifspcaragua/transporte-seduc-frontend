"use client";

import axios from "axios";
import { Bus, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/buttons";
import { Input } from "@/components/form/inputs";
import { Modal } from "@/components/modal";
import { linhaService } from "@/services/api/modules/linha";
import type { Linha } from "@/types/inscricao";

type ApiError = { message?: string; errors?: Record<string, string[]> };

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

const formInicial = {
  name: "",
  description: "",
  departure_time: "",
  return_time: "",
  max_capacity: "",
};

/** O backend guarda HH:MM:SS, mas o input de hora só aceita HH:MM. */
function horaParaInput(valor?: string | null) {
  return valor ? valor.slice(0, 5) : "";
}

function ocupacaoDe(linha: Linha) {
  const ocupacao = linha.ocupacao ?? 0;
  const capacidade = linha.max_capacity ?? 0;
  const proporcao = capacidade > 0 ? ocupacao / capacidade : 0;

  return {
    ocupacao,
    capacidade,
    vagas: linha.vagas_restantes ?? Math.max(0, capacidade - ocupacao),
    lotada: capacidade > 0 && ocupacao >= capacidade,
    proporcao: Math.min(1, proporcao),
  };
}

export function LinhasWorkspace() {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState<Linha | null>(null);
  const [modalAberta, setModalAberta] = useState(false);
  const [excluindo, setExcluindo] = useState<Linha | null>(null);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setLinhas(await linhaService.list());
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditando(null);
    setForm(formInicial);
    setFeedback("");
    setModalAberta(true);
  }

  function abrirEdicao(linha: Linha) {
    setEditando(linha);
    setForm({
      name: linha.name,
      description: linha.description ?? "",
      departure_time: horaParaInput(linha.departure_time),
      return_time: horaParaInput(linha.return_time),
      max_capacity: String(linha.max_capacity ?? ""),
    });
    setFeedback("");
    setModalAberta(true);
  }

  function fecharModal() {
    if (actionLoading) return;
    setModalAberta(false);
    setEditando(null);
    setForm(formInicial);
  }

  async function salvar() {
    if (form.name.trim().length < 3) {
      setFeedback("O nome da linha deve ter ao menos 3 caracteres.");
      return;
    }

    const capacidade = Number(form.max_capacity);

    if (!Number.isInteger(capacidade) || capacidade < 1) {
      setFeedback("Informe a capacidade em número de lugares (mínimo 1).");
      return;
    }

    // Campos opcionais vazios não são enviados: o backend valida formato de
    // hora e recusaria a string vazia.
    const payload = {
      name: form.name.trim(),
      max_capacity: capacidade,
      ...(form.description.trim()
        ? { description: form.description.trim() }
        : {}),
      ...(form.departure_time ? { departure_time: form.departure_time } : {}),
      ...(form.return_time ? { return_time: form.return_time } : {}),
    };

    try {
      setActionLoading(true);
      setFeedback("");

      if (editando) {
        await linhaService.update(editando.id, payload);
      } else {
        await linhaService.create(payload);
      }

      setModalAberta(false);
      setEditando(null);
      setForm(formInicial);
      await carregar();
    } catch (error) {
      setFeedback(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  async function excluir() {
    if (!excluindo) return;

    try {
      setActionLoading(true);
      setFeedback("");
      await linhaService.remove(excluindo.id);
      setExcluindo(null);
      await carregar();
    } catch (error) {
      // O backend recusa apagar linha com estudantes vinculados; a mensagem
      // dele explica quantos são.
      setFeedback(errorMessage(error));
      setExcluindo(null);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <section className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-brand-700">
            <Bus className="size-5" />
            <h1 className="text-lg font-bold">Linhas de transporte</h1>
          </div>
          <Button fullWidth={false} onClick={abrirCriacao} size="sm">
            Nova linha
          </Button>
        </div>
        <p className="mt-2 text-sm text-content-muted">
          Rotas, horários e capacidade. A ocupação conta apenas estudantes
          ativos vinculados à linha.
        </p>

        {feedback && (
          <p className="mt-4 rounded-md bg-danger-600/10 px-3 py-2 text-sm font-medium text-danger-600">
            {feedback}
          </p>
        )}
      </section>

      {loading ? (
        <p className="text-sm font-medium text-content-muted">
          Carregando linhas...
        </p>
      ) : linhas.length === 0 ? (
        <section className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-slate-800">
            Nenhuma linha cadastrada
          </p>
          <p className="mt-1 text-sm text-content-muted">
            Cadastre a primeira linha para poder vincular estudantes a ela.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {linhas.map((linha) => {
            const { ocupacao, capacidade, vagas, lotada, proporcao } =
              ocupacaoDe(linha);

            return (
              <article
                className="flex flex-col rounded-lg bg-white p-5 shadow-sm"
                key={linha.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-slate-800">{linha.name}</h2>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-bold ${
                      lotada
                        ? "bg-danger-600/10 text-danger-600"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {lotada ? "Lotada" : `${vagas} vaga(s)`}
                  </span>
                </div>

                {linha.description && (
                  <p className="mt-2 text-sm text-content-muted">
                    {linha.description}
                  </p>
                )}

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="font-semibold text-slate-700">Saída</dt>
                    <dd className="text-content-muted">
                      {horaParaInput(linha.departure_time) || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-700">Retorno</dt>
                    <dd className="text-content-muted">
                      {horaParaInput(linha.return_time) || "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      Ocupação
                    </span>
                    <span className="text-content-muted">
                      {ocupacao} de {capacidade}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        lotada ? "bg-danger-600" : "bg-brand-600"
                      }`}
                      style={{ width: `${proporcao * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    fullWidth={false}
                    leftIcon={<Pencil className="size-4" />}
                    onClick={() => abrirEdicao(linha)}
                    size="sm"
                    variant="secondary"
                  >
                    Editar
                  </Button>
                  <Button
                    fullWidth={false}
                    leftIcon={<Trash2 className="size-4" />}
                    onClick={() => setExcluindo(linha)}
                    size="sm"
                    variant="danger"
                  >
                    Excluir
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        onClose={fecharModal}
        onSave={() => void salvar()}
        open={modalAberta}
        saveLabel={editando ? "Salvar alterações" : "Criar linha"}
        saveLoading={actionLoading}
        title={editando ? "Editar linha" : "Nova linha"}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            required
            value={form.name}
          />
          <Input
            label="Descrição da rota"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Bairros e instituições atendidas"
            value={form.description}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Horário de saída"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  departure_time: event.target.value,
                }))
              }
              type="time"
              value={form.departure_time}
            />
            <Input
              label="Horário de retorno"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  return_time: event.target.value,
                }))
              }
              type="time"
              value={form.return_time}
            />
          </div>
          <Input
            label="Capacidade (lugares)"
            min={1}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                max_capacity: event.target.value,
              }))
            }
            required
            type="number"
            value={form.max_capacity}
          />
          {editando && (
            <p className="text-sm text-content-muted">
              Esta linha tem {ocupacaoDe(editando).ocupacao} estudante(s)
              ativo(s) vinculado(s).
            </p>
          )}
          {feedback && (
            <p className="rounded-md bg-danger-600/10 px-3 py-2 text-sm font-medium text-danger-600">
              {feedback}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        onClose={() => !actionLoading && setExcluindo(null)}
        onSave={() => void excluir()}
        open={Boolean(excluindo)}
        saveLabel="Excluir linha"
        saveLoading={actionLoading}
        saveVariant="danger"
        title="Excluir linha"
      >
        <p className="text-sm font-medium text-slate-800">
          Excluir a linha {excluindo?.name}? Linhas com estudantes vinculados
          não podem ser excluídas — realoque-os antes.
        </p>
      </Modal>
    </main>
  );
}
