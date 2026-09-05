import { Skeleton } from "@/components/loading";

export function DashboardSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Carregando dashboard"
      aria-live="polite"
      className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6"
    >
      <div aria-hidden="true" className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-60 max-w-full rounded-full" />
          <Skeleton className="mt-1 h-12 w-16 rounded-lg" />
          <Skeleton className="mt-2 h-5 w-96 max-w-full rounded-full" />
        </div>

        <div>
          <Skeleton className="mb-3 h-5 w-52 max-w-full rounded-full" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {["inscricoes", "recadastros", "sem-linha", "ausentes"].map(
              (key) => (
                <div
                  className="flex items-start gap-3 rounded-lg bg-white p-5 shadow-sm"
                  key={key}
                >
                  <Skeleton className="mt-0.5 size-5 shrink-0 rounded" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-8 w-10 rounded-lg" />
                    <div className="flex h-10 flex-col justify-around">
                      <Skeleton className="h-3 w-full rounded-full" />
                      <Skeleton className="h-3 w-2/3 rounded-full" />
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 shrink-0 rounded" />
                <Skeleton className="h-7 w-48 rounded-full" />
              </div>
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="mb-4 h-5 w-full rounded-full" />
            <div className="space-y-4">
              {["linha-1", "linha-2", "linha-3", "linha-4"].map((key) => (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Skeleton className="h-5 w-1/3 rounded-full" />
                    <Skeleton className="h-5 w-1/4 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <Skeleton className="mb-2 h-7 w-28 rounded-full" />
              <div className="divide-y divide-border-subtle">
                {["em-analise", "incompletas", "aprovadas", "rejeitadas"].map(
                  (key) => (
                    <div
                      className="flex items-center justify-between gap-3 py-2"
                      key={key}
                    >
                      <Skeleton className="h-5 w-2/3 rounded-full" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <Skeleton className="mb-2 h-7 w-28 rounded-full" />
              <Skeleton className="h-5 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
