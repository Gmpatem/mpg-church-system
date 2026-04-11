import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type PlatformHeroAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export function PlatformExecutiveHero({
  eyebrow,
  title,
  description,
  badges = [],
  actions = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  badges?: string[];
  actions?: PlatformHeroAction[];
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-5 text-white shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100">
          {eyebrow}
        </span>
        {badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100"
          >
            {badge}
          </span>
        ))}
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">{description}</p>

      {actions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={
                action.variant === "secondary"
                  ? "inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                  : "inline-flex items-center rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function PlatformKpiGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function PlatformKpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "positive" | "warning" | "critical";
}) {
  const toneMap = {
    default: "from-blue-600 via-cyan-500 to-teal-500",
    positive: "from-emerald-600 via-teal-500 to-cyan-500",
    warning: "from-amber-500 via-orange-500 to-rose-500",
    critical: "from-rose-600 via-red-500 to-orange-500",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={cn("h-1 w-full rounded-t-2xl bg-gradient-to-r", toneMap[tone])} />
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          {typeof value === "number" ? value.toLocaleString("en-US") : value}
        </p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  );
}

export function ComplianceAlertRail({
  title,
  summary,
  href,
  actionLabel,
}: {
  title: string;
  summary: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">{title}</p>
          <p className="mt-1 text-xs text-amber-800">{summary}</p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-900"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function PlatformSectionCard({
  title,
  description,
  actionLabel,
  actionHref,
  children,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ChurchHealthCard({
  churchName,
  regionLabel,
  statusLabel,
  healthScore,
  adoptionScore,
  complianceRate,
  riskLabel,
  reasons,
  inspectHref,
}: {
  churchName: string;
  regionLabel: string;
  statusLabel: string;
  healthScore: number;
  adoptionScore: number;
  complianceRate: number;
  riskLabel: string;
  reasons: string[];
  inspectHref: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{churchName}</p>
          <p className="mt-0.5 text-xs text-slate-500">{regionLabel}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Health</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{healthScore}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Adoption</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{adoptionScore}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Compliance</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{complianceRate}%</p>
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-slate-700">Risk: {riskLabel}</p>
      {reasons.length > 0 ? (
        <ul className="mt-1 space-y-1 text-xs text-slate-500">
          {reasons.slice(0, 2).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      <Link
        href={inspectHref}
        className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Inspect
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
