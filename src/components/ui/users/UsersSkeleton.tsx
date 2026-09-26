import { Skeleton, TextSkeleton } from "@/components/loading";

export function UsersTableSkeleton() {
  return (
    <output aria-label="Carregando usuários" className="block">
      {["first", "second", "third", "fourth", "fifth"].map((key) => (
        <div
          className="grid min-h-20 gap-4 border-b border-border-subtle px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.35fr)_9rem_7rem_10rem] md:items-center md:gap-3"
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
