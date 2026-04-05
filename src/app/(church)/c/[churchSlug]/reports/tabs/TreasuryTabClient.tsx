"use client";

import { ReportsExportActions } from "./ReportsExportActions";
import { PrintReadySummaryStrip } from "./PrintReadySummaryStrip";

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

function DonutCard({
  title,
  description,
  data,
  emptyMessage,
}: {
  title: string;
  description: string;
  data: Datum[];
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
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={68}
                    outerRadius={100}
                    paddingAngle={3}
                  >
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
  data: Datum[];
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

export function TreasuryTabClient({ treasury }: TreasuryTabClientProps) {
  return (
    <div className="space-y-6">
      <ReportsExportActions
        title="Treasury Reporting Actions"
        subtitle="Prepare finance summaries for leadership meetings, treasury review, and print handoff."
      />

      <PrintReadySummaryStrip
        title="Treasury Print Summary"
        items={treasury.stats.slice(0, 4)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {treasury.stats.map((stat) => (
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

      <div className="grid gap-6 2xl:grid-cols-2">
        <DonutCard
          title="Inflow by Type"
          description="Tithe, offering, donation, and contribution mix."
          data={treasury.inflowByType}
          emptyMessage="No inflow data available yet."
        />
        <DonutCard
          title="Outflow by Type"
          description="Expense pattern across treasury categories."
          data={treasury.outflowByType}
          emptyMessage="No outflow data available yet."
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <BarCard
          title="Top Inflow Funds"
          description="Most active receiving funds in the current reporting range."
          data={treasury.inflowByFund}
          emptyMessage="No fund-linked inflow data available yet."
        />
        <BarCard
          title="Top Outflow Funds"
          description="Funds carrying the most outgoing movement."
          data={treasury.outflowByFund}
          emptyMessage="No fund-linked outflow data available yet."
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Outflow by Department</h3>
          <p className="mt-1 text-sm text-slate-500">Which departments are pulling treasury movement in the current range.</p>
        </div>
        <div className="p-5">
          {treasury.outflowByDepartment.length === 0 ? (
            <EmptyBlock message="No department-linked outflow data available yet." />
          ) : (
            <div className="space-y-3">
              {treasury.outflowByDepartment.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                  <span className="text-sm font-medium text-slate-700">{item.value.toLocaleString("en-US")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

