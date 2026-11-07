"use client";

import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/buttons";
import { Checkbox, Input, Select } from "@/components/form/inputs";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { transporteQuery } from "@/services/api/modules/transporte";
import { linhasQuery, usersQuery } from "@/services/api/page-queries";
import type { TransporteField } from "./transporteConfig";
import {
  formatTransporteValue,
  getTransporteValue,
} from "./transportePresentation";

type Props = {
  field: TransporteField;
  value: string;
  disabled?: boolean;
  error?: string;
  onChange: (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
};

export function ReferenceSelect({
  field,
  value,
  disabled,
  error,
  onChange,
  records,
  fetching,
  failed,
  refresh,
}: Props & {
  records: unknown[];
  fetching: boolean;
  failed: boolean;
  refresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const options = records
    .map((record) => ({
      value: String(getTransporteValue(record, "id")),
      label: String(
        getTransporteValue(record, "name") ??
          getTransporteValue(record, "identificacao") ??
          getTransporteValue(record, "nome") ??
          [
            getTransporteValue(record, "linha.name"),
            getTransporteValue(record, "data")
              ? formatTransporteValue(getTransporteValue(record, "data"))
              : null,
            getTransporteValue(record, "sentido"),
            getTransporteValue(record, "horario_saida"),
          ]
            .filter(Boolean)
            .join(" — "),
      ),
    }))
    .filter((option) =>
      option.label
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
    );
  if (value && !options.some((option) => option.value === value))
    options.unshift({
      value,
      label: "Registro selecionado (fora dos resultados)",
    });
  if (!field.required) options.unshift({ value: "", label: "Sem seleção" });
  return (
    <div className="min-w-0 space-y-3">
      <Input
        label={`Pesquisar: ${field.label.replace(/^ID (da|do) /, "")}`}
        value={search}
        hint="Pesquisa nas opções carregadas."
        disabled={disabled}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Select
        label={field.label.replace("ID da ", "").replace("ID do ", "")}
        value={value}
        disabled={disabled || fetching || failed}
        required={field.required}
        error={error}
        hint={failed ? "Não foi possível consultar as opções." : field.hint}
        onChange={onChange}
        options={options}
        placeholder={
          fetching
            ? "Carregando opções..."
            : options.length
              ? "Selecione"
              : "Nenhum resultado nesta página"
        }
      />
      {failed && (
        <Button
          size="sm"
          fullWidth={false}
          variant="secondary"
          disabled={disabled}
          onClick={refresh}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function TransporteLinhaField(props: Props) {
  const result = useCachedQuery(linhasQuery);
  return (
    <ReferenceSelect
      {...props}
      records={result.data ?? []}
      fetching={result.isLoading}
      failed={Boolean(result.error)}
      refresh={() => void result.refresh()}
    />
  );
}

export function TransporteResponsavelField(props: Props) {
  const result = useCachedQuery(usersQuery);
  return (
    <ReferenceSelect
      {...props}
      records={result.data ?? []}
      fetching={result.isLoading}
      failed={Boolean(result.error)}
      refresh={() => void result.refresh()}
    />
  );
}

export function TransporteResponsavelDisponivelField(
  props: Props & { records: unknown[] },
) {
  const records = Array.from(
    new Map(
      props.records.map(
        (record) => [String(getTransporteValue(record, "id")), record] as const,
      ),
    ).values(),
  );
  return (
    <ReferenceSelect
      {...props}
      records={records}
      field={{
        ...props.field,
        hint: "Responsáveis dos registros carregados. Navegue pelas páginas para encontrar outros.",
      }}
      fetching={false}
      failed={false}
      refresh={() => {}}
    />
  );
}

export function TransporteLinhasField({
  field,
  value,
  disabled,
  error,
  onChange,
}: Props) {
  const result = useCachedQuery(linhasQuery);
  const selected = value.split(",").filter(Boolean);
  return (
    <fieldset
      disabled={disabled || result.isLoading || Boolean(result.error)}
      className="min-w-0 space-y-3 md:col-span-2"
    >
      <legend className="mb-2 text-sm font-medium">Linhas vinculadas</legend>
      <p className="text-xs text-content-muted">
        Selecione as linhas atendidas. Sem seleção, a instituição ficará sem
        vínculos.
      </p>
      <div className="grid max-h-60 gap-3 overflow-y-auto p-1 sm:grid-cols-2">
        {(result.data ?? []).map((line) => (
          <Checkbox
            key={line.id}
            label={line.name}
            checked={selected.includes(String(line.id))}
            onChange={(event) => {
              const next = event.target.checked
                ? [...selected, String(line.id)]
                : selected.filter((id) => id !== String(line.id));
              onChange({
                target: { name: field.key, value: next.join(",") },
              } as ChangeEvent<HTMLInputElement>);
            }}
          />
        ))}
      </div>
      {result.isLoading ? (
        <output className="text-xs">Carregando linhas...</output>
      ) : result.error ? (
        <p role="alert" className="text-sm text-danger-600">
          Não foi possível carregar as linhas. Feche o formulário e tente
          novamente.
        </p>
      ) : result.data?.length === 0 ? (
        <p className="text-xs text-content-muted">Nenhuma linha cadastrada.</p>
      ) : null}
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function TransporteReferenceField(
  props: Props & { resource: "veiculos" | "pontos" | "viagens" },
) {
  const [page, setPage] = useState(1);
  const result = useCachedQuery(transporteQuery, props.resource, {
    page,
    per_page: 15,
  });
  const meta = result.data?.meta;
  return (
    <div className="min-w-0 space-y-3">
      <ReferenceSelect
        {...props}
        records={result.data?.data ?? []}
        fetching={result.isLoading}
        failed={Boolean(result.error)}
        refresh={() => void result.refresh()}
      />
      {meta && meta.last_page > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            fullWidth={false}
            disabled={props.disabled || result.isFetching || page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </Button>
          <span className="text-xs text-content-muted">
            Página {page} de {meta.last_page}
          </span>
          <Button
            size="sm"
            variant="secondary"
            fullWidth={false}
            disabled={
              props.disabled || result.isFetching || page >= meta.last_page
            }
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
