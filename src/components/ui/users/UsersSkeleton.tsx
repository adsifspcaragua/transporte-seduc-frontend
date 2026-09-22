import { Skeleton } from "@/components/loading";

export function UsersSkeleton() {
  return (
    <section aria-busy="true" aria-label="Carregando usuários">
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-white">
        <div className="grid grid-cols-4 gap-4 border-b border-border-subtle px-5 py-4">
          {["name", "email", "role", "status"].map((key) => (
            <Skeleton className="h-4 w-24 rounded-full" key={key} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            className="grid grid-cols-4 gap-4 border-b border-border-subtle px-5 py-5 last:border-0"
            key={row}
          >
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-5 w-44 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        ))}
      </div>
    </section>
  );
}
