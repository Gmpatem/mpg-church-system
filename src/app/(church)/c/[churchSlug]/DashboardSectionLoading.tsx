export function DashboardSectionLoading({
  cards = false,
}: {
  cards?: boolean;
}) {
  if (cards) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="h-[360px] animate-pulse rounded-2xl bg-slate-200" />
      <div className="space-y-6">
        <div className="h-[190px] animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-[140px] animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
