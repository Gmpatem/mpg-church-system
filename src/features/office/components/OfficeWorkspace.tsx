import Link from "next/link";

interface OfficeQueueItem {
  id: string;
  type: "access_request" | "leadership_request" | "announcement_review" | "event_approval" | "today_event";
  title: string;
  description: string;
  href: string;
  createdAt?: string | null;
  startsAt?: string | null;
  status?: string | null;
}

interface OfficeWorkspaceData {
  church: {
    id: string;
    slug: string;
    name: string;
  };
  roles: string[];
  stats: {
    totalMembers: number;
    activeDepartments: number;
    pendingAccessRequests: number;
    pendingLeadershipRequests: number;
    announcementsNeedingPublish: number;
    departmentEventsAwaitingApproval: number;
    upcomingEvents: number;
    todaysEvents: number;
  };
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    href: string;
    event_type: string;
    entity_type: string;
    entity_id: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    start_datetime: string;
    status: string;
  }>;
  secretaryCalendar?: {
    pendingSubmissions: Array<{
      id: string;
      title: string;
      event_type: string;
      start_datetime: string | null;
      status: string | null;
      workflow_state: string | null;
    }>;
    sharedCalendar: Array<{
      id: string;
      title: string;
      event_type: string;
      start_datetime: string | null;
      status: string | null;
      workflow_state: string | null;
    }>;
  };
  queue: OfficeQueueItem[];
}

interface OfficeWorkspaceProps {
  churchSlug: string;
  data: OfficeWorkspaceData;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

function OfficeCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}



function formatCalendarDayLabel(value?: string | null) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatCalendarTimeLabel(value?: string | null) {
  if (!value) return "Time not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function groupSecretaryCalendarByDate(
  items: Array<{
    id: string;
    title: string;
    event_type: string;
    start_datetime: string | null;
    status: string | null;
    workflow_state: string | null;
  }>
) {
  const groups = new Map<string, typeof items>();

  for (const item of items) {
    const dateKey = item.start_datetime
      ? new Date(item.start_datetime).toISOString().slice(0, 10)
      : "unknown";

    const existing = groups.get(dateKey) ?? [];
    existing.push(item);
    groups.set(dateKey, existing);
  }

  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}
function getQueueActionLabel(type: OfficeQueueItem["type"]) {
  if (type === "access_request") return "Review Access";
  if (type === "leadership_request") return "Review Leadership";
  if (type === "announcement_review") return "Open Announcement";
  if (type === "event_approval") return "Review Event";
  if (type === "today_event") return "Open Calendar";
  return "Review";
}
function QueueBadge({ type }: { type: OfficeQueueItem["type"] }) {
  const map = {
    access_request: "bg-blue-100 text-blue-700",
    leadership_request: "bg-violet-100 text-violet-700",
    announcement_review: "bg-amber-100 text-amber-800",
    event_approval: "bg-rose-100 text-rose-700",
    today_event: "bg-emerald-100 text-emerald-700",
  } as const;

  const labels = {
    access_request: "Access",
    leadership_request: "Leadership",
    announcement_review: "Announcement",
    event_approval: "Event Review",
    today_event: "Today",
  } as const;

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[type]}`}>
      {labels[type]}
    </span>
  );
}

export function OfficeWorkspace({ churchSlug, data }: OfficeWorkspaceProps) {
  const roles = data.roles ?? [];
  const isSecretary = roles.includes("church_secretary");
  const isClerk = roles.includes("clerk");

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 p-6 text-white shadow-sm">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100">
              Office Workspace
            </span>
            {isClerk ? (
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                Clerk
              </span>
            ) : null}
            {isSecretary ? (
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                Church Secretary
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Church Office Coordination Desk
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
            A guided operational desk for approvals, records, coordination, calendar flow,
            announcements, and reporting across {data.church.name}.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <StatCard label="Members" value={data.stats.totalMembers} hint="Registry footprint" />
        <StatCard label="Departments" value={data.stats.activeDepartments} hint="Active structure" />
        <StatCard label="Access Requests" value={data.stats.pendingAccessRequests} hint="Needs review" />
        <StatCard label="Leadership Requests" value={data.stats.pendingLeadershipRequests} hint="Needs review" />
        <StatCard label="Announcements" value={data.stats.announcementsNeedingPublish} hint="Need publish" />
        <StatCard label="Event Approvals" value={data.stats.departmentEventsAwaitingApproval} hint="Workflow queue" />
        <StatCard label="Today" value={data.stats.todaysEvents} hint="Calendar load" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <OfficeCard
          title="Member Registry"
          description="Manage member records, status changes, edits, and transfers."
          href={`/c/${churchSlug}/members`}
        />
        <OfficeCard
          title="Household Desk"
          description="Track family units, household heads, and linked member records."
          href={`/c/${churchSlug}/households`}
        />
        <OfficeCard
          title="Department Records"
          description="Review department structure, assignments, and ministry organization."
          href={`/c/${churchSlug}/departments`}
        />
        <OfficeCard
          title="Leadership Requests"
          description="Monitor department leadership requests and active leadership assignments."
          href={`/c/${churchSlug}/leadership`}
        />
        <OfficeCard
          title="Access Requests"
          description="Review onboarding-linked access requests and role approvals."
          href={`/c/${churchSlug}/access-control`}
        />
        <OfficeCard
          title="Reports Desk"
          description="Review cross-module intelligence for members, treasury, departments, and events."
          href={`/c/${churchSlug}/reports`}
        />

        {isSecretary ? (
          <>
            <OfficeCard
              title="Event Calendar"
              description="Coordinate event scheduling, department events, and church calendar flow."
              href={`/c/${churchSlug}/events`}
            />
            <OfficeCard
              title="Announcements"
              description="Publish church-wide and department-facing updates from one coordination layer."
              href={`/c/${churchSlug}/announcements`}
            />
            <OfficeCard
              title="Unified Calendar"
              description="See approved and published coordination activity across the church."
              href={`/c/${churchSlug}/calendar`}
            />
          </>
        ) : null}
      </div>


      {isSecretary ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Pending Calendar Submissions</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Department or church activities waiting for calendar review and approval.
                  </p>
                </div>

                <Link
                  href={`/c/${churchSlug}/events`}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Open Events
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {(data.secretaryCalendar?.pendingSubmissions?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No pending event submissions right now.
                  </div>
                ) : (
                  data.secretaryCalendar!.pendingSubmissions.map((event) => (
                    <Link
                      key={event.id}
                      href={`/c/${churchSlug}/events`}
                      className="block rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{event.title}</p>
                          <p className="text-sm text-slate-600">
                            {event.event_type.replaceAll("_", " ")} • {formatDateTime(event.start_datetime)}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                          {event.workflow_state ?? "pending"}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Shared Church Calendar</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Approved and published activities already feeding the common church calendar.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/c/${churchSlug}/calendar`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Open Calendar
                  </Link>
                  <Link
                    href={`/c/${churchSlug}/events`}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Create Activity
                  </Link>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(data.secretaryCalendar?.sharedCalendar?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No shared calendar activities found yet.
                  </div>
                ) : (
                  data.secretaryCalendar!.sharedCalendar.slice(0, 6).map((event) => (
                    <Link
                      key={event.id}
                      href={`/c/${churchSlug}/calendar`}
                      className="block rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{event.title}</p>
                          <p className="text-sm text-slate-600">
                            {event.event_type.replaceAll("_", " ")} • {formatDateTime(event.start_datetime)}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                          {event.workflow_state ?? event.status ?? "scheduled"}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Secretary Calendar Board</h2>
                <p className="mt-1 text-sm text-slate-600">
                  A real agenda-style calendar surface inside Office, grouped by day and auto-filled from the shared church event system.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/c/${churchSlug}/calendar`}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Full Calendar
                </Link>
                <Link
                  href={`/c/${churchSlug}/events`}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Manage Activities
                </Link>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {(data.secretaryCalendar?.sharedCalendar?.length ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  Calendar board is empty for now. Once departments submit activities and events are approved or published, this board will auto-fill here.
                </div>
              ) : (
                groupSecretaryCalendarByDate(data.secretaryCalendar!.sharedCalendar).map(([dateKey, items]) => (
                  <div key={dateKey} className="rounded-xl border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {dateKey === "unknown" ? "Unknown Date" : formatCalendarDayLabel(`${dateKey}T00:00:00`)}
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {items.map((event) => (
                        <Link
                          key={event.id}
                          href={`/c/${churchSlug}/events`}
                          className="flex flex-col gap-2 px-4 py-3 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{event.title}</p>
                            <p className="text-sm text-slate-600">
                              {event.event_type.replaceAll("_", " ")} • {formatCalendarTimeLabel(event.start_datetime)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {event.status ?? "scheduled"}
                            </span>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                              {event.workflow_state ?? "live"}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Live Office Queue</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cross-module workflow signals that need office attention now.
        </p>

        <div className="mt-4 space-y-3">
          {data.queue.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No active office queue items right now.
            </div>
          ) : (
            data.queue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <QueueBadge type={item.type} />
                      {item.status ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {item.status?.replaceAll("_", " ")}
                        </span>
                      ) : null}
                    </div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>

                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <div className="text-sm text-slate-500 md:text-right">
                      {item.startsAt ? (
                        <p>{formatDateTime(item.startsAt)}</p>
                      ) : item.createdAt ? (
                        <p>{formatDateTime(item.createdAt)}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={item.href}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open
                      </Link>
                      <Link
                        href={item.href}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Upcoming Office Queue</h2>
        <p className="mt-1 text-sm text-slate-600">
          Scheduled events ahead that may need office coordination follow-up.
        </p>

        <div className="mt-4 space-y-3">
          {data.upcomingEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No upcoming scheduled events found.
            </div>
          ) : (
            data.upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/c/${churchSlug}/events?eventId=${event.id}&tab=detail`}
                className="block rounded-xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{event.title}</p>
                    <p className="text-sm text-slate-600">{formatDateTime(event.start_datetime)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {event.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}






