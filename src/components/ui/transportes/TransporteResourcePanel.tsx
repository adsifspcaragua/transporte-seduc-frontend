"use client";

import axios from "axios";
import {
  Ban,
  Check,
  ClipboardCheck,
  Eye,
  Pencil,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { Checkbox, Input, NumberInput } from "@/components/form/inputs";
import { TextSkeleton } from "@/components/loading";
import { Modal } from "@/components/modal";
import { DataTable, TableActionButton } from "@/components/table";
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
import type {
  TransportePeriod,
  TransporteSaveNotice,
} from "@/types/transporte-operacao";
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
  guidedDuplicate,
  guidedFields,
  scopedValues,
  shouldReconcileGuidedFailure,
} from "./transporteOperacaoPresentation";
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
  2: "md:grid-cols-[minmax(0,1fr)_9rem]",
  3: "md:grid-cols-[repeat(2,minmax(0,1fr))_9rem]",
  4: "md:min-w-[40rem] md:grid-cols-[repeat(3,minmax(0,1fr))_9rem]",
  5: "md:min-w-[48rem] md:grid-cols-[repeat(4,minmax(0,1fr))_9rem]",
  6: "md:min-w-[52rem] md:grid-cols-[repeat(5,minmax(0,1fr))_9rem]",
  7: "md:min-w-[56rem] md:grid-cols-[repeat(6,minmax(0,1fr))_9rem]",
};

export function TransporteResourcePanel({
  config,
  guided,
}: {
  config: TransporteConfig;
  guided?: {
    linhaId: number;
    period: TransportePeriod;
    hideList?: boolean;
    defaults?: TransporteFormValues;
    onSaved: (notice: TransporteSaveNotice) => void;
  };
}) {
  const { can, canAny } = useAuthz();
  const canWrite = Boolean(config.write && can(config.write));
  const canRemove = Boolean(config.remove && can(config.remove));
  // Começa no que pede decisão: negativas com pedido de revisão e
  // comprovantes feitos sem conexão.
  const [filters, setFilters] = useState<TransporteFiltros>(
    config.key === "tentativas" ? { revisao_status: "Pendente" } : {},
  );
  const [filterValues, setFilterValues] = useState<TransporteFormValues>(
    config.key === "tentativas" ? { revisao_status: "Pendente" } : {},
  );
  const [page, setPage] = useState(1);
  const [filterReset, setFilterReset] = useState(0);
  const [perPage, setPerPage] = useState(15);
  const result = useCachedQuery(transporteQuery, config.key, {
    ...filters,
    ...(guided
      ? {
          linha_id: guided.linhaId,
          ...(config.key === "viagens" || config.key === "dias"
            ? guided.period
            : {}),
        }
      : {}),
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
  const [uncertain, setUncertain] = useState(false);
  const [confirmedScope, setConfirmedScope] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const mutationLock = useRef(false);
  const columns = [...config.columns, { key: "actions", label: "Ações" }];
  const gridClassName = `${gridClasses[columns.length] ?? "md:grid-cols-4"} md:gap-4`;

  function open(
    operation: Operation,
    title: string,
    record?: TransporteRegistro,
  ) {
    if (guided && uncertain) return;
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
    setConfirmedScope(false);
    setForm({
      operation,
      title,
      fields,
      record,
      values: {
        ...initialTransporteValues(fields, record),
        ...(guided && !record ? guided.defaults : {}),
        ...(guided && fields.some((f) => f.key === "linha_id")
          ? { linha_id: String(guided.linhaId) }
          : {}),
        ...(guided && operation === "generate" ? guided.period : {}),
      },
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
    if (!form || busy || mutationLock.current) return;
    if (guided && (uncertain || !confirmedScope)) return;
    const isRemove = form.operation === "remove";
    if (!(isRemove ? canRemove : canWrite) || !canAny(config.view)) return;
    const values =
      guided && form.fields.some((f) => f.key === "linha_id")
        ? scopedValues(
            form.values,
            guided.linhaId,
            form.operation === "generate" ? guided.period : undefined,
          )
        : form.values;
    const nextErrors = validateTransporteForm(form.fields, values);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const payload =
      form.operation === "edit"
        ? buildTransportePatch(form.fields, values, form.record)
        : buildTransportePayload(form.fields, values);
    const id = getTransporteValue(form.record, "id");
    const session = getQuerySessionVersion();
    setBusy(true);
    setError("");
    setMessage("");
    setConflicts([]);
    mutationLock.current = true;
    let sent = false;
    let accepted = false;
    let issuedQr = false;
    try {
      if (guided && form.operation === "create") {
        const existing = await transporteService.list(config.key, {
          linha_id: guided.linhaId,
        });
        if (session !== getQuerySessionVersion()) return;
        if (guidedDuplicate(config.key, payload, existing.data)) {
          setError(
            "Já existe um cadastro equivalente. Use o registro existente ou confira seus dados antes de cadastrar outro.",
          );
          return;
        }
      }
      let response: TransporteMutation;
      sent = true;
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
      accepted = true;
      const nextQr = getTransporteValue(response.data, "qr");
      if (
        nextQr &&
        typeof getTransporteValue(nextQr, "token") === "string" &&
        typeof getTransporteValue(nextQr, "url") === "string"
      ) {
        setQr(nextQr as QrVeiculo);
        issuedQr = true;
      }
      const nextConflicts =
        response.conflitos ?? getTransporteValue(response.data, "conflitos");
      if (Array.isArray(nextConflicts))
        setConflicts(nextConflicts as ConflitoViagem[]);
      if (guided) {
        // A successful mutation is not enough: independently read its result.
        const savedId = getTransporteValue(response.data, "id") ?? id;
        if (form.operation === "generate") {
          const { readAllTrips } = await import(
            "@/services/api/modules/transporte-operacao"
          );
          await readAllTrips(guided.period);
        } else if (detailResources.has(config.key) && savedId != null) {
          await transporteService.detail(config.key, String(savedId));
        } else {
          const check = await transporteService.list(config.key, {
            linha_id: guided.linhaId,
          });
          if (
            savedId == null ||
            !check.data.some(
              (item) => getTransporteValue(item, "id") === savedId,
            )
          )
            throw new Error("Resultado não confirmado");
        }
        if (session !== getQuerySessionVersion()) return;
        guided.onSaved({
          text: `${config.label}: ${response.message ?? "gravação conferida no servidor."}`,
          confirmed: true,
        });
      }
      setMessage(
        `${response.message ?? "Operação concluída."}${response.viagens_canceladas !== undefined ? ` ${response.viagens_canceladas} viagem(ns) cancelada(s).` : ""}`,
      );
      setForm(null);
      // Cross-module mutations affect trips, assignments, indicators and audit together.
      invalidateQueries();
    } catch (failure) {
      if (session !== getQuerySessionVersion()) return;
      const failureData = transporteError(failure);
      setError(
        guided &&
          config.key === "viagens" &&
          axios.isAxiosError(failure) &&
          failure.response?.status === 409
          ? "Este veículo já está previsto em outra viagem com janela sobreposta. Confira o calendário e ajuste a janela ou escolha outro veículo."
          : failureData.message,
      );
      setFieldErrors(failureData.fields);
      if (
        guided &&
        shouldReconcileGuidedFailure(
          sent,
          accepted,
          axios.isAxiosError(failure) ? failure.response?.status : undefined,
        )
      ) {
        setUncertain(true);
        if (issuedQr) setForm(null);
        setError(
          "O resultado do envio não foi confirmado. A consulta dos registros foi atualizada. Para evitar duplicação, novos envios desta seção ficam bloqueados nesta configuração; confira os registros em Cadastros e manutenção.",
        );
        guided.onSaved({
          text: `${config.label}: resultado do envio a conferir na manutenção. Não repita o cadastro sem consultar os registros.`,
          confirmed: false,
        });
        invalidateQueries();
        await result.refresh();
      }
    } finally {
      if (session === getQuerySessionVersion()) {
        mutationLock.current = false;
        setBusy(false);
      }
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

  const rows = (result.data?.data ?? [])
    .filter(
      (record) =>
        !guided ||
        config.key !== "dias" ||
        getTransporteValue(record, "linha_id") == null ||
        getTransporteValue(record, "linha_id") === guided.linhaId,
    )
    .map((record, index) => ({
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
          {canWrite && config.create && !uncertain && (
            <Button
              size="sm"
              fullWidth={false}
              onClick={() => open("create", `Cadastrar: ${config.label}`)}
            >
              Cadastrar
            </Button>
          )}
          {canWrite && config.key === "viagens" && !uncertain && (
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
                {guided
                  ? "Conflito informado pelo servidor em "
                  : `Veículo #${conflict.veiculo_id} em `}{" "}
                {formatTransporteValue(conflict.data)}: viagens{" "}
                {guided
                  ? "com janelas sobrepostas. Confira os detalhes no resumo do calendário."
                  : conflict.viagens.map((trip) => `#${trip}`).join(" e ")}
                .
              </li>
            ))}
          </ul>
        </div>
      )}
      {!guided && config.filters.length > 0 && (
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
            key={filterReset}
            fields={config.filters}
            responsaveis={(result.data?.data ?? [])
              .map((record) => getTransporteValue(record, "user"))
              .filter(Boolean)}
            values={filterValues}
            onChange={(key, value) =>
              setFilterValues((current) => ({ ...current, [key]: value }))
            }
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" fullWidth={false} type="submit">
              Filtrar
            </Button>
            <Button
              size="sm"
              fullWidth={false}
              variant="secondary"
              onClick={() => {
                setFilterValues({});
                setFilterReset((current) => current + 1);
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
      {!guided?.hideList && (
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
          errorMessage={
            result.error ? transporteError(result.error).message : ""
          }
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
                  {!guided &&
                    index === 0 &&
                    getTransporteValue(record, "id") !== undefined && (
                      <span className="mt-1 block text-xs text-content-muted">
                        #{String(getTransporteValue(record, "id"))}
                      </span>
                    )}
                </div>
              ))}
              <div className="flex flex-nowrap items-center gap-1">
                {!guided && (
                  <TableActionButton
                    ariaLabel="Detalhes"
                    tooltip="Detalhes"
                    icon={<Eye />}
                    variant="secondary"
                    loading={detailBusy}
                    onClick={() => void showDetails(record)}
                  />
                )}
                {canWrite &&
                  config.edit &&
                  !uncertain &&
                  !(
                    guided &&
                    (config.key === "veiculos" ||
                      config.key === "pontos" ||
                      (config.key === "dias" &&
                        getTransporteValue(record, "linha_id") == null))
                  ) && (
                    <TableActionButton
                      ariaLabel="Editar"
                      tooltip="Editar"
                      icon={<Pencil />}
                      variant="secondary"
                      onClick={() =>
                        open("edit", `Editar: ${config.label}`, record)
                      }
                    />
                  )}

                {!guided && canWrite && config.key === "veiculos" && (
                  <TableActionButton
                    ariaLabel="Novo QR"
                    tooltip="Novo QR"
                    icon={<QrCode />}
                    variant="secondary"
                    onClick={() =>
                      open(
                        "qr",
                        "Gerar novo QR: o anterior deixará de valer",
                        record,
                      )
                    }
                  />
                )}
                {canWrite &&
                  config.key === "solicitacoes" &&
                  getTransporteValue(record, "status") === "Pendente" && (
                    <TableActionButton
                      ariaLabel="Aprovar"
                      tooltip="Aprovar"
                      icon={<Check />}
                      variant="approved"
                      onClick={() =>
                        open(
                          "approve",
                          "Aprovar vinculação de dispositivo",
                          record,
                        )
                      }
                    />
                  )}
                {canWrite &&
                  config.key === "solicitacoes" &&
                  ["Pendente", "Aprovada"].includes(
                    String(getTransporteValue(record, "status")),
                  ) && (
                    <TableActionButton
                      ariaLabel="Rejeitar"
                      tooltip="Rejeitar"
                      icon={<X />}
                      variant="danger"
                      onClick={() =>
                        open(
                          "reject",
                          "Rejeitar vinculação de dispositivo",
                          record,
                        )
                      }
                    />
                  )}
                {canWrite &&
                  config.key === "dispositivos" &&
                  getTransporteValue(record, "status") === "Ativo" && (
                    <TableActionButton
                      ariaLabel="Revogar"
                      tooltip="Revogar"
                      icon={<Ban />}
                      variant="danger"
                      onClick={() =>
                        open(
                          "revoke",
                          "Revogar dispositivo imediatamente",
                          record,
                        )
                      }
                    />
                  )}
                {canWrite &&
                  config.key === "tentativas" &&
                  getTransporteValue(record, "revisao.status") ===
                    "Pendente" && (
                    <TableActionButton
                      ariaLabel="Analisar"
                      tooltip="Analisar"
                      icon={<ClipboardCheck />}
                      variant="primary"
                      onClick={() =>
                        open("review", "Analisar revisão de presença", record)
                      }
                    />
                  )}
                {!guided && canRemove && (
                  <TableActionButton
                    ariaLabel="Excluir"
                    tooltip="Excluir"
                    icon={<Trash2 />}
                    variant="danger"
                    onClick={() =>
                      open(
                        "remove",
                        `Excluir registro #${String(getTransporteValue(record, "id"))}`,
                        record,
                      )
                    }
                  />
                )}
              </div>
            </article>
          )}
        />
      )}
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
        saveDisabled={Boolean(
          guided && (!confirmedScope || uncertain || !canWrite),
        )}
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
            {form.record && !guided && (
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
            {guided && (
              <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
                <p>
                  Confirmar grava imediatamente no cadastro compartilhado.
                  Voltar ou sair do assistente não desfaz esta ação.
                </p>
                <p>
                  {config.key === "horarios"
                    ? "Salvar horário pode gerar viagens de hoje e descartar viagens futuras sem presença ou ajuste manual. Gere novamente o período quando necessário."
                    : config.key === "atribuicoes"
                      ? "A alocação pode mudar o veículo de viagens programadas ainda não encerradas, preservando substituições manuais. Conflitos podem ser informados depois da gravação."
                      : config.key === "dias"
                        ? "Esta suspensão será desta linha e cancela viagens programadas da data. Sua remoção não reativa viagens."
                        : config.key === "viagens"
                          ? form.operation === "generate"
                            ? "A geração cria viagens no período selecionado. Eventuais conflitos não desfazem as viagens geradas."
                            : "Este ajuste muda somente a viagem selecionada e exige motivo. Envie apenas as alterações pretendidas."
                          : "Este recurso ficará disponível para outras configurações, mesmo que você não conclua as etapas."}
                </p>
                {form.operation === "generate" && (
                  <p>
                    Período: {formatTransporteValue(guided.period.de)} a{" "}
                    {formatTransporteValue(guided.period.ate)}.
                  </p>
                )}
                <Checkbox
                  label="Entendi o alcance e quero gravar esta alteração."
                  checked={confirmedScope}
                  disabled={busy || uncertain}
                  onChange={(event) => setConfirmedScope(event.target.checked)}
                />
              </div>
            )}
            <TransporteFields
              fields={
                guided
                  ? guidedFields(form.fields).filter(
                      (f) =>
                        form.operation !== "generate" ||
                        (f.key !== "de" && f.key !== "ate"),
                    )
                  : form.fields
              }
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
