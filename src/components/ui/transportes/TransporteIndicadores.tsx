"use client";

import { useState } from "react";
import { Button } from "@/components/buttons";
import { TextSkeleton } from "@/components/loading";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { indicadoresTransporteQuery } from "@/services/api/modules/transporte";
import type { TransporteFiltros } from "@/types/transporte";
import { TransporteFields } from "./TransporteFields";
import {
  formatTransporteValue,
  type TransporteFormValues,
  transporteError,
} from "./transportePresentation";

const fields = [
  { key: "de", label: "De", type: "date" as const },
  { key: "ate", label: "Até", type: "date" as const },
  { key: "linha_id", label: "ID da linha", type: "number" as const, min: 1 },
];

export function TransporteIndicadores() {
  const [values, setValues] = useState<TransporteFormValues>({});
  const [filters, setFilters] = useState<TransporteFiltros>({});
  const [filterReset, setFilterReset] = useState(0);
  const result = useCachedQuery(indicadoresTransporteQuery, filters);
  const data = result.data;
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-700">
          Indicadores de presença
        </h2>
        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          loading={result.isFetching}
          onClick={() => void result.refresh()}
        >
          Atualizar
        </Button>
      </div>
      <form
        className="space-y-4 rounded-xl border border-border-subtle bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(
            Object.fromEntries(
              Object.entries(values).filter(([, value]) => value !== ""),
            ),
          );
        }}
      >
        <TransporteFields
          key={filterReset}
          fields={fields}
          values={values}
          onChange={(key, value) =>
            setValues((current) => ({ ...current, [key]: value }))
          }
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" fullWidth={false}>
            Consultar indicadores
          </Button>
          <Button
            size="sm"
            fullWidth={false}
            variant="secondary"
            onClick={() => {
              setValues({});
              setFilters({});
              setFilterReset((current) => current + 1);
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </form>
      {result.error ? (
        <div
          role="alert"
          className="rounded-xl bg-white p-5 text-sm text-danger-600"
        >
          {transporteError(result.error).message}
          <Button
            variant="secondary"
            fullWidth={false}
            className="mt-3"
            onClick={() => void result.refresh()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {result.isLoading && (
        <div className="space-y-4 rounded-xl bg-white p-5">
          <TextSkeleton />
          <TextSkeleton />
          <TextSkeleton />
        </div>
      )}
      {data && (
        <>
          <p className="text-sm text-content-muted">
            Período: {formatTransporteValue(data.periodo.de)} a{" "}
            {formatTransporteValue(data.periodo.ate)}. Sem filtro, o servidor
            considera os últimos 30 dias.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Presenças",
                data.presencas_por_linha.reduce(
                  (total, line) => total + line.total,
                  0,
                ),
              ],
              [
                "Presenças manuais",
                data.presencas_por_linha.reduce(
                  (total, line) => total + line.manuais,
                  0,
                ),
              ],
              [
                "Tentativas negadas",
                data.negadas_por_motivo.reduce(
                  (total, reason) => total + reason.total,
                  0,
                ),
              ],
              ["Revisões pendentes", data.revisoes.Pendente ?? 0],
            ].map(([label, value]) => (
              <article
                className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm"
                key={label}
              >
                <h3 className="text-sm text-content-muted">{label}</h3>
                <p className="mt-2 text-2xl font-bold text-brand-700">
                  {value}
                </p>
              </article>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <IndicadorList
              title="Presenças por linha"
              rows={data.presencas_por_linha.map((line) => ({
                label: `${line.linha ?? `Linha #${line.linha_id}`} (${line.manuais} manuais)`,
                value: line.total,
              }))}
            />
            <IndicadorList
              title="Presenças por dia"
              rows={data.presencas_por_dia.map((day) => ({
                label: formatTransporteValue(day.data),
                value: day.total,
              }))}
            />
            <IndicadorList
              title="Negativas por motivo"
              rows={data.negadas_por_motivo.map((reason) => ({
                label: reason.codigo ?? "Sem código",
                value: reason.total,
              }))}
            />
            <IndicadorList
              title="Revisões"
              rows={Object.entries(data.revisoes).map(([label, value]) => ({
                label,
                value,
              }))}
            />
          </div>
          <article className="rounded-xl border border-border-subtle bg-white p-5">
            <h3 className="font-bold text-brand-700">Qualidade do GPS</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ["Leituras", data.gps.leituras],
                ["Precisão média (m)", data.gps.precisao_media_metros],
                [
                  "Distância média aceita (m)",
                  data.gps.distancia_media_aceita_metros,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-content-muted">{label}</dt>
                  <dd className="mt-1 text-lg font-bold">
                    {formatTransporteValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        </>
      )}
    </section>
  );
}

function IndicadorList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  return (
    <article className="rounded-xl border border-border-subtle bg-white p-5">
      <h3 className="font-bold text-brand-700">{title}</h3>
      {rows.length ? (
        <dl className="mt-3 divide-y divide-border-subtle">
          {rows.map((row) => (
            <div
              className="flex items-center justify-between gap-4 py-2 text-sm"
              key={row.label}
            >
              <dt>{row.label}</dt>
              <dd className="font-bold">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-content-muted">
          Nenhum registro no período.
        </p>
      )}
    </article>
  );
}
