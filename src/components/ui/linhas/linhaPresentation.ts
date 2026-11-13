import type { Linha } from "@/types/inscricao";
import type { LinhaFormErrors, LinhaFormValues } from "./LinhaFormFields";

export function validateLinhaForm(form: LinhaFormValues): LinhaFormErrors {
  const errors: LinhaFormErrors = {};
  if (form.name.trim().length < 3 || form.name.trim().length > 255)
    errors.name = "Informe um nome de 3 a 255 caracteres.";
  if (
    form.description.trim() &&
    (form.description.trim().length < 3 || form.description.trim().length > 255)
  )
    errors.description = "Informe uma descrição de 3 a 255 caracteres.";
  if (
    !Number.isInteger(Number(form.max_capacity)) ||
    Number(form.max_capacity) < 1
  )
    errors.max_capacity =
      "Informe a capacidade em número de lugares (mínimo 1).";
  for (const key of ["departure_time", "return_time"] as const)
    if (form[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form[key]))
      errors[key] = "Informe um horário válido no formato HH:MM.";
  return errors;
}

export function buildLinhaPayload(form: LinhaFormValues) {
  return {
    name: form.name.trim(),
    max_capacity: Number(form.max_capacity),
    ...(form.description.trim()
      ? { description: form.description.trim() }
      : {}),
    ...(form.departure_time ? { departure_time: form.departure_time } : {}),
    ...(form.return_time ? { return_time: form.return_time } : {}),
  };
}

export type LinhasViewMode = "grid" | "list";

export function horaParaInput(valor?: string | null) {
  return valor ? valor.slice(0, 5) : "";
}

export function formatLastPresence(value?: string | null) {
  if (!value) return "Sem presença registrada";

  const [year, month, day] = value.slice(0, 10).split("-");

  return `${day}/${month}/${year}`;
}

export function ocupacaoDe(linha: Linha) {
  const ocupacao = linha.ocupacao ?? 0;
  const capacidade = linha.max_capacity ?? 0;
  const proporcao = capacidade > 0 ? ocupacao / capacidade : 0;

  return {
    ocupacao,
    capacidade,
    vagas: linha.vagas_restantes ?? Math.max(0, capacidade - ocupacao),
    lotada: capacidade > 0 && ocupacao >= capacidade,
    proporcao: Math.min(1, proporcao),
  };
}
