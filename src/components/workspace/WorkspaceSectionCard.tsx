import { cn } from "@/lib/utils/cn";

interface WorkspaceSectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function WorkspaceSectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: WorkspaceSectionCardProps) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      <div className={cn("p-5", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
