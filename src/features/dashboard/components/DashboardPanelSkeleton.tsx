import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPanelSkeleton() {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E5E0D6] bg-[#FFFDF8] p-5 shadow-[0_10px_30px_rgba(44,38,28,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="mt-5 grid gap-3">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="flex min-w-0 max-w-none flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="mt-2 h-4 w-56 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-lg" />
          <Skeleton className="h-11 w-24 rounded-lg" />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E0D6] bg-[#FFFDF8] p-5">
        <Skeleton className="h-4 w-36 rounded-full" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-5 lg:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <DashboardPanelSkeleton key={index} />
        ))}
      </div>

      <div className="hidden min-w-0 items-start gap-5 lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.9fr)] xl:hidden">
        <div className="flex min-w-0 flex-col gap-5">
          <DashboardPanelSkeleton />
          <DashboardPanelSkeleton />
          <DashboardPanelSkeleton />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <DashboardPanelSkeleton />
          <DashboardPanelSkeleton />
        </div>
      </div>

      <div className="hidden min-w-0 items-start gap-5 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(20rem,1fr)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_minmax(21.25rem,0.95fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <DashboardPanelSkeleton />
          <DashboardPanelSkeleton />
        </div>

        <div className="min-w-0">
          <DashboardPanelSkeleton />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <DashboardPanelSkeleton />
          <DashboardPanelSkeleton />
        </div>
      </div>
    </div>
  );
}
