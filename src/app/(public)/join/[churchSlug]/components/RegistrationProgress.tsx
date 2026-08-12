type RegistrationProgressProps = {
  current: number;
  total: number;
  label: string;
};

export function RegistrationProgress({ current, total, label }: RegistrationProgressProps) {
  const progress = Math.min(100, Math.round((current / total) * 100));
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
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
        <div
          className="h-full rounded-full bg-amber-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
