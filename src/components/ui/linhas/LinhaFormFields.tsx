"use client";

import {
  Input,
  NumberInput,
  TimeInput,
} from "@/components/form/inputs";

export type LinhaFormValues = {
  name: string;
  description: string;
  departure_time: string;
  return_time: string;
  max_capacity: string;
};
export type LinhaFormErrors = Partial<Record<keyof LinhaFormValues, string>>;

export function LinhaFormFields({
  values,
  errors,
  onChange,
  basic = false,
}: {
  values: LinhaFormValues;
  errors: LinhaFormErrors;
  onChange: (field: keyof LinhaFormValues, value: string) => void;
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
    </>
  );
}
