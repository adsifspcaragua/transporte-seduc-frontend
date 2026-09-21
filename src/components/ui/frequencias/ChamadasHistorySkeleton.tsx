import { Skeleton, TextSkeleton } from "@/components/loading";

export function ChamadasHistoryTableSkeleton() {
  return (
    <output aria-label="Carregando histórico de chamadas" className="block">
      {["first", "second", "third", "fourth", "fifth"].map((key) => (
        <div
          className="grid min-h-24 gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.1fr)_7rem_minmax(0,1.4fr)_8rem_11rem] md:items-center"
          key={key}
        >
          <TextSkeleton lines={["75%", "55%"]} />
          <TextSkeleton lines={["70%"]} />
          <TextSkeleton lines={["full", "80%"]} />
          <Skeleton className="h-7 w-20 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
        </div>
      ))}
    </output>
  );
}
