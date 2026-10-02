import { Skeleton, TextSkeleton } from "@/components/loading";

function RecadastroCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-32 rounded-full" />
          <TextSkeleton className="mt-2" lines={["75%", "55%"]} />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    </div>
  );
}

export function RecadastroPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div
        aria-hidden="true"
        className="mb-5 flex items-center justify-between gap-3"
      >
        <Skeleton className="h-8 w-52 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="space-y-6" aria-hidden="true">
        <section className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Skeleton className="size-11 shrink-0 rounded-xl" />
              <div>
                <Skeleton className="h-5 w-52 rounded-full" />
                <Skeleton className="mt-2 h-4 w-72 max-w-full rounded-full" />
              </div>
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            {["ano", "semestre", "inicio", "fim", "observacoes"].map((key) => (
              <div
                className={
                  key === "observacoes"
                    ? "md:col-span-2 xl:col-span-4"
                    : "xl:col-span-2"
                }
                key={key}
              >
                <Skeleton className="mb-1.5 h-3 w-16 rounded-full" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="mt-2 h-3 w-28 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-44 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {["periodo-1", "periodo-2", "periodo-3"].map((key) => (
              <RecadastroCardSkeleton key={key} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
          <div className="flex items-start gap-3">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-56 rounded-full" />
              <Skeleton className="mt-2 h-4 w-80 max-w-full rounded-full" />
            </div>
          </div>
          <div className="mt-5 space-y-4 rounded-xl border border-border-subtle p-4">
            {["solicitacao-1", "solicitacao-2", "solicitacao-3"].map((key) => (
              <Skeleton className="h-12 w-full rounded-lg" key={key} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
