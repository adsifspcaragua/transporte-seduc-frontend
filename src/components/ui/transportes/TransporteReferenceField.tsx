"use client";

import type { ChangeEvent } from "react";
import { NumberInput, Select } from "@/components/form/inputs";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { transporteQuery } from "@/services/api/modules/transporte";
import { linhasQuery } from "@/services/api/page-queries";
import type { TransporteField } from "./transporteConfig";
import { getTransporteValue } from "./transportePresentation";

type Props = {
  field: TransporteField;
  value: string;
  disabled?: boolean;
  error?: string;
  onChange: (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
};

function ReferenceSelect({
  field,
  value,
  disabled,
  error,
  onChange,
  records,
  fetching,
  failed,
}: Props & { records: unknown[]; fetching: boolean; failed: boolean }) {
  if (failed)
    return (
      <NumberInput
        label={field.label}
        value={value}
        disabled={disabled}
        required={field.required}
        error={error}
        hint="Consulta de opções indisponível. Informe o identificador do registro."
        min={1}
        onChange={onChange}
      />
    );
  const options = records.map((record) => ({
    value: String(getTransporteValue(record, "id")),
    label: `${String(getTransporteValue(record, "name") ?? getTransporteValue(record, "identificacao") ?? getTransporteValue(record, "nome"))} (#${String(getTransporteValue(record, "id"))})`,
  }));
  if (value && !options.some((option) => option.value === value))
    options.unshift({ value, label: `Registro #${value}` });
  return (
    <Select
      label={field.label.replace("ID da ", "").replace("ID do ", "")}
      value={value}
      disabled={disabled || fetching}
      required={field.required}
      error={error}
      hint={field.hint}
      onChange={onChange}
      options={options}
      placeholder={fetching ? "Carregando opções..." : "Selecione"}
    />
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
    />
  );
}

export function TransporteReferenceField(
  props: Props & { resource: "veiculos" | "pontos" },
) {
  const result = useCachedQuery(transporteQuery, props.resource, {});
  return (
    <ReferenceSelect
      {...props}
      records={result.data?.data ?? []}
      fetching={result.isLoading}
      failed={Boolean(result.error)}
    />
  );
}
