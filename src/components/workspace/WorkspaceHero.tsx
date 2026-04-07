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
}: WorkspaceHeroProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 p-6 text-white shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
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

          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              {description}
            </p>
          ) : null}
        </div>

        {actions?.length ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {actions.map((action) => {
              const common =
                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition";

              if (action.href) {
                return (
                  <a
                    key={action.label}
                    href={action.href}
                    className={cn(common, actionClasses(action.variant))}
                  >
                    {action.label}
                  </a>
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
