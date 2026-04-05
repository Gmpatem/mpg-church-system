import { getReportsOverviewStrip } from "@/features/reports/queries";

function findStatValue(
  stats: Array<{ label: string; value: string | number }>,
  candidates: string[]
) {
  const stat = stats.find((item) =>
    candidates.some((candidate) => item.label.toLowerCase() === candidate.toLowerCase())
  );

  return stat?.value ?? "—";
}

export async function ReportsOverviewSection({
  churchSlug,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const data = await getReportsOverviewStrip(churchSlug, { dateFrom, dateTo });

  const overviewStats = data.overview?.stats ?? [];
  const treasuryStats = data.treasury?.stats ?? [];
  const membersStats = data.members?.stats ?? [];
  const eventsStats = data.events?.stats ?? [];

  const totalIn =
    findStatValue(treasuryStats, ["Total In", "Total Inflow", "Inflows"]) ??
    findStatValue(overviewStats, ["Total In", "Total Inflow", "Inflows"]);

  const totalOut =
    findStatValue(treasuryStats, ["Total Out", "Total Outflow", "Outflows"]) ??
    findStatValue(overviewStats, ["Total Out", "Total Outflow", "Outflows"]);

  const memberCount =
    findStatValue(membersStats, ["Members", "Total Members"]) ??
    findStatValue(overviewStats, ["Members", "Total Members"]);

  const eventCount =
    findStatValue(eventsStats, ["Events", "Total Events"]) ??
    findStatValue(overviewStats, ["Events", "Total Events"]);

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total In</p>
        <p className="mt-2 text-xl font-bold text-slate-950">{String(totalIn)}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Out</p>
        <p className="mt-2 text-xl font-bold text-slate-950">{String(totalOut)}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Members</p>
        <p className="mt-2 text-xl font-bold text-slate-950">{String(memberCount)}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Events</p>
        <p className="mt-2 text-xl font-bold text-slate-950">{String(eventCount)}</p>
      </div>
    </div>
  );
}
