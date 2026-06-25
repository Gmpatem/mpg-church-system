"use client";

import { BarChart3, CheckCircle2, UsersRound } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils/cn";
import type { SmallGroupsWorkspaceData } from "../types";
import { formatDate, numberFormat } from "../shared";

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "green",
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone?: "green" | "blue" | "orange";
}) {
  const toneClasses = {
    green: "bg-emerald-50 text-primary",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <section className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold leading-none text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", toneClasses[tone])}>
          {icon}
        </div>
      </div>
    </section>
  );
}

function AttendanceTrendPanel({ data }: { data: SmallGroupsWorkspaceData }) {
  const hasTrend = data.attendanceTrend.length > 0;

  return (
    <section className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Attendance Trend
          </h2>
        </div>
      </div>
      <div className="mt-5 h-[300px] min-w-0">
        {hasTrend ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.attendanceTrend} margin={{ top: 10, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                width={34}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--background))" }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 text-center">
            <p className="text-base font-semibold text-foreground">No attendance data yet</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Attendance trends will appear after real small group meetings are recorded.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function UpcomingMeetingsPanel({
  data,
  onSelectMeeting,
}: {
  data: SmallGroupsWorkspaceData;
  onSelectMeeting: (meetingId: string) => void;
}) {
  const meetings = data.meetings.slice(0, 5);

  return (
    <section className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Upcoming Meetings
      </h2>

      <div className="mt-5 flex flex-col gap-3">
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              onClick={() => onSelectMeeting(meeting.id)}
              className="grid min-h-[70px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg bg-muted/55 px-4 py-3 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold text-foreground">
                  {meeting.groupName}
                </span>
                <span className="mt-1 block truncate text-sm text-primary">{meeting.topic}</span>
              </span>
              <span className="text-right">
                <span className="block whitespace-nowrap text-sm font-medium text-foreground">
                  {formatDate(meeting.startsAt, { year: "numeric", month: "2-digit", day: "2-digit" })}
                </span>
                <span className="mt-1 block truncate text-sm text-muted-foreground">
                  {meeting.conductor?.name ?? "Unassigned"}
                </span>
              </span>
            </button>
          ))
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 text-center">
            <p className="text-base font-semibold text-foreground">No upcoming meetings</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Scheduled small group meetings will appear here once real records exist.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export function OverviewTab({
  data,
  onSelectMeeting,
}: {
  data: SmallGroupsWorkspaceData;
  onSelectMeeting: (meetingId: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Groups"
          value={numberFormat(data.stats.totalGroups)}
          hint="All Groups"
          icon={<UsersRound className="size-5" aria-hidden="true" />}
        />
        <KpiCard
          label="Active Groups"
          value={numberFormat(data.stats.activeGroups)}
          hint="This Month"
          icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
        />
        <KpiCard
          label="Group Members"
          value={numberFormat(data.stats.totalMembers)}
          hint="Total Members"
          icon={<UsersRound className="size-5" aria-hidden="true" />}
          tone="blue"
        />
        <KpiCard
          label="Avg. Attendance"
          value={data.stats.averageAttendanceDisplay}
          hint="Per Meeting"
          icon={<BarChart3 className="size-5" aria-hidden="true" />}
          tone="orange"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AttendanceTrendPanel data={data} />
        <UpcomingMeetingsPanel data={data} onSelectMeeting={onSelectMeeting} />
      </div>
    </div>
  );
}
