import { Skeleton, TextSkeleton } from "@/components/loading";

export function RelatorioFrequenciaTableSkeleton() {
  return (
    <output aria-label="Carregando relatório" className="block">
      {["first", "second", "third", "fourth", "fifth"].map((key) => (
        <div
          className="grid min-h-24 gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6rem_6rem_6rem_7rem_6rem] md:items-center"
          key={key}
        >
          <TextSkeleton lines={["75%", "50%"]} />
          <TextSkeleton lines={["70%"]} />
          {["presence", "absence", "justified", "sequence"].map((metric) => (
            <Skeleton className="h-7 w-16 rounded-full" key={metric} />
          ))}
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      ))}
    </output>
  );
}
