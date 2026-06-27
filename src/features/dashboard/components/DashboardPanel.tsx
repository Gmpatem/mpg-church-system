import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function DashboardPanel({
  title,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: {
  title: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl border border-[#E5E0D6] bg-[#FFFDF8] shadow-[0_10px_30px_rgba(44,38,28,0.05)]",
        className
      )}
    >
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#ECE7DC] px-4 py-3 sm:px-5">
        <h2 className="flex min-w-0 items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#1E2635]">
          {Icon ? <Icon className="size-4 shrink-0 text-[#0F4D3A]" aria-hidden="true" /> : null}
          <span className="truncate">{title}</span>
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("min-w-0 px-4 py-4 sm:px-5", contentClassName)}>{children}</div>
    </section>
  );
}

export function CompactEmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon;
  title: ReactNode;
  message: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-[#E8E1D5] bg-[#F8F6EF] px-4 py-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-[#E6F0E7] text-[#145C44]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-[#172018]">{title}</h3>
      <p className="mt-1 max-w-xs text-xs leading-5 text-[#66706A]">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
