import { cn } from "@/lib/utils/cn";

interface WorkspaceControlRailProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function WorkspaceControlRail({
  title,
  description,
  children,
  className,
}: WorkspaceControlRailProps) {
  return (
    <section className={cn("mobile-fade-up rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      {(title || description) ? (
        <div className="mb-3.5 sm:mb-4">
          {title ? (
            <p className="text-sm font-semibold text-slate-900">
              {title}
            </p>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}
