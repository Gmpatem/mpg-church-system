import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type ChurchWorkspaceSkeletonVariant =
  | "registry"
  | "detail"
  | "form"
  | "dashboard"
  | "calendar"
  | "list";

interface SharedSkeletonProps {
  className?: string;
}

interface ChurchWorkspaceSkeletonProps extends SharedSkeletonProps {
  variant?: ChurchWorkspaceSkeletonVariant;
  rows?: number;
  metrics?: number;
  showRightRail?: boolean;
  ariaLabel?: string;
}

const tableWidths = ["w-11/12", "w-3/4", "w-5/6", "w-2/3", "w-4/5", "w-7/12"];
const timelineWidths = ["w-2/3", "w-5/6", "w-3/5", "w-4/5"];

export function ChurchWorkspaceHeaderSkeleton({
  className,
}: SharedSkeletonProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start justify-between gap-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>
    </div>
  );
}

export function ChurchTabBarSkeleton({ className }: SharedSkeletonProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 overflow-hidden",
        className
      )}
    >
      {[96, 112, 104, 128].map((width) => (
        <Skeleton
          key={width}
          className="h-9 shrink-0 rounded-md"
          style={{ width }}
        />
      ))}
    </div>
  );
}

export function ChurchSummaryStripSkeleton({ className }: SharedSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-3",
        className
      )}
    >
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChurchKpiRowSkeleton({
  metrics = 4,
  className,
}: SharedSkeletonProps & { metrics?: number }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: metrics }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-background p-4"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-16" />
          <Skeleton className="mt-3 h-3 w-32 max-w-full" />
        </div>
      ))}
    </div>
  );
}

export function ChurchToolbarSkeleton({ className }: SharedSkeletonProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton className="h-10 min-w-0 flex-1 rounded-md" />
        <Skeleton className="hidden h-10 w-28 rounded-md sm:block" />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </div>
  );
}

export function ChurchTableSkeleton({
  rows = 6,
  className,
}: SharedSkeletonProps & { rows?: number }) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border border-border bg-background",
        className
      )}
    >
      <div className="grid grid-cols-[minmax(12rem,1.4fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_7rem] gap-4 border-b border-border bg-muted/40 px-4 py-3">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-3 w-20" />
        ))}
      </div>
      <div className="flex flex-col">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(12rem,1.4fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_7rem] gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <Skeleton
              className={cn("h-4", tableWidths[index % tableWidths.length])}
            />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChurchRightRailSkeleton({ className }: SharedSkeletonProps) {
  return (
    <aside
      className={cn(
        "hidden rounded-lg border border-border bg-background p-4 xl:flex xl:flex-col xl:gap-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </aside>
  );
}

export function ChurchChartSkeleton({ className }: SharedSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="mt-6 flex h-52 items-end gap-3">
        {[64, 108, 82, 144, 118, 176, 92, 132].map((height, index) => (
          <Skeleton
            key={`${height}-${index}`}
            className="min-w-0 flex-1 rounded-t-md"
            style={{ height }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChurchFormSkeleton({ className }: SharedSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background p-5",
        className
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}

export function ChurchTimelineSkeleton({ className }: SharedSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {timelineWidths.map((width, index) => (
        <div key={width} className="flex gap-3">
          <Skeleton className="mt-1 size-3 rounded-full" />
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3">
            <Skeleton className={cn("h-4", width)} />
            <Skeleton className="mt-2 h-3 w-32" />
            {index % 2 === 0 ? <Skeleton className="mt-3 h-3 w-full" /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChurchListSkeleton({
  rows = 5,
  className,
}: SharedSkeletonProps & { rows?: number }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
        >
          <Skeleton className="size-10 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton
              className={cn("h-4", tableWidths[index % tableWidths.length])}
            />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function ChurchCalendarSkeleton({ className }: SharedSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background p-4",
        className
      )}
    >
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <div
            key={index}
            className="min-h-24 rounded-md border border-border/70 p-2"
          >
            <Skeleton className="h-3 w-6" />
            {index % 4 === 0 ? (
              <Skeleton className="mt-4 h-6 w-full rounded-md" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChurchCardGridSkeleton({
  rows = 6,
  className,
}: SharedSkeletonProps & { rows?: number }) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-background p-4"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <div className="mt-4 flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChurchDetailsSkeleton({ className }: SharedSkeletonProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]",
        className
      )}
    >
      <div className="min-w-0">
        <ChurchFormSkeleton />
        <ChurchTimelineSkeleton className="mt-4" />
      </div>
      <ChurchRightRailSkeleton />
    </div>
  );
}

export function ChurchWorkspaceSkeleton({
  variant = "registry",
  rows = 6,
  metrics = 4,
  showRightRail = true,
  ariaLabel = "Loading church workspace",
  className,
}: ChurchWorkspaceSkeletonProps) {
  const main =
    variant === "dashboard" ? (
      <>
        <ChurchKpiRowSkeleton metrics={metrics} />
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <ChurchChartSkeleton className="min-w-0" />
          <ChurchRightRailSkeleton />
        </div>
        <ChurchTableSkeleton rows={4} />
      </>
    ) : variant === "detail" ? (
      <ChurchDetailsSkeleton />
    ) : variant === "form" ? (
      <ChurchFormSkeleton />
    ) : variant === "calendar" ? (
      <ChurchCalendarSkeleton />
    ) : variant === "list" ? (
      <ChurchListSkeleton rows={rows} />
    ) : (
      <>
        <ChurchSummaryStripSkeleton />
        <ChurchToolbarSkeleton />
        <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <ChurchTableSkeleton rows={rows} className="min-w-0" />
          {showRightRail ? <ChurchRightRailSkeleton /> : null}
        </div>
      </>
    );

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      className={cn("church-workspace flex min-w-0 flex-col gap-4", className)}
    >
      <ChurchWorkspaceHeaderSkeleton />
      <ChurchTabBarSkeleton />
      {main}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}
