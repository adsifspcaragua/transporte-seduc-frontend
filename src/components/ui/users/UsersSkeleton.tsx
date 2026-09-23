import { Skeleton } from "@/components/loading";

export function UsersSkeleton() {
  return (
    <section aria-busy="true" aria-label="Carregando usuários">
      <div className="overflow-hidden rounded-md bg-white shadow-[0_3px_12px_rgba(0,0,0,0.2)]">
        <div className="hidden grid-cols-5 gap-4 bg-brand-600 px-5 py-3 md:grid">
          {["name", "email", "role", "status", "actions"].map((key) => (
            <Skeleton className="h-4 w-24 rounded-full" key={key} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            className="grid gap-4 border-b border-border-subtle px-5 py-5 last:border-0 md:grid-cols-5"
            key={row}
          >
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-5 w-44 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </section>
  );
}
