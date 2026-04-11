import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Clock,
} from "lucide-react";
import { WorkspaceSectionCard } from "@/components/workspace";

interface DashboardRecentSectionProps {
  churchId: string;
  churchSlug: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

function getAvatarColor(id: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500", 
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
}

export async function DashboardRecentSection({ churchId, churchSlug }: DashboardRecentSectionProps) {
  const supabase = await createClient();

  const { data: recentMembers } = await supabase
    .from("members")
    .select("id, first_name, last_name, email, phone, created_at, membership_status")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: upcomingEvents } = await supabase
    .from("church_events")
    .select("id, title, start_datetime, location")
    .eq("church_id", churchId)
    .eq("status", "scheduled")
    .gte("start_datetime", new Date().toISOString())
    .order("start_datetime", { ascending: true })
    .limit(3);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <WorkspaceSectionCard
        title="Recent Members"
        description="Newest people added to the church workspace."
      >
        <div className="mb-4 flex justify-end">
          <Link
            href={`/c/${churchSlug}/members`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Open Members
          </Link>
        </div>

        {!recentMembers || recentMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <UserPlus className="h-6 w-6 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">No members yet</p>
            <p className="mt-1 text-xs text-slate-400">Add members to see them here</p>
            <Link
              href={`/c/${churchSlug}/members/new`}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Add First Member
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentMembers.map((member) => (
              <Link
                key={member.id}
                href={`/c/${churchSlug}/members/${member.id}`}
                className="mobile-touch-feedback group flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(member.id)}`}>
                  {getInitials(member.first_name, member.last_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {[member.first_name, member.last_name].filter(Boolean).join(" ") || "Unnamed member"}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                    {member.email ? (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">{member.email}</span>
                      </span>
                    ) : member.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </span>
                    ) : (
                      <span>No contact</span>
                    )}
                  </div>
                </div>

                <span className="shrink-0 text-xs text-slate-400">
                  {formatRelativeTime(member.created_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Upcoming Events"
        description="Next scheduled activities and ministry calendar moments."
      >
        <div className="mb-4 flex justify-end">
          <Link
            href={`/c/${churchSlug}/events`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Open Events
          </Link>
        </div>

        {!upcomingEvents || upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Calendar className="h-6 w-6 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">No upcoming events</p>
            <p className="mt-1 text-xs text-slate-400">Schedule events to see them here</p>
            <Link
              href={`/c/${churchSlug}/events`}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.start_datetime);
              const isToday = eventDate.toDateString() === new Date().toDateString();

              return (
                <Link
                  key={event.id}
                  href={`/c/${churchSlug}/events`}
                  className="mobile-touch-feedback group flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 transition hover:border-cyan-200 hover:bg-cyan-50/30"
                >
                  <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${isToday ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      {eventDate.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="text-base font-bold">{eventDate.getDate()}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{event.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {eventDate.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      {event.location ? (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{event.location}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {isToday ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      Today
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </WorkspaceSectionCard>
    </div>
  );
}
