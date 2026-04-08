"use client";

import { ReportsExportActions } from "./ReportsExportActions";
import { PrintReadySummaryStrip } from "./PrintReadySummaryStrip";

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

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

interface UnifiedTabClientProps {
  unified: {
    stats: Array<{ label: string; value: string | number; hint?: string }>;
    insights: Array<{ title: string; description: string; tone?: "default" | "success" | "warning" }>;
    departmentHealth: Array<{
      name: string;
      memberCount: number;
      eventCount: number;
      outflowTotal: number;
    }>;
  };
}

function findStatValue(
  stats: Array<{ label: string; value: string | number }>,
  candidates: string[]
) {
  const stat = stats.find((item) =>
    candidates.some((candidate) => item.label.toLowerCase() === candidate.toLowerCase())
  );

  return stat?.value;
}

export function UnifiedTabClient({ unified }: UnifiedTabClientProps) {
  const strongestDepartment = findStatValue(unified.stats, ["Top Department", "Strongest Department"]);
  const quietDepartments = findStatValue(unified.stats, ["Quiet Departments"]);
  const dataGaps = findStatValue(unified.stats, ["Data Gaps", "Data Cleanup Gaps"]);

  return (
    <div className="space-y-6">
      <ReportsExportActions />

      <PrintReadySummaryStrip
        title="Unified Print Summary"
        items={unified.stats.slice(0, 4)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {unified.stats.map((stat) => (
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

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-blue-200 bg-blue-50 shadow-sm">
          <div className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Strongest Footprint</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-blue-950">
              {strongestDepartment ? String(strongestDepartment) : "No clear leader yet"}
            </p>
            <p className="mt-3 text-sm leading-6 text-blue-900">
              The department currently showing the strongest combined signal across people, activity, and treasury movement.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Quiet Departments</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-amber-950">
              {quietDepartments !== undefined ? String(quietDepartments) : "—"}
            </p>
            <p className="mt-3 text-sm leading-6 text-amber-900">
              Departments with people footprint but little or no visible activity in the selected reporting window.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-rose-200 bg-rose-50 shadow-sm">
          <div className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-rose-700">Data Cleanup Gaps</p>
            <p className="mt-3 text-2xl font-bold tracking-tight text-rose-950">
              {dataGaps !== undefined ? String(dataGaps) : "—"}
            </p>
            <p className="mt-3 text-sm leading-6 text-rose-900">
              Household, department, or data-linkage gaps that can weaken decision quality and reporting confidence.
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Unified Intelligence Cards</h3>
          <p className="mt-1 text-sm text-slate-500">Cross-module leadership observations generated from the current reporting window.</p>
        </div>
        <div className="p-5">
          {unified.insights.length === 0 ? (
            <EmptyBlock message="No unified insight cards available yet." />
          ) : (
            <div className="space-y-3">
              {unified.insights.map((item) => (
                <div key={item.title} className={`rounded-2xl border p-4 ${insightToneClass(item.tone)}`}>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-6 opacity-90">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Department Health Matrix</h3>
          <p className="mt-1 text-sm text-slate-500">Cross-module footprint across membership, events, and treasury movement.</p>
        </div>
        <div className="p-5">
          {unified.departmentHealth.length === 0 ? (
            <EmptyBlock message="No department health data available yet." />
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
                  {unified.departmentHealth.map((row) => (
                    <tr key={row.name} className="border-b border-slate-100 bg-white last:border-b-0">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-slate-700">{row.memberCount.toLocaleString("en-US")}</td>
                      <td className="px-4 py-3 text-slate-700">{row.eventCount.toLocaleString("en-US")}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.outflowTotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

