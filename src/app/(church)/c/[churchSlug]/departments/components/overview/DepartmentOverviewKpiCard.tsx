"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type KpiTone = "green" | "emerald" | "blue" | "amber" | "purple";

const toneClasses: Record<KpiTone, string> = {
  green: "bg-primary/10 text-primary ring-primary/15",
  emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  blue: "bg-blue-100 text-blue-700 ring-blue-200",
  amber: "bg-amber-100 text-amber-700 ring-amber-200",
  purple: "bg-violet-100 text-violet-700 ring-violet-200",
};

export function DepartmentOverviewKpiCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: KpiTone;
}) {
  return (
    <section className="min-h-[112px] rounded-xl border border-border bg-background p-[18px] shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className={cn(
            "inline-flex size-12 shrink-0 items-center justify-center rounded-full ring-1",
            toneClasses[tone]
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-5 text-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold leading-none tracking-normal text-foreground">
            {value}
          </p>
          <p className="mt-3 text-xs leading-4 text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  );
}
