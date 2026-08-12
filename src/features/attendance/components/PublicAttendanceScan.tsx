"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import {
  confirmPublicMemberAttendanceAction,
  forgetPublicAttendanceDeviceAction,
  lookupPublicMemberAction,
  recordPublicHouseholdAttendanceAction,
  recordPublicVisitorAttendanceAction,
  rememberPublicAttendancePhoneAction,
  requestPublicAttendanceReviewAction,
} from "../actions";
import type { AttendanceActionState, PublicAttendanceInitialData, PublicMemberLookupResult } from "../types";

const initialState: AttendanceActionState = { ok: false };
type ViewState = "recognizing" | "recognized" | "choose" | "member" | "visitor";

function formatPublicAttendanceTime(value: string | null | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function PublicSubmitButton({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-12 w-full rounded-2xl bg-emerald-900 text-base font-semibold text-white shadow-sm hover:bg-emerald-800">
      {pending ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : icon ? <span className="mr-2">{icon}</span> : null}
      {children}
    </Button>
  );
}

function PublicNotice({ state }: { state: AttendanceActionState }) {
  if (!state.message && !state.error) return null;
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm leading-6", state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800")}>
      <div className="flex items-start gap-3">
        {state.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" /> : <HeartHandshake className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />}
        <p>{state.message || state.error}</p>
      </div>
    </div>
  );
}

function Header({ data, compact = false }: { data: PublicAttendanceInitialData; compact?: boolean }) {
  return (
    <header className="text-center">
      <div className={cn("mx-auto flex items-center justify-center overflow-hidden rounded-3xl bg-white/80 shadow-sm ring-1 ring-emerald-900/10", compact ? "size-12" : "size-16")}>
        {data.church?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.church.logoUrl} alt="" className="size-full object-contain p-2" />
        ) : (
          <Sparkles className="size-7 text-emerald-800" aria-hidden="true" />
        )}
      </div>
      <p className="mt-3 text-sm font-medium text-amber-700">Happy Sabbath</p>
      <h1 className={cn("mx-auto mt-1 max-w-sm font-semibold tracking-tight text-emerald-950", compact ? "text-2xl" : "text-3xl")}>
        {data.church?.name ?? "Welcome"}
      </h1>
      {!compact ? <p className="mx-auto mt-2 max-w-sm text-base leading-7 text-slate-600">{data.welcomeMessage}</p> : null}
    </header>
  );
}

function RecognizingCard({ data }: { data: PublicAttendanceInitialData }) {
  return (
    <div className="rounded-[2rem] border border-amber-100 bg-white/92 p-7 text-center shadow-xl shadow-amber-900/5">
      <div className="mx-auto flex size-36 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
        <div className="relative flex size-28 items-center justify-center rounded-full bg-white shadow-inner">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
          {data.church?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.church.logoUrl} alt="" className="size-14 object-contain" />
          ) : (
            <Sparkles className="size-12 text-emerald-800" aria-hidden="true" />
          )}
        </div>
      </div>
      <h2 className="mt-8 text-2xl font-semibold text-emerald-950">Recognizing your phone...</h2>
      <p className="mx-auto mt-3 max-w-xs text-base leading-7 text-slate-600">Please wait while we confirm this Sabbath attendance.</p>
    </div>
  );
}

function RememberPhoneForm({ data }: { data: PublicAttendanceInitialData }) {
  const [state, action] = useActionState(rememberPublicAttendancePhoneAction, initialState);

  if (data.recognizedSource !== "session" || !data.recognizedMember) return null;

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="publicCode" value={data.publicCode} />
      <input type="hidden" name="memberId" value={data.recognizedMember.id} />
      <PublicSubmitButton icon={<ShieldCheck className="size-4" aria-hidden="true" />}>Remember this phone</PublicSubmitButton>
      <PublicNotice state={state} />
    </form>
  );
}

function ReviewIdentityForm({ data }: { data: PublicAttendanceInitialData }) {
  const [state, action] = useActionState(requestPublicAttendanceReviewAction, initialState);

  if (!data.recognizedMember || !data.recognizedRecord) return null;

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="publicCode" value={data.publicCode} />
      <input type="hidden" name="memberId" value={data.recognizedMember.id} />
      <input type="hidden" name="attendanceRecordId" value={data.recognizedRecord.id} />
      <Button type="submit" variant="outline" className="h-12 w-full rounded-2xl border-amber-300 bg-white/85 text-emerald-950">
        This is not me
      </Button>
      <PublicNotice state={state} />
    </form>
  );
}

function ForgetPhoneForm({ publicCode, onReset, label = "Forget this phone" }: { publicCode: string; onReset: () => void; label?: string }) {
  const [state, action] = useActionState(forgetPublicAttendanceDeviceAction, initialState);
  useEffect(() => {
    if (!state.ok || !state.resetDevice) return;
    const id = window.setTimeout(onReset, 1200);
    return () => window.clearTimeout(id);
  }, [state, onReset]);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="publicCode" value={publicCode} />
      <Button type="submit" variant="outline" className="h-12 w-full rounded-2xl border-emerald-900/15 bg-white/85 text-emerald-950">
        {label}
      </Button>
      <PublicNotice state={state} />
    </form>
  );
}

function RecognizedFlow({ data, onReset }: { data: PublicAttendanceInitialData; onReset: () => void }) {
  const member = data.recognizedMember;
  if (!member) return null;
  const isTrustedPhone = data.recognizedSource === "trusted_phone";
  const methodLabel = data.recognizedSource === "session" ? "Recognized account" : "Recognized phone";
  const checkedInTime = formatPublicAttendanceTime(data.recognizedRecord?.checkedInAt);

  return (
    <div className="flex flex-col gap-4">
      <div className="animate-in fade-in slide-in-from-bottom-2 rounded-[2rem] border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow-sm duration-500">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-8 ring-emerald-100">
          <CheckCircle2 className="size-11" aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-3xl font-semibold leading-tight text-emerald-950">
          {isTrustedPhone ? "Welcome back," : "Welcome,"}
          <br />
          {member.displayName}
        </h2>
        <div className="mx-auto mt-5 h-px w-44 bg-emerald-200" />
        <p className="mx-auto mt-5 max-w-xs text-base leading-7 text-slate-700">
          {data.recognizedDuplicate ? "You are already marked present today." : "You are marked present for Sabbath Worship."}
        </p>
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4 text-left text-sm text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-500">Method</span>
            <span className="font-semibold text-emerald-950">{methodLabel}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-medium text-slate-500">Time</span>
            <span className="font-semibold text-emerald-950">{checkedInTime}</span>
          </div>
        </div>
      </div>
      <FamilyAttendancePanel data={data} />
      <RememberPhoneForm data={data} />
      <ReviewIdentityForm data={data} />
      {isTrustedPhone ? <ForgetPhoneForm publicCode={data.publicCode} onReset={onReset} /> : null}
    </div>
  );
}

function FamilyAttendancePanel({ data }: { data: PublicAttendanceInitialData }) {
  const [state, action] = useActionState(recordPublicHouseholdAttendanceAction, initialState);
  const availableMembers = data.householdMembers.filter((member) => !member.presentToday);

  if (!data.recognizedMember || data.householdMembers.length <= 1) return null;

  return (
    <form action={action} className="flex flex-col gap-4 rounded-[1.7rem] border border-emerald-900/10 bg-white/90 p-5 shadow-sm">
      <input type="hidden" name="publicCode" value={data.publicCode} />
      <div className="flex items-center gap-3">
        <Users className="size-5 text-emerald-900" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-emerald-950">Family attendance</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {data.householdMembers.map((member) => (
          <label key={member.id} className="flex items-center justify-between gap-3 py-3 text-base text-slate-700">
            <span>{member.displayName}{member.id === data.recognizedMember?.id ? " (You)" : ""}</span>
            {member.presentToday ? (
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-900 text-white"><CheckCircle2 className="size-4" /></span>
            ) : (
              <Checkbox name="memberIds" value={member.id} />
            )}
          </label>
        ))}
      </div>
      <PublicNotice state={state} />
      <PublicSubmitButton icon={<Users className="size-4" aria-hidden="true" />}>
        {availableMembers.length > 0 ? "Mark my family present" : "Family already marked present"}
      </PublicSubmitButton>
    </form>
  );
}

function IdentityChoice({ onChoose }: { onChoose: (view: ViewState) => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-emerald-900/10 bg-white/90 p-5 shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-emerald-950">Welcome</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">How would you like to record attendance?</p>
      </div>
      <button type="button" onClick={() => onChoose("member")} className="flex w-full items-center justify-between rounded-2xl border border-emerald-900/10 bg-white p-4 text-left shadow-sm">
        <span className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-full bg-emerald-900 text-white"><UserCheck className="size-6" /></span><span><span className="block text-lg font-semibold text-emerald-950">I am a church member</span><span className="mt-1 block text-sm text-slate-600">Find your profile and record attendance.</span></span></span>
        <span className="text-2xl text-amber-600">›</span>
      </button>
      <button type="button" onClick={() => onChoose("visitor")} className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left shadow-sm">
        <span className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-full bg-amber-600 text-white"><UserPlus className="size-6" /></span><span><span className="block text-lg font-semibold text-emerald-950">I am visiting today</span><span className="mt-1 block text-sm text-slate-600">Let us welcome you well.</span></span></span>
        <span className="text-2xl text-amber-600">›</span>
      </button>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return <button type="button" onClick={onBack} className="inline-flex size-10 items-center justify-center rounded-full text-emerald-950"><ArrowLeft className="size-6" /></button>;
}

function MemberConfirmCard({ match, publicCode, lookupValue }: { match: PublicMemberLookupResult; publicCode: string; lookupValue: string }) {
  const [state, action] = useActionState(confirmPublicMemberAttendanceAction, initialState);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="publicCode" value={publicCode} />
      <input type="hidden" name="memberId" value={match.id} />
      <input type="hidden" name="lookupValue" value={lookupValue} />
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-900 text-base font-semibold text-white">{match.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-emerald-950">{match.displayName}</p>
          <p className="text-sm text-slate-500">{match.householdName ?? match.maskedPhone ?? match.maskedEmail ?? match.memberCode ?? "Member record"}</p>
        </div>
        <CheckCircle2 className="size-5 text-emerald-700" />
      </div>
      <label className="flex items-start gap-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/50 p-3 text-sm text-slate-700">
        <Checkbox name="rememberDevice" value="true" defaultChecked className="mt-0.5" />
        <span><span className="font-medium text-emerald-950">Remember this phone</span><span className="block text-xs text-slate-500">Quickly mark me present on this phone next time.</span></span>
      </label>
      <PublicNotice state={state} />
      <PublicSubmitButton icon={<ShieldCheck className="size-4" aria-hidden="true" />}>Mark present</PublicSubmitButton>
    </form>
  );
}

function MemberLookup({ data, onBack }: { data: PublicAttendanceInitialData; onBack: () => void }) {
  const [state, action] = useActionState(lookupPublicMemberAction, initialState);
  return (
    <div className="flex flex-col gap-4">
      <BackButton onBack={onBack} />
      <Header data={data} compact />
      <div className="text-center"><h2 className="text-3xl font-semibold text-emerald-950">I am a church member</h2><p className="mt-2 text-slate-600">Enter your phone, email, or member code.</p></div>
      <form action={action} className="flex flex-col gap-3 rounded-[1.7rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
        <input type="hidden" name="publicCode" value={data.publicCode} />
        <div className="relative"><Input name="lookupValue" placeholder="Phone, email, or member code" className="h-14 rounded-2xl pl-4 pr-12 text-base" required /><Search className="absolute right-4 top-4 size-5 text-emerald-800" /></div>
        <PublicSubmitButton icon={<Search className="size-4" />}>Find my profile</PublicSubmitButton>
      </form>
      <PublicNotice state={state} />
      {state.matches?.map((match) => <MemberConfirmCard key={match.id} match={match} publicCode={data.publicCode} lookupValue={state.lookupValue ?? ""} />)}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-slate-700"><ShieldCheck className="mb-2 size-5 text-emerald-800" />Your information is used only to confirm your record and mark attendance.</div>
    </div>
  );
}

function VisitorForm({ data, onBack }: { data: PublicAttendanceInitialData; onBack: () => void }) {
  const [state, action] = useActionState(recordPublicVisitorAttendanceAction, initialState);
  return (
    <div className="flex flex-col gap-4">
      <BackButton onBack={onBack} />
      <Header data={data} compact />
      <div className="text-center"><h2 className="text-3xl font-semibold text-emerald-950">I am visiting today</h2><p className="mt-2 text-slate-600">We’d love to welcome you well.</p></div>
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="publicCode" value={data.publicCode} />
        <IconInput icon={<User className="size-5" />} name="fullName" placeholder="Your full name" autoComplete="name" required />
        <IconInput icon={<Phone className="size-5" />} name="phone" placeholder="Mobile number" autoComplete="tel" />
        <IconInput icon={<Mail className="size-5" />} name="email" type="email" placeholder="Email address" autoComplete="email" />
        <IconInput icon={<Users className="size-5" />} name="householdName" placeholder="Family or household (optional)" />
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><Textarea name="notes" placeholder="Anything you’d like to share with us? Prayer requests, how you heard about us, etc." className="min-h-20 border-0 p-0 shadow-none focus-visible:ring-0" /></div>
        <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-slate-700"><Checkbox name="wantsFollowUp" value="true" className="mt-1" /><span><span className="block font-semibold text-emerald-950">Please have someone from the church contact me</span><span>We’d love to follow up with you.</span></span></label>
        <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-slate-700"><Checkbox name="interestedInMembership" value="true" className="mt-1" /><span><span className="block font-semibold text-emerald-950">I’m interested in learning more about membership</span><span>Tell me more about how to get connected.</span></span></label>
        <PublicNotice state={state} />
        <PublicSubmitButton icon={<ShieldCheck className="size-4" />}>Record my visit</PublicSubmitButton>
      </form>
    </div>
  );
}

function IconInput({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode }) {
  return <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm text-slate-500"><span>{icon}</span><input {...props} className="min-w-0 flex-1 border-0 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400" /></div>;
}

function Footer() {
  return <footer className="mt-auto rounded-t-[2rem] bg-emerald-950 px-4 py-4 text-center text-sm font-medium text-white"><ShieldCheck className="mr-2 inline size-4 text-amber-400" /> Secure • Private • Faithful</footer>;
}

function RecognitionIssueNotice({ data }: { data: PublicAttendanceInitialData }) {
  if (!data.recognitionIssue) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-800" aria-hidden="true" />
        <p>{data.recognitionIssue}</p>
      </div>
    </div>
  );
}

export function PublicAttendanceScan({ data }: { data: PublicAttendanceInitialData }) {
  const [view, setView] = useState<ViewState>("recognizing");
  const readyView = useMemo<ViewState>(() => (data.recognizedMember ? "recognized" : "choose"), [data.recognizedMember]);

  useEffect(() => {
    const id = window.setTimeout(() => setView(data.isAvailable ? readyView : "choose"), 750);
    return () => window.clearTimeout(id);
  }, [data.isAvailable, readyView]);

  const resetToChoice = () => setView("choose");

  return (
    <main className="min-h-screen bg-[#fff9ef] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[radial-gradient(circle_at_top,#fffef8,#fff7e8_55%,#f4ead6)] px-5 pb-0 pt-6 shadow-2xl shadow-emerald-950/10">
        {!data.isAvailable ? (
          <div className="flex flex-1 flex-col justify-center gap-5"><Header data={data} /><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><h2 className="font-semibold">We could not open this attendance link.</h2><p className="mt-2">{data.unavailableReason}</p></div></div>
        ) : view === "recognizing" ? (
          <div className="flex flex-1 flex-col justify-center gap-7"><Header data={data} /><RecognizingCard data={data} /></div>
        ) : view === "recognized" ? (
          <div className="flex flex-1 flex-col gap-5"><Header data={data} compact /><RecognizedFlow data={data} onReset={resetToChoice} /></div>
        ) : view === "member" ? (
          <MemberLookup data={data} onBack={resetToChoice} />
        ) : view === "visitor" ? (
          <VisitorForm data={data} onBack={resetToChoice} />
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-7"><Header data={data} /><RecognitionIssueNotice data={data} /><IdentityChoice onChoose={setView} /></div>
        )}
        <div className="mt-6 -mx-5"><Footer /></div>
      </div>
    </main>
  );
}
