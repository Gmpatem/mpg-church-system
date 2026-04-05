export function WorkspaceLoadingShell({
  stats = 6,
  tall = false,
}: {
  stats?: number;
  tall?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className={tall ? "h-[560px] animate-pulse rounded-2xl bg-slate-200" : "h-96 animate-pulse rounded-2xl bg-slate-200"} />
    </div>
  );
}
