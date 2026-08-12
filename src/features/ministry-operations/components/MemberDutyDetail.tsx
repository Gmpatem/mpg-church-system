"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Pencil, RefreshCw } from "lucide-react";
import { addDutyNoteAction, confirmDutyAssignmentAction, requestDutyReplacementAction } from "../actions";
import type { MemberDutyDetailData, MinistryActionState } from "../types";

const initialState: MinistryActionState = { ok: false };

function Message({ state }: { state: MinistryActionState }) {
  if (!state.message && !state.error) return null;
  return <div className={state.ok ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>{state.message || state.error}</div>;
}

export function MemberDutyDetail({ data }: { data: MemberDutyDetailData }) {
  const [confirmState, confirmAction] = useActionState(confirmDutyAssignmentAction, initialState);
  const [replaceState, replaceAction] = useActionState(requestDutyReplacementAction, initialState);
  const [noteState, noteAction] = useActionState(addDutyNoteAction, initialState);

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-5 bg-[#fffaf0] px-4 pb-28 pt-4 text-slate-900">
      <header className="flex items-center gap-3">
        <Link href={`/my/${data.churchSlug}?tab=ministries`} className="text-2xl text-emerald-950">←</Link>
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-900 text-amber-300">GC</div>
        <div>
          <h1 className="text-xl font-semibold text-emerald-950">{data.scope.name}</h1>
          <p className="text-sm text-slate-600">{data.churchName ?? "Church"}</p>
        </div>
      </header>

      <section className="rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-emerald-900">☑</div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-emerald-950">{data.duty.dutyName}</h2>
            <p className="mt-1 text-slate-600">{data.duty.serviceDate}{data.duty.startsAt ? ` • ${new Date(data.duty.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}</p>
            <p className="mt-4 text-lg font-semibold text-emerald-950">{data.duty.memberName}</p>
            <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-800">{data.duty.status}</span>
          </div>
        </div>
      </section>

      <form action={confirmAction}>
        <input type="hidden" name="churchSlug" value={data.churchSlug} />
        <input type="hidden" name="assignmentId" value={data.duty.id} />
        <button className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-emerald-900 px-5 text-lg font-semibold text-white shadow-sm"><span className="flex items-center gap-3"><CheckCircle2 className="size-6" />Confirm I will serve</span><ChevronRight /></button>
        <Message state={confirmState} />
      </form>

      {data.canOpenAttendanceSupport ? (
        <Link href={`/my/${data.churchSlug}/duties/${data.duty.id}/attendance-support`} className="flex min-h-16 w-full items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-5 text-lg font-semibold text-emerald-950 shadow-sm"><span>Open Attendance Support</span><ChevronRight /></Link>
      ) : null}

      <form action={replaceAction} className="space-y-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
        <input type="hidden" name="churchSlug" value={data.churchSlug} />
        <input type="hidden" name="assignmentId" value={data.duty.id} />
        <label className="flex items-center gap-2 font-semibold text-emerald-950"><RefreshCw className="size-5" />Request replacement</label>
        <textarea name="reason" placeholder="Reason or note for your leader" className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <button className="min-h-11 w-full rounded-xl border border-emerald-900 font-medium text-emerald-950">Send request</button>
        <Message state={replaceState} />
      </form>

      <form action={noteAction} className="space-y-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
        <input type="hidden" name="churchSlug" value={data.churchSlug} />
        <input type="hidden" name="assignmentId" value={data.duty.id} />
        <label className="flex items-center gap-2 font-semibold text-emerald-950"><Pencil className="size-5" />Add note</label>
        <textarea name="note" defaultValue={data.duty.memberNote ?? ""} placeholder="Anything your leader should know" className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <button className="min-h-11 w-full rounded-xl bg-emerald-900 font-medium text-white">Save note</button>
        <Message state={noteState} />
      </form>

      {data.duty.leaderNote ? <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><p className="font-semibold text-emerald-950">Leader note:</p><p className="mt-1 text-slate-700">{data.duty.leaderNote}</p></section> : null}
    </div>
  );
}