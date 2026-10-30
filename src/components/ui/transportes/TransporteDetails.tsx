import {
  formatTransporteValue,
  transporteLabels,
} from "./transportePresentation";

export function TransporteDetails({ value }: { value: unknown }) {
  if (!value || typeof value !== "object")
    return <p className="text-sm">{formatTransporteValue(value)}</p>;
  if (Array.isArray(value))
    return (
      <div className="space-y-3">
        {value.length ? (
          value.map((entry, index) => (
            <div
              className="rounded-lg border border-border-subtle p-3"
              key={String(
                typeof entry === "object" && entry && "id" in entry
                  ? entry.id
                  : index,
              )}
            >
              <TransporteDetails value={entry} />
            </div>
          ))
        ) : (
          <p className="text-sm text-content-muted">Nenhum registro.</p>
        )}
      </div>
    );
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {Object.entries(value)
        .filter(([key]) => key !== "qr")
        .map(([key, entry]) => {
          const nested =
            entry !== null &&
            typeof entry === "object" &&
            key !== "dias_semana" &&
            key !== "linhas_ids";
          return (
            <div className={nested ? "sm:col-span-2" : "min-w-0"} key={key}>
              <dt className="mb-1 text-xs font-semibold text-content-muted">
                {transporteLabels[key] ?? key.replaceAll("_", " ")}
              </dt>
              <dd className="break-words text-sm text-content-primary">
                {nested ? (
                  <div className="rounded-lg bg-surface-muted p-3">
                    <TransporteDetails value={entry} />
                  </div>
                ) : (
                  formatTransporteValue(entry, key)
                )}
              </dd>
            </div>
          );
        })}
    </dl>
  );
}
