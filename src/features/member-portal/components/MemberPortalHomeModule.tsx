import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  HandHeart,
  Heart,
  MapPin,
  User2,
  Users,
} from "lucide-react";
import { getLabel, memberStatusLabels, memberTypeLabels } from "@/lib/display-maps";
import type {
  MemberPortalIdentity,
  MemberPortalOverviewData,
  MemberPortalUpcomingEventItem,
} from "@/features/member-portal/types";
import {
  formatClockTime,
  formatCompactDate,
  getFirstName,
  MemberPortalAvatar,
  MemberPortalCard,
  MemberPortalChurchMark,
  MemberPortalIconBubble,
  MemberPortalNotificationBell,
  MemberPortalSectionHeader,
  MemberPortalStatusPill,
} from "./MemberPortalAppPrimitives";

type MemberPortalHomeModuleProps = {
  churchName: string;
  churchSlug: string;
  memberName: string;
  identity: MemberPortalIdentity;
  data: MemberPortalOverviewData;
};

const QUICK_LINKS = [
  { tab: "ministries", label: "My Ministries", icon: Users },
  { tab: "events", label: "Events", icon: CalendarDays },
  { tab: "giving", label: "Giving", icon: HandHeart },
  { tab: "profile", label: "Profile", icon: User2 },
] as const;

const FALLBACK_NEXT_UP: MemberPortalUpcomingEventItem = {
  id: "fallback-youth-bible-study",
  title: "Youth Bible Study",
  event_type: "small_group",
  location: "Room 3",
  start_datetime: new Date().toISOString(),
  end_datetime: new Date().toISOString(),
  status: "scheduled",
};

function nextUpTime(event: MemberPortalUpcomingEventItem, isFallback: boolean) {
  if (isFallback) return "Today · 4:00 PM";
  return `${formatCompactDate(event.start_datetime)} · ${formatClockTime(event.start_datetime)}`;
}

export function MemberPortalHomeModule({
  churchName,
  churchSlug,
  memberName,
  identity,
  data,
}: MemberPortalHomeModuleProps) {
  const firstName = getFirstName(memberName);
  const nextUp = data.upcomingEvents[0] ?? FALLBACK_NEXT_UP;
  const usingFallbackNextUp = data.upcomingEvents.length === 0;
  const membershipStatus = getLabel(memberStatusLabels, identity.member.membership_status);
  const membershipType = getLabel(memberTypeLabels, identity.member.membership_type);

  return (
    <div className="flex flex-col gap-5">
      <header className="-mx-3 -mt-3 rounded-b-[24px] bg-white px-4 pb-4 pt-4 shadow-sm sm:mx-0 sm:mt-0 sm:rounded-[24px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <MemberPortalChurchMark className="size-11" />
            <p className="truncate text-sm font-semibold text-emerald-950">{churchName}</p>
          </div>
          <MemberPortalNotificationBell />
        </div>
      </header>

      <section className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-700">Good morning,</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-normal text-emerald-950">
            {firstName}!
          </h1>
          <p className="mt-3 text-sm text-slate-600">We&apos;re glad you&apos;re here!</p>
        </div>
        <MemberPortalAvatar name={memberName} className="size-16" />
      </section>

      <MemberPortalCard>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">Next Up</p>
            <p className="mt-2 text-sm text-slate-600">{nextUpTime(nextUp, usingFallbackNextUp)}</p>
            <p className="mt-1 truncate text-base font-semibold text-slate-950">{nextUp.title}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
              <MapPin className="size-4 shrink-0 text-slate-500" />
              <span className="truncate">{nextUp.location?.trim() ? nextUp.location : "Location not set"}</span>
            </p>
          </div>
          <MemberPortalIconBubble icon={Users} />
        </div>
      </MemberPortalCard>

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="Quick Access" />
        <div className="grid grid-cols-4 gap-2">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.tab}
                href={`/my/${churchSlug}?tab=${item.tab}`}
                className="mobile-touch-feedback flex min-h-[90px] flex-col items-center justify-center gap-2 rounded-[16px] border border-amber-100 bg-white px-2 py-3 text-center shadow-sm shadow-amber-950/5 hover:bg-amber-50"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-950">
                  <Icon className="size-5" />
                </span>
                <span className="text-[11px] font-medium leading-tight text-slate-700">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <MemberPortalSectionHeader title="My Snapshot" href={`/my/${churchSlug}?tab=profile`} />
        <div className="grid grid-cols-3 gap-2">
          <MemberPortalCard className="flex min-h-[98px] flex-col justify-between rounded-[16px] p-3">
            <p className="text-xs text-slate-600">Attendance</p>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="size-4" />
              <span>Present</span>
            </div>
          </MemberPortalCard>
          <MemberPortalCard className="flex min-h-[98px] flex-col justify-between rounded-[16px] p-3 text-center">
            <p className="text-xs text-slate-600">Service</p>
            <div>
              <p className="text-2xl font-semibold leading-none text-emerald-950">
                {data.activeRoleCount || data.activeDepartmentCount}
              </p>
              <p className="mt-1 text-xs text-slate-600">Duties</p>
            </div>
          </MemberPortalCard>
          <MemberPortalCard className="flex min-h-[98px] flex-col justify-between rounded-[16px] p-3 text-center">
            <p className="text-xs text-slate-600">Groups</p>
            <div>
              <p className="text-2xl font-semibold leading-none text-emerald-950">
                {data.activeDepartmentCount}
              </p>
              <p className="mt-1 text-xs text-slate-600">Joined</p>
            </div>
          </MemberPortalCard>
        </div>
      </section>

      <MemberPortalCard className="relative overflow-hidden bg-amber-50/40 text-center">
        <Heart className="absolute left-4 top-4 size-6 text-amber-600" />
        <p className="mx-auto max-w-[260px] text-sm leading-6 text-slate-700">
          &ldquo;Let us not give up meeting together... but let us encourage one another.&rdquo;
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">Hebrews 10:25</p>
      </MemberPortalCard>

      <div className="grid gap-3 md:grid-cols-2">
        <MemberPortalCard className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-600">Membership</p>
            <p className="mt-1 font-semibold text-emerald-950">{membershipStatus}</p>
          </div>
          <MemberPortalStatusPill tone="success">{membershipType}</MemberPortalStatusPill>
        </MemberPortalCard>
        <Link
          href={`/my/${churchSlug}?tab=events`}
          className="mobile-touch-feedback flex items-center justify-between gap-3 rounded-[22px] border border-amber-100 bg-white p-4 shadow-sm shadow-amber-950/5 hover:bg-amber-50"
        >
          <div className="min-w-0">
            <p className="text-xs text-slate-600">Upcoming Events</p>
            <p className="mt-1 font-semibold text-emerald-950">{data.upcomingEvents.length} published</p>
          </div>
          <ChevronRight className="size-5 text-emerald-950" />
        </Link>
      </div>
    </div>
  );
}
