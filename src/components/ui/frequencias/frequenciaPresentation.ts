import type {
  Chamada,
  FrequenciaLinha,
  FrequenciaRegistro,
  FrequenciaSituacao,
  RegistrarFrequenciaItem,
} from "@/types/frequencia";

export type ChamadaDraftEntry = {
  situacao: FrequenciaSituacao;
  observacao: string;
};

export type ChamadaDraft = Record<number, ChamadaDraftEntry>;

export type ChamadaDraftErrors = Partial<Record<number, string>>;

function normalizedObservation(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function createChamadaDraft(
  chamada: Pick<Chamada, "frequencias">,
): ChamadaDraft {
  return Object.fromEntries(
    chamada.frequencias.map((registro) => [
      registro.estudante_id,
      {
        situacao: registro.situacao,
        observacao: registro.observacao ?? "",
      },
    ]),
  );
}

export function isRegistroLocked(registro: FrequenciaRegistro) {
  const status = registro.justificativa?.status;
  return status === "Aprovada" || status === "Rejeitada";
}

export function getChangedEntries(
  chamada: Pick<Chamada, "frequencias">,
  draft: ChamadaDraft,
): RegistrarFrequenciaItem[] {
  return chamada.frequencias.flatMap((registro) => {
    const entry = draft[registro.estudante_id];

    if (!entry || isRegistroLocked(registro)) return [];

    const observation = normalizedObservation(entry.observacao);
    const unchanged =
      entry.situacao === registro.situacao &&
      observation === normalizedObservation(registro.observacao);

    if (unchanged) return [];

    return [
      {
        estudante_id: registro.estudante_id,
        situacao: entry.situacao,
        ...(observation ? { observacao: observation } : {}),
      },
    ];
  });
}

export function validateDraft(draft: ChamadaDraft): ChamadaDraftErrors {
  return Object.fromEntries(
    Object.entries(draft)
      .filter(
        ([, entry]) =>
          entry.situacao === "Justificada" &&
          normalizedObservation(entry.observacao) === "",
      )
      .map(([estudanteId]) => [
        estudanteId,
        "Informe o motivo da falta justificada.",
      ]),
  );
}

export function hasPendingEntries(draft: ChamadaDraft) {
  return Object.values(draft).some((entry) => entry.situacao === "Pendente");
}

export function getLinhaCallAction(
  chamadaHoje: FrequenciaLinha["chamada_hoje"],
  isToday: boolean,
) {
  if (!isToday) return "Abrir chamada";
  if (!chamadaHoje) return "Iniciar";
  return chamadaHoje.status === "Aberta" ? "Continuar" : "Visualizar";
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function localDateIso(date = new Date()) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

export function formatCallDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}
