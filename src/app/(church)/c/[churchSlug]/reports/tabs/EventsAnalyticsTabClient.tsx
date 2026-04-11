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

interface EventsAnalyticsTabClientProps {
  events: {
    stats: Array<{ label: string; value: string | number; hint?: string }>;
    byStatus: Array<{ name: string; value: number }>;
    byType: Array<{ name: string; value: number }>;
    byDepartment: Array<{ name: string; value: number }>;
    trend: Array<{ label: string; events: number }>;
    upcoming: Array<{ label: string; sublabel?: string; value?: string | number }>;
  };
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function EventsAnalyticsTabClient({ events }: EventsAnalyticsTabClientProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(420px,1fr)]">
        <WorkspaceSectionCard
          title="Event Volume Trend"
          description="Main chart showing event volume movement through the selected reporting window."
        >
          {events.trend.length === 0 ? (
            <EmptyBlock message="No event trend data available yet." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={events.trend} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" name="Events" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Department Breakdown"
          description="Event count by department to identify active and quiet ministry lanes."
          contentClassName="p-0"
        >
          {events.byDepartment.length === 0 ? (
            <div className="p-5">
              <EmptyBlock message="No department event data available yet." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {events.byDepartment.map((item) => (
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
        title="Operational Insights"
        description="Status/type context and upcoming schedule items for planning follow-up."
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Status Breakdown</p>
              {events.byStatus.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No status data available.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {events.byStatus.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm text-slate-700">
                      <span>{item.name}</span>
                      <span className="font-semibold text-slate-900">{item.value.toLocaleString("en-US")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Type Breakdown</p>
              {events.byType.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No type data available.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {events.byType.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm text-slate-700">
                      <span>{item.name}</span>
                      <span className="font-semibold text-slate-900">{item.value.toLocaleString("en-US")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Upcoming Schedule</p>
            </div>
            {events.upcoming.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">No upcoming scheduled events were found.</div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">When</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {events.upcoming.map((item, index) => (
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
      </WorkspaceSectionCard>
    </div>
  );
}
