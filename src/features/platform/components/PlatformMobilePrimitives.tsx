import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type MobileHeroAction = {
  label: string;
  href: string;
};

export function PlatformMobileHero({
  eyebrow,
  title,
  description,
  badge,
  actions = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  actions?: MobileHeroAction[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700 p-4 text-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100">
          {eyebrow}
        </span>
        {badge ? (
          <span className="rounded-full border border-cyan-200/30 bg-cyan-200/20 px-2.5 py-1 text-xs font-medium text-cyan-50">
            {badge}
          </span>
        ) : null}
      </div>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-5 text-blue-100">{description}</p>

      {actions.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function PlatformMobileAttentionStrip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      {children}
    </div>
  );
}

export function PlatformMobileStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500" />
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

export function PlatformMobileSectionCard({
  title,
  actionLabel,
  actionHref,
  children,
  className,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600"
          >
            {actionLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

type QuickLinkItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function PlatformMobileQuickLinks({
  items,
}: {
  items: QuickLinkItem[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-20 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 py-3 text-center shadow-sm transition hover:bg-slate-50"
          >
            <Icon className="h-5 w-5 text-slate-600" />
            <span className="mt-1 text-[11px] font-medium text-slate-700">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function PlatformMobileFilterPills({
  items,
  activeValue,
  onSelect,
}: {
  items: Array<{ label: string; value: string }>;
  activeValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = item.value === activeValue;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            className={
              isActive
                ? "whitespace-nowrap rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                : "whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

