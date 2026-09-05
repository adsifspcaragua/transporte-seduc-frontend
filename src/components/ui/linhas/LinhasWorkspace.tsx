"use client";

import axios from "axios";
import { Bus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/buttons";
import { Input, NumberInput, TimeInput } from "@/components/form/inputs";
import { Modal } from "@/components/modal";
import { LinhaCard, LinhaCreateCard } from "@/components/ui/linhas/LinhaCard";
import {
  LinhasPageSkeleton,
  LinhasSkeleton,
} from "@/components/ui/linhas/LinhasSkeleton";
import {
  horaParaInput,
  ocupacaoDe,
} from "@/components/ui/linhas/linhaPresentation";
import { useMinimumVisibleLoading } from "@/hooks/use-minimum-visible-loading";
import { linhaService } from "@/services/api/modules/linha";
import type { Linha } from "@/types/inscricao";
import { scheduleFocusFirstFieldError } from "@/utils/focus-first-field-error";

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

type LinhaFormField = keyof typeof formInicial;
type LinhaFieldErrors = Partial<Record<LinhaFormField, string>>;

export function LinhasWorkspace() {
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LinhaFieldErrors>({});
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState<Linha | null>(null);
  const [modalAberta, setModalAberta] = useState(false);
  const [excluindo, setExcluindo] = useState<Linha | null>(null);
  const showSkeleton = useMinimumVisibleLoading(loading);
  const showPageSkeleton = useMinimumVisibleLoading(loading && !hasLoaded);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      setLinhas(await linhaService.list());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirCriacao() {
    setEditando(null);
    setForm(formInicial);
    setFormError("");
    setFieldErrors({});
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
    setFormError("");
    setFieldErrors({});
    setModalAberta(true);
  }

  function fecharModal() {
    if (actionLoading) return;
    setModalAberta(false);
    setEditando(null);
    setForm(formInicial);
    setFormError("");
    setFieldErrors({});
  }

  function setField(field: LinhaFormField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function salvar() {
    if (actionLoading) return;

    const nextErrors: LinhaFieldErrors = {};
    setFormError("");

    if (form.name.trim().length < 3) {
      nextErrors.name = "O nome da linha deve ter ao menos 3 caracteres.";
    }

    const capacidade = Number(form.max_capacity);

    for (const field of ["departure_time", "return_time"] as const) {
      if (form[field] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form[field])) {
        nextErrors[field] = "Informe um horário válido no formato HH:MM.";
      }
    }

    if (!Number.isInteger(capacidade) || capacidade < 1) {
      nextErrors.max_capacity =
        "Informe a capacidade em número de lugares (mínimo 1).";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scheduleFocusFirstFieldError(formRef.current);
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
      const apiErrors = axios.isAxiosError<ApiError>(error)
        ? error.response?.data?.errors
        : undefined;
      const nextFieldErrors: LinhaFieldErrors = {};
      let unhandledError: string | undefined;

      for (const [field, messages] of Object.entries(apiErrors ?? {})) {
        if (!messages[0]) continue;
        if (Object.hasOwn(formInicial, field)) {
          nextFieldErrors[field as LinhaFormField] = messages[0];
        } else {
          unhandledError ??= messages[0];
        }
      }

      setFieldErrors(nextFieldErrors);
      if (Object.keys(nextFieldErrors).length > 0) {
        setFormError(unhandledError ?? "");
        scheduleFocusFirstFieldError(formRef.current);
      } else {
        setFormError(errorMessage(error));
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function excluir() {
    if (!excluindo || actionLoading) return;

    try {
      setActionLoading(true);
      setDeleteError("");
      await linhaService.remove(excluindo.id);
      setExcluindo(null);
      await carregar();
    } catch (error) {
      // O backend recusa apagar linha com estudantes vinculados; a mensagem
      // dele explica quantos são.
      setDeleteError(errorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }

  if (showPageSkeleton) {
    return <LinhasPageSkeleton />;
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-600">Linhas</h1>
        <Button
          className="h-11 px-4"
          fullWidth={false}
          leftIcon={<Plus />}
          onClick={abrirCriacao}
          variant="primary"
        >
          Nova linha
        </Button>
      </div>

      <section className="mb-6 rounded-lg border border-brand-600/10 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-brand-600">
          <Bus className="size-4" />
          <h2 className="text-base font-bold">Linhas de transporte</h2>
        </div>
        <p className="text-sm text-content-muted">
          Rotas, horários e capacidade. A ocupação conta apenas estudantes
          ativos vinculados à linha.
        </p>

        {loadError && (
          <p
            className="mt-4 rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
            role="alert"
          >
            {loadError}
          </p>
        )}
      </section>

      {loading || showSkeleton ? (
        <LinhasSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {linhas.map((linha) => (
            <LinhaCard
              key={linha.id}
              linha={linha}
              onEdit={abrirEdicao}
              onDelete={(selected) => {
                setDeleteError("");
                setExcluindo(selected);
              }}
            />
          ))}
          <LinhaCreateCard onCreate={abrirCriacao} />
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
        <div className="space-y-4" ref={formRef}>
          {formError && (
            <div
              className="rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
              role="alert"
            >
              {formError}
            </div>
          )}
          <Input
            aria-invalid={Boolean(fieldErrors.name)}
            error={fieldErrors.name}
            label="Nome"
            onChange={(event) => setField("name", event.target.value)}
            required
            value={form.name}
          />
          <Input
            aria-invalid={Boolean(fieldErrors.description)}
            error={fieldErrors.description}
            label="Descrição da rota"
            onChange={(event) => setField("description", event.target.value)}
            placeholder="Bairros e instituições atendidas"
            value={form.description}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TimeInput
              aria-invalid={Boolean(fieldErrors.departure_time)}
              error={fieldErrors.departure_time}
              label="Horário de saída"
              onChange={(event) =>
                setField("departure_time", event.target.value)
              }
              value={form.departure_time}
            />
            <TimeInput
              aria-invalid={Boolean(fieldErrors.return_time)}
              error={fieldErrors.return_time}
              label="Horário de retorno"
              onChange={(event) => setField("return_time", event.target.value)}
              value={form.return_time}
            />
          </div>
          <NumberInput
            aria-invalid={Boolean(fieldErrors.max_capacity)}
            error={fieldErrors.max_capacity}
            label="Capacidade (lugares)"
            min={1}
            onChange={(event) => setField("max_capacity", event.target.value)}
            required
            value={form.max_capacity}
          />
          {editando && (
            <p className="text-sm text-content-muted">
              Esta linha tem {ocupacaoDe(editando).ocupacao} estudante(s)
              ativo(s) vinculado(s).
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
        {deleteError && (
          <div
            className="mt-4 rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
            role="alert"
          >
            {deleteError}
          </div>
        )}
      </Modal>
    </>
  );
}
