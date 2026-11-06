import { Skeleton, TextSkeleton } from "@/components/loading";

function RecadastroCardSkeleton() {
  return (
    <div className="min-w-0 rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 w-32 max-w-full rounded-full" />
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
    <div
      aria-busy="true"
      aria-live="polite"
      className="@container/recadastro min-w-0"
    >
      <div
        aria-hidden="true"
        className="mb-5 flex flex-wrap items-center justify-between gap-3"
      >
        <Skeleton className="h-8 w-52 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="space-y-6" aria-hidden="true">
        <section className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <Skeleton className="size-11 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <Skeleton className="h-5 w-52 max-w-full rounded-full" />
                <Skeleton className="mt-2 h-4 w-72 max-w-full rounded-full" />
              </div>
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-4 @min-[32rem]/recadastro:grid-cols-2 @min-[68rem]/recadastro:grid-cols-12">
            {["ano", "semestre", "inicio", "fim", "observacoes"].map((key) => (
              <div
                className={
                  key === "observacoes"
                    ? "min-w-0 @min-[32rem]/recadastro:col-span-2 @min-[68rem]/recadastro:col-span-4"
                    : "min-w-0 @min-[68rem]/recadastro:col-span-2"
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
            <div className="flex max-w-full flex-wrap gap-2">
              <Skeleton className="h-10 w-44 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4">
            {["periodo-1", "periodo-2", "periodo-3"].map((key) => (
              <RecadastroCardSkeleton key={key} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
          <div className="flex items-start gap-3">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-56 max-w-full rounded-full" />
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
