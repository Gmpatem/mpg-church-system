import { cn } from "@/lib/utils/cn";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <fieldset className={cn("space-y-4", className)}>
      <div className="border-b border-slate-200 pb-3">
        <legend className="text-sm font-semibold text-slate-900">{title}</legend>
        {description ? (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}
