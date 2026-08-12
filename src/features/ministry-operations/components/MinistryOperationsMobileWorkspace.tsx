"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, CheckCircle2, ClipboardCheck, FileText, Home, ListChecks, Plus, UserPlus, Users } from "lucide-react";
import {
  createDutyAssignmentAction,
  createDutyTypeAction,
  createMinistryTaskAction,
  submitMinistryReportAction,
  updateDutyStatusAction,
} from "../actions";
import { MINISTRY_DUTY_STATUS_LABELS } from "../constants";
import type { MinistryActionState, MinistryOperationsData } from "../types";

const initialState: MinistryActionState = { ok: false };

function StatusMessage({ state }: { state: MinistryActionState }) {
  if (!state.message && !state.error) return null;
  return (
    <div className={state.ok ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>
      {state.message || state.error}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white/90 p-3 text-center shadow-sm">
      <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-50 text-emerald-900">{icon}</div>
      <p className="mt-2 text-xs text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-emerald-950">{value}</p>
      <div className="mx-auto mt-1 h-0.5 w-8 rounded-full bg-amber-500" />
    </div>
  );
}

function DutyStatusPill({ status }: { status: string }) {
  const styles = status === "confirmed" || status === "served" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status === "replacement_requested" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}>{MINISTRY_DUTY_STATUS_LABELS[status as keyof typeof MINISTRY_DUTY_STATUS_LABELS] ?? status}</span>;
}

function dateValue() {
  return new Date().toISOString().slice(0, 10);
}

export function MinistryOperationsMobileWorkspace({ data }: { data: MinistryOperationsData }) {
  const [activeTab, setActiveTab] = useState<"overview" | "duties" | "tasks" | "reports">("overview");
  const [dutyTypeState, createDutyType] = useActionState(createDutyTypeAction, initialState);
  const [assignmentState, createAssignment] = useActionState(createDutyAssignmentAction, initialState);
  const [taskState, createTask] = useActionState(createMinistryTaskAction, initialState);
  const [reportState, submitReport] = useActionState(submitMinistryReportAction, initialState);
  const [statusState, updateStatus] = useActionState(updateDutyStatusAction, initialState);
  const canManage = data.access.canManage;

  const nextDuties = useMemo(() => data.duties.slice(0, 8), [data.duties]);

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-[#fffaf0] px-4 pb-28 pt-4 text-slate-900 sm:px-6 lg:max-w-6xl lg:pb-10">
      <header className="flex items-center gap-3">
        <Link href={`/c/${data.church.slug}/departments`} className="flex size-10 items-center justify-center rounded-full text-emerald-950 hover:bg-emerald-50" aria-label="Back">
          <span className="text-2xl">←</span>
        </Link>
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-900 text-sm font-semibold text-amber-300">GC</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-semibold text-emerald-950">{data.scope.name} Operations</p>
          <p className="text-sm text-slate-600">{data.church.name ?? "Church"}</p>
        </div>
      </header>

      <section className="mt-5 rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-full border border-amber-300 text-amber-700">♕</div>
          <div>
            <h1 className="text-2xl font-semibold text-emerald-950">Happy Sabbath, Leader</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Manage this week’s ministry operations with clarity and care.</p>
            <div className="mt-4 h-0.5 w-12 rounded-full bg-amber-500" />
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-4 gap-3">
        <StatCard label="Members" value={data.stats.members} icon={<Users className="size-5" />} />
        <StatCard label="Duties" value={data.stats.upcomingDuties} icon={<ClipboardCheck className="size-5" />} />
        <StatCard label="Tasks" value={data.stats.openTasks} icon={<ListChecks className="size-5" />} />
        <StatCard label="Reports" value={data.stats.reportsDue} icon={<FileText className="size-5" />} />
      </section>

      <nav className="sticky top-0 z-10 mt-5 rounded-2xl border border-amber-100 bg-white/95 p-1 shadow-sm backdrop-blur">
        <div className="grid grid-cols-4 gap-1 text-sm font-medium">
          {[
            ["overview", "Overview", Home],
            ["duties", "Duties", ClipboardCheck],
            ["tasks", "Tasks", ListChecks],
            ["reports", "Reports", FileText],
          ].map(([key, label, Icon]: any) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)} className={activeTab === key ? "rounded-xl bg-emerald-900 px-2 py-2 text-white" : "rounded-xl px-2 py-2 text-slate-600"}>
              <Icon className="mx-auto mb-1 size-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "overview" ? (
        <div className="mt-5 space-y-5">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-emerald-950"><span className="text-amber-600">☘</span>This Sabbath</h2>
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
              {nextDuties.length === 0 ? <p className="p-4 text-sm text-slate-500">No upcoming duties yet.</p> : nextDuties.map((duty: any) => (
                <div key={duty.id} className="flex items-center gap-3 border-b border-amber-50 p-4 last:border-b-0">
                  <div className="flex size-11 items-center justify-center rounded-full bg-amber-50 text-emerald-900"><ClipboardCheck className="size-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-emerald-950">{duty.dutyName}</p>
                    <p className="text-sm text-slate-600">{duty.memberName} • {duty.serviceDate}</p>
                  </div>
                  <DutyStatusPill status={duty.status} />
                </div>
              ))}
            </div>
          </section>

          {canManage ? (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-emerald-950"><span className="text-amber-600">⚡</span>Quick Actions</h2>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setActiveTab("duties")} className="rounded-2xl border border-amber-100 bg-white p-4 text-sm font-medium shadow-sm"><CalendarPlus className="mx-auto mb-2 size-6 text-emerald-900" />Add Duty</button>
                <button onClick={() => setActiveTab("tasks")} className="rounded-2xl border border-amber-100 bg-white p-4 text-sm font-medium shadow-sm"><Plus className="mx-auto mb-2 size-6 text-emerald-900" />Create Task</button>
                <button onClick={() => setActiveTab("reports")} className="rounded-2xl border border-amber-100 bg-white p-4 text-sm font-medium shadow-sm"><FileText className="mx-auto mb-2 size-6 text-emerald-900" />Submit Report</button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {activeTab === "duties" ? (
        <div className="mt-5 space-y-5">
          <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-950">Duties & Schedule</h2>
            <div className="mt-4 space-y-3">
              {data.duties.map((duty: any) => (
                <div key={duty.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-emerald-950">{duty.dutyName}</p>
                      <p className="text-sm text-slate-600">{duty.memberName} • {duty.serviceDate}</p>
                    </div>
                    <DutyStatusPill status={duty.status} />
                  </div>
                  {canManage ? (
                    <form action={updateStatus} className="mt-3 flex gap-2">
                      <input type="hidden" name="churchSlug" value={data.church.slug} />
                      <input type="hidden" name="scopeType" value={data.scope.type} />
                      <input type="hidden" name="scopeId" value={data.scope.id} />
                      <input type="hidden" name="assignmentId" value={duty.id} />
                      <button name="status" value="confirmed" className="min-h-10 flex-1 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-800">Confirm</button>
                      <button name="status" value="served" className="min-h-10 flex-1 rounded-xl bg-emerald-900 text-sm font-medium text-white">Mark served</button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
            <StatusMessage state={statusState} />
          </section>

          {canManage ? (
            <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-emerald-950">Assign duty</h3>
              <form action={createAssignment} className="mt-3 space-y-3">
                <input type="hidden" name="churchSlug" value={data.church.slug} />
                <input type="hidden" name="scopeType" value={data.scope.type} />
                <input type="hidden" name="scopeId" value={data.scope.id} />
                <select name="dutyTypeId" required className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  <option value="">Choose duty</option>
                  {data.dutyTypes.map((type: any) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
                <select name="memberId" required className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  <option value="">Choose member</option>
                  {data.members.map((member: any) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
                <input name="serviceDate" type="date" defaultValue={dateValue()} required className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                <input name="startsAt" type="time" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                <textarea name="leaderNote" placeholder="Leader note, optional" className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                <button className="min-h-11 w-full rounded-xl bg-emerald-900 font-medium text-white">Assign member</button>
                <StatusMessage state={assignmentState} />
              </form>
            </section>
          ) : null}

          {canManage ? (
            <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-emerald-950">Add duty type</h3>
              <form action={createDutyType} className="mt-3 space-y-3">
                <input type="hidden" name="churchSlug" value={data.church.slug} />
                <input type="hidden" name="scopeType" value={data.scope.type} />
                <input type="hidden" name="scopeId" value={data.scope.id} />
                <input name="name" placeholder="Duty name" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
                <textarea name="description" placeholder="Description" className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="requiresAttendanceSupport" value="true" /> This is an Attendance Support duty</label>
                <button className="min-h-11 w-full rounded-xl border border-emerald-200 bg-emerald-50 font-medium text-emerald-900">Create duty type</button>
                <StatusMessage state={dutyTypeState} />
              </form>
            </section>
          ) : null}
        </div>
      ) : null}

      {activeTab === "tasks" ? (
        <div className="mt-5 space-y-4">
          {data.tasks.map((task: any) => <div key={task.id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"><p className="font-semibold text-emerald-950">{task.title}</p><p className="text-sm text-slate-600">{task.assignedToName ?? "Unassigned"} • {task.dueDate ?? "No due date"}</p></div>)}
          {canManage ? <form action={createTask} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm space-y-3"><input type="hidden" name="churchSlug" value={data.church.slug} /><input type="hidden" name="scopeType" value={data.scope.type} /><input type="hidden" name="scopeId" value={data.scope.id} /><input name="title" placeholder="Task title" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /><select name="assignedToMemberId" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">Assign to member</option>{data.members.map((member: any) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><input name="dueDate" type="date" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /><textarea name="description" placeholder="Task details" className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button className="min-h-11 w-full rounded-xl bg-emerald-900 font-medium text-white">Create task</button><StatusMessage state={taskState} /></form> : null}
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <div className="mt-5 space-y-4">
          {data.reports.map((report: any) => <div key={report.id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"><p className="font-semibold text-emerald-950">{report.title}</p><p className="text-sm text-slate-600">{report.status} • {report.periodEnd ?? "No period"}</p></div>)}
          {canManage ? <form action={submitReport} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm space-y-3"><input type="hidden" name="churchSlug" value={data.church.slug} /><input type="hidden" name="scopeType" value={data.scope.type} /><input type="hidden" name="scopeId" value={data.scope.id} /><input name="title" placeholder="Report title" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /><textarea name="summary" placeholder="Summary, needs, wins, challenges" className="min-h-32 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button className="min-h-11 w-full rounded-xl bg-emerald-900 font-medium text-white">Submit report</button><StatusMessage state={reportState} /></form> : null}
        </div>
      ) : null}
    </div>
  );
}