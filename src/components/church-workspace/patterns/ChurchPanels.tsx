import { cn } from "@/lib/utils/cn";

export function ChurchMainPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-border bg-background shadow-sm",
        className
      )}
    >
      {children}
    </section>
  );
}

export function ChurchContentGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]", className)}>
      {children}
    </div>
  );
}

export function ChurchRightRail({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "min-w-0 rounded-xl border border-border bg-background shadow-sm",
        className
      )}
    >
      {children}
    </aside>
  );
}
