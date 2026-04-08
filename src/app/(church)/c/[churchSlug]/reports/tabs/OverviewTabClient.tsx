"use client";

import { ReportsExportActions } from "./ReportsExportActions";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
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

function insightToneClass(tone?: "default" | "success" | "warning") {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-900";
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function WorkspaceEmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

interface OverviewTabClientProps {
  overview: {
    stats: Array<{ label: string; value: string | number; hint?: string }>;
    membershipStatus: Array<{ name: string; value: number }>;
    eventStatus: Array<{ name: string; value: number }>;
    treasuryTrend: Array<{ label: string; inflow: number; outflow: number; net: number }>;
    topDepartments: Array<{ label: string; value?: string | number }>;
    highlights: Array<{ title: string; description: string; tone?: "default" | "success" | "warning" }>;
  };
}

export function OverviewTabClient({ overview }: OverviewTabClientProps) {
  return (
    <div className="space-y-6">
      <ReportsExportActions />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overview.stats.map((stat) => (
          <div key={stat.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500" />
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {formatMetric(stat.value)}
              </p>
              {stat.hint ? (
                <p className="mt-2 text-xs text-slate-500">
                  {stat.hint}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">Membership Status</h3>
            <p className="mt-1 text-sm text-slate-500">Current status mix across the visible member records.</p>
          </div>
          <div className="p-5">
            {overview.membershipStatus.length === 0 ? (
              <EmptyChart message="No membership status data available yet." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.membershipStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={68}
                        outerRadius={100}
                        paddingAngle={3}
                      >
                        {overview.membershipStatus.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {overview.membershipStatus.map((item, index) => (
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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">Treasury Trend</h3>
            <p className="mt-1 text-sm text-slate-500">High-level treasury movement over time.</p>
          </div>
          <div className="p-5">
            {overview.treasuryTrend.length === 0 ? (
              <EmptyChart message="No treasury trend data available yet." />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.treasuryTrend} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="inflow" name="Inflow" stroke="#1d4ed8" fill="#93c5fd" />
                    <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#ea580c" fill="#fdba74" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">Event Status</h3>
            <p className="mt-1 text-sm text-slate-500">Operational event state inside the reporting window.</p>
          </div>
          <div className="p-5">
            {overview.eventStatus.length === 0 ? (
              <EmptyChart message="No event status data available yet." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.eventStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={68}
                        outerRadius={100}
                        paddingAngle={3}
                      >
                        {overview.eventStatus.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {overview.eventStatus.map((item, index) => (
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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">Top Departments</h3>
            <p className="mt-1 text-sm text-slate-500">Highest visible ministry footprint right now.</p>
          </div>
          <div className="p-5">
            {overview.topDepartments.length === 0 ? (
              <WorkspaceEmptyBlock message="No department footprint data available yet." />
            ) : (
              <div className="space-y-3">
                {overview.topDepartments.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{String(item.value ?? "—")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Leadership Highlights</h3>
          <p className="mt-1 text-sm text-slate-500">Auto-generated summary cards for the current reporting window.</p>
        </div>
        <div className="p-5">
          {overview.highlights.length === 0 ? (
            <WorkspaceEmptyBlock message="No highlight cards available yet." />
          ) : (
            <div className="space-y-3">
              {overview.highlights.map((item) => (
                <div key={item.title} className={`rounded-2xl border p-4 ${insightToneClass(item.tone)}`}>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-6 opacity-90">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

