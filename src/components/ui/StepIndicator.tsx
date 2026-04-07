import { cn } from "@/lib/utils/cn";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <nav aria-label="Form progress" className={cn("w-full", className)}>
      <ol className="flex items-center gap-0">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <li key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isCompleted && "border-emerald-600 bg-emerald-600 text-white",
                    isCurrent && "border-blue-600 bg-blue-600 text-white",
                    !isCompleted && !isCurrent && "border-slate-300 bg-white text-slate-400"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium leading-tight text-center",
                    isCurrent ? "text-blue-700" : "text-slate-500"
                  )}
                >
                  {step}
                </span>
              </div>

              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    "mx-2 mb-5 h-0.5 flex-1 transition-colors",
                    isCompleted ? "bg-emerald-400" : "bg-slate-200"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
