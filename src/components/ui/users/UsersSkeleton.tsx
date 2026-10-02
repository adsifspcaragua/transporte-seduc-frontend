import { Skeleton, TextSkeleton } from "@/components/loading";

const usersTableGridClassName =
  "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.35fr)_9rem_7rem_10rem] md:gap-3";

export function UsersPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div
        aria-hidden="true"
        className="mb-5 flex items-center justify-between gap-3"
      >
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <section className="overflow-hidden rounded-md bg-white shadow-[0_3px_12px_rgba(0,0,0,0.2)]">
        <div
          className={`hidden bg-brand-600 px-5 py-3 md:grid ${usersTableGridClassName}`}
        >
          {["nome", "email", "papel", "situacao", "acoes"].map((key) => (
            <Skeleton className="h-4 w-20 rounded-full bg-white/30" key={key} />
          ))}
        </div>
        <UsersTableSkeleton />
      </section>
    </div>
  );
}

export function UsersTableSkeleton() {
  return (
    <output aria-label="Carregando usuários" className="block">
      {["first", "second", "third", "fourth", "fifth"].map((key) => (
        <div
          className={`grid min-h-20 gap-4 border-b border-border-subtle px-5 py-4 last:border-b-0 md:items-center ${usersTableGridClassName}`}
          key={key}
        >
          <TextSkeleton lines={["75%"]} />
          <TextSkeleton lines={["85%"]} />
          <TextSkeleton lines={["70%"]} />
          <Skeleton className="h-7 w-20 rounded-full" />
          <div className="flex gap-2 md:justify-end">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
        </div>
      ))}
    </output>
  );
}
