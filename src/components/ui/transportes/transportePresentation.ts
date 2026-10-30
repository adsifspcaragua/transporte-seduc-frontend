import axios from "axios";
import type { TransporteField } from "./transporteConfig";

export const weekDays = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
export type TransporteFormValues = Record<string, string>;
export type TransporteFormPayload = Record<
  string,
  string | number | boolean | number[] | null
>;

export function getTransporteValue(record: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object"
          ? Reflect.get(value, key)
          : undefined,
      record,
    );
}

export function formatTransporteValue(value: unknown, key = ""): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) {
    if (key === "dias_semana")
      return value.map((day) => weekDays[Number(day)]).join(", ");
    return value.map((item) => formatTransporteValue(item)).join(", ") || "—";
  }
  if (typeof value === "object") {
    const label =
      getTransporteValue(value, "name") ??
      getTransporteValue(value, "nome") ??
      getTransporteValue(value, "identificacao") ??
      getTransporteValue(value, "linha.name");
    return label
      ? String(label)
      : `#${String(getTransporteValue(value, "id") ?? "—")}`;
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value.split("-").reverse().join("/");
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)
  ) {
    // API trip windows contain the local offset; other resource timestamps are UTC.
    const date = new Date(value);
    if (!Number.isNaN(date.getTime()))
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(date);
  }
  return String(value);
}

export function initialTransporteValues(
  fields: TransporteField[],
  record?: unknown,
): TransporteFormValues {
  return Object.fromEntries(
    fields.map((field) => {
      const raw = getTransporteValue(record, field.key);
      let value = raw === null || raw === undefined ? "" : String(raw);
      if (field.type === "boolean") value = raw === false ? "false" : "true";
      if (field.type === "time") value = value.slice(0, 5);
      if (field.type === "datetime-local")
        value = value.slice(0, 16).replace(" ", "T");
      if (
        field.key === "motivo" &&
        record &&
        getTransporteValue(record, "janela_inicio")
      )
        value = "";
      return [field.key, value];
    }),
  );
}

export function buildTransportePayload(
  fields: TransporteField[],
  values: TransporteFormValues,
): TransporteFormPayload {
  return Object.fromEntries(
    fields
      .filter((field) => !(field.omitEmpty && !values[field.key]))
      .map((field) => {
        const value = values[field.key]?.trim() ?? "";
        if (field.type === "boolean") return [field.key, value === "true"];
        if (field.type === "days" || field.type === "ids")
          return [
            field.key,
            value ? value.split(",").map((item) => Number(item.trim())) : [],
          ];
        if (field.type === "number")
          return [field.key, value === "" ? null : Number(value)];
        if (field.type === "datetime-local")
          return [field.key, value.replace("T", " ")];
        return [field.key, value || null];
      }),
  );
}

export function validateTransporteForm(
  fields: TransporteField[],
  values: TransporteFormValues,
) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.key]?.trim() ?? "";
    if (field.required && !value) errors[field.key] = "Campo obrigatório.";
    if (value && field.minLength && value.length < field.minLength)
      errors[field.key] = `Informe pelo menos ${field.minLength} caracteres.`;
    if (value && field.maxLength && value.length > field.maxLength)
      errors[field.key] = `Informe até ${field.maxLength} caracteres.`;
    if (value && field.type === "number") {
      const numeric = Number(value);
      if (
        !Number.isFinite(numeric) ||
        (field.min !== undefined && numeric < field.min) ||
        (field.max !== undefined && numeric > field.max) ||
        ((field.step ?? 1) === 1 && !Number.isInteger(numeric))
      )
        errors[field.key] =
          "Informe um número válido dentro dos limites do campo.";
    }
    if (value && (field.type === "days" || field.type === "ids")) {
      const entries = value.split(",").map((entry) => Number(entry.trim()));
      if (
        entries.some(
          (entry) =>
            !Number.isInteger(entry) ||
            entry < (field.type === "days" ? 0 : 1) ||
            (field.type === "days" && entry > 6),
        ) ||
        new Set(entries).size !== entries.length
      )
        errors[field.key] = "Informe números inteiros válidos, sem repetir.";
    }
  }
  for (const [start, end] of [
    ["inicio", "fim"],
    ["vigencia_inicio", "vigencia_fim"],
    ["de", "ate"],
    ["janela_inicio", "janela_fim"],
  ]) {
    if (
      values[start] &&
      values[end] &&
      (values[end] < values[start] ||
        (start === "janela_inicio" && values[end] === values[start]))
    )
      errors[end] = "O fim deve respeitar o início do intervalo.";
  }
  if (
    values.de &&
    values.ate &&
    (Date.parse(values.ate) - Date.parse(values.de)) / 86400000 > 62
  )
    errors.ate = "Gere no máximo 62 dias de diferença por vez.";
  return errors;
}

export function buildTransportePatch(
  fields: TransporteField[],
  values: TransporteFormValues,
  record: unknown,
) {
  const previous = initialTransporteValues(fields, record);
  const changed = fields.filter(
    (field) =>
      (field.key === "motivo" &&
        Boolean(getTransporteValue(record, "janela_inicio"))) ||
      values[field.key] !== previous[field.key],
  );
  return buildTransportePayload(changed, values);
}

type TransporteError = {
  message?: string;
  errors?: Record<string, string[]>;
  conflito_viagem_id?: number;
};
export function transporteError(error: unknown) {
  if (!axios.isAxiosError<TransporteError>(error))
    return {
      message: "Não foi possível concluir a operação.",
      fields: {} as Record<string, string>,
    };
  const data = error.response?.data;
  const status = error.response?.status;
  const fallback =
    status === 403
      ? "Você não tem permissão para esta operação."
      : status === 429
        ? "Muitas solicitações. Aguarde e tente novamente."
        : "Não foi possível concluir a operação. Tente novamente.";
  const fields = Object.fromEntries(
    Object.entries(data?.errors ?? {}).map(([key, messages]) => [
      key.split(".")[0],
      messages[0],
    ]),
  );
  return {
    message: data?.message ?? Object.values(fields)[0] ?? fallback,
    fields,
  };
}

export const transporteLabels: Record<string, string> = {
  id: "Identificador",
  name: "Nome",
  nome: "Nome",
  title: "Cargo",
  identificacao: "Identificação",
  placa: "Placa",
  ativo: "Ativo",
  qr_gerado_em: "QR gerado em",
  atribuicoes: "Atribuições",
  veiculo_id: "ID do veículo",
  veiculo: "Veículo",
  linha_id: "ID da linha",
  linha: "Linha",
  inicio: "Início",
  fim: "Fim",
  motivo: "Motivo",
  criada_por: "Criada por",
  sentido: "Sentido",
  dias_semana: "Dias da semana",
  horario_saida: "Saída",
  janela_antes_min: "Janela antes (min)",
  janela_depois_min: "Janela depois (min)",
  janela_efetiva: "Janela efetiva",
  antes_min: "Antes (min)",
  depois_min: "Depois (min)",
  vigencia_inicio: "Vigência inicial",
  vigencia_fim: "Vigência final",
  horario_id: "ID do horário",
  data: "Data",
  janela_inicio: "Início da janela",
  janela_fim: "Fim da janela",
  veiculo_substituido: "Veículo substituído",
  status: "Situação",
  motivo_alteracao: "Motivo da alteração",
  alterada_por: "Alterada por",
  presencas: "Presenças",
  criado_por: "Criado por",
  latitude: "Latitude",
  longitude: "Longitude",
  raio_metros: "Raio (m)",
  linhas: "Linhas",
  ponto_id: "ID do ponto",
  ponto: "Ponto",
  ordem: "Ordem",
  horario_previsto: "Passagem prevista",
  estudante_id: "ID do estudante",
  estudante: "Estudante",
  cpf: "CPF",
  tipo: "Tipo",
  parecer: "Parecer",
  analisada_por: "Analisada por",
  analisada_em: "Analisada em",
  aprovacao_expira_em: "Aprovação expira em",
  concluida_em: "Concluída em",
  created_at: "Criado em",
  rotulo: "Navegador",
  aprovado_por: "Aprovado por",
  aprovado_em: "Aprovado em",
  ultimo_uso_em: "Último uso",
  revogado_em: "Revogado em",
  revogado_por: "Revogado por",
  motivo_revogacao: "Motivo da revogação",
  viagem: "Viagem",
  metodo: "Método",
  registrada_em: "Registrada em",
  politica_geo: "Política de localização",
  resultado_geo: "Resultado de localização",
  distancia_metros: "Distância (m)",
  precisao_metros: "Precisão (m)",
  registrada_por: "Registrada por",
  justificativa: "Justificativa",
  dispositivo_id: "ID do dispositivo",
  presenca_id: "ID da presença",
  etapa: "Etapa",
  resultado: "Resultado",
  codigo: "Código",
  mensagem: "Mensagem",
  recebida_em: "Recebida em",
  pode_pedir_revisao: "Admite revisão",
  revisao: "Revisão",
  solicitada_em: "Solicitada em",
  user: "Responsável",
  acao: "Ação",
  auditavel_type: "Tipo de registro",
  auditavel_id: "ID do registro",
  dados: "Alterações",
  antes: "Antes",
  depois: "Depois",
  linhas_ids: "IDs das linhas",
  viagens_alteradas: "Viagens alteradas",
  viagens_canceladas: "Viagens canceladas",
  viagens_refeitas: "Viagens refeitas",
  viagem_id: "ID da viagem",
  autorizacao_id: "ID da autorização",
  atribuicao_id: "ID da atribuição",
};
