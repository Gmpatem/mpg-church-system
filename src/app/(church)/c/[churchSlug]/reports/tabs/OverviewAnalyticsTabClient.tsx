"use client";

import { WorkspaceSectionCard } from "@/components/workspace";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OverviewAnalyticsTabClientProps {
  overview: {
    stats: Array<{ label: string; value: string | number; hint?: string }>;
    membershipStatus: Array<{ name: string; value: number }>;
    eventStatus: Array<{ name: string; value: number }>;
    treasuryTrend: Array<{ label: string; inflow: number; outflow: number; net: number }>;
    topDepartments: Array<{ label: string; value?: string | number }>;
    highlights: Array<{ title: string; description: string; tone?: "default" | "success" | "warning" }>;
  };
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function insightToneClass(tone?: "default" | "success" | "warning") {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-900";
}

export function OverviewAnalyticsTabClient({ overview }: OverviewAnalyticsTabClientProps) {
  const breakdownRows = [
    ...overview.membershipStatus.map((item) => ({ domain: "Membership", label: item.name, value: item.value })),
    ...overview.eventStatus.map((item) => ({ domain: "Events", label: item.name, value: item.value })),
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(420px,1fr)]">
        <WorkspaceSectionCard
          title="Treasury Trend"
          description="Main movement view for inflow and outflow across the selected reporting window."
        >
          {overview.treasuryTrend.length === 0 ? (
            <EmptyBlock message="No treasury trend data available yet." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.treasuryTrend} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
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
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Operational Breakdown"
          description="Current membership and event status mix for quick leadership scan."
          contentClassName="p-0"
        >
          {breakdownRows.length === 0 ? (
            <div className="p-5">
              <EmptyBlock message="No membership or event status breakdown available yet." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Domain</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {breakdownRows.map((row, index) => (
                    <tr key={`${row.domain}-${row.label}-${index}`}>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{row.domain}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{row.label}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">{row.value.toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WorkspaceSectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspaceSectionCard
          title="Top Departments"
          description="Strongest visible ministry footprint in the selected range."
          contentClassName="p-0"
        >
          {overview.topDepartments.length === 0 ? (
            <div className="p-5">
              <EmptyBlock message="No department footprint data available yet." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {overview.topDepartments.map((item, index) => (
                    <tr key={`${item.label}-${index}`}>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{item.label}</td>
                      <td className="px-4 py-3.5 text-right text-sm text-slate-700">{String(item.value ?? "-")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Insights"
          description="Leadership summary notes generated for the same reporting period."
        >
          {overview.highlights.length === 0 ? (
            <EmptyBlock message="No insight notes available yet." />
          ) : (
            <div className="space-y-3">
              {overview.highlights.map((item) => (
                <div key={item.title} className={`rounded-xl border p-4 ${insightToneClass(item.tone)}`}>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-6 opacity-90">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </WorkspaceSectionCard>
      </div>
    </div>
  );
}
