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
import { TransporteEstudanteField } from "./TransporteEstudanteField";
import {
  TransporteLinhaField,
  TransporteLinhasField,
  TransporteReferenceField,
  TransporteResponsavelDisponivelField,
  TransporteResponsavelField,
} from "./TransporteReferenceField";
import type { TransporteField } from "./transporteConfig";
import type { TransporteFormValues } from "./transportePresentation";
import { weekDays } from "./transportePresentation";

type Props = {
  fields: TransporteField[];
  values: TransporteFormValues;
  errors?: Record<string, string>;
  disabled?: boolean;
  responsaveis?: unknown[];
  onChange: (key: string, value: string) => void;
};

export function TransporteFields({
  fields,
  values,
  errors = {},
  disabled,
  responsaveis = [],
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
        if (field.key === "estudante_id")
          return can("estudantes.view") ? (
            <TransporteEstudanteField
              {...props}
              field={field}
              key={field.key}
            />
          ) : (
            <Input
              {...props}
              key={field.key}
              label="Estudante"
              disabled
              hint="Seu perfil não permite consultar o cadastro de estudantes."
            />
          );
        if (field.key === "linhas_ids")
          return can("linhas.view") ? (
            <TransporteLinhasField {...props} field={field} key={field.key} />
          ) : (
            <Input
              {...props}
              key={field.key}
              label="Linhas vinculadas"
              disabled
              hint="Seu perfil não permite consultar as linhas."
            />
          );
        if (field.key === "user_id")
          return can("users.view") ? (
            <TransporteResponsavelField
              {...props}
              field={field}
              key={field.key}
            />
          ) : (
            <TransporteResponsavelDisponivelField
              {...props}
              field={field}
              records={responsaveis}
              key={field.key}
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
        if (field.key === "viagem_id" && can("viagens.view"))
          return (
            <TransporteReferenceField
              {...props}
              field={field}
              resource="viagens"
              key={field.key}
            />
          );
        if (
          ["linha_id", "veiculo_id", "ponto_id", "viagem_id"].includes(
            field.key,
          )
        )
          return (
            <Input
              {...props}
              key={field.key}
              disabled
              label={field.label.replace(/^ID (da|do) /, "")}
              hint="Seu perfil não permite consultar este cadastro."
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
