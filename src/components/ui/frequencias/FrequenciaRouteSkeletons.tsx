import { Skeleton, TextSkeleton } from "@/components/loading";

function FrequenciaLinhaCardSkeleton() {
  return (
    <div className="rounded-lg border border-brand-600/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <TextSkeleton className="mt-3 h-5" lines={["65%"]} />
      <TextSkeleton className="mt-3" lines={["85%", "72%", "90%"]} />
      <Skeleton className="mt-4 h-10 w-full rounded-lg" />
    </div>
  );
}

export function FrequenciasPageSkeleton() {
  return (
    <div>
      <div className="mb-6 rounded-lg border border-brand-600/10 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <TextSkeleton className="h-5" lines={["9rem"]} />
        </div>
        <Skeleton className="h-10 w-full rounded-lg sm:w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {["first", "second", "third"].map((key) => (
          <FrequenciaLinhaCardSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}
