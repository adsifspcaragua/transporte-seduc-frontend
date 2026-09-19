import { Skeleton, TextSkeleton } from "@/components/loading";

export function JustificativasTableSkeleton() {
  return (
    <output aria-label="Carregando justificativas" className="block">
      {["first", "second", "third", "fourth", "fifth"].map((key) => (
        <div
          className="grid min-h-24 gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.4fr)_8rem_12rem] md:items-center"
          key={key}
        >
          <TextSkeleton lines={["75%", "55%"]} />
          <TextSkeleton lines={["80%", "50%"]} />
          <TextSkeleton lines={["full", "70%"]} />
          <Skeleton className="h-7 w-24 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </output>
  );
}
