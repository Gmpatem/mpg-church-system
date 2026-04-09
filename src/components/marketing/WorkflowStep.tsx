import { cn } from "@/lib/utils/cn";

interface WorkflowStepProps {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}

export function WorkflowStep({ number, title, description, isLast }: WorkflowStepProps) {
  return (
    <div className="relative flex gap-6">
      {/* Number circle */}
      <div className="flex shrink-0 flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 text-white font-semibold">
          {number}
        </div>
        {!isLast && (
          <div className="mt-4 w-px flex-1 bg-gradient-to-b from-slate-300 to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className={cn("pb-10", isLast && "pb-0")}>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
