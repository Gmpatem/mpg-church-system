interface PrintReadySummaryStripProps {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    hint?: string;
  }>;
}

function formatMetric(value: string | number) {
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }
  return value;
}

export function PrintReadySummaryStrip({
  title,
  items,
}: PrintReadySummaryStripProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Compact board-ready summary block for quick printing and review.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {formatMetric(item.value)}
            </p>
            {item.hint ? (
              <p className="mt-1 text-xs text-slate-500">
                {item.hint}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
