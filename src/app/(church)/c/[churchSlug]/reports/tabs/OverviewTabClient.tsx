"use client";

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

function insightToneClass(tone?: "default" | "success" | "warning") {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-900";
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

function formatMetric(value: string | number) {
  if (typeof value === "number") return value.toLocaleString("en-US");
  return value;
}

export function OverviewTabClient({ overview }: OverviewTabClientProps) {
  // Find key stats for KPI strip
  const findStat = (candidates: string[]) =>
    overview.stats.find((s) => candidates.some((c) => s.label.toLowerCase().includes(c.toLowerCase())));

  const totalMembers = findStat(["total members", "members"])?.value ?? "—";
  const activeMembers = findStat(["active"])?.value ?? "—";
  const totalIn = findStat(["total in", "inflow"])?.value ?? "—";
  const totalEvents = findStat(["events", "total events"])?.value ?? "—";

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Total Members</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(totalMembers)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Active Members</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(activeMembers)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Total Inflow</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(totalIn)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Events</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(totalEvents)}</p>
        </div>
      </div>

      {/* Main Chart Area: Treasury Trend + Membership */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Treasury Trend */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Treasury Trend</h3>
          </div>
          <div className="p-4">
            {overview.treasuryTrend.length === 0 ? (
              <EmptyChart message="No treasury trend data available." />
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.treasuryTrend} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="inflow" name="Inflow" stroke="#1d4ed8" fill="#93c5fd" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#ea580c" fill="#fdba74" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Membership Status */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Membership Status</h3>
          </div>
          <div className="p-4">
            {overview.membershipStatus.length === 0 ? (
              <EmptyChart message="No membership status data available." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.membershipStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {overview.membershipStatus.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {overview.membershipStatus.map((item, index) => (
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
      </div>

      {/* Supporting Tables: Departments + Event Status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Departments */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Top Departments</h3>
          </div>
          <div className="p-4">
            {overview.topDepartments.length === 0 ? (
              <EmptyBlock message="No department data available." />
            ) : (
              <div className="divide-y divide-slate-100">
                {overview.topDepartments.slice(0, 6).map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-medium text-slate-900">{String(item.value ?? "—")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Status */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Event Status</h3>
          </div>
          <div className="p-4">
            {overview.eventStatus.length === 0 ? (
              <EmptyBlock message="No event status data available." />
            ) : (
              <div className="space-y-2">
                {overview.eventStatus.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm capitalize text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{item.value.toLocaleString("en-US")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {overview.highlights.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Leadership Highlights</h3>
          </div>
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview.highlights.map((item) => (
                <div key={item.title} className={`rounded-lg border p-3 ${insightToneClass(item.tone)}`}>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-90">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
