"use client";

import { WorkspaceSectionCard } from "@/components/workspace";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MembersAnalyticsTabClientProps {
  members: {
    stats: Array<{ label: string; value: string | number; hint?: string }>;
    statusBreakdown: Array<{ name: string; value: number }>;
    byDepartment: Array<{ name: string; value: number }>;
    recentTrend: Array<{ label: string; members: number }>;
    recentMembers: Array<{ label: string; sublabel?: string; value?: string | number }>;
    health: Array<{ title: string; description: string; tone?: "default" | "success" | "warning" }>;
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

export function MembersAnalyticsTabClient({ members }: MembersAnalyticsTabClientProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(420px,1fr)]">
        <WorkspaceSectionCard
          title="Member Growth Trend"
          description="Main chart for visible member additions across the selected reporting period."
        >
          {members.recentTrend.length === 0 ? (
            <EmptyBlock message="No member trend data available yet." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={members.recentTrend} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="members" name="Member additions" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Department Breakdown"
          description="Member distribution across departments for operational staffing review."
          contentClassName="p-0"
        >
          {members.byDepartment.length === 0 ? (
            <div className="p-5">
              <EmptyBlock message="No members-by-department data available yet." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Members</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {members.byDepartment.map((item) => (
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
        title="Member Insights"
        description="Health signals and recent records for follow-up and retention action."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Health Watch</h4>
            <div className="mt-3 space-y-3">
              {members.health.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No member health notes available yet.
                </div>
              ) : (
                members.health.map((item) => (
                  <div key={item.title} className={`rounded-xl border p-4 ${insightToneClass(item.tone)}`}>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-6 opacity-90">{item.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Recent Member Records</h4>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              {members.recentMembers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No recent member records available yet.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Details</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {members.recentMembers.map((item, index) => (
                      <tr key={`${item.label}-${index}`}>
                        <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{item.label}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-600">{item.sublabel ?? "-"}</td>
                        <td className="px-4 py-3.5 text-right text-sm text-slate-700">{item.value !== undefined ? String(item.value) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </WorkspaceSectionCard>
    </div>
  );
}
