"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { Input, NumberInput } from "@/components/form/inputs";
import { TextSkeleton } from "@/components/loading";
import { Modal } from "@/components/modal";
import { DataTable } from "@/components/table";
import { useAuthz } from "@/hooks/use-authz";
import { useCachedQuery } from "@/hooks/use-cached-query";
import {
  transporteQuery,
  transporteService,
} from "@/services/api/modules/transporte";
import {
  getQuerySessionVersion,
  invalidateQueries,
} from "@/services/api/query-cache";
import type {
  ConflitoViagem,
  QrVeiculo,
  TransporteFiltros,
  TransporteMutation,
  TransportePayloads,
  TransporteRegistro,
  TransporteWritable,
} from "@/types/transporte";
import { TransporteDetails } from "./TransporteDetails";
import { TransporteFields } from "./TransporteFields";
import { TransporteQrCode } from "./TransporteQrCode";
import {
  gerarViagensFields,
  motivoFields,
  parecerFields,
  presencaManualFields,
  revisaoFields,
  type TransporteConfig,
  type TransporteField,
} from "./transporteConfig";
import {
  buildTransportePatch,
  buildTransportePayload,
  formatTransporteValue,
  getTransporteValue,
  initialTransporteValues,
  type TransporteFormValues,
  transporteError,
  validateTransporteForm,
} from "./transportePresentation";

type Operation =
  | "create"
  | "edit"
  | "remove"
  | "qr"
  | "generate"
  | "manual"
  | "approve"
  | "reject"
  | "revoke"
  | "review";
type FormState = {
  operation: Operation;
  title: string;
  fields: TransporteField[];
  record?: TransporteRegistro;
  values: TransporteFormValues;
};
const detailResources = new Set([
  "veiculos",
  "horarios",
  "viagens",
  "pontos",
  "solicitacoes",
  "instituicoes",
]);
const gridClasses: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  7: "md:grid-cols-7",
};

export function TransporteResourcePanel({
  config,
}: {
  config: TransporteConfig;
}) {
  const { can, canAny } = useAuthz();
  const canWrite = Boolean(config.write && can(config.write));
  const canRemove = Boolean(config.remove && can(config.remove));
  const [filters, setFilters] = useState<TransporteFiltros>(
    config.key === "tentativas" ? { resultado: "Negada" } : {},
  );
  const [filterValues, setFilterValues] = useState<TransporteFormValues>(
    config.key === "tentativas" ? { resultado: "Negada" } : {},
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const result = useCachedQuery(transporteQuery, config.key, {
    ...filters,
    page,
    per_page: perPage,
  });
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<TransporteRegistro | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [qr, setQr] = useState<QrVeiculo | null>(null);
  const [conflicts, setConflicts] = useState<ConflitoViagem[]>([]);
  const [lookupId, setLookupId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const columns = [...config.columns, { key: "actions", label: "Ações" }];
  const gridClassName = `${gridClasses[columns.length] ?? "md:grid-cols-4"} md:gap-4`;

  function open(
    operation: Operation,
    title: string,
    record?: TransporteRegistro,
  ) {
    const fields =
      operation === "create" || operation === "edit"
        ? config.fields.filter(
            (field) => operation !== "edit" || !field.createOnly,
          )
        : operation === "generate"
          ? gerarViagensFields
          : operation === "manual"
            ? presencaManualFields
            : operation === "approve" || operation === "reject"
              ? parecerFields
              : operation === "review"
                ? revisaoFields
                : operation === "remove"
                  ? []
                  : motivoFields;
    setError("");
    setFieldErrors({});
    setForm({
      operation,
      title,
      fields,
      record,
      values: initialTransporteValues(fields, record),
    });
  }

  async function showDetails(record?: TransporteRegistro, lookup?: number) {
    if (!canAny(config.view)) return;
    const session = getQuerySessionVersion();
    setError("");
    const id = lookup ?? getTransporteValue(record, "id");
    if (
      !detailResources.has(config.key) ||
      (config.key === "instituicoes" && !canWrite) ||
      (typeof id !== "string" && typeof id !== "number")
    ) {
      setDetails(record ?? null);
      return;
    }
    try {
      setDetailBusy(true);
      const data = await transporteService.detail(config.key, id);
      if (session === getQuerySessionVersion()) setDetails(data);
    } catch (failure) {
      if (session === getQuerySessionVersion())
        setError(transporteError(failure).message);
    } finally {
      if (session === getQuerySessionVersion()) setDetailBusy(false);
    }
  }

  async function save() {
    if (!form || busy) return;
    const isRemove = form.operation === "remove";
    if (!(isRemove ? canRemove : canWrite) || !canAny(config.view)) return;
    const nextErrors = validateTransporteForm(form.fields, form.values);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const payload =
      form.operation === "edit"
        ? buildTransportePatch(form.fields, form.values, form.record)
        : buildTransportePayload(form.fields, form.values);
    const id = getTransporteValue(form.record, "id");
    const session = getQuerySessionVersion();
    setBusy(true);
    setError("");
    setMessage("");
    setConflicts([]);
    try {
      let response: TransporteMutation;
      switch (form.operation) {
        case "create":
        case "edit": {
          const key = config.key as TransporteWritable;
          // Configuration enumerates the backend request fields and validates their types.
          response = await transporteService.save(
            key,
            payload as TransportePayloads[typeof key],
            form.operation === "edit" ? Number(id) : undefined,
          );
          break;
        }
        case "remove":
          response = await transporteService.remove(
            config.key as TransporteWritable,
            Number(id),
          );
          break;
        case "qr":
          response = await transporteService.rotateQr(
            Number(id),
            String(payload.motivo),
          );
          break;
        case "generate":
          response = await transporteService.generate({
            de: String(payload.de),
            ate: String(payload.ate),
            linha_id:
              payload.linha_id === null ? null : Number(payload.linha_id),
          });
          break;
        case "manual":
          response = await transporteService.manual({
            estudante_id: Number(payload.estudante_id),
            viagem_id: Number(payload.viagem_id),
            justificativa: String(payload.justificativa),
          });
          break;
        case "approve":
        case "reject":
          response = await transporteService.decideDevice(
            Number(id),
            form.operation === "approve" ? "aprovar" : "rejeitar",
            String(payload.parecer),
          );
          break;
        case "revoke":
          response = await transporteService.revokeDevice(
            String(id),
            String(payload.motivo),
          );
          break;
        case "review":
          response = await transporteService.review(Number(id), {
            decisao: payload.decisao as "Aprovada" | "Rejeitada",
            parecer: String(payload.parecer),
          });
          break;
      }
      if (session !== getQuerySessionVersion()) return;
      const nextQr = getTransporteValue(response.data, "qr");
      if (
        nextQr &&
        typeof getTransporteValue(nextQr, "token") === "string" &&
        typeof getTransporteValue(nextQr, "url") === "string"
      )
        setQr(nextQr as QrVeiculo);
      const nextConflicts =
        response.conflitos ?? getTransporteValue(response.data, "conflitos");
      if (Array.isArray(nextConflicts))
        setConflicts(nextConflicts as ConflitoViagem[]);
      setMessage(
        `${response.message ?? "Operação concluída."}${response.viagens_canceladas !== undefined ? ` ${response.viagens_canceladas} viagem(ns) cancelada(s).` : ""}`,
      );
      setForm(null);
      // Cross-module mutations affect trips, assignments, indicators and audit together.
      invalidateQueries();
    } catch (failure) {
      if (session !== getQuerySessionVersion()) return;
      const failureData = transporteError(failure);
      setError(failureData.message);
      setFieldErrors(failureData.fields);
    } finally {
      if (session === getQuerySessionVersion()) setBusy(false);
    }
  }

  async function copy(value: string) {
    const session = getQuerySessionVersion();
    try {
      await navigator.clipboard.writeText(value);
      if (session === getQuerySessionVersion())
        setMessage("Copiado para a área de transferência.");
    } catch {
      if (session === getQuerySessionVersion())
        setError(
          "Não foi possível copiar. Selecione o conteúdo e copie manualmente.",
        );
    }
  }

  const rows = (result.data?.data ?? []).map((record, index) => ({
    record,
    key: String(getTransporteValue(record, "id") ?? `${page}-${index}`),
  }));
  const meta = result.data?.meta;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-700">{config.label}</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            fullWidth={false}
            loading={result.isFetching}
            onClick={() => void result.refresh()}
          >
            Atualizar
          </Button>
          {canWrite && config.create && (
            <Button
              size="sm"
              fullWidth={false}
              onClick={() => open("create", `Cadastrar: ${config.label}`)}
            >
              Cadastrar
            </Button>
          )}
          {canWrite && config.key === "viagens" && (
            <Button
              size="sm"
              fullWidth={false}
              onClick={() => open("generate", "Gerar viagens")}
            >
              Gerar viagens
            </Button>
          )}
          {canWrite && config.key === "presencas" && (
            <Button
              size="sm"
              fullWidth={false}
              onClick={() => open("manual", "Registrar exceção de presença")}
            >
              Presença manual
            </Button>
          )}
        </div>
      </div>
      {config.notice && (
        <p className="rounded-lg border border-border-subtle bg-white p-4 text-sm leading-6 text-content-secondary">
          {config.notice}
        </p>
      )}
      {message && (
        <output className="block rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </output>
      )}
      {error && !form && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-danger-600"
        >
          {error}
        </p>
      )}
      {conflicts.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm"
        >
          <p className="font-bold">
            Conflitos de veículo: ajuste as viagens para o QR identificar uma
            única viagem.
          </p>
          <ul className="mt-2 space-y-1">
            {conflicts.map((conflict) => (
              <li key={`${conflict.veiculo_id}-${conflict.viagens.join("-")}`}>
                Veículo #{conflict.veiculo_id} em{" "}
                {formatTransporteValue(conflict.data)}: viagens{" "}
                {conflict.viagens.map((trip) => `#${trip}`).join(" e ")}.
              </li>
            ))}
          </ul>
        </div>
      )}
      {config.filters.length > 0 && (
        <form
          className="space-y-4 rounded-xl border border-border-subtle bg-white p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setFilters(
              Object.fromEntries(
                Object.entries(filterValues).filter(
                  ([, value]) => value !== "",
                ),
              ),
            );
          }}
        >
          <TransporteFields
            fields={config.filters}
            values={filterValues}
            onChange={(key, value) =>
              setFilterValues((current) => ({ ...current, [key]: value }))
            }
          />
          <div className="flex gap-2">
            <Button size="sm" fullWidth={false} type="submit">
              Filtrar
            </Button>
            <Button
              size="sm"
              fullWidth={false}
              variant="secondary"
              onClick={() => {
                setFilterValues({});
                setFilters({});
                setPage(1);
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </form>
      )}
      {config.key === "instituicoes" && canWrite && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (Number.isInteger(Number(lookupId)) && Number(lookupId) > 0)
              void showDetails(undefined, Number(lookupId));
          }}
        >
          <NumberInput
            label="ID da instituição"
            min={1}
            required
            value={lookupId}
            onChange={(event) => setLookupId(event.target.value)}
          />
          <Button
            type="submit"
            size="sm"
            fullWidth={false}
            loading={detailBusy}
          >
            Consultar pelo ID
          </Button>
        </form>
      )}
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(row) => row.key}
        gridClassName={gridClassName}
        loading={result.isLoading}
        skeleton={
          <div className="space-y-4 p-6">
            <TextSkeleton />
            <TextSkeleton />
            <TextSkeleton />
          </div>
        }
        errorMessage={result.error ? transporteError(result.error).message : ""}
        onRetry={() => void result.refresh()}
        pagination={
          meta
            ? {
                currentPage: meta.current_page,
                lastPage: meta.last_page,
                perPage: meta.per_page,
                total: meta.total,
                from: meta.from,
                to: meta.to,
                disabled: result.isFetching,
                onPageChange: setPage,
                onPerPageChange: (value) => {
                  setPage(1);
                  setPerPage(value);
                },
              }
            : undefined
        }
        renderRow={({ record }) => (
          <article
            className={`grid gap-3 border-b border-border-subtle px-5 py-4 text-sm last:border-b-0 md:items-center ${gridClassName}`}
          >
            {config.columns.map((column, index) => (
              <div className="min-w-0 break-words" key={column.key}>
                <span className="block text-xs font-semibold text-content-muted md:hidden">
                  {column.label}
                </span>
                {formatTransporteValue(
                  getTransporteValue(record, column.key),
                  column.key,
                )}
                {index === 0 &&
                  getTransporteValue(record, "id") !== undefined && (
                    <span className="mt-1 block text-xs text-content-muted">
                      #{String(getTransporteValue(record, "id"))}
                    </span>
                  )}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                fullWidth={false}
                disabled={detailBusy}
                onClick={() => void showDetails(record)}
              >
                Detalhes
              </Button>
              {canWrite && config.edit && (
                <Button
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onClick={() =>
                    open("edit", `Editar: ${config.label}`, record)
                  }
                >
                  Editar
                </Button>
              )}
              {canRemove && (
                <Button
                  size="sm"
                  variant="danger"
                  fullWidth={false}
                  onClick={() =>
                    open(
                      "remove",
                      `Excluir registro #${String(getTransporteValue(record, "id"))}`,
                      record,
                    )
                  }
                >
                  Excluir
                </Button>
              )}
              {canWrite && config.key === "veiculos" && (
                <Button
                  size="sm"
                  variant="secondary"
                  fullWidth={false}
                  onClick={() =>
                    open(
                      "qr",
                      "Gerar novo QR: o anterior deixará de valer",
                      record,
                    )
                  }
                >
                  Novo QR
                </Button>
              )}
              {canWrite &&
                config.key === "solicitacoes" &&
                getTransporteValue(record, "status") === "Pendente" && (
                  <Button
                    size="sm"
                    fullWidth={false}
                    onClick={() =>
                      open(
                        "approve",
                        "Aprovar vinculação de dispositivo",
                        record,
                      )
                    }
                  >
                    Aprovar
                  </Button>
                )}
              {canWrite &&
                config.key === "solicitacoes" &&
                ["Pendente", "Aprovada"].includes(
                  String(getTransporteValue(record, "status")),
                ) && (
                  <Button
                    size="sm"
                    variant="danger"
                    fullWidth={false}
                    onClick={() =>
                      open(
                        "reject",
                        "Rejeitar vinculação de dispositivo",
                        record,
                      )
                    }
                  >
                    Rejeitar
                  </Button>
                )}
              {canWrite &&
                config.key === "dispositivos" &&
                getTransporteValue(record, "status") === "Ativo" && (
                  <Button
                    size="sm"
                    variant="danger"
                    fullWidth={false}
                    onClick={() =>
                      open(
                        "revoke",
                        "Revogar dispositivo imediatamente",
                        record,
                      )
                    }
                  >
                    Revogar
                  </Button>
                )}
              {canWrite &&
                config.key === "tentativas" &&
                getTransporteValue(record, "revisao.status") === "Pendente" && (
                  <Button
                    size="sm"
                    fullWidth={false}
                    onClick={() =>
                      open("review", "Analisar revisão de presença", record)
                    }
                  >
                    Analisar
                  </Button>
                )}
            </div>
          </article>
        )}
      />
      {config.key === "instituicoes" && !meta && (
        <nav
          aria-label="Páginas de instituições"
          className="flex items-center justify-end gap-3 text-sm"
        >
          <Button
            variant="secondary"
            size="sm"
            fullWidth={false}
            disabled={page <= 1 || result.isFetching}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </Button>
          <span>Página {page}</span>
          <Button
            variant="secondary"
            size="sm"
            fullWidth={false}
            disabled={
              rows.length < 15 || result.isFetching || Boolean(result.error)
            }
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
          </Button>
        </nav>
      )}
      <Modal
        open={form !== null}
        title={form?.title ?? "Operação"}
        onClose={() => {
          if (!busy) {
            setForm(null);
            setError("");
          }
        }}
        onSave={() => formRef.current?.requestSubmit()}
        saveLabel={
          form?.operation === "remove" ? "Confirmar exclusão" : "Confirmar"
        }
        saveVariant={
          form && ["remove", "revoke", "reject", "qr"].includes(form.operation)
            ? "danger"
            : "primary"
        }
        saveLoading={busy}
      >
        {form && (
          <form
            ref={formRef}
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            {form.record && (
              <div className="rounded-lg bg-surface-muted p-3 text-sm">
                <strong>
                  Registro #{String(getTransporteValue(form.record, "id"))}
                </strong>
                <p>
                  {formatTransporteValue(
                    getTransporteValue(form.record, "estudante.name") ??
                      getTransporteValue(form.record, "identificacao") ??
                      getTransporteValue(form.record, "name") ??
                      getTransporteValue(form.record, "linha.name"),
                  )}
                </p>
                {getTransporteValue(form.record, "revisao.motivo") ? (
                  <p className="mt-2">
                    Pedido:{" "}
                    {String(getTransporteValue(form.record, "revisao.motivo"))}
                  </p>
                ) : null}
              </div>
            )}
            {form.operation === "remove" && (
              <p className="text-sm">
                Confirme a exclusão deste registro.{" "}
                {config.key === "dias"
                  ? "As viagens canceladas precisarão ser reativadas manualmente."
                  : "Registros com histórico podem ter a exclusão recusada pelo sistema."}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger-600">
                {error}
              </p>
            )}
            <TransporteFields
              fields={form.fields}
              values={form.values}
              errors={fieldErrors}
              disabled={busy}
              onChange={(key, value) =>
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        values: { ...current.values, [key]: value },
                      }
                    : null,
                )
              }
            />
            <button className="sr-only" type="submit" tabIndex={-1}>
              Confirmar
            </button>
          </form>
        )}
      </Modal>
      <Modal
        open={details !== null}
        title={`Detalhes: ${config.label}`}
        onClose={() => setDetails(null)}
        hideSave
      >
        <TransporteDetails value={details} />
        {details && config.key === "instituicoes" && canWrite && (
          <Button
            className="mt-5"
            fullWidth={false}
            onClick={() => {
              open("edit", "Editar instituição", details);
              setDetails(null);
            }}
          >
            Editar instituição
          </Button>
        )}
      </Modal>
      <Modal
        open={qr !== null}
        title="Guarde o novo código do veículo"
        onClose={() => setQr(null)}
        hideSave
      >
        {qr && (
          <div className="space-y-4">
            <p className="text-sm text-content-secondary">
              Este código aparece somente agora. Baixe ou imprima o QR do
              veículo. Um código substituído deixa de funcionar imediatamente.
            </p>
            <TransporteQrCode url={qr.url} />
            <Input label="Endereço do QR" readOnly value={qr.url} />
            <Button
              fullWidth={false}
              variant="secondary"
              onClick={() => void copy(qr.url)}
            >
              Copiar endereço
            </Button>
            <Input label="Token do QR" readOnly value={qr.token} />
            <Button
              fullWidth={false}
              variant="secondary"
              onClick={() => void copy(qr.token)}
            >
              Copiar token
            </Button>
            <Button
              fullWidth={false}
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([qr.url], { type: "text/plain;charset=utf-8" }),
                );
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "endereco-qr-veiculo.txt";
                anchor.click();
                URL.revokeObjectURL(url);
              }}
            >
              Salvar endereço
            </Button>
            {error && (
              <p role="alert" className="text-sm text-danger-600">
                {error}
              </p>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}
