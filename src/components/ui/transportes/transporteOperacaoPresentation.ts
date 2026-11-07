import type { Linha } from "@/types/inscricao";
import type {
  AtribuicaoVeiculo,
  HorarioViagem,
  Veiculo,
  Viagem,
} from "@/types/transporte";
import type {
  TransporteIssue,
  TransportePeriod,
  TransporteSnapshot,
} from "@/types/transporte-operacao";
import type { TransporteField } from "./transporteConfig";
import type { TransporteFormValues } from "./transportePresentation";

export function operationToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function periodDates(period: TransportePeriod): string[] {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(period.de) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(period.ate)
  )
    return [];
  const start = Date.parse(`${period.de}T12:00:00Z`);
  const end = Date.parse(`${period.ate}T12:00:00Z`);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end < start ||
    end - start > 62 * 86400000
  )
    return [];
  return Array.from(
    { length: Math.round((end - start) / 86400000) + 1 },
    (_, i) => new Date(start + i * 86400000).toISOString().slice(0, 10),
  );
}

export function effectiveVehicle(
  lineId: number,
  day: string,
  assignments: AtribuicaoVeiculo[],
  vehicles: Veiculo[],
) {
  const available = assignments.filter(
    (a) =>
      a.linha_id === lineId &&
      a.inicio <= day &&
      (!a.fim || a.fim >= day) &&
      vehicles.some((v) => v.id === a.veiculo_id && v.ativo),
  );
  available.sort((a, b) => b.inicio.localeCompare(a.inicio) || b.id - a.id);
  return vehicles.find((v) => v.id === available[0]?.veiculo_id);
}

export function tripConflicts(trips: Viagem[]): [Viagem, Viagem][] {
  const active = trips.filter(
    (t) => t.status === "Programada" && t.veiculo_id != null,
  );
  const result: [Viagem, Viagem][] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i],
        b = active[j];
      // The resolver accepts endpoints inclusively, including adjacent windows.
      if (
        a.veiculo_id === b.veiculo_id &&
        Date.parse(a.janela_inicio) <= Date.parse(b.janela_fim) &&
        Date.parse(b.janela_inicio) <= Date.parse(a.janela_fim)
      )
        result.push([a, b]);
    }
  }
  return result;
}

export function scheduleOperates(h: HorarioViagem, day: string) {
  return (
    h.ativo &&
    (!h.vigencia_inicio || h.vigencia_inicio <= day) &&
    (!h.vigencia_fim || h.vigencia_fim >= day) &&
    h.dias_semana.map(Number).includes(new Date(`${day}T12:00:00Z`).getUTCDay())
  );
}

export function guidedFields(fields: TransporteField[]) {
  return fields
    .filter((f) => f.key !== "linha_id")
    .map((f) => ({ ...f, label: f.label?.replace(/^ID (da|do) /, "") }));
}

export function scopedValues(
  values: TransporteFormValues,
  linhaId: number,
  period?: TransportePeriod,
) {
  return { ...values, linha_id: String(linhaId), ...(period ?? {}) };
}

export function shouldReconcileGuidedFailure(
  sent: boolean,
  accepted: boolean,
  status?: number,
) {
  return sent && (accepted || status == null || status >= 500);
}

export function buildMotoristaUpdate(
  latest: Linha,
  motoristaId: number | null,
) {
  if (!latest.max_capacity || !Number.isInteger(latest.max_capacity))
    throw new Error("Não foi possível conferir a capacidade atual da linha.");
  return { max_capacity: latest.max_capacity, motorista_id: motoristaId };
}

export function guidedDuplicate(
  resource: string,
  payload: Record<string, unknown>,
  records: unknown[],
) {
  const normalized = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLocaleLowerCase("pt-BR");
  return records.some((item) => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    const same = (...keys: string[]) =>
      keys.every(
        (key) => String(row[key] ?? "") === String(payload[key] ?? ""),
      );
    if (resource === "veiculos")
      return (
        normalized(row.identificacao) === normalized(payload.identificacao) ||
        Boolean(
          payload.placa && normalized(row.placa) === normalized(payload.placa),
        )
      );
    if (resource === "pontos")
      return (
        normalized(row.nome) === normalized(payload.nome) &&
        Number(row.latitude) === Number(payload.latitude) &&
        Number(row.longitude) === Number(payload.longitude)
      );
    if (resource === "vinculos") return same("linha_id", "ponto_id", "sentido");
    if (resource === "atribuicoes")
      return same("linha_id", "veiculo_id", "inicio", "fim");
    if (resource === "dias") return same("linha_id", "data");
    if (resource === "horarios") {
      return (
        same("linha_id", "sentido") &&
        normalized(row.horario_saida).slice(0, 5) ===
          normalized(payload.horario_saida).slice(0, 5) &&
        row.ativo === payload.ativo &&
        Array.isArray(row.dias_semana) &&
        Array.isArray(payload.dias_semana) &&
        row.dias_semana.some((day) =>
          (payload.dias_semana as unknown[]).map(Number).includes(Number(day)),
        ) &&
        String(row.vigencia_inicio ?? "0000-01-01") <=
          String(payload.vigencia_fim ?? "9999-12-31") &&
        String(payload.vigencia_inicio ?? "0000-01-01") <=
          String(row.vigencia_fim ?? "9999-12-31")
      );
    }
    return false;
  });
}

export function summarizeLinha(
  linha: Linha,
  snapshot: TransporteSnapshot,
  period: TransportePeriod,
) {
  const issues: TransporteIssue[] = [];
  const names = {
    veiculos: "Veículos",
    atribuicoes: "Atendimento do veículo",
    horarios: "Horários",
    pontos: "Pontos",
    vinculos: "Pontos da linha",
    dias: "Suspensões",
    viagens: "Viagens",
  } as const;
  const unavailable = Object.entries(names).flatMap(([key, label]) => {
    const state = snapshot[key as keyof typeof names];
    return state.error || !state.data
      ? [`${label}: ${state.error ?? "Consulta não concluída."}`]
      : [];
  });
  const dates = periodDates(period);
  const horarios =
    snapshot.horarios.data?.filter((h) => h.linha_id === linha.id) ?? [];
  const viagens =
    snapshot.viagens.data?.filter(
      (t) =>
        t.linha_id === linha.id && t.data >= period.de && t.data <= period.ate,
    ) ?? [];
  const suspensions =
    snapshot.dias.data?.filter(
      (d) => d.linha_id == null || d.linha_id === linha.id,
    ) ?? [];
  const coverageKnown = !!snapshot.horarios.data && !!snapshot.dias.data;
  const calendar = dates.map((day) => {
    const suspended = suspensions.some((d) => d.data === day);
    const expected = coverageKnown
      ? horarios.filter((h) => scheduleOperates(h, day) && !suspended)
      : null;
    const trips = snapshot.viagens.data
      ? viagens.filter((t) => t.data === day)
      : null;
    const vehicle =
      snapshot.atribuicoes.data && snapshot.veiculos.data
        ? effectiveVehicle(
            linha.id,
            day,
            snapshot.atribuicoes.data,
            snapshot.veiculos.data,
          )
        : undefined;
    return { day, suspended, expected, trips, vehicle };
  });
  const expected = coverageKnown
    ? calendar.reduce((n, d) => n + (d.expected?.length ?? 0), 0)
    : null;
  const missing =
    coverageKnown && snapshot.viagens.data
      ? calendar.reduce(
          (n, d) =>
            n +
            (d.expected?.filter(
              (h) => !d.trips?.some((t) => t.horario_id === h.id),
            ).length ?? 0),
          0,
        )
      : null;
  const withoutVehicle = snapshot.viagens.data
    ? viagens.filter(
        (t) =>
          t.status === "Programada" &&
          (t.veiculo_id == null ||
            (snapshot.veiculos.data &&
              !snapshot.veiculos.data.some(
                (v) => v.id === t.veiculo_id && v.ativo,
              ))),
      ).length
    : null;
  const pointsKnown = !!snapshot.vinculos.data && !!snapshot.pontos.data;
  const points = Object.fromEntries(
    ["Ida", "Volta"].map((sentido) => [
      sentido,
      pointsKnown
        ? (snapshot.vinculos.data?.filter(
            (v) =>
              v.linha_id === linha.id &&
              v.sentido === sentido &&
              snapshot.pontos.data?.some((p) => p.id === v.ponto_id && p.ativo),
          ).length ?? 0)
        : null,
    ]),
  ) as Record<"Ida" | "Volta", number | null>;
  const conflicts = snapshot.viagens.data
    ? tripConflicts(snapshot.viagens.data).filter((pair) =>
        pair.some(
          (t) =>
            t.linha_id === linha.id &&
            t.data >= period.de &&
            t.data <= period.ate,
        ),
      )
    : [];
  if (!linha.motorista_id && !linha.motorista)
    issues.push({ text: "Motorista responsável não informado.", step: 1 });
  if (
    snapshot.horarios.data &&
    !horarios.some((h) => dates.some((day) => scheduleOperates(h, day)))
  )
    issues.push({
      text: "Nenhum horário ativo atende o período selecionado.",
      step: 2,
    });
  if (missing)
    issues.push({
      text: `${missing} viagem(ns) prevista(s) ainda não gerada(s).`,
      step: 4,
    });
  if (withoutVehicle)
    issues.push({
      text: `${withoutVehicle} viagem(ns) sem veículo ativo.`,
      step: 1,
    });
  if (conflicts.length)
    issues.push({
      text: `${conflicts.length} possível(is) conflito(s) de veículo no período.`,
      step: 4,
    });
  for (const sentido of ["Ida", "Volta"] as const) {
    if (
      points[sentido] === 0 &&
      horarios.some(
        (h) =>
          h.sentido === sentido &&
          dates.some((day) => scheduleOperates(h, day)),
      )
    )
      issues.push({
        text: `Sem ponto ativo na ${sentido.toLowerCase()} para o embarque por QR.`,
        step: 3,
      });
  }
  if (
    snapshot.atribuicoes.data &&
    snapshot.veiculos.data &&
    calendar.some((d) => d.expected?.length && !d.vehicle)
  )
    issues.push({
      text: "Há datas previstas sem alocação de veículo ativo; confira também as substituições das viagens.",
      step: 1,
    });
  return {
    issues,
    unavailable,
    horarios,
    viagens,
    calendar,
    expected,
    missing,
    withoutVehicle,
    points,
    conflicts,
    trips: snapshot.viagens.data ? viagens.length : null,
    cancelled: snapshot.viagens.data
      ? viagens.filter((t) => t.status === "Cancelada").length
      : null,
  };
}
