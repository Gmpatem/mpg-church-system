"use client";

import {
  Bar,
  BarChart,
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

interface Datum {
  name: string;
  value: number;
}

interface TreasuryStat {
  label: string;
  value: string | number;
  hint?: string;
}

interface TreasuryTabClientProps {
  treasury: {
    stats: TreasuryStat[];
    inflowByType: Datum[];
    outflowByType: Datum[];
    inflowByFund: Datum[];
    outflowByFund: Datum[];
    outflowByDepartment: Datum[];
  };
}

export function TreasuryTabClient({ treasury }: TreasuryTabClientProps) {
  // Find key stats for KPI strip
  const findStat = (candidates: string[]) =>
    treasury.stats.find((s) => candidates.some((c) => s.label.toLowerCase().includes(c.toLowerCase())));

  const totalIn = findStat(["total in", "inflow"])?.value ?? "—";
  const totalOut = findStat(["total out", "outflow"])?.value ?? "—";
  const net = findStat(["net"])?.value ?? "—";
  const balance = findStat(["balance"])?.value ?? "—";

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Total Inflow</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatMetric(totalIn)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Total Outflow</p>
          <p className="mt-1 text-xl font-bold text-rose-700">{formatMetric(totalOut)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Net Position</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(net)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Balance</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(balance)}</p>
        </div>
      </div>

      {/* Main Charts: Inflow + Outflow by Type */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Inflow by Type */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Inflow by Type</h3>
            <p className="text-xs text-slate-500">Tithe, offering, donation, and contribution mix</p>
          </div>
          <div className="p-4">
            {treasury.inflowByType.length === 0 ? (
              <EmptyChart message="No inflow data available." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={treasury.inflowByType}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {treasury.inflowByType.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {treasury.inflowByType.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-slate-600">{item.name}</span>
                      <span className="ml-auto font-medium text-slate-900">{item.value.toLocaleString("en-US")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Outflow by Type */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Outflow by Type</h3>
            <p className="text-xs text-slate-500">Expense pattern across treasury categories</p>
          </div>
          <div className="p-4">
            {treasury.outflowByType.length === 0 ? (
              <EmptyChart message="No outflow data available." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={treasury.outflowByType}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {treasury.outflowByType.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {treasury.outflowByType.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-slate-600">{item.name}</span>
                      <span className="ml-auto font-medium text-slate-900">{item.value.toLocaleString("en-US")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fund Breakdown: Bar Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Inflow Funds */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Top Inflow Funds</h3>
          </div>
          <div className="p-4">
            {treasury.inflowByFund.length === 0 ? (
              <EmptyChart message="No fund-linked inflow data available." />
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={treasury.inflowByFund.slice(0, 6)} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
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
                      {treasury.inflowByFund.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Top Outflow Funds */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Top Outflow Funds</h3>
          </div>
          <div className="p-4">
            {treasury.outflowByFund.length === 0 ? (
              <EmptyChart message="No fund-linked outflow data available." />
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={treasury.outflowByFund.slice(0, 6)} margin={{ left: 6, right: 12, top: 8, bottom: 8 }}>
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
                      {treasury.outflowByFund.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Outflow Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="font-semibold text-slate-900">Outflow by Department</h3>
          <p className="text-xs text-slate-500">Department-linked treasury movement</p>
        </div>
        <div className="p-4">
          {treasury.outflowByDepartment.length === 0 ? (
            <EmptyBlock message="No department-linked outflow data available." />
          ) : (
            <div className="divide-y divide-slate-100">
              {treasury.outflowByDepartment.slice(0, 8).map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-slate-700">{item.name}</span>
                  <span className="text-sm font-medium text-slate-900">{item.value.toLocaleString("en-US")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
