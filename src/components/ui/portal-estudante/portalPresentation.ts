import axios from "axios";
import type { PortalErroResposta } from "@/types/portal-estudante";

export function portalError(error: unknown) {
  if (axios.isAxiosError<PortalErroResposta>(error)) {
    if (error.response?.status === 429)
      return "Muitas tentativas. Aguarde antes de tentar novamente.";
    const data = error.response?.data;
    return (
      Object.values(data?.errors ?? {}).flat()[0] ??
      data?.message ??
      "Não foi possível concluir a solicitação. Verifique sua conexão e tente novamente."
    );
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a solicitação.";
}

export function portalDate(value: string | null | undefined, withTime = false) {
  if (!value) return "Não informado";
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00-03:00` : value,
  );
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

export function portalTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informado"
    : new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}
