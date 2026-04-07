import { cn } from "@/lib/utils/cn";

interface WorkspaceStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  valueClassName?: string;
}

export function WorkspaceStatCard({
  label,
  value,
  hint,
  className,
  valueClassName,
}: WorkspaceStatCardProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500" />
      <div className="p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <p className={cn("mt-3 text-3xl font-bold tracking-tight text-slate-950", valueClassName)}>
          {typeof value === "number" ? value.toLocaleString("en-US") : value}
        </p>
        {hint ? (
          <p className="mt-2 text-xs text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
