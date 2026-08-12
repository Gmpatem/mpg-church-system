"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Filter, Search, ShieldCheck, Users } from "lucide-react";
import { markAttendanceSupportPresentAction } from "../actions";
import type { AttendanceSupportData, MinistryActionState } from "../types";

const initialState: MinistryActionState = { ok: false };

function Message({ state }: { state: MinistryActionState }) {
  if (!state.message && !state.error) return null;
  return <div className={state.ok ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"}>{state.message || state.error}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-amber-100 bg-white p-3 text-center shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-emerald-950">{value}</p></div>;
}

export function AttendanceSupportMobileTool({ data }: { data: AttendanceSupportData }) {
  const [query, setQuery] = useState("");
  const [state, action] = useActionState(markAttendanceSupportPresentAction, initialState);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.notMarkedMembers;
    return data.notMarkedMembers.filter((member) => [member.name, member.memberCode, member.departmentLabel].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle)));
  }, [data.notMarkedMembers, query]);

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-5 bg-[#fffaf0] px-4 pb-28 pt-4 text-slate-900">
      <header className="flex items-center gap-3">
        <Link href={`/my/${data.churchSlug}/duties/${data.assignmentId}`} className="text-2xl text-emerald-950">←</Link>
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-900 text-amber-300"><Users className="size-6" /></div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-emerald-950">Attendance Support</h1>
          <p className="text-sm text-slate-600">{data.occurrence?.title ?? "Today’s attendance"}</p>
        </div>
      </header>

      <section className="rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 size-8 text-emerald-900" />
          <div>
            <h2 className="text-2xl font-semibold text-emerald-950">Mark members present</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Only mark someone present after you have physically confirmed they are in church today.</p>
          </div>
        </div>
      </section>

      {data.occurrence ? (
        <>
          <section className="grid grid-cols-4 gap-2">
            <Stat label="Present" value={data.stats.present} />
            <Stat label="Not marked" value={data.stats.notMarkedYet} />
            <Stat label="Visitors" value={data.stats.visitors} />
            <Stat label="Review" value={data.stats.review} />
          </section>

          <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-amber-100 bg-white px-3 shadow-sm">
            <Search className="size-5 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search member by name or code" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <Filter className="size-5 text-amber-600" />
          </label>

          <Message state={state} />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-emerald-950">Not marked yet ({filtered.length})</h2>
            {filtered.map((member) => (
              <div key={member.id} className="rounded-2xl border border-amber-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-emerald-900 text-sm font-semibold text-white">{member.initials}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-emerald-950">{member.name}</p>
                    <p className="text-sm text-slate-600">{member.departmentLabel ?? member.memberCode ?? "Active member"}</p>
                  </div>
                </div>
                <form action={action} className="mt-3">
                  <input type="hidden" name="churchSlug" value={data.churchSlug} />
                  <input type="hidden" name="assignmentId" value={data.assignmentId} />
                  <input type="hidden" name="occurrenceId" value={data.occurrence?.id ?? ""} />
                  <input type="hidden" name="memberId" value={member.id} />
                  <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 text-sm font-medium text-white"><CheckCircle2 className="size-4" />Mark present</button>
                </form>
              </div>
            ))}
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-amber-100 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
          No attendance occurrence is open for today. Ask a church admin to open Sabbath attendance first.
        </section>
      )}
    </div>
  );
}