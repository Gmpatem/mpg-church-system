import { CalendarCheck, Clock3, UserCheck } from "lucide-react";
import { ChurchEmptyState, ChurchWorkspacePanel } from "@/components/church-workspace";
import { ATTENDANCE_METHOD_LABELS } from "../constants";
import type { AttendanceSummary } from "../types";

function formatDateTime(value: string | null) {
  if (!value) return "No attendance recorded yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

interface AttendanceSummaryCardProps {
  title: string;
  description: string;
  summary: AttendanceSummary;
}

export function AttendanceSummaryCard({ title, description, summary }: AttendanceSummaryCardProps) {
  return (
    <ChurchWorkspacePanel
      title={title}
      description={description}
      action={
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <UserCheck className="size-3.5" aria-hidden="true" />
          {summary.presentCountLast90Days} in 90 days
        </div>
      }
      contentClassName="p-4 sm:p-5"
    >

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Clock3 className="size-3.5" aria-hidden="true" />
            Last seen
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{formatDateTime(summary.lastSeenAt)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <CalendarCheck className="size-3.5" aria-hidden="true" />
            This month
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{summary.currentMonthPresent} attendance records</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Last method</div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {summary.lastMethod ? ATTENDANCE_METHOD_LABELS[summary.lastMethod] : "—"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent attendance</p>
        {summary.recentRecords.length === 0 ? (
          <ChurchEmptyState
            title="No attendance yet"
            message="Attendance history will appear here after the first Sabbath attendance."
          />
        ) : (
          <div className="mt-3 divide-y divide-border rounded-lg border border-border">
            {summary.recentRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{record.title}</p>
                  <p className="text-xs text-muted-foreground">{ATTENDANCE_METHOD_LABELS[record.method]}</p>
                </div>
                <p className="shrink-0 text-sm text-muted-foreground">{formatDate(record.occurrenceDate)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ChurchWorkspacePanel>
  );
}
