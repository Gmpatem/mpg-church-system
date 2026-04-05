"use client";

import { ReportsExportActions } from "./ReportsExportActions";
import { PrintReadySummaryStrip } from "./PrintReadySummaryStrip";

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
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }
  return value;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
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

function DonutCard({
  title,
  description,
  data,
  emptyMessage,
}: {
  title: string;
  description: string;
  data: Array<{ name: string; value: number }>;
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="p-5">
        {data.length === 0 ? (
          <EmptyChart message={emptyMessage} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="h-[280px]">
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
                    <span className="capitalize">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-950">{item.value.toLocaleString("en-US")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BarCard({
  title,
  description,
  data,
  emptyMessage,
}: {
  title: string;
  description: string;
  data: Array<{ name: string; value: number }>;
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="p-5">
        {data.length === 0 ? (
          <EmptyChart message={emptyMessage} />
        ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={76}
                />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

export function EventsTabClient({ events }: EventsTabClientProps) {
  return (
    <div className="space-y-6">
      <ReportsExportActions
        title="Events Reporting Actions"
        subtitle="Prepare event summaries for planning meetings, calendars, and leadership review."
      />

      <PrintReadySummaryStrip
        title="Events Print Summary"
        items={events.stats.slice(0, 4)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {events.stats.map((stat) => (
          <div key={stat.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500" />
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{formatMetric(stat.value)}</p>
              {stat.hint ? <p className="mt-2 text-xs text-slate-500">{stat.hint}</p> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <DonutCard
          title="Events by Status"
          description="Scheduled, completed, and cancelled activity split."
          data={events.byStatus}
          emptyMessage="No event status data available yet."
        />
        <BarCard
          title="Events by Type"
          description="Where church programming is leaning right now."
          data={events.byType}
          emptyMessage="No event type data available yet."
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <BarCard
          title="Events by Department"
          description="Department-linked event footprint across the selected window."
          data={events.byDepartment}
          emptyMessage="No department event activity available yet."
        />

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">Upcoming Events</h3>
            <p className="mt-1 text-sm text-slate-500">Scheduled items still ahead of the current time.</p>
          </div>
          <div className="p-5">
            {events.upcoming.length === 0 ? (
              <EmptyBlock message="No upcoming scheduled events were found." />
            ) : (
              <div className="space-y-3">
                {events.upcoming.map((item, index) => (
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
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Event Trend</h3>
          <p className="mt-1 text-sm text-slate-500">How event volume moved across the selected reporting period.</p>
        </div>
        <div className="p-5">
          {events.trend.length === 0 ? (
            <EmptyChart message="No event trend data available yet." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={events.trend} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" name="Events" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

