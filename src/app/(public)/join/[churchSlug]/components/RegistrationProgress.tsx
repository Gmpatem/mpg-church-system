type RegistrationProgressProps = {
  current: number;
  total: number;
  label: string;
};

export function RegistrationProgress({ current, total, label }: RegistrationProgressProps) {
  const progress = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-sm text-stone-600">
        <span className="shrink-0 font-medium">
          Step {current} of {total}
        </span>
        <span className="min-w-0 truncate text-right text-stone-700">{label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
        <div
          className="h-full rounded-full bg-emerald-700 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-right text-xs text-stone-500">{progress}% complete</p>
    </div>
  );
}
