"use client";

import { WorkspaceSectionCard } from "@/components/workspace";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Datum {
  name: string;
  value: number;
}

interface FinanceAnalyticsTabClientProps {
  treasury: {
    stats: Array<{ label: string; value: string | number; hint?: string }>;
    inflowByType: Datum[];
    outflowByType: Datum[];
    inflowByFund: Datum[];
    outflowByFund: Datum[];
    outflowByDepartment: Datum[];
  };
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function buildTypeComparisonRows(inflows: Datum[], outflows: Datum[]) {
  const map = new Map<string, { name: string; inflow: number; outflow: number }>();

  for (const item of inflows) {
    map.set(item.name, {
      name: item.name,
      inflow: item.value,
      outflow: map.get(item.name)?.outflow ?? 0,
    });
  }

  for (const item of outflows) {
    const existing = map.get(item.name);
    map.set(item.name, {
      name: item.name,
      inflow: existing?.inflow ?? 0,
      outflow: item.value,
    });
  }

  return Array.from(map.values()).sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow));
}

export function FinanceAnalyticsTabClient({ treasury }: FinanceAnalyticsTabClientProps) {
  const typeRows = buildTypeComparisonRows(treasury.inflowByType, treasury.outflowByType);
  const topInflow = [...treasury.inflowByFund].sort((a, b) => b.value - a.value)[0];
  const topOutflow = [...treasury.outflowByFund].sort((a, b) => b.value - a.value)[0];
  const largestDepartmentOutflow = [...treasury.outflowByDepartment].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(420px,1fr)]">
        <WorkspaceSectionCard
          title="Finance Type Comparison"
          description="Main chart comparing inflow and outflow volume by finance type."
        >
          {typeRows.length === 0 ? (
            <EmptyBlock message="No finance type activity available yet." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeRows} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={76} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => value.toLocaleString("en-US")} />
                  <Bar dataKey="inflow" name="Inflow" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="outflow" name="Outflow" fill="#ea580c" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Department Outflow Breakdown"
          description="Top departmental outflow destinations in the current reporting window."
          contentClassName="p-0"
        >
          {treasury.outflowByDepartment.length === 0 ? (
            <div className="p-5">
              <EmptyBlock message="No department-linked outflow data available yet." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {treasury.outflowByDepartment.map((item) => (
                    <tr key={item.name}>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">{item.value.toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WorkspaceSectionCard>
      </div>

      <WorkspaceSectionCard
        title="Finance Insights"
        description="Quick finance observations for leadership and reconciliation follow-up."
      >
        <div className="grid gap-3 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Top Inflow Fund</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{topInflow?.name ?? "No inflow fund data"}</p>
            <p className="mt-1 text-sm text-slate-600">
              {topInflow ? topInflow.value.toLocaleString("en-US") : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Top Outflow Fund</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{topOutflow?.name ?? "No outflow fund data"}</p>
            <p className="mt-1 text-sm text-slate-600">
              {topOutflow ? topOutflow.value.toLocaleString("en-US") : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Largest Department Outflow</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {largestDepartmentOutflow?.name ?? "No department outflow data"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {largestDepartmentOutflow ? largestDepartmentOutflow.value.toLocaleString("en-US") : "-"}
            </p>
          </div>
        </div>
      </WorkspaceSectionCard>
    </div>
  );
}
