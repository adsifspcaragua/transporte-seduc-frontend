import { Skeleton } from "@/components/loading";

export function LinhasPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div aria-hidden="true">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-40 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
        <div className="mb-6 rounded-lg border border-brand-600/10 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-6 w-52 max-w-full rounded-full" />
          </div>
          <Skeleton className="h-5 w-2/3 rounded-full" />
        </div>
      </div>
      <LinhasSkeleton />
    </div>
  );
}

export function LinhasSkeleton() {
  return (
    <section aria-busy="true" aria-label="Carregando linhas" aria-live="polite">
      <div
        aria-hidden="true"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {["linha-1", "linha-2", "linha-3", "linha-4", "linha-5", "linha-6"].map(
          (key) => (
            <div
              className="flex min-w-0 flex-col rounded-lg border border-brand-600/10 border-l-[3px] bg-white p-4 shadow-sm"
              key={key}
            >
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="size-11 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-2/3 rounded-full" />
                  <Skeleton className="mt-1 h-3 w-full rounded-full" />
                  <Skeleton className="mt-1 h-3 w-3/4 rounded-full" />
                </div>
                <Skeleton className="h-5 w-16 shrink-0 rounded-md" />
                <Skeleton className="h-5 w-3 shrink-0 rounded-full" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {["saida", "retorno"].map((horario) => (
                  <div
                    className="flex items-center gap-3 rounded-lg bg-surface-muted px-3 py-2"
                    key={horario}
                  >
                    <Skeleton className="size-4 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-3 w-10 max-w-full rounded-full" />
                      <Skeleton className="mt-1 h-4 w-12 max-w-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-3 mt-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="mt-2 h-3 w-28 rounded-full" />
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border-subtle pt-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="ml-auto h-4 w-20 rounded-full" />
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
