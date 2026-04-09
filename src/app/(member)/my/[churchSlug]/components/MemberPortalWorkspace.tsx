import {
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard
} from "@/components/workspace";
import { getLabel, memberStatusLabels, memberTypeLabels } from "@/lib/display-maps";
import { CalendarView } from "@/components/shared/CalendarView";
import type { CalendarEvent } from "@/features/calendar/types";
import type {
  MemberPortalDepartmentsData,
  MemberPortalFoundationData,
  MemberPortalOverviewData,
  MemberPortalProfileData,
  MemberPortalTabData,
  MemberPortalTabKey,
} from "@/features/member-portal/types";

type MemberPortalWorkspaceProps = {
  foundation: MemberPortalFoundationData;
  activeTab: MemberPortalTabKey;
  tabData: MemberPortalTabData;
  showWelcome?: boolean;
};

const TAB_ITEMS: Array<{
  key: MemberPortalTabKey;
  label: string;
}> = [
  { key: "overview", label: "Overview" },
  { key: "profile", label: "Profile" },
  { key: "departments", label: "My Involvement" },
  { key: "calendar", label: "Calendar" },
];

function formatMemberName(foundation: MemberPortalFoundationData) {
  const member = foundation.identity?.member;
  const profile = foundation.profile;

  if (member?.display_name?.trim()) return member.display_name.trim();

  const fullName = [member?.first_name, member?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;
  if (profile?.full_name?.trim()) return profile.full_name.trim();

  return "Member";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderOverviewTab(data: MemberPortalOverviewData) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStatCard
          label="Active Roles"
          value={String(data.activeRoleCount)}
          hint="Current formal church roles"
        />
        <WorkspaceStatCard
          label="Departments"
          value={String(data.activeDepartmentCount)}
          hint="Active department assignments"
        />
        <WorkspaceStatCard
          label="Upcoming Events"
          value={String(data.upcomingEvents.length)}
          hint="Next scheduled events"
        />
        <WorkspaceStatCard
          label="Household"
          value={data.identity.household?.household_name ?? "Not linked"}
          hint="Current household record"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <WorkspaceSectionCard
          title="Identity Snapshot"
          description="Your current church member profile at a glance."
          contentClassName="space-y-3"
          className="xl:col-span-1"
        >
          <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-1">
            <div>
              <p className="text-muted-foreground">Full name</p>
              <p className="font-medium">
                {data.identity.member.display_name ??
                  [data.identity.member.first_name, data.identity.member.last_name]
                    .filter(Boolean)
                    .join(" ")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Member code</p>
              <p className="font-medium">{data.identity.member.member_code ?? "Not assigned"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Membership status</p>
              <p className="font-medium">{getLabel(memberStatusLabels, data.identity.member.membership_status)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Membership type</p>
              <p className="font-medium">{getLabel(memberTypeLabels, data.identity.member.membership_type)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Joined date</p>
              <p className="font-medium">{formatDate(data.identity.member.date_joined)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Baptism date</p>
              <p className="font-medium">{formatDate(data.identity.member.baptism_date)}</p>
            </div>
          </div>
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Important Updates"
          description="A quick preview of things relevant to your church life."
          contentClassName="space-y-3"
          className="xl:col-span-2"
        >
          {data.notifications.length > 0 ? (
            <div className="space-y-3">
              {data.notifications.map((item) => (
                <div key={item.id} className="rounded-2xl border p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              There are no important updates to show right now.
            </p>
          )}
        </WorkspaceSectionCard>
      </div>

      <WorkspaceSectionCard
        title="Upcoming Events"
        description="The next scheduled church events visible in your portal."
        contentClassName="space-y-3"
      >
        {data.upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {data.upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 rounded-2xl border p-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {event.event_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.location?.trim() ? event.location : "Location not set"}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground md:text-right">
                  <p>{formatDateTime(event.start_datetime)}</p>
                  <p className="mt-1 capitalize">{event.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No upcoming church events are scheduled right now.
          </p>
        )}
      </WorkspaceSectionCard>
    </div>
  );
}

function renderProfileField(label: string, value: string | null | undefined) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value?.trim() ? value : "Not provided"}</p>
    </div>
  );
}

function renderProfileTab(data: MemberPortalProfileData) {
  const fields = data.fields;

  return (
    <div className="space-y-6">
      <WorkspaceSectionCard
        title="Profile Details"
        description="Your core member identity and contact information."
        contentClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {renderProfileField("Full name", fields.fullName)}
        {renderProfileField("First name", fields.firstName)}
        {renderProfileField("Last name", fields.lastName)}
        {renderProfileField("Display name", fields.displayName)}
        {renderProfileField("Email", fields.email)}
        {renderProfileField("Phone", fields.phone)}
        {renderProfileField("Gender", fields.gender)}
        {renderProfileField("Date of birth", formatDate(fields.dateOfBirth))}
        {renderProfileField("Marital status", fields.maritalStatus)}
        {renderProfileField("Address", fields.address)}
        {renderProfileField("City", fields.city)}
        {renderProfileField("Country", fields.country)}
        {renderProfileField("Previous church", fields.previousChurch)}
        {renderProfileField("Household", fields.householdName)}
      </WorkspaceSectionCard>

      <WorkspaceSectionCard
        title="Church Record Details"
        description="Important church-managed fields from your member record."
        contentClassName="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {renderProfileField("Member code", fields.memberCode)}
        {renderProfileField("Membership status", fields.membershipStatus)}
        {renderProfileField("Membership type", fields.membershipType)}
        {renderProfileField("Date joined", formatDate(fields.dateJoined))}
        {renderProfileField("Baptism date", formatDate(fields.baptismDate))}
      </WorkspaceSectionCard>
    </div>
  );
}

function renderDepartmentsTab(data: MemberPortalDepartmentsData) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStatCard
          label="Active Roles"
          value={String(data.activeRoleCount)}
          hint="Current church roles"
        />
        <WorkspaceStatCard
          label="Past Roles"
          value={String(data.inactiveRoleCount)}
          hint="Inactive or ended roles"
        />
        <WorkspaceStatCard
          label="Active Departments"
          value={String(data.activeDepartmentCount)}
          hint="Current service areas"
        />
        <WorkspaceStatCard
          label="Past Departments"
          value={String(data.inactiveDepartmentCount)}
          hint="Inactive department records"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <WorkspaceSectionCard
          title="Church Roles"
          description="Formal roles assigned to you within the church."
          contentClassName="space-y-3"
        >
          {data.roles.length > 0 ? (
            <div className="space-y-3">
              {data.roles.map((role) => (
                <div key={role.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{role.roleName}</p>
                    <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                      {role.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>Code: {role.roleCode}</p>
                    <p>Start: {formatDate(role.startDate)}</p>
                    <p>End: {formatDate(role.endDate)}</p>
                    <p>{role.roleDescription?.trim() ? role.roleDescription : "No description"}</p>
                  </div>
                  {role.notes?.trim() ? (
                    <p className="mt-3 text-sm text-muted-foreground">{role.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No church roles are assigned to you yet.
            </p>
          )}
        </WorkspaceSectionCard>

        <WorkspaceSectionCard
          title="Departments"
          description="Your department assignments and service roles."
          contentClassName="space-y-3"
        >
          {data.departments.length > 0 ? (
            <div className="space-y-3">
              {data.departments.map((department) => (
                <div key={department.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{department.departmentName}</p>
                    <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                      {department.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>Code: {department.departmentCode ?? "Not set"}</p>
                    <p>Role title: {department.roleTitle?.trim() ? department.roleTitle : "Not set"}</p>
                    <p>Start: {formatDate(department.startDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No department assignments are linked to your member record yet.
            </p>
          )}
        </WorkspaceSectionCard>
      </div>
    </div>
  );
}

function renderCalendarTab(events: CalendarEvent[]) {
  return (
    <WorkspaceSectionCard
      title="Church Calendar"
      description="Upcoming approved events for this church."
    >
      <CalendarView
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          event_type: e.event_type,
          location: e.location,
          is_all_day: e.is_all_day,
        }))}
        showViewToggle={true}
        emptyMessage="No upcoming events scheduled."
      />
    </WorkspaceSectionCard>
  );
}

export function MemberPortalWorkspace({
  foundation,
  activeTab,
  tabData,
  showWelcome = false,
}: MemberPortalWorkspaceProps) {
  const churchSlug = foundation.churchSlug;
  const churchName = foundation.churchName ?? "Church";
  const memberName = formatMemberName(foundation);
  const isLinked = foundation.linkStatus === "linked";
  const identity = foundation.identity;

  if (!isLinked || !identity) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <WorkspaceHero
          eyebrow="Member Portal"
          title={`Welcome to ${churchName}`}
          description="Your personal church workspace will appear here once your member record is linked to your account."
        />

        <WorkspaceEmptyState
          title="Your member portal is not linked yet"
          message="Your account can access this church, but we could not find a member record linked to your profile yet. A church admin needs to connect your account to your member profile first."
          actionLabel="Open church dashboard"
          actionHref={`/c/${churchSlug}`}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <WorkspaceHero
        eyebrow="My Church Home"
        title={`Welcome, ${memberName}`}
        description={`This is your personal workspace for ${churchName}. Review your profile, service roles, events, and giving in one place.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStatCard
          label="Membership Status"
          value={identity.member.membership_status ?? "Unknown"}
          hint="Current membership state"
        />
        <WorkspaceStatCard
          label="Member Code"
          value={identity.member.member_code ?? "Not assigned"}
          hint="Church member reference"
        />
        <WorkspaceStatCard
          label="Membership Type"
          value={identity.member.membership_type ?? "Not set"}
          hint="Member category"
        />
        <WorkspaceStatCard
          label="Household"
          value={identity.household?.household_name ?? "Not linked"}
          hint="Current household record"
        />
      </div>

      {activeTab === "overview" && tabData.tab === "overview" && tabData.data
        ? renderOverviewTab(tabData.data)
        : null}

      {activeTab === "profile" && tabData.tab === "profile" && tabData.data
        ? renderProfileTab(tabData.data)
        : null}

      {activeTab === "departments" && tabData.tab === "departments" && tabData.data
        ? renderDepartmentsTab(tabData.data)
        : null}

      {activeTab === "calendar" && tabData.tab === "calendar"
        ? renderCalendarTab(tabData.data)
        : null}
    </div>
  );
}





