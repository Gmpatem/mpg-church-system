"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = ["#1d4ed8", "#0f766e", "#7c3aed", "#ea580c", "#2563eb", "#be123c"];

function formatMetric(value: string | number) {
  if (typeof value === "number") return value.toLocaleString("en-US");
  return value;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

interface EventsTabClientProps {
  events: {
    stats: Array<{ label: string; value: string | number; hint?: string }>;
    byStatus: Array<{ name: string; value: number }>;
    byType: Array<{ name: string; value: number }>;
    byDepartment: Array<{ name: string; value: number }>;
    trend: Array<{ label: string; events: number }>;
    upcoming: Array<{ label: string; sublabel?: string; value?: string | number }>;
  };
}

export function EventsTabClient({ events }: EventsTabClientProps) {
  // Find key stats for KPI strip
  const findStat = (candidates: string[]) =>
    events.stats.find((s) => candidates.some((c) => s.label.toLowerCase().includes(c.toLowerCase())));

  const totalEvents = findStat(["total events", "events"])?.value ?? "—";
  const scheduled = findStat(["scheduled", "upcoming"])?.value ?? "—";
  const completed = findStat(["completed", "done"])?.value ?? "—";
  const cancelled = findStat(["cancelled", "canceled"])?.value ?? "—";

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Total Events</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(totalEvents)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Scheduled</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{formatMetric(scheduled)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Completed</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatMetric(completed)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Cancelled</p>
          <p className="mt-1 text-xl font-bold text-rose-700">{formatMetric(cancelled)}</p>
        </div>
      </div>

      {/* Main Charts: Status + Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Events by Status */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Events by Status</h3>
            <p className="text-xs text-slate-500">Scheduled, completed, and cancelled activity split</p>
          </div>
          <div className="p-4">
            {events.byStatus.length === 0 ? (
              <EmptyChart message="No event status data available." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={events.byStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {events.byStatus.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {events.byStatus.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="capitalize text-slate-600">{item.name}</span>
                      <span className="ml-auto font-medium text-slate-900">{item.value.toLocaleString("en-US")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Trend */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Event Trend</h3>
            <p className="text-xs text-slate-500">Event volume across the reporting period</p>
          </div>
          <div className="p-4">
            {events.trend.length === 0 ? (
              <EmptyChart message="No event trend data available." />
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={events.trend} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="events"
                      name="Events"
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supporting Charts: Type + Department */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Events by Type */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Events by Type</h3>
            <p className="text-xs text-slate-500">Where church programming is leaning</p>
          </div>
          <div className="p-4">
            {events.byType.length === 0 ? (
              <EmptyChart message="No event type data available." />
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={events.byType.slice(0, 6)} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {events.byType.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Events by Department */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Events by Department</h3>
            <p className="text-xs text-slate-500">Department-linked event footprint</p>
          </div>
          <div className="p-4">
            {events.byDepartment.length === 0 ? (
              <EmptyChart message="No department event activity available." />
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={events.byDepartment.slice(0, 6)} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {events.byDepartment.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Upcoming Events</h3>
          <p className="text-xs text-slate-500">Scheduled items still ahead</p>
        </div>
        <div className="p-4">
          {events.upcoming.length === 0 ? (
            <EmptyBlock message="No upcoming scheduled events found." />
          ) : (
            <div className="divide-y divide-slate-100">
              {events.upcoming.slice(0, 8).map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-start justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    {item.sublabel ? <p className="text-xs text-slate-500">{item.sublabel}</p> : null}
                  </div>
                  {item.value !== undefined ? (
                    <span className="text-sm text-slate-600">{String(item.value)}</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
