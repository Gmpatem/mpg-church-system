import { Skeleton } from "@/components/ui/skeleton";

export default function SmallGroupsLoading() {
  return (
    <div className="min-w-0 space-y-4" aria-busy="true">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
          <Skeleton className="h-11 w-full rounded-lg" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="hidden h-96 rounded-2xl xl:block" />
      </div>
    </div>
  );
}
