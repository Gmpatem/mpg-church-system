import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface WorkspaceHeroAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
}

interface WorkspaceHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badges?: string[];
  actions?: WorkspaceHeroAction[];
  className?: string;
  size?: "default" | "compact";
  mobileLayout?: "default" | "slim";
}

function actionClasses(variant: WorkspaceHeroAction["variant"]) {
  if (variant === "secondary") {
    return "border border-white/15 bg-white/10 text-white hover:bg-white/15";
  }

  if (variant === "outline") {
    return "border border-white/20 bg-transparent text-white hover:bg-white/10";
  }

  return "bg-white text-slate-950 hover:bg-slate-100";
}

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  badges,
  actions,
  className,
  size = "default",
  mobileLayout = "default",
}: WorkspaceHeroProps) {
  const compact = size === "compact";
  const primaryAction = actions?.[0];

  return (
    <section
      className={cn(
        "mobile-fade-up overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 text-white shadow-sm",
        compact ? "p-4 sm:p-5" : "p-5 sm:p-6",
        className
      )}
    >
      {mobileLayout === "slim" ? (
        <div className="flex items-center justify-between gap-3 sm:hidden">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[10px] uppercase tracking-[0.18em] text-blue-300">{eyebrow}</p>
            ) : null}
            <h1 className="truncate text-lg font-bold">{title}</h1>
          </div>
          {primaryAction?.href ? (
            primaryAction.href.startsWith("http") ? (
              <a
                href={primaryAction.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-950"
              >
                {primaryAction.label}
              </a>
            ) : (
              <Link
                href={primaryAction.href}
                className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-950"
              >
                {primaryAction.label}
              </Link>
            )
          ) : primaryAction?.onClick ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className={cn(
                "shrink-0 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-950",
                primaryAction.disabled ? "cursor-not-allowed opacity-60" : ""
              )}
            >
              {primaryAction.label}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-col xl:flex-row xl:items-end xl:justify-between",
          mobileLayout === "slim" ? "hidden sm:flex" : "flex",
          compact ? "gap-4" : "gap-6"
        )}
      >
        <div className="max-w-3xl">
          {(eyebrow || badges?.length) ? (
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow ? (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100">
                  {eyebrow}
                </span>
              ) : null}

              {badges?.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          <h1
            className={cn(
              "font-bold tracking-tight",
              compact ? "mt-3 text-2xl md:text-3xl" : "mt-4 text-3xl md:text-4xl"
            )}
          >
            {title}
          </h1>

          {description ? (
            <p
              className={cn(
                "max-w-2xl text-sm text-blue-100",
                compact ? "mt-2 leading-5" : "mt-3 leading-6"
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        {actions?.length ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {actions.map((action) => {
              const common =
                "mobile-touch-feedback inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition";

              if (action.href) {
                const isExternal = action.href.startsWith("http");
                return (
                  isExternal ? (
                    <a
                      key={action.label}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(common, actionClasses(action.variant))}
                    >
                      {action.label}
                    </a>
                  ) : (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={cn(common, actionClasses(action.variant))}
                    >
                      {action.label}
                    </Link>
                  )
                );
              }

              return (
                <button
                  key={action.label}
                  type="button"
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className={cn(
                    common,
                    actionClasses(action.variant),
                    action.disabled ? "cursor-not-allowed opacity-60" : ""
                  )}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
