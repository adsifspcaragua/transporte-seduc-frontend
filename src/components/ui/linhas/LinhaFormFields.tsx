"use client";

import {
  Input,
  NumberInput,
  Select,
  TimeInput,
} from "@/components/form/inputs";
import type { DriverOption } from "@/types/user";

export type LinhaFormValues = {
  name: string;
  description: string;
  departure_time: string;
  return_time: string;
  max_capacity: string;
  motorista_id: string;
};
export type LinhaFormErrors = Partial<Record<keyof LinhaFormValues, string>>;

export function LinhaFormFields({
  values,
  errors,
  onChange,
  drivers = [],
  driversError,
  basic = false,
}: {
  values: LinhaFormValues;
  errors: LinhaFormErrors;
  onChange: (field: keyof LinhaFormValues, value: string) => void;
  drivers?: DriverOption[];
  driversError?: string;
  basic?: boolean;
}) {
  return (
    <>
      <Input
        label="Nome"
        required
        value={values.name}
        error={errors.name}
        aria-invalid={Boolean(errors.name)}
        onChange={(e) => onChange("name", e.target.value)}
      />
      <Input
        label="Descrição da rota"
        placeholder="Bairros e instituições atendidas"
        value={values.description}
        error={errors.description}
        aria-invalid={Boolean(errors.description)}
        onChange={(e) => onChange("description", e.target.value)}
      />
      {!basic && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TimeInput
            label="Horário de saída"
            value={values.departure_time}
            error={errors.departure_time}
            aria-invalid={Boolean(errors.departure_time)}
            onChange={(e) => onChange("departure_time", e.target.value)}
          />
          <TimeInput
            label="Horário de retorno"
            value={values.return_time}
            error={errors.return_time}
            aria-invalid={Boolean(errors.return_time)}
            onChange={(e) => onChange("return_time", e.target.value)}
          />
        </div>
      )}
      <NumberInput
        label="Capacidade (lugares)"
        required
        min={1}
        value={values.max_capacity}
        error={errors.max_capacity}
        aria-invalid={Boolean(errors.max_capacity)}
        onChange={(e) => onChange("max_capacity", e.target.value)}
      />
      {!basic && (
        <Select
          label="Motorista responsável"
          value={values.motorista_id}
          error={errors.motorista_id}
          aria-invalid={Boolean(errors.motorista_id)}
          hint={driversError}
          onChange={(e) => onChange("motorista_id", e.target.value)}
          options={[
            { value: "", label: "Nenhum motorista vinculado" },
            ...drivers.map((d) => ({ value: String(d.id), label: d.name })),
          ]}
        />
      )}
    </>
  );
}
