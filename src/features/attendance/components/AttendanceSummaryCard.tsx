import { CalendarCheck, Clock3, UserCheck } from "lucide-react";
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <UserCheck className="size-3.5" aria-hidden="true" />
          {summary.presentCountLast90Days} in 90 days
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Clock3 className="size-3.5" aria-hidden="true" />
            Last seen
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(summary.lastSeenAt)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <CalendarCheck className="size-3.5" aria-hidden="true" />
            This month
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{summary.currentMonthPresent} attendance records</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last method</div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {summary.lastMethod ? ATTENDANCE_METHOD_LABELS[summary.lastMethod] : "—"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent attendance</p>
        {summary.recentRecords.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-600">
            Attendance history will appear here after the first Sabbath attendance.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {summary.recentRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{record.title}</p>
                  <p className="text-xs text-slate-500">{ATTENDANCE_METHOD_LABELS[record.method]}</p>
                </div>
                <p className="shrink-0 text-sm text-slate-600">{formatDate(record.occurrenceDate)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
