type RegistrationProgressProps = {
  current: number;
  total: number;
  label: string;
};

export function RegistrationProgress({ current, total, label }: RegistrationProgressProps) {
  const dots = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <div className="grid gap-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-sm text-stone-600">
        <span className="min-w-0 truncate font-semibold text-stone-950">{label}</span>
        <span className="shrink-0 text-xs font-medium text-emerald-900">
          Step {current} of {total}
        </span>
      </div>
      <div className="flex items-center gap-2" aria-hidden="true">
        {dots.map((dot) => (
          <div
            key={dot}
            className={dot <= current ? "h-2 flex-1 rounded-full bg-emerald-800" : "h-2 flex-1 rounded-full bg-stone-200"}
          />
        ))}
      </div>
    </div>
  );
}
