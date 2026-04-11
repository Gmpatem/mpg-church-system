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

function insightToneClass(tone?: "default" | "success" | "warning") {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-900";
}

interface MembersTabClientProps {
  members: {
    stats: Array<{ label: string; value: string | number; hint?: string }>;
    statusBreakdown: Array<{ name: string; value: number }>;
    byDepartment: Array<{ name: string; value: number }>;
    recentTrend: Array<{ label: string; members: number }>;
    recentMembers: Array<{ label: string; sublabel?: string; value?: string | number }>;
    health: Array<{ title: string; description: string; tone?: "default" | "success" | "warning" }>;
  };
}

export function MembersTabClient({ members }: MembersTabClientProps) {
  // Find key stats for KPI strip
  const findStat = (candidates: string[]) =>
    members.stats.find((s) => candidates.some((c) => s.label.toLowerCase().includes(c.toLowerCase())));

  const totalMembers = findStat(["total members", "members"])?.value ?? "—";
  const activeMembers = findStat(["active"])?.value ?? "—";
  const visitors = findStat(["visitor"])?.value ?? "—";
  const transfers = findStat(["transfer"])?.value ?? "—";

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Total Members</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(totalMembers)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Active</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatMetric(activeMembers)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Visitors</p>
          <p className="mt-1 text-xl font-bold text-blue-700">{formatMetric(visitors)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Transfers</p>
          <p className="mt-1 text-xl font-bold text-slate-700">{formatMetric(transfers)}</p>
        </div>
      </div>

      {/* Main Charts: Membership Status + Recent Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Membership Status */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Membership Status</h3>
            <p className="text-xs text-slate-500">Current status mix across the church roster</p>
          </div>
          <div className="p-4">
            {members.statusBreakdown.length === 0 ? (
              <EmptyChart message="No membership status data available." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={members.statusBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {members.statusBreakdown.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {members.statusBreakdown.map((item, index) => (
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

        {/* Recent Member Additions Trend */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Recent Member Additions</h3>
            <p className="text-xs text-slate-500">Member creation trend inside the reporting window</p>
          </div>
          <div className="p-4">
            {members.recentTrend.length === 0 ? (
              <EmptyChart message="No recent member trend data available." />
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={members.recentTrend} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="members"
                      name="New members"
                      stroke="#1d4ed8"
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

      {/* Department Breakdown */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Members by Department</h3>
          <p className="text-xs text-slate-500">Department assignment strength across the church</p>
        </div>
        <div className="p-4">
          {members.byDepartment.length === 0 ? (
            <EmptyChart message="No department assignment data available." />
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={members.byDepartment.slice(0, 8)} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
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
                    {members.byDepartment.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Supporting Tables: Recent Members */}
      {members.recentMembers.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Recent Member Records</h3>
          </div>
          <div className="p-4">
            <div className="divide-y divide-slate-100">
              {members.recentMembers.slice(0, 6).map((item, index) => (
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
          </div>
        </div>
      )}

      {/* Insights Section */}
      {members.health.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Member Health Watch</h3>
          </div>
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {members.health.map((item) => (
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
