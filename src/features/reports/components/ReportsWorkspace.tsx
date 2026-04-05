"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DepartmentHealthRow,
  ReportDatum,
  ReportInsight,
  ReportListItem,
  ReportStat,
  ReportTabKey,
  ReportTrendDatum,
  ReportsWorkspaceData,
} from "@/features/reports/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { useReportExport } from "@/features/reports/hooks";

const TAB_ITEMS: Array<{ key: ReportTabKey; label: string; short: string }> = [
  { key: "overview", label: "Overview", short: "Overview" },
  { key: "members", label: "Members", short: "Members" },
  { key: "departments", label: "Departments", short: "Departments" },
  { key: "treasury", label: "Treasury", short: "Treasury" },
  { key: "events", label: "Events", short: "Events" },
  { key: "unified", label: "Unified Report", short: "Unified" },
];

const CHART_COLORS = ["#1d4ed8", "#0f766e", "#7c3aed", "#ea580c", "#2563eb", "#be123c", "#0891b2", "#65a30d"];

function formatMetric(value: string | number) {
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }
  return value;
}

function insightToneClasses(tone?: "default" | "success" | "warning") {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }
  return "border-slate-200 bg-slate-50 text-slate-900";
}

function ReportStatGrid({ stats }: { stats: ReportStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label} className="overflow-hidden border-slate-200 shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500" />
          <CardHeader className="pb-3">
            <CardDescription className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {stat.label}
            </CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-950">
              {formatMetric(stat.value)}
            </CardTitle>
          </CardHeader>
          {stat.hint ? (
            <CardContent className="pt-0">
              <p className="text-xs text-slate-500">{stat.hint}</p>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-slate-200 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight text-slate-950">{title}</CardTitle>
        {description ? <CardDescription className="text-sm leading-6">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function DonutChartCard({
  title,
  description,
  data,
  emptyMessage,
}: {
  title: string;
  description?: string;
  data: ReportDatum[];
  emptyMessage: string;
}) {
  return (
    <SectionCard title={title} description={description}>
      {data.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={100} paddingAngle={3}>
                  {data.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-slate-950">{item.value.toLocaleString("en-US")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function BarChartCard({
  title,
  description,
  data,
  emptyMessage,
  valueLabel = "value",
}: {
  title: string;
  description?: string;
  data: ReportDatum[];
  emptyMessage: string;
  valueLabel?: string;
}) {
  return (
    <SectionCard title={title} description={description}>
      {data.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={76} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
              <Legend />
              <Bar dataKey="value" name={valueLabel} radius={[10, 10, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}

function TrendChartCard({
  title,
  description,
  data,
  emptyMessage,
  mode,
}: {
  title: string;
  description?: string;
  data: ReportTrendDatum[];
  emptyMessage: string;
  mode: "treasury" | "members" | "events";
}) {
  return (
    <SectionCard title={title} description={description}>
      {data.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            {mode === "treasury" ? (
              <AreaChart data={data} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="inflow" name="Inflow" stroke="#1d4ed8" fill="#93c5fd" />
                <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#ea580c" fill="#fdba74" />
              </AreaChart>
            ) : mode === "members" ? (
              <LineChart data={data} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="members" name="Member additions" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            ) : (
              <LineChart data={data} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="events" name="Events" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}

function InsightList({ title, items }: { title: string; items: ReportInsight[] }) {
  return (
    <SectionCard title={title}>
      {items.length === 0 ? (
        <EmptyState message="No insight cards available yet." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.title} className={cn("rounded-2xl border p-4", insightToneClasses(item.tone))}>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1.5 text-sm leading-6 opacity-90">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function RankedList({
  title,
  description,
  items,
  emptyMessage,
}: {
  title: string;
  description?: string;
  items: ReportListItem[];
  emptyMessage: string;
}) {
  return (
    <SectionCard title={title} description={description}>
      {items.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-start justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                {item.sublabel ? <p className="mt-1 text-xs text-slate-500">{item.sublabel}</p> : null}
              </div>
              {item.value !== undefined ? (
                <span className="text-sm font-medium text-slate-700">{String(item.value)}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function DepartmentHealthTable({ rows }: { rows: DepartmentHealthRow[] }) {
  return (
    <SectionCard title="Department Health Matrix" description="Cross-module footprint across membership, events, and treasury movement.">
      {rows.length === 0 ? (
        <EmptyState message="No department health data available yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Events</th>
                <th className="px-4 py-3 font-medium">Outflow</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-slate-100 bg-white last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.memberCount.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-slate-700">{row.eventCount.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-slate-700">{row.outflowTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function HeaderActionButtons({
  churchSlug,
  filters,
}: {
  churchSlug: string;
  filters: any;
}) {
  const { triggerExport, pending } = useReportExport(churchSlug, filters);

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="secondary" disabled={pending} onClick={() => triggerExport("pdf")}>
        Export PDF
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => triggerExport("excel")}>
        Export Excel
      </Button>
      <Button type="button" variant="secondary" disabled={pending} onClick={() => triggerExport("print")}>
        Print Report
      </Button>
      <Button type="button" variant="outline" disabled title="Preset flow comes next">
        Save Preset
      </Button>
      <Button type="button" variant="outline" disabled title="Snapshot flow comes next">
        Save Snapshot
      </Button>
      <Button type="button" variant="outline" disabled title="Scheduling flow comes next">
        Schedule
      </Button>
    </div>
  );
}

function QuickRangeChips({ churchSlug }: { churchSlug: string }) {
  const today = new Date();

  function isoDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  const last30Start = new Date(today);
  last30Start.setDate(last30Start.getDate() - 30);

  const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
  const quarterStart = new Date(today.getFullYear(), quarterStartMonth, 1);

  const yearStart = new Date(today.getFullYear(), 0, 1);

  const ranges = [
    { label: "Last 30 Days", dateFrom: isoDate(last30Start), dateTo: isoDate(today) },
    { label: "This Quarter", dateFrom: isoDate(quarterStart), dateTo: isoDate(today) },
    { label: "This Year", dateFrom: isoDate(yearStart), dateTo: isoDate(today) },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <a
          key={range.label}
          href={`/c/${churchSlug}/reports?dateFrom=${range.dateFrom}&dateTo=${range.dateTo}`}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          {range.label}
        </a>
      ))}
    </div>
  );
}

function FilterBar({
  churchSlug,
  dateFrom,
  dateTo,
}: {
  churchSlug: string;
  dateFrom: string;
  dateTo: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Global Reporting Filters</p>
            <p className="text-sm text-slate-500">This date range controls all tabs in the reporting workspace.</p>
          </div>
          <QuickRangeChips churchSlug={churchSlug} />
        </div>

        <form method="get" action={`/c/${churchSlug}/reports`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[160px_160px_auto]">
          <div>
            <label htmlFor="dateFrom" className="mb-1 block text-sm font-medium text-slate-700">
              From
            </label>
            <input
              id="dateFrom"
              name="dateFrom"
              type="date"
              defaultValue={dateFrom}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="mb-1 block text-sm font-medium text-slate-700">
              To
            </label>
            <input
              id="dateTo"
              name="dateTo"
              type="date"
              defaultValue={dateTo}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit">Apply Range</Button>
            <Button asChild type="button" variant="outline">
              <a href={`/c/${churchSlug}/reports`}>Reset</a>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UnifiedHero({
  strongestDepartment,
  quietCount,
  dataGapCount,
}: {
  strongestDepartment?: string;
  quietCount: number;
  dataGapCount: number;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="border-blue-200 bg-blue-50 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase tracking-[0.18em] text-blue-700">Strongest Footprint</CardDescription>
          <CardTitle className="text-xl text-blue-950">{strongestDepartment ?? "No clear leader yet"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-blue-900">
            The department currently showing the strongest combined signal across people, activity, and treasury movement.
          </p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase tracking-[0.18em] text-amber-700">Quiet Departments</CardDescription>
          <CardTitle className="text-xl text-amber-950">{quietCount}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-amber-900">
            Departments with members but no recorded event activity in the selected reporting window.
          </p>
        </CardContent>
      </Card>

      <Card className="border-rose-200 bg-rose-50 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase tracking-[0.18em] text-rose-700">Data Cleanup Gaps</CardDescription>
          <CardTitle className="text-xl text-rose-950">{dataGapCount}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-rose-900">
            Household and department-assignment gaps that can weaken the quality of reporting decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsWorkspace({
  churchSlug,
  data,
}: {
  churchSlug: string;
  data: ReportsWorkspaceData;
}) {
  const [activeTab, setActiveTab] = useState<ReportTabKey>("overview");

  const strongestDepartment = typeof data.unified.stats.find((item) => item.label === "Top Department")?.value === "string"
    ? String(data.unified.stats.find((item) => item.label === "Top Department")?.value)
    : undefined;

  const quietCount = Number(data.unified.stats.find((item) => item.label === "Quiet Departments")?.value ?? 0);
  const dataGapCount = Number(data.unified.stats.find((item) => item.label === "Data Gaps")?.value ?? 0);

  const tabContent = useMemo(() => {
    if (activeTab === "members") {
      return (
        <div className="space-y-6">
          <ReportStatGrid stats={data.members.stats} />
          <div className="grid gap-6 2xl:grid-cols-2">
            <DonutChartCard
              title="Membership Status"
              description="Current status mix across the church roster."
              data={data.members.statusBreakdown}
              emptyMessage="No member status data is available yet."
            />
            <BarChartCard
              title="Members by Department"
              description="Department assignment strength across the church."
              data={data.members.byDepartment}
              emptyMessage="No department assignment data is available yet."
              valueLabel="Members"
            />
          </div>
          <div className="grid gap-6 2xl:grid-cols-2">
            <TrendChartCard
              title="Recent Member Additions"
              description="Member creation trend inside the selected reporting window."
              data={data.members.recentTrend}
              emptyMessage="No member trend data available yet."
              mode="members"
            />
            <RankedList
              title="Recent Member Records"
              description="Latest member additions inside the current filter."
              items={data.members.recentMembers}
              emptyMessage="No recent member records in the selected range."
            />
          </div>
          <InsightList title="Member Health Watch" items={data.members.health} />
        </div>
      );
    }

    if (activeTab === "departments") {
      return (
        <div className="space-y-6">
          <ReportStatGrid stats={data.departments.stats} />
          <div className="grid gap-6 2xl:grid-cols-2">
            <BarChartCard
              title="Members by Department"
              description="Which ministries have the widest people footprint."
              data={data.departments.membersByDepartment}
              emptyMessage="No department membership data available yet."
              valueLabel="Members"
            />
            <BarChartCard
              title="Events by Department"
              description="Event activity by ministry area within the selected range."
              data={data.departments.eventsByDepartment}
              emptyMessage="No department-linked events available in this range."
              valueLabel="Events"
            />
          </div>
          <div className="grid gap-6 2xl:grid-cols-2">
            <BarChartCard
              title="Outflow by Department"
              description="Treasury outflow attributed to departments in the current window."
              data={data.departments.outflowByDepartment}
              emptyMessage="No department-linked treasury outflow available yet."
              valueLabel="Outflow"
            />
            <RankedList
              title="Department Footprint Ranking"
              description="Combined glimpse of people, events, and money movement."
              items={data.departments.rankings}
              emptyMessage="No department ranking data is available yet."
            />
          </div>
          <InsightList title="Department Watchlist" items={data.departments.watchlist} />
        </div>
      );
    }

    if (activeTab === "treasury") {
      return (
        <div className="space-y-6">
          <ReportStatGrid stats={data.treasury.stats} />
          <TrendChartCard
            title="Treasury Movement Trend"
            description="Inflow and outflow movement across the selected period."
            data={data.treasury.trend}
            emptyMessage="No treasury trend data available yet."
            mode="treasury"
          />
          <div className="grid gap-6 2xl:grid-cols-2">
            <DonutChartCard
              title="Inflow by Type"
              description="Tithe, offering, donation, and special contribution mix."
              data={data.treasury.inflowByType}
              emptyMessage="No inflow data available for this period."
            />
            <DonutChartCard
              title="Outflow by Type"
              description="Expense pattern across treasury categories."
              data={data.treasury.outflowByType}
              emptyMessage="No outflow data available for this period."
            />
          </div>
          <div className="grid gap-6 2xl:grid-cols-2">
            <BarChartCard
              title="Top Inflow Funds"
              description="Most active receiving funds in the current range."
              data={data.treasury.inflowByFund}
              emptyMessage="No fund-linked inflow data is available yet."
              valueLabel="Amount"
            />
            <BarChartCard
              title="Top Outflow Funds"
              description="Funds carrying the most outgoing movement."
              data={data.treasury.outflowByFund}
              emptyMessage="No fund-linked outflow data is available yet."
              valueLabel="Amount"
            />
          </div>
          <BarChartCard
            title="Outflow by Department"
            description="Which departments are pulling treasury movement in the current range."
            data={data.treasury.outflowByDepartment}
            emptyMessage="No department-linked outflow data available yet."
            valueLabel="Amount"
          />
        </div>
      );
    }

    if (activeTab === "events") {
      return (
        <div className="space-y-6">
          <ReportStatGrid stats={data.events.stats} />
          <div className="grid gap-6 2xl:grid-cols-2">
            <DonutChartCard
              title="Events by Status"
              description="Scheduled, completed, and cancelled activity split."
              data={data.events.byStatus}
              emptyMessage="No event status data is available yet."
            />
            <BarChartCard
              title="Events by Type"
              description="Where church programming is leaning right now."
              data={data.events.byType}
              emptyMessage="No event type data is available yet."
              valueLabel="Events"
            />
          </div>
          <div className="grid gap-6 2xl:grid-cols-2">
            <BarChartCard
              title="Events by Department"
              description="Department-linked event footprint across the selected window."
              data={data.events.byDepartment}
              emptyMessage="No department event activity available in this range."
              valueLabel="Events"
            />
            <TrendChartCard
              title="Event Trend"
              description="How event volume moved across the selected reporting period."
              data={data.events.trend}
              emptyMessage="No event trend data is available yet."
              mode="events"
            />
          </div>
          <RankedList
            title="Upcoming Events"
            description="Scheduled items still ahead of the current time."
            items={data.events.upcoming}
            emptyMessage="No upcoming scheduled events were found."
          />
        </div>
      );
    }

    if (activeTab === "unified") {
      return (
        <div className="space-y-6">
          <UnifiedHero
            strongestDepartment={strongestDepartment}
            quietCount={quietCount}
            dataGapCount={dataGapCount}
          />
          <ReportStatGrid stats={data.unified.stats} />
          <InsightList title="Unified Intelligence Cards" items={data.unified.insights} />
          <DepartmentHealthTable rows={data.unified.departmentHealth} />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <ReportStatGrid stats={data.overview.stats} />
        <div className="grid gap-6 2xl:grid-cols-2">
          <DonutChartCard
            title="Membership Status"
            description="Roster status snapshot for leadership review."
            data={data.overview.membershipStatus}
            emptyMessage="No membership status data is available yet."
          />
          <TrendChartCard
            title="Treasury Trend"
            description="High-level treasury movement over time."
            data={data.overview.treasuryTrend}
            emptyMessage="No treasury movement is available in the selected range."
            mode="treasury"
          />
        </div>
        <div className="grid gap-6 2xl:grid-cols-2">
          <DonutChartCard
            title="Event Status"
            description="Operational event state inside the current reporting window."
            data={data.overview.eventStatus}
            emptyMessage="No event status data is available yet."
          />
          <RankedList
            title="Top Departments"
            description="Highest member footprint right now."
            items={data.overview.topDepartments}
            emptyMessage="No department footprint data is available yet."
          />
        </div>
        <InsightList title="Leadership Highlights" items={data.overview.highlights} />
      </div>
    );
  }, [activeTab, data, strongestDepartment, quietCount, dataGapCount]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100">
                Reporting Workspace
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                {data.filters.label}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Church Intelligence Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              A single reporting command center for members, departments, treasury, events, and unified leadership insight across the church.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-blue-100">
              <span className="rounded-full bg-white/10 px-3 py-1">{data.churchName}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Live workspace</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Global filter active</span>
            </div>
          </div>

          <HeaderActionButtons churchSlug={churchSlug} filters={data.filters} />
        </div>
      </div>

      <FilterBar churchSlug={churchSlug} dateFrom={data.filters.dateFrom} dateTo={data.filters.dateTo} />

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
                aria-pressed={isActive}
              >
                {tab.short}
              </button>
            );
          })}
        </div>
      </div>

      {tabContent}
    </div>
  );
}
