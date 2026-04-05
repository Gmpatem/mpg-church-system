"use client";

interface ReportsExportActionsProps {
  title: string;
  subtitle?: string;
}

export function ReportsExportActions({
  title,
  subtitle,
}: ReportsExportActionsProps) {
  function handlePlaceholder(action: string) {
    window.alert(`${action} for "${title}" is prepared as a placeholder. Real export wiring comes next.`);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handlePlaceholder("Export PDF")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Export PDF
          </button>

          <button
            type="button"
            onClick={() => handlePlaceholder("Export Excel")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Export Excel
          </button>

          <button
            type="button"
            onClick={() => handlePlaceholder("Print Summary")}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Print Summary
          </button>
        </div>
      </div>
    </section>
  );
}
