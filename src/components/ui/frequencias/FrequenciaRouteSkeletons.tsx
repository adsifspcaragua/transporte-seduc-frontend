import { Skeleton, TextSkeleton } from "@/components/loading";

function FrequenciaLinhaCardSkeleton() {
  return (
    <div className="min-h-64 rounded-lg border border-border-subtle bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <TextSkeleton className="mt-5 h-5" lines={["65%"]} />
      <TextSkeleton className="mt-5" lines={["85%", "72%", "90%"]} />
      <Skeleton className="mt-7 h-10 w-full rounded-lg" />
    </div>
  );
}

export function FrequenciasPageSkeleton() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TextSkeleton className="h-7" lines={["12rem"]} />
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {["first", "second", "third"].map((key) => (
          <FrequenciaLinhaCardSkeleton key={key} />
        ))}
      </div>
    </main>
  );
}
