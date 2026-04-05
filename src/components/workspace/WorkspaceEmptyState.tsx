import { cn } from "@/lib/utils/cn";

interface WorkspaceEmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function WorkspaceEmptyState({
  title = "Nothing here yet",
  message,
  actionLabel,
  actionHref,
  className,
}: WorkspaceEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center",
        className
      )}
    >
      <h3 className="text-base font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {message}
      </p>

      {actionLabel && actionHref ? (
        <a
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}
