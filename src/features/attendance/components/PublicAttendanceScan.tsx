"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  Home,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
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
  recordPublicHouseholdAttendanceAction,
  recordPublicVisitorAttendanceAction,
} from "../actions";
import type { AttendanceActionState, PublicAttendanceInitialData, PublicAttendanceMember } from "../types";

const initialState: AttendanceActionState = { ok: false };

type PublicAttendanceStep =
  | "recognizing"
  | "recognized"
  | "choose"
  | "member"
  | "visitor";

function PublicSubmitButton({
  children,
  disabled = false,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="attendance-primary-button h-12 w-full gap-2 rounded-2xl text-base font-semibold shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-5" aria-hidden="true" />}
      {children}
    </Button>
  );
}

function PublicNotice({ state }: { state: AttendanceActionState }) {
  if (!state.message && !state.error) return null;

  return (
    <div
      className={cn(
        "attendance-pop rounded-2xl border px-4 py-3 text-sm leading-6",
        state.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-800"
      )}
    >
      <div className="flex items-start gap-3">
        {state.ok ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
        ) : (
          <HeartHandshake className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
        )}
        <p>{state.message || state.error}</p>
      </div>
    </div>
  );
}

function ChurchLogo({ data, size = "lg" }: { data: PublicAttendanceInitialData; size?: "sm" | "lg" }) {
  return (
    <div
      className={cn(
        "mx-auto flex items-center justify-center overflow-hidden rounded-3xl bg-white/70 text-emerald-800",
        size === "lg" ? "size-16" : "size-12"
      )}
    >
      {data.church?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.church.logoUrl} alt="" className="size-full object-contain p-1.5" />
      ) : (
        <Sparkles className={cn("text-emerald-700", size === "lg" ? "size-8" : "size-6")} aria-hidden="true" />
      )}
    </div>
  );
}

function FlowHeader({
  data,
  title,
  eyebrow = "Happy Sabbath",
  subtitle,
  showChurchName = false,
}: {
  data: PublicAttendanceInitialData;
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  showChurchName?: boolean;
}) {
  return (
    <header className="text-center">
      <ChurchLogo data={data} />
      <p className="mt-2 text-sm font-medium text-[#b8861f]">{eyebrow}</p>
      {showChurchName ? (
        <h1 className="mt-1 text-balance font-serif text-[clamp(1.75rem,7vw,2.75rem)] font-semibold leading-tight text-[#064529]">
          {data.church?.name ?? "Welcome"}
        </h1>
      ) : null}
      {title ? (
        <h1 className="mt-1 text-balance font-serif text-[clamp(2rem,8vw,3rem)] font-semibold leading-tight text-[#064529]">
          {title}
        </h1>
      ) : null}
      {subtitle ? <p className="mx-auto mt-2 max-w-sm text-base leading-7 text-slate-600">{subtitle}</p> : null}
    </header>
  );
}

function RecognitionScreen({ data }: { data: PublicAttendanceInitialData }) {
  return (
    <div className="space-y-5">
      <FlowHeader
        data={data}
        showChurchName
        subtitle="We’re glad you’re here!"
      />

      <section className="attendance-glass-card attendance-pop rounded-[2rem] px-6 py-8 text-center">
        <div className="attendance-recognition-ring mx-auto flex size-40 items-center justify-center rounded-full">
          <div className="flex size-24 items-center justify-center rounded-full bg-white shadow-inner">
            {data.church?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.church.logoUrl} alt="" className="size-16 object-contain" />
            ) : (
              <Sparkles className="size-10 text-[#b8861f]" aria-hidden="true" />
            )}
          </div>
        </div>
        <h2 className="mt-8 font-serif text-3xl font-semibold text-[#064529]">Recognizing your device...</h2>
        <p className="mx-auto mt-3 max-w-xs text-base leading-7 text-slate-600">
          Please wait while we prepare your attendance.
        </p>
        <Loader2 className="mx-auto mt-8 size-7 animate-spin text-[#c99628]" aria-hidden="true" />
      </section>
    </div>
  );
}

function RecognizedMemberScreen({
  data,
  onUseAnotherOption,
}: {
  data: PublicAttendanceInitialData;
  onUseAnotherOption: () => void;
}) {
  const member = data.recognizedMember;
  if (!member) return null;

  return (
    <div className="space-y-4">
      <FlowHeader
        data={data}
        showChurchName
        subtitle="We’re glad you’re here!"
      />

      <section className="attendance-success-card attendance-pop rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 px-5 py-6 text-center shadow-sm">
        <div className="attendance-success-icon mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
          <Check className="size-11" aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight text-[#064529]">
          Welcome,<br />{member.displayName}.
        </h2>
        <div className="mx-auto mt-4 h-px max-w-48 bg-emerald-200" />
        <p className="mx-auto mt-4 max-w-xs text-base leading-7 text-slate-700">
          {data.recognizedDuplicate
            ? "You are already marked present for today. Happy Sabbath again."
            : "You are marked present for today. God bless your worship."}
        </p>
      </section>

      <FamilyAttendanceCard data={data} />

      <button
        type="button"
        onClick={onUseAnotherOption}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e4d8bf] bg-white/90 px-4 py-3.5 text-sm font-medium text-[#064529] shadow-sm transition hover:bg-white"
      >
        Not you? Use another option
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function ChoiceScreen({
  data,
  onChooseMember,
  onChooseVisitor,
}: {
  data: PublicAttendanceInitialData;
  onChooseMember: () => void;
  onChooseVisitor: () => void;
}) {
  return (
    <div className="space-y-5">
      <FlowHeader
        data={data}
        showChurchName
        subtitle="How would you like to continue?"
      />

      <section className="space-y-3">
        <button type="button" onClick={onChooseMember} className="attendance-choice-card group w-full rounded-3xl p-5 text-left">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
              <UserCheck className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-2xl font-semibold text-[#064529]">I am a church member</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Find your profile and record attendance.</p>
            </div>
            <ChevronRight className="size-5 text-[#b8861f] transition group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
        </button>

        <button type="button" onClick={onChooseVisitor} className="attendance-choice-card group w-full rounded-3xl p-5 text-left">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#b8861f] text-white shadow-sm">
              <UserPlus className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-2xl font-semibold text-[#064529]">I am visiting today</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Let us know you are here. We’d love to connect.</p>
            </div>
            <ChevronRight className="size-5 text-[#b8861f] transition group-hover:translate-x-0.5" aria-hidden="true" />
          </div>
        </button>
      </section>
    </div>
  );
}

function MemberLookupForm({ data }: { data: PublicAttendanceInitialData }) {
  const [state, action] = useActionState(confirmPublicMemberAttendanceAction, initialState);
  const [query, setQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(data.memberOptions[0]?.id ?? "");

  const filteredMembers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return data.memberOptions.slice(0, 8);

    return data.memberOptions
      .filter((member) => {
        const haystack = [member.displayName, member.memberCode, member.householdName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      })
      .slice(0, 8);
  }, [data.memberOptions, query]);

  useEffect(() => {
    if (!selectedMemberId && filteredMembers[0]?.id) setSelectedMemberId(filteredMembers[0].id);
  }, [filteredMembers, selectedMemberId]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="publicCode" value={data.publicCode} />
      <input type="hidden" name="memberId" value={selectedMemberId} />

      <label className="attendance-input-card flex items-center gap-3 rounded-2xl px-4 py-3">
        <span className="sr-only">Search by name or mobile</span>
        <Search className="size-5 shrink-0 text-[#064529]" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or mobile"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
        />
      </label>

      <div className="space-y-2">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <MemberOptionCard
              key={member.id}
              member={member}
              selected={member.id === selectedMemberId}
              onSelect={() => setSelectedMemberId(member.id)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            No member matched that search. Try another name, phone, or member code.
          </div>
        )}
      </div>

      <label className="attendance-option-card flex items-center justify-between gap-4 rounded-2xl p-4">
        <span>
          <span className="block font-serif text-xl font-semibold text-[#064529]">Remember this device</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">Quickly mark me present on this device next time.</span>
        </span>
        <Checkbox name="rememberDevice" value="true" className="size-6 rounded-md border-emerald-700 data-[state=checked]:bg-emerald-700" />
      </label>

      <div className="attendance-option-card flex items-start gap-4 rounded-2xl p-4">
        <ShieldCheck className="mt-1 size-7 shrink-0 text-[#064529]" aria-hidden="true" />
        <div>
          <h3 className="font-serif text-xl font-semibold text-[#064529]">Your privacy matters</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">Your information is used only for attendance and church follow-up.</p>
        </div>
      </div>

      <PublicNotice state={state} />
      <PublicSubmitButton disabled={!selectedMemberId}>Record my attendance</PublicSubmitButton>
    </form>
  );
}

function MemberOptionCard({
  member,
  selected,
  onSelect,
}: {
  member: PublicAttendanceMember;
  selected: boolean;
  onSelect: () => void;
}) {
  const initials = member.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "M";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition",
        selected ? "border-emerald-300 ring-2 ring-emerald-100" : "border-[#e4d8bf] hover:border-emerald-200"
      )}
    >
      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-800 font-serif text-xl font-semibold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-xl font-semibold text-[#064529]">{member.displayName}</p>
        <p className="mt-1 truncate text-sm text-slate-500">
          {member.memberCode ?? member.householdName ?? "Church member"}
        </p>
      </div>
      <div className={cn("flex size-9 items-center justify-center rounded-full border", selected ? "border-emerald-700 text-emerald-700" : "border-slate-200 text-transparent")}>
        <Check className="size-5" aria-hidden="true" />
      </div>
    </button>
  );
}

function VisitorAttendanceForm({ data }: { data: PublicAttendanceInitialData }) {
  const [state, action] = useActionState(recordPublicVisitorAttendanceAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="publicCode" value={data.publicCode} />

      <IconInput icon={<User className="size-5" aria-hidden="true" />} name="fullName" placeholder="Your full name" autoComplete="name" required />
      <IconInput icon={<Phone className="size-5" aria-hidden="true" />} name="phone" placeholder="Mobile number" autoComplete="tel" />
      <IconInput icon={<Mail className="size-5" aria-hidden="true" />} name="email" type="email" placeholder="Email address" autoComplete="email" />
      <IconInput icon={<Home className="size-5" aria-hidden="true" />} name="householdName" placeholder="Family or household (optional)" />

      <label className="attendance-input-card flex items-start gap-3 rounded-2xl px-4 py-3">
        <MessageSquare className="mt-1 size-5 shrink-0 text-[#064529]" aria-hidden="true" />
        <span className="sr-only">Anything you would like to share with us?</span>
        <Textarea
          name="notes"
          placeholder="Anything you’d like to share with us? Prayer requests, how you heard about us, etc."
          className="min-h-20 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      </label>

      <label className="attendance-option-card flex items-start gap-4 rounded-2xl p-4">
        <Checkbox name="wantsFollowUp" value="true" className="mt-1 size-6 rounded-md border-[#b8861f] data-[state=checked]:bg-[#b8861f]" />
        <span>
          <span className="block font-serif text-lg font-semibold leading-snug text-[#064529]">Please have someone from the church contact me</span>
          <span className="mt-1 block text-sm text-slate-600">We’d love to follow up with you.</span>
        </span>
      </label>

      <label className="attendance-option-card flex items-start gap-4 rounded-2xl p-4">
        <Checkbox name="interestedInMembership" value="true" className="mt-1 size-6 rounded-md border-[#b8861f] data-[state=checked]:bg-[#b8861f]" />
        <span>
          <span className="block font-serif text-lg font-semibold leading-snug text-[#064529]">I’m interested in learning more about membership</span>
          <span className="mt-1 block text-sm text-slate-600">Tell me more about how to get connected.</span>
        </span>
      </label>

      <PublicNotice state={state} />
      <PublicSubmitButton>Record my visit</PublicSubmitButton>
    </form>
  );
}

function IconInput({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode }) {
  return (
    <label className={cn("attendance-input-card flex items-center gap-3 rounded-2xl px-4 py-3", className)}>
      <span className="shrink-0 text-[#064529]">{icon}</span>
      <span className="sr-only">{String(props.placeholder ?? props.name ?? "Input")}</span>
      <Input {...props} className="h-auto border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0" />
    </label>
  );
}

function FamilyAttendanceCard({ data }: { data: PublicAttendanceInitialData }) {
  const [state, action] = useActionState(recordPublicHouseholdAttendanceAction, initialState);
  const availableMembers = data.householdMembers.filter((member) => !member.presentToday);

  if (!data.recognizedMember || data.householdMembers.length <= 1) return null;

  return (
    <form action={action} className="attendance-option-card attendance-pop space-y-4 rounded-[1.75rem] p-5">
      <input type="hidden" name="publicCode" value={data.publicCode} />
      <div className="flex items-center gap-3">
        <Users className="size-6 text-[#064529]" aria-hidden="true" />
        <h2 className="font-serif text-2xl font-semibold text-[#064529]">Family attendance</h2>
      </div>

      <div className="divide-y divide-[#e8dec8]">
        {data.householdMembers.map((member) => (
          <label key={member.id} className="flex items-center gap-3 py-3 text-base text-slate-700">
            {member.presentToday ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-800 text-white">
                <Check className="size-4" aria-hidden="true" />
              </span>
            ) : (
              <Checkbox name="memberIds" value={member.id} className="size-7 rounded-md border-emerald-900 data-[state=checked]:bg-emerald-800" />
            )}
            <span>{member.displayName}{member.id === data.recognizedMember?.id ? " (You)" : ""}</span>
          </label>
        ))}
      </div>

      <PublicNotice state={state} />
      <PublicSubmitButton disabled={availableMembers.length === 0}>Mark my family present</PublicSubmitButton>
    </form>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full text-[#064529] transition hover:bg-emerald-50"
      aria-label="Go back"
    >
      <ArrowLeft className="size-6" aria-hidden="true" />
    </button>
  );
}

function SecurityFooter() {
  return (
    <footer className="attendance-wave-footer mt-auto rounded-t-[2rem] px-4 pb-5 pt-8 text-center text-sm font-medium text-white shadow-[0_-10px_30px_rgba(6,69,41,0.12)]">
      <div className="flex items-center justify-center gap-2">
        <Lock className="size-4 text-[#d7a83f]" aria-hidden="true" />
        <span>Secure</span>
        <span className="text-[#d7a83f]">•</span>
        <span>Private</span>
        <span className="text-[#d7a83f]">•</span>
        <span>Faithful</span>
      </div>
    </footer>
  );
}

function PrivacyNote() {
  return (
    <div className="flex items-start gap-3 px-2 pb-3 pt-1 text-sm leading-6 text-slate-600">
      <ShieldCheck className="mt-0.5 size-6 shrink-0 text-[#064529]" aria-hidden="true" />
      <p>
        Your information is used only for attendance and follow-up. We respect your privacy. <span className="font-semibold text-[#064529]">Need help?</span> Ask a greeter.
      </p>
    </div>
  );
}

function UnavailableLink({ data }: { data: PublicAttendanceInitialData }) {
  return (
    <section className="attendance-option-card rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
      <h2 className="font-serif text-2xl font-semibold">Attendance link unavailable</h2>
      <p className="mt-2">{data.unavailableReason ?? "Please ask an usher or church leader for today’s attendance link."}</p>
    </section>
  );
}

export function PublicAttendanceScan({ data }: { data: PublicAttendanceInitialData }) {
  const [step, setStep] = useState<PublicAttendanceStep>("recognizing");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStep(data.recognizedMember ? "recognized" : "choose");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [data.recognizedMember]);

  return (
    <main className="attendance-mobile-page min-h-screen px-3 py-4 text-slate-950 sm:px-4 sm:py-6">
      <style>{attendanceMobileStyles}</style>
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[430px] flex-col overflow-hidden rounded-[2.5rem] border border-[#d9c9a6] bg-[#fffaf0] shadow-2xl shadow-emerald-950/15 sm:min-h-[860px]">
        <div className="relative flex flex-1 flex-col px-5 pb-0 pt-8 sm:px-7 sm:pt-10">
          {(step === "member" || step === "visitor") && <BackButton onClick={() => setStep("choose")} />}

          {!data.isAvailable ? (
            <div className="flex flex-1 flex-col justify-center gap-6">
              <FlowHeader data={data} showChurchName subtitle="We’re glad you’re here." />
              <UnavailableLink data={data} />
            </div>
          ) : step === "recognizing" ? (
            <RecognitionScreen data={data} />
          ) : step === "recognized" ? (
            <RecognizedMemberScreen data={data} onUseAnotherOption={() => setStep("choose")} />
          ) : step === "member" ? (
            <div className="space-y-5">
              <FlowHeader data={data} title="I am a church member" subtitle="Search and confirm your profile." />
              <MemberLookupForm data={data} />
            </div>
          ) : step === "visitor" ? (
            <div className="space-y-5">
              <FlowHeader data={data} title="I am visiting today" subtitle="We’d love to welcome you well." />
              <VisitorAttendanceForm data={data} />
              <PrivacyNote />
            </div>
          ) : (
            <ChoiceScreen data={data} onChooseMember={() => setStep("member")} onChooseVisitor={() => setStep("visitor")} />
          )}
        </div>
        <SecurityFooter />
      </div>
    </main>
  );
}

const attendanceMobileStyles = `
  .attendance-mobile-page {
    background:
      radial-gradient(circle at top, rgba(215, 168, 63, 0.12), transparent 36rem),
      linear-gradient(135deg, #fffaf0 0%, #f6f0e3 100%);
  }

  .attendance-glass-card,
  .attendance-option-card,
  .attendance-choice-card,
  .attendance-input-card {
    border: 1px solid #e4d8bf;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 18px 38px rgba(6, 69, 41, 0.08);
    backdrop-filter: blur(14px);
  }

  .attendance-choice-card {
    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
  }

  .attendance-choice-card:hover,
  .attendance-choice-card:focus-visible {
    transform: translateY(-1px);
    border-color: rgba(6, 69, 41, 0.3);
    box-shadow: 0 22px 42px rgba(6, 69, 41, 0.12);
  }

  .attendance-primary-button {
    background: linear-gradient(135deg, #075232 0%, #043b26 100%);
    color: white;
  }

  .attendance-primary-button:hover {
    background: linear-gradient(135deg, #0a633d 0%, #043b26 100%);
  }

  .attendance-wave-footer {
    position: relative;
    background: linear-gradient(135deg, #075232 0%, #043b26 100%);
  }

  .attendance-wave-footer::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: -18px;
    height: 36px;
    background: radial-gradient(80% 120% at 50% 0%, transparent 48%, #c99628 49%, #c99628 52%, #075232 53%);
    pointer-events: none;
  }

  .attendance-recognition-ring {
    background:
      radial-gradient(circle, rgba(255,255,255,0.96) 0 35%, transparent 36%),
      conic-gradient(from 30deg, #d7a83f 0deg, #d7a83f 96deg, rgba(215,168,63,0.14) 97deg, rgba(215,168,63,0.14) 360deg);
    animation: attendanceSpin 1.35s linear infinite;
    box-shadow: 0 0 0 18px rgba(215, 168, 63, 0.08), 0 0 0 34px rgba(215, 168, 63, 0.05);
  }

  .attendance-pop {
    animation: attendancePop 360ms cubic-bezier(.2,.8,.2,1) both;
  }

  .attendance-success-icon {
    animation: attendanceSuccess 650ms cubic-bezier(.2,.8,.2,1) both;
  }

  @keyframes attendanceSpin {
    to { transform: rotate(360deg); }
  }

  @keyframes attendancePop {
    0% { opacity: 0; transform: translateY(12px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes attendanceSuccess {
    0% { opacity: 0; transform: scale(0.72); box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
    55% { opacity: 1; transform: scale(1.06); box-shadow: 0 0 0 16px rgba(16,185,129,0); }
    100% { opacity: 1; transform: scale(1); box-shadow: 0 12px 24px rgba(5, 150, 105, 0.18); }
  }

  @media (max-width: 380px) {
    .attendance-mobile-page > div {
      border-radius: 1.75rem;
    }
  }
`;
