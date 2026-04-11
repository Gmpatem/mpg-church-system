import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ChevronLeft, Clock3, MapPin, ShieldCheck } from "lucide-react";
import {
  PlatformMobileHero,
  PlatformMobileSectionCard,
  PlatformMobileStatCard,
} from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformEventById } from "@/features/platform/queries";

const EVENT_STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  worship_service: "Worship Service",
  prayer_meeting: "Prayer Meeting",
  board_meeting: "Board Meeting",
  department_meeting: "Department Meeting",
  youth_meeting: "Youth Meeting",
  evangelism: "Evangelism",
  youth_program: "Youth Program",
  sabbath_school: "Sabbath School",
  community_outreach: "Community Outreach",
  special_program: "Special Program",
  outreach: "Outreach",
  seminar: "Seminar",
  social: "Social Event",
  fundraiser: "Fundraiser",
  other: "Other",
};

function getChurch(churches: any) {
  if (!churches) return null;
  return Array.isArray(churches) ? churches[0] ?? null : churches;
}

function getEventStatusLabel(status: string | null | undefined) {
  if (!status) return "Planned";
  return EVENT_STATUS_LABELS[status] ?? "Planned";
}

function getEventTypeLabel(type: string | null | undefined) {
  if (!type) return "Other";
  return EVENT_TYPE_LABELS[type] ?? "Other";
}

function getWorkflowLabel(value: string | null | undefined) {
  if (!value) return "In Progress";
  if (value === "pending_approval") return "Pending Approval";
  if (value === "approved") return "Approved";
  if (value === "draft") return "Draft";
  if (value === "rejected") return "Needs Revision";
  return "In Progress";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function PlatformEventDetailPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getPlatformEventById(eventId);

  if (!event) {
    notFound();
  }

  const church = getChurch(event.churches);

  return (
    <div className="space-y-5">
      <Link
        href="/platform/events"
        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <PlatformMobileHero
        eyebrow="Event Detail"
        title={event.title}
        description="Review schedule, workflow stage, and source church context for this event."
        badge={getEventStatusLabel(event.status)}
        actions={
          church?.slug
            ? [{ href: "/c/" + church.slug + "/events?eventId=" + event.id + "&tab=detail", label: "Open Church Event" }]
            : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <PlatformMobileStatCard label="Type" value={getEventTypeLabel(event.event_type)} hint="Event classification" />
        <PlatformMobileStatCard label="Workflow" value={getWorkflowLabel(event.workflow_state)} hint="Approval stage" />
        <PlatformMobileStatCard label="All Day" value={event.is_all_day ? "Yes" : "No"} hint="Duration setting" />
        <PlatformMobileStatCard label="Church" value={church?.name ?? "Unassigned"} hint="Source church" />
      </div>

      <PlatformMobileSectionCard title="Schedule">
        <div className="space-y-2 text-sm text-slate-700">
          <p className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-500" />
            Starts: {formatDate(event.start_datetime)}
          </p>
          <p className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-slate-500" />
            Ends: {formatDate(event.end_datetime)}
          </p>
          <p className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            {event.location ?? "Location not specified"}
          </p>
        </div>
      </PlatformMobileSectionCard>

      <PlatformMobileSectionCard title="Approval & Notes">
        <div className="space-y-2 text-sm">
          <p className="inline-flex items-center gap-2 text-slate-700">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            {getWorkflowLabel(event.workflow_state)}
          </p>
          <p className="text-slate-600">{event.description?.trim() ? event.description : "No description provided."}</p>
          {event.approval_note ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {event.approval_note}
            </div>
          ) : null}
        </div>
      </PlatformMobileSectionCard>
    </div>
  );
}
