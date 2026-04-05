import Link from "next/link";

export function DashboardShell({
  churchName,
  churchSlug,
}: {
  churchName: string;
  churchSlug: string;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 p-6 text-white shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100">
              Church Dashboard
            </span>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
              Live workspace
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            {churchName}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
            Central operations view for members, departments, treasury, events, and reporting.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/c/${churchSlug}/members`}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
          >
            Manage Members
          </Link>
          <Link
            href={`/c/${churchSlug}/events`}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Open Events
          </Link>
          <Link
            href={`/c/${churchSlug}/reports`}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Open Reports
          </Link>
        </div>
      </div>
    </section>
  );
}
