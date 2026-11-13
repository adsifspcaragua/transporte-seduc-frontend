"use client";

import axios from "axios";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/buttons";
import { Modal } from "@/components/modal";
import { LinhaCard, LinhaCreateCard } from "@/components/ui/linhas/LinhaCard";
import { LinhaDetailsModal } from "@/components/ui/linhas/LinhaDetailsModal";
import {
  LinhasPageSkeleton,
  LinhasSkeleton,
} from "@/components/ui/linhas/LinhasSkeleton";
import {
  buildLinhaPayload,
  horaParaInput,
  type LinhasViewMode,
  ocupacaoDe,
  validateLinhaForm,
} from "@/components/ui/linhas/linhaPresentation";
import { useAuthz } from "@/hooks/use-authz";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { linhaService } from "@/services/api/modules/linha";
import { linhasQuery } from "@/services/api/page-queries";
import type { Linha } from "@/types/inscricao";
import { hasRouteAccess } from "@/utils/authz";
import { cn } from "@/utils/cn";
import { scheduleFocusFirstFieldError } from "@/utils/focus-first-field-error";
import { LinhaFormFields } from "./LinhaFormFields";

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
  const { can, permissions } = useAuthz();
  const canWrite = can("linhas.write");
  const canDelete = can("linhas.delete");
  const [viewMode, setViewMode] = useState<LinhasViewMode>("grid");
  const [detalhes, setDetalhes] = useState<Linha | null>(null);
  const linhasResult = useCachedQuery(linhasQuery);
  const linhas = linhasResult.data ?? [];
  const loading = linhasResult.isLoading;
  const carregar = linhasResult.refresh;
  const [actionLoading, setActionLoading] = useState(false);
  const loadError = linhasResult.error ? errorMessage(linhasResult.error) : "";
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LinhaFieldErrors>({});
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState(formInicial);
  const [editando, setEditando] = useState<Linha | null>(null);
  const [modalAberta, setModalAberta] = useState(false);
  const [excluindo, setExcluindo] = useState<Linha | null>(null);
  const showSkeleton = loading;
  const showPageSkeleton = loading;

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

    const nextErrors = validateLinhaForm(form);
    setFormError("");

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scheduleFocusFirstFieldError(formRef.current);
      return;
    }

    const payload = buildLinhaPayload(form);

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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-600">Linhas</h1>
        <div className="flex items-center gap-2">
          <fieldset
            aria-label="Modo de exibição das linhas"
            className="inline-flex h-10 shrink-0 overflow-hidden rounded-lg border border-brand-600/20 bg-white"
          >
            {(
              [
                { value: "list", label: "Visualizar em lista", icon: List },
                {
                  value: "grid",
                  label: "Visualizar em cards",
                  icon: LayoutGrid,
                },
              ] as const
            ).map((option) => {
              const selected = viewMode === option.value;
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  aria-label={option.label}
                  aria-pressed={selected}
                  title={option.label}
                  className={cn(
                    "h-full w-14 rounded-none border-0 shadow-none first:border-r first:border-brand-600/20 focus-visible:-outline-offset-2 active:scale-100",
                    selected
                      ? "bg-action-light-default text-brand-700 hover:bg-action-light-hover"
                      : "bg-white text-content-secondary hover:bg-surface-muted",
                  )}
                  leftIcon={<Icon aria-hidden="true" />}
                  onClick={() => setViewMode(option.value)}
                  size="icon"
                  variant="ghost"
                />
              );
            })}
          </fieldset>
          {canWrite && (
            <Button
              className="h-10 px-4 text-sm"
              fullWidth={false}
              leftIcon={<Plus />}
              onClick={abrirCriacao}
              variant="primary"
            >
              Nova linha
            </Button>
          )}
        </div>
      </div>

      {loadError && (
        <p
          className="mb-5 rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
          role="alert"
        >
          {loadError}
        </p>
      )}

      {loading || showSkeleton ? (
        <LinhasSkeleton viewMode={viewMode} />
      ) : (
        <div
          className={cn(
            "grid gap-4",
            viewMode === "grid" && "md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {linhas.map((linha) => (
            <LinhaCard
              key={linha.id}
              linha={linha}
              viewMode={viewMode}
              onDetails={setDetalhes}
              configureHref={
                hasRouteAccess("/transportes", permissions)
                  ? `/transportes?linha=${linha.id}&configurar=1`
                  : undefined
              }
              onEdit={canWrite ? abrirEdicao : undefined}
              onDelete={
                canDelete
                  ? (selected) => {
                      setDeleteError("");
                      setExcluindo(selected);
                    }
                  : undefined
              }
            />
          ))}
          {canWrite && (viewMode === "grid" || linhas.length === 0) && (
            <LinhaCreateCard onCreate={abrirCriacao} />
          )}
        </div>
      )}

      {detalhes && (
        <LinhaDetailsModal
          key={detalhes.id}
          linha={detalhes}
          onClose={() => setDetalhes(null)}
        />
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
          <LinhaFormFields
            values={form}
            errors={fieldErrors}
            onChange={setField}
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
