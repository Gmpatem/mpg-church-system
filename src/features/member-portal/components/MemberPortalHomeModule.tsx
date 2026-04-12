import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, HandHeart, User2, Users } from "lucide-react";
import {
  WorkspaceEmptyState,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import {
  eventStatusLabels,
  eventTypeLabels,
  getLabel,
  memberStatusLabels,
  memberTypeLabels,
} from "@/lib/display-maps";
import type {
  MemberPortalIdentity,
  MemberPortalOverviewData,
} from "@/features/member-portal/types";
import { MemberPortalModuleHero } from "./MemberPortalModuleHero";
import { formatDateTime } from "./memberPortalUiUtils";

function formatNotificationTime(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
}

type MemberPortalHomeModuleProps = {
  churchName: string;
  churchSlug: string;
  memberName: string;
  identity: MemberPortalIdentity;
  data: MemberPortalOverviewData;
};

const QUICK_LINKS = [
  { tab: "departments", label: "Directory", icon: Users },
  { tab: "events", label: "Events", icon: CalendarDays },
  { tab: "giving", label: "Giving", icon: HandHeart },
  { tab: "profile", label: "Profile", icon: User2 },
] as const;

export function MemberPortalHomeModule({
  churchName,
  churchSlug,
  memberName,
  identity,
  data,
}: MemberPortalHomeModuleProps) {
  const topNotification = data.notifications[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      <MemberPortalModuleHero
        eyebrow="My Church Home"
        title={`Welcome, ${memberName}`}
        description={`Review your profile, church updates, events, and giving in one place for ${churchName}.`}
      />

      {topNotification ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <Bell className="mt-0.5 h-4 w-4 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Needs attention</p>
              <p className="text-sm text-amber-800">{topNotification.description}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mobile-stagger grid grid-cols-2 gap-3 md:grid-cols-4">
        <WorkspaceStatCard
          label="Membership"
          value={getLabel(memberStatusLabels, identity.member.membership_status)}
          hint="Current status"
          className="h-full"
          valueClassName="text-xl md:text-2xl"
        />
        <WorkspaceStatCard
          label="Member Type"
          value={getLabel(memberTypeLabels, identity.member.membership_type)}
          hint="Church category"
          className="h-full"
          valueClassName="text-xl md:text-2xl"
        />
        <WorkspaceStatCard
          label="Departments"
          value={String(data.activeDepartmentCount)}
          hint="Active assignments"
          className="h-full"
          valueClassName="text-xl md:text-2xl"
        />
        <WorkspaceStatCard
          label="Upcoming"
          value={String(data.upcomingEvents.length)}
          hint="Next events"
          className="h-full"
          valueClassName="text-xl md:text-2xl"
        />
      </div>

      <WorkspaceSectionCard
        title="Quick Links"
        description="Jump to your main member portal modules."
        contentClassName="grid grid-cols-2 gap-3"
      >
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.tab}
              href={`/my/${churchSlug}?tab=${item.tab}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-500" />
                {item.label}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          );
        })}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Recent Activity"
        description="The latest updates related to your church record."
        contentClassName="space-y-3"
      >
        {data.notifications.length > 0 ? (
          data.notifications.map((item) => (
            item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="mobile-touch-feedback block rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                {formatNotificationTime(item.createdAt) ? (
                  <p className="mt-2 text-xs text-slate-500">{formatNotificationTime(item.createdAt)}</p>
                ) : null}
              </Link>
            ) : (
              <div key={item.id} className="mobile-touch-feedback rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              </div>
            )
          ))
        ) : (
          <WorkspaceEmptyState
            title="No new updates"
            message="We will show important updates here as they become available."
            className="min-h-[160px]"
          />
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Upcoming Events"
        description="Next church events visible in your portal."
        contentClassName="space-y-3"
      >
        {data.upcomingEvents.length > 0 ? (
          data.upcomingEvents.map((event) => (
            <div key={event.id} className="mobile-touch-feedback rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {getLabel(eventTypeLabels, event.event_type)}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {getLabel(eventStatusLabels, event.status)}
                </span>
              </div>
              <p className="mt-2 font-medium text-slate-900">{event.title}</p>
              <p className="mt-1 text-sm text-slate-600">{formatDateTime(event.start_datetime)}</p>
              <p className="text-sm text-slate-500">
                {event.location?.trim() ? event.location : "Location not set"}
              </p>
            </div>
          ))
        ) : (
          <WorkspaceEmptyState
            title="No upcoming events"
            message="When events are published for your church, they will appear here."
            className="min-h-[160px]"
          />
        )}
      </WorkspaceSectionCard>
    </div>
  );
}
