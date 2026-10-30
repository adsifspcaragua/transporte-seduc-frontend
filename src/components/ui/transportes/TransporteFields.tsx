"use client";

import {
  Checkbox,
  DateInput,
  Input,
  NumberInput,
  Select,
  Textarea,
  TimeInput,
} from "@/components/form/inputs";
import { useAuthz } from "@/hooks/use-authz";
import {
  TransporteLinhaField,
  TransporteReferenceField,
} from "./TransporteReferenceField";
import type { TransporteField } from "./transporteConfig";
import type { TransporteFormValues } from "./transportePresentation";
import { weekDays } from "./transportePresentation";

type Props = {
  fields: TransporteField[];
  values: TransporteFormValues;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (key: string, value: string) => void;
};

export function TransporteFields({
  fields,
  values,
  errors = {},
  disabled,
  onChange,
}: Props) {
  const { can } = useAuthz();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((field) => {
        const props = {
          label: field.label,
          name: field.key,
          value: values[field.key] ?? "",
          required: field.required,
          disabled,
          error: errors[field.key],
          hint: field.hint,
          onChange: (
            event: React.ChangeEvent<
              HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >,
          ) => onChange(field.key, event.target.value),
        };
        if (field.type === "boolean")
          return (
            <Checkbox
              key={field.key}
              label={field.label}
              disabled={disabled}
              checked={values[field.key] === "true"}
              onChange={(event) =>
                onChange(field.key, String(event.target.checked))
              }
              error={errors[field.key]}
            />
          );
        if (field.type === "days") {
          const selected = values[field.key]?.split(",").filter(Boolean) ?? [];
          return (
            <fieldset
              className="md:col-span-2"
              key={field.key}
              disabled={disabled}
            >
              <legend className="mb-3 text-sm font-medium">
                {field.label}
              </legend>
              <div className="flex flex-wrap gap-4">
                {weekDays.map((day, index) => (
                  <Checkbox
                    key={day}
                    label={day}
                    checked={selected.includes(String(index))}
                    onChange={(event) =>
                      onChange(
                        field.key,
                        (event.target.checked
                          ? [...selected, String(index)]
                          : selected.filter((item) => item !== String(index))
                        )
                          .sort()
                          .join(","),
                      )
                    }
                  />
                ))}
              </div>
              {errors[field.key] && (
                <p className="mt-2 text-sm text-danger-600">
                  {errors[field.key]}
                </p>
              )}
            </fieldset>
          );
        }
        if (field.options)
          return (
            <Select
              {...props}
              key={field.key}
              placeholder="Selecione"
              options={field.options.map((option) => ({
                value: option,
                label:
                  field.key === "ativo"
                    ? option === "1"
                      ? "Ativo"
                      : "Inativo"
                    : option,
              }))}
            />
          );
        if (field.key === "linha_id" && can("linhas.view"))
          return (
            <TransporteLinhaField {...props} field={field} key={field.key} />
          );
        if (field.key === "veiculo_id" && can("veiculos.view"))
          return (
            <TransporteReferenceField
              {...props}
              field={field}
              resource="veiculos"
              key={field.key}
            />
          );
        if (field.key === "ponto_id" && can("geocercas.view"))
          return (
            <TransporteReferenceField
              {...props}
              field={field}
              resource="pontos"
              key={field.key}
            />
          );
        if (field.type === "number")
          return (
            <NumberInput
              {...props}
              key={field.key}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
            />
          );
        if (field.type === "date")
          return <DateInput {...props} key={field.key} />;
        if (field.type === "time")
          return <TimeInput {...props} key={field.key} />;
        if (field.type === "textarea")
          return (
            <Textarea
              {...props}
              key={field.key}
              minLength={field.minLength}
              maxLength={field.maxLength}
              containerClassName="md:col-span-2"
            />
          );
        return (
          <Input
            {...props}
            key={field.key}
            minLength={field.minLength}
            maxLength={field.maxLength}
            type={field.type === "datetime-local" ? field.type : "text"}
          />
        );
      })}
    </div>
  );
}
