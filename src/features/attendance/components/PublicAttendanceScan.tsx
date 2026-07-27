"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import {
  confirmPublicMemberAttendanceAction,
  recordPublicHouseholdAttendanceAction,
  recordPublicVisitorAttendanceAction,
} from "../actions";
import type { AttendanceActionState, PublicAttendanceInitialData } from "../types";

const initialState: AttendanceActionState = { ok: false };

function PublicSubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-11 w-full gap-2">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
      {children}
    </Button>
  );
}

function PublicNotice({ state }: { state: AttendanceActionState }) {
  if (!state.message && !state.error) return null;

  return (
    <div
      className={cn(
        "animate-in fade-in zoom-in-95 rounded-xl border px-4 py-3 text-sm duration-300",
        state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
      )}
    >
      <div className="flex items-start gap-3">
        {state.ok ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 animate-in zoom-in-50 text-emerald-600 duration-300" aria-hidden="true" />
        ) : (
          <HeartHandshake className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
        )}
        <p>{state.message || state.error}</p>
      </div>
    </div>
  );
}

function Header({ data }: { data: PublicAttendanceInitialData }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {data.church?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.church.logoUrl} alt="" className="size-full object-cover" />
        ) : (
          <Sparkles className="size-7 animate-pulse text-emerald-700" aria-hidden="true" />
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-emerald-800">Happy Sabbath</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
        {data.church?.name ?? "Welcome"}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{data.welcomeMessage}</p>
    </div>
  );
}

function RecognizedMemberCard({ data }: { data: PublicAttendanceInitialData }) {
  if (!data.recognizedMember) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 duration-500">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-white p-2 shadow-sm">
          <CheckCircle2 className="size-6 animate-in zoom-in-50 text-emerald-700 duration-300" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold">Welcome, {data.recognizedMember.displayName}.</h2>
          <p className="mt-1 text-sm leading-6">
            {data.recognizedDuplicate
              ? "You were already checked in for today. Happy Sabbath again."
              : "You are checked in for today. God bless you as we worship together."}
          </p>
        </div>
      </div>
    </div>
  );
}

function MemberCheckInForm({ data }: { data: PublicAttendanceInitialData }) {
  const [state, action] = useActionState(confirmPublicMemberAttendanceAction, initialState);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="publicCode" value={data.publicCode} />
      <div>
        <div className="flex items-center gap-2">
          <UserCheck className="size-5 text-slate-700" aria-hidden="true" />
          <h2 className="font-semibold text-slate-950">I am a member</h2>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Choose your name once. You can remember this device so next Sabbath is even easier.
        </p>
      </div>

      <Select name="memberId" required>
        <SelectTrigger>
          <SelectValue placeholder="Choose your name" />
        </SelectTrigger>
        <SelectContent>
          {data.memberOptions.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.displayName}{member.householdName ? ` • ${member.householdName}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
        <Checkbox name="rememberDevice" value="true" className="mt-0.5" />
        <span>
          Remember this device after I confirm my name.
          <span className="block text-xs text-slate-500">Only a secure token hash is saved.</span>
        </span>
      </label>

      <PublicNotice state={state} />
      <PublicSubmitButton>Check me in</PublicSubmitButton>
    </form>
  );
}

function VisitorCheckInForm({ data }: { data: PublicAttendanceInitialData }) {
  const [state, action] = useActionState(recordPublicVisitorAttendanceAction, initialState);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="publicCode" value={data.publicCode} />
      <div>
        <div className="flex items-center gap-2">
          <UserPlus className="size-5 text-slate-700" aria-hidden="true" />
          <h2 className="font-semibold text-slate-950">I am visiting today</h2>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Welcome. We are glad you are here, and we would love to greet you well.
        </p>
      </div>

      <Input name="fullName" placeholder="Your name" autoComplete="name" required />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input name="phone" placeholder="Mobile number" autoComplete="tel" />
        <Input name="email" type="email" placeholder="Email" autoComplete="email" />
      </div>
      <Input name="householdName" placeholder="Family or household name, optional" />
      <Textarea name="notes" placeholder="Anything you would like the church team to know, optional" />

      <div className="space-y-2">
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
          <Checkbox name="wantsFollowUp" value="true" className="mt-0.5" />
          <span>Please have someone from the church contact me.</span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
          <Checkbox name="interestedInMembership" value="true" className="mt-0.5" />
          <span>I would like to learn more about membership.</span>
        </label>
      </div>

      <PublicNotice state={state} />
      <PublicSubmitButton>Save my visit</PublicSubmitButton>
    </form>
  );
}

function HouseholdCheckIn({ data }: { data: PublicAttendanceInitialData }) {
  const [state, action] = useActionState(recordPublicHouseholdAttendanceAction, initialState);
  const availableMembers = data.householdMembers.filter((member) => !member.presentToday);

  if (!data.recognizedMember || data.householdMembers.length <= 1) return null;

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="publicCode" value={data.publicCode} />
      <div>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-slate-700" aria-hidden="true" />
          <h2 className="font-semibold text-slate-950">Check in your household</h2>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Choose who is here with you today. Already checked-in names are shown quietly.
        </p>
      </div>

      <div className="space-y-2">
        {data.householdMembers.map((member) => (
          <label
            key={member.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border p-3 text-sm",
              member.presentToday ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700"
            )}
          >
            <span>{member.displayName}</span>
            {member.presentToday ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Present
              </span>
            ) : (
              <Checkbox name="memberIds" value={member.id} />
            )}
          </label>
        ))}
      </div>

      <PublicNotice state={state} />
      <PublicSubmitButton>
        Check in {availableMembers.length === 1 ? "1 person" : `${availableMembers.length} people`}
      </PublicSubmitButton>
    </form>
  );
}

function PrivacyNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
      <p>
        We use this only to record today’s attendance and help the church care for members and visitors.
        It does not create a public profile.
      </p>
    </div>
  );
}

export function PublicAttendanceScan({ data }: { data: PublicAttendanceInitialData }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:py-10">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <Header data={data} />

        {!data.isAvailable ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 shadow-sm">
            <h2 className="font-semibold">We could not open this attendance link.</h2>
            <p className="mt-2">{data.unavailableReason}</p>
          </div>
        ) : (
          <>
            <RecognizedMemberCard data={data} />
            <HouseholdCheckIn data={data} />
            {!data.recognizedMember ? <MemberCheckInForm data={data} /> : null}
            <VisitorCheckInForm data={data} />
          </>
        )}

        <PrivacyNote />
      </div>
    </main>
  );
}
