import "server-only";
import { cache } from "react";

import { getMemberMinistryPortalData } from "@/features/ministry-operations/queries";

import { createClient } from "@/lib/supabase/server";
import { requireMemberPortalAccess } from "@/features/access/queries";
import { getPublishedEvents } from "@/features/calendar/queries";
import { getLabel, memberStatusLabels } from "@/lib/display-maps";
import type {
  MemberPortalDepartmentItem,
  MemberPortalDepartmentsData,
  MemberPortalFoundationData,
  MemberPortalGivingData,
  MemberPortalIdentity,
  MemberPortalHouseholdSummary,
  MemberPortalMemberSummary,
  MemberPortalOverviewData,
  MemberPortalProfileData,
  MemberPortalProfileSummary,
  MemberPortalRoleItem,
  MemberPortalTabData,
  MemberPortalTabKey,
} from "./types";

type MemberRow = {
  id: string;
  church_id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  member_code: string | null;
  membership_status: string;
  membership_type: string | null;
  date_joined: string | null;
  baptism_date: string | null;
  household_id: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  marital_status: string | null;
  previous_church: string | null;
};

type HouseholdRow = {
  id: string;
  household_name: string;
};

type EventRow = {
  id: string;
  title: string;
  event_type: string;
  location: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
};

type RoleAssignmentRow = {
  id: string;
  role_id: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  role_definitions: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  } | null;
};

type MemberDepartmentRow = {
  id: string;
  department_id: string | null;
  department_name: string;
  role_title: string | null;
  is_active: boolean;
  start_date: string | null;
  church_departments: {
    id: string;
    department_name: string;
    code: string | null;
  } | null;
};

type TreasuryInflowRow = {
  id: string;
  inflow_type: string | null;
  amount: number | string | null;
  inflow_date: string;
  note: string | null;
  reference_number: string | null;
};

type AttendanceLatestRow = {
  checked_in_at: string;
  check_in_method: string | null;
};

type GivingSummaryRow = {
  inflow_type: string | null;
  amount: number | string | null;
  inflow_date: string;
};

async function getAllMemberGivingRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  churchId: string,
  memberId: string
) {
  const pageSize = 1000;
  const rows: GivingSummaryRow[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("treasury_inflows")
      .select("inflow_type, amount, inflow_date")
      .eq("church_id", churchId)
      .eq("member_id", memberId)
      .order("inflow_date", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);

    const page = (data ?? []) as GivingSummaryRow[];
    rows.push(...page);

    if (page.length < pageSize) break;
  }

  return rows;
}

function mapProfile(profile: {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_language: "en" | "fr" | null;
} | null): MemberPortalProfileSummary | null {
  if (!profile) return null;

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    preferred_language: profile.preferred_language,
  };
}

function mapMember(member: MemberRow): MemberPortalMemberSummary {
  return {
    id: member.id,
    church_id: member.church_id,
    profile_id: member.profile_id,
    first_name: member.first_name,
    last_name: member.last_name,
    display_name: member.display_name,
    email: member.email,
    phone: member.phone,
    member_code: member.member_code,
    membership_status: member.membership_status,
    membership_type: member.membership_type,
    date_joined: member.date_joined,
    baptism_date: member.baptism_date,
    household_id: member.household_id,
  };
}

function formatFullName(member: MemberPortalMemberSummary) {
  if (member.display_name?.trim()) return member.display_name.trim();
  return [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
}

const getCurrentLinkedMemberInternal = cache(async function getCurrentLinkedMemberInternal(
  churchSlug: string
): Promise<(MemberPortalIdentity & { memberRow: MemberRow }) | null> {
  const ctx = await requireMemberPortalAccess(churchSlug);
  const supabase = await createClient();

  if (!ctx.profile?.id) {
    return null;
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select(
      [
        "id",
        "church_id",
        "profile_id",
        "first_name",
        "last_name",
        "display_name",
        "email",
        "phone",
        "member_code",
        "membership_status",
        "membership_type",
        "date_joined",
        "baptism_date",
        "household_id",
        "gender",
        "date_of_birth",
        "address",
        "city",
        "country",
        "marital_status",
        "previous_church",
      ].join(", ")
    )
    .eq("church_id", ctx.churchId)
    .eq("profile_id", ctx.profile.id)
    .maybeSingle<MemberRow>();

  if (memberError) {
    throw new Error(memberError.message);
  }

  if (!member) {
    return null;
  }

  let household: MemberPortalHouseholdSummary = null;

  if (member.household_id) {
    const { data: householdRow, error: householdError } = await supabase
      .from("households")
      .select("id, household_name")
      .eq("church_id", ctx.churchId)
      .eq("id", member.household_id)
      .maybeSingle<HouseholdRow>();

    if (householdError) {
      throw new Error(householdError.message);
    }

    if (householdRow) {
      household = {
        id: householdRow.id,
        household_name: householdRow.household_name,
      };
    }
  }

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    churchName: ctx.churchName ?? null,
    profile: mapProfile(ctx.profile ?? null),
    member: mapMember(member),
    household,
    memberRow: member,
  };
});

export async function getCurrentLinkedMember(
  churchSlug: string
): Promise<MemberPortalIdentity | null> {
  const identity = await getCurrentLinkedMemberInternal(churchSlug);

  if (!identity) return null;

  const { memberRow: _memberRow, ...cleanIdentity } = identity;
  return cleanIdentity;
}

export async function getMemberPortalFoundation(
  churchSlug: string
): Promise<MemberPortalFoundationData> {
  const ctx = await requireMemberPortalAccess(churchSlug);
  const identity = await getCurrentLinkedMemberInternal(churchSlug);
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data: notificationRows, error: notificationError } = await supabase
    .from("church_notifications")
    .select(
      "id, title, message, event_type, entity_type, entity_id, is_read, read_at, requires_acknowledgement, acknowledged_at, expires_at, created_at"
    )
    .eq("church_id", ctx.churchId)
    .eq("target_user_id", ctx.userId)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (notificationError) {
    throw new Error(notificationError.message);
  }

  const notifications = (notificationRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    isRead: row.is_read,
    readAt: row.read_at,
    requiresAcknowledgement: row.requires_acknowledgement ?? false,
    acknowledgedAt: row.acknowledged_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
  const unreadNotificationCount = notifications.filter((item) => !item.isRead).length;

  if (!identity) {
    return {
      churchId: ctx.churchId,
      churchSlug: ctx.churchSlug,
      churchName: ctx.churchName ?? null,
      profile: mapProfile(ctx.profile ?? null),
      linkStatus: "unlinked",
      identity: null,
      unreadNotificationCount,
      notifications,
      requiresPasswordChange: (ctx.profile as any)?.must_change_password ?? false,
    };
  }

  const { memberRow: _memberRow, ...cleanIdentity } = identity;

  return {
    churchId: ctx.churchId,
    churchSlug: ctx.churchSlug,
    churchName: ctx.churchName ?? null,
    profile: mapProfile(ctx.profile ?? null),
    linkStatus: "linked",
    identity: cleanIdentity,
    unreadNotificationCount,
    notifications,
    requiresPasswordChange: (ctx.profile as any)?.must_change_password ?? false,
  };
}

export async function getMemberPortalOverview(
  churchSlug: string
): Promise<MemberPortalOverviewData | null> {
  const identity = await getCurrentLinkedMemberInternal(churchSlug);
  if (!identity) return null;

  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);
  const nextDutyWindow = new Date(now);
  nextDutyWindow.setDate(nextDutyWindow.getDate() + 45);
  const attendanceSince = new Date(now);
  attendanceSince.setDate(attendanceSince.getDate() - 90);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    departmentCountResult,
    roleCountResult,
    eventsResult,
    churchNotificationsResult,
    dutyCountResult,
    latestAttendanceResult,
    attendanceCountResult,
    currentMonthAttendanceCountResult,
  ] = await Promise.all([
    supabase
      .from("member_departments")
      .select("*", { count: "exact", head: true })
      .eq("church_id", identity.churchId)
      .eq("member_id", identity.member.id)
      .eq("is_active", true),
    identity.profile?.id
      ? supabase
          .from("church_role_assignments")
          .select("*", { count: "exact", head: true })
          .eq("church_id", identity.churchId)
          .eq("user_id", identity.profile.id)
          .eq("is_active", true)
      : Promise.resolve({ count: 0, error: null } as { count: number; error: null }),
    supabase
      .from("church_events")
      .select("id, title, event_type, location, start_datetime, end_datetime, status")
      .eq("church_id", identity.churchId)
      .eq("workflow_state", "published")
      .neq("status", "cancelled")
      .gte("end_datetime", nowIso)
      .order("start_datetime", { ascending: true })
      .limit(5),
    identity.profile?.id
      ? supabase
          .from("church_notifications")
          .select("id, title, message, href, event_type, is_read, created_at")
          .eq("church_id", identity.churchId)
          .eq("target_user_id", identity.profile.id)
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({
          data: [],
          error: null,
        } as {
          data: Array<{
            id: string;
            title: string;
            message: string;
            href: string;
            event_type: string | null;
            is_read: boolean;
            created_at: string;
          }>;
          error: null;
        }),
    supabase
      .from("ministry_duty_assignments")
      .select("id", { count: "exact", head: true })
      .eq("church_id", identity.churchId)
      .eq("member_id", identity.member.id)
      .gte("service_date", today)
      .lte("service_date", nextDutyWindow.toISOString().slice(0, 10))
      .not("status", "in", '("cancelled","replaced")'),
    supabase
      .from("attendance_records")
      .select("checked_in_at, check_in_method")
      .eq("church_id", identity.churchId)
      .eq("member_id", identity.member.id)
      .neq("status", "removed")
      .gte("checked_in_at", attendanceSince.toISOString())
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("church_id", identity.churchId)
      .eq("member_id", identity.member.id)
      .neq("status", "removed")
      .gte("checked_in_at", attendanceSince.toISOString()),
    supabase
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("church_id", identity.churchId)
      .eq("member_id", identity.member.id)
      .neq("status", "removed")
      .gte("checked_in_at", monthStart),
  ]);

  if (departmentCountResult.error) {
    throw new Error(departmentCountResult.error.message);
  }

  if (roleCountResult.error) {
    throw new Error(roleCountResult.error.message);
  }

  if (eventsResult.error) {
    throw new Error(eventsResult.error.message);
  }

  if (churchNotificationsResult.error) {
    throw new Error(churchNotificationsResult.error.message);
  }

  if (dutyCountResult.error) {
    throw new Error(dutyCountResult.error.message);
  }

  if (latestAttendanceResult.error) {
    throw new Error(latestAttendanceResult.error.message);
  }

  if (attendanceCountResult.error) {
    throw new Error(attendanceCountResult.error.message);
  }

  if (currentMonthAttendanceCountResult.error) {
    throw new Error(currentMonthAttendanceCountResult.error.message);
  }

  const activeDepartmentCount = departmentCountResult.count ?? 0;
  const activeRoleCount = identity.profile?.id ? roleCountResult.count ?? 0 : 0;

  const summaryNotifications = [
    {
      id: "membership-status",
      title: "Membership status",
      description: `Your current membership status is ${getLabel(memberStatusLabels, identity.member.membership_status)}.`,
    },
    {
      id: "department-summary",
      title: "Department assignments",
      description:
        activeDepartmentCount > 0
          ? `You currently have ${activeDepartmentCount} active department assignment${activeDepartmentCount === 1 ? "" : "s"}.`
          : "You do not have any active department assignments yet.",
    },
    {
      id: "role-summary",
      title: "Church roles",
      description:
        activeRoleCount > 0
          ? `You currently have ${activeRoleCount} active church role${activeRoleCount === 1 ? "" : "s"}.`
          : "You do not have any active formal church roles assigned yet.",
    },
  ];

  const liveNotifications = (churchNotificationsResult.data ?? []).map((row) => ({
    id: `church-notification-${row.id}`,
    title: row.title ?? "Church update",
    description: row.message ?? "You have a new church notification.",
    href: row.href ?? null,
    createdAt: row.created_at ?? null,
    isRead: row.is_read ?? false,
    eventType: row.event_type ?? null,
  }));

  const notifications = [...liveNotifications, ...summaryNotifications];
  const latestAttendance = latestAttendanceResult.data as AttendanceLatestRow | null;

  const { memberRow: _memberRow, ...cleanIdentity } = identity;

  return {
    identity: cleanIdentity,
    activeDepartmentCount,
    activeRoleCount,
    upcomingDutyCount: dutyCountResult.count ?? 0,
    attendance: {
      lastSeenAt: latestAttendance?.checked_in_at ?? null,
      lastMethod: latestAttendance?.check_in_method ?? null,
      presentCountLast90Days: attendanceCountResult.count ?? 0,
      currentMonthPresent: currentMonthAttendanceCountResult.count ?? 0,
    },
    upcomingEvents: (eventsResult.data ?? []) as EventRow[],
    notifications,
  };
}

export async function getMemberPortalProfile(
  churchSlug: string
): Promise<MemberPortalProfileData | null> {
  const identity = await getCurrentLinkedMemberInternal(churchSlug);
  if (!identity) return null;

  const member = identity.member;
  const row = identity.memberRow;

  const { memberRow: _memberRow, ...cleanIdentity } = identity;

  return {
    identity: cleanIdentity,
    fields: {
      fullName: formatFullName(member),
      firstName: member.first_name,
      lastName: member.last_name,
      displayName: member.display_name,
      email: member.email,
      phone: member.phone,
      gender: row.gender,
      dateOfBirth: row.date_of_birth,
      address: row.address,
      city: row.city,
      country: row.country,
      maritalStatus: row.marital_status,
      baptismDate: member.baptism_date,
      dateJoined: member.date_joined,
      membershipStatus: member.membership_status,
      membershipType: member.membership_type,
      memberCode: member.member_code,
      previousChurch: row.previous_church,
      householdName: identity.household?.household_name ?? null,
    },
  };
}

export async function getMemberPortalDepartments(
  churchSlug: string
): Promise<MemberPortalDepartmentsData | null> {
  const identity = await getCurrentLinkedMemberInternal(churchSlug);
  if (!identity) return null;

  const supabase = await createClient();

  const [rolesResult, departmentsResult] = await Promise.all([
    identity.profile?.id
      ? supabase
          .from("church_role_assignments")
          .select(
            "id, role_id, is_active, start_date, end_date, notes, role_definitions(id, code, name, description)"
          )
          .eq("church_id", identity.churchId)
          .eq("user_id", identity.profile.id)
          .order("is_active", { ascending: false })
          .order("start_date", { ascending: false, nullsFirst: false })
      : Promise.resolve({ data: [], error: null } as { data: RoleAssignmentRow[]; error: null }),
    supabase
      .from("member_departments")
      .select(
        "id, department_id, department_name, role_title, is_active, start_date, church_departments(id, department_name, code)"
      )
      .eq("church_id", identity.churchId)
      .eq("member_id", identity.member.id)
      .order("is_active", { ascending: false })
      .order("start_date", { ascending: false, nullsFirst: false }),
  ]);

  if (rolesResult.error) {
    throw new Error(rolesResult.error.message);
  }

  if (departmentsResult.error) {
    throw new Error(departmentsResult.error.message);
  }

  const roles = ((rolesResult.data ?? []) as RoleAssignmentRow[]).map<MemberPortalRoleItem>((row) => ({
    id: row.id,
    roleId: row.role_id,
    roleCode: row.role_definitions?.code ?? "unknown",
    roleName: row.role_definitions?.name ?? "Unknown role",
    roleDescription: row.role_definitions?.description ?? null,
    isActive: row.is_active,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
  }));

    const departments = ((departmentsResult.data ?? []) as any[]).map<MemberPortalDepartmentItem>((rawRow) => {
    const row = {
      ...rawRow,
      church_departments: Array.isArray(rawRow.church_departments)
        ? rawRow.church_departments[0] ?? null
        : rawRow.church_departments,
    } as MemberDepartmentRow;

    return {
      id: row.id,
      departmentId: row.department_id,
      departmentName:
        row.church_departments?.department_name ??
        row.department_name ??
        "Unknown department",
      departmentCode: row.church_departments?.code ?? null,
      roleTitle: row.role_title,
      isActive: row.is_active,
      startDate: row.start_date,
    };
  });

  const activeRoleCount = roles.filter((item) => item.isActive).length;
  const inactiveRoleCount = roles.length - activeRoleCount;
  const activeDepartmentCount = departments.filter((item) => item.isActive).length;
  const inactiveDepartmentCount = departments.length - activeDepartmentCount;

  const { memberRow: _memberRow, ...cleanIdentity } = identity;

  return {
    identity: cleanIdentity,
    activeRoleCount,
    inactiveRoleCount,
    activeDepartmentCount,
    inactiveDepartmentCount,
    roles,
    departments,
  };
}

export async function getMemberPortalGiving(
  churchSlug: string
): Promise<MemberPortalGivingData | null> {
  const identity = await getCurrentLinkedMemberInternal(churchSlug);
  if (!identity) return null;

  const supabase = await createClient();
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const [recentResult, allTimeRows] = await Promise.all([
    supabase
      .from("treasury_inflows")
      .select("id, inflow_type, amount, inflow_date, note, reference_number")
      .eq("church_id", identity.churchId)
      .eq("member_id", identity.member.id)
      .order("inflow_date", { ascending: false })
      .limit(20),
    getAllMemberGivingRows(supabase, identity.churchId, identity.member.id),
  ]);

  if (recentResult.error) throw new Error(recentResult.error.message);

  const inflows = ((recentResult.data ?? []) as TreasuryInflowRow[]).map((row) => ({
    id: row.id,
    inflowType: row.inflow_type,
    amount: Number(row.amount ?? 0),
    inflowDate: row.inflow_date,
    note: row.note,
    referenceNumber: row.reference_number,
  }));

  const sumAmounts = (rows: GivingSummaryRow[]) =>
    rows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  const totalGiving = sumAmounts(allTimeRows);
  const yearToDateRows = allTimeRows.filter((item) => item.inflow_date >= yearStart);
  const currentMonthRows = allTimeRows.filter((item) => item.inflow_date >= monthStart);
  const yearToDateTotal = sumAmounts(yearToDateRows);
  const currentMonthTotal = sumAmounts(currentMonthRows);

  const totalTithe = sumAmounts(allTimeRows.filter((item) => item.inflow_type === "tithe"));
  const totalOffering = sumAmounts(allTimeRows.filter((item) => item.inflow_type === "offering"));
  const totalDonation = sumAmounts(allTimeRows.filter((item) => item.inflow_type === "donation"));

  return {
    totalGiving,
    yearToDateTotal,
    currentMonthTotal,
    currentMonthCount: currentMonthRows.length,
    totalTithe,
    totalOffering,
    totalDonation,
    recent: inflows,
  };
}

export async function getMemberPortalTabData(
  churchSlug: string,
  tab: MemberPortalTabKey
): Promise<MemberPortalTabData> {
  if (tab === "overview") {
    const data = await getMemberPortalOverview(churchSlug);
    if (!data) {
      return { tab: "overview", data: null as never };
    }
    return { tab: "overview", data };
  }
  if (tab === "ministries") {
    const data = await getMemberMinistryPortalData(churchSlug);
    return { tab: "ministries", data };
  }


  if (tab === "profile") {
    const data = await getMemberPortalProfile(churchSlug);
    if (!data) {
      return { tab: "profile", data: null as never };
    }
    return { tab: "profile", data };
  }

  if (tab === "departments") {
    const data = await getMemberPortalDepartments(churchSlug);
    if (!data) {
      return { tab: "departments", data: null as never };
    }
    return { tab: "departments", data };
  }

  if (tab === "calendar") {
    const ctx = await requireMemberPortalAccess(churchSlug);
    const events = await getPublishedEvents(ctx.churchId, undefined, { upcomingOnly: true });
    return { tab: "calendar", data: events };
  }

  if (tab === "events") {
    const ctx = await requireMemberPortalAccess(churchSlug);
    const events = await getPublishedEvents(ctx.churchId, undefined, { upcomingOnly: true });
    return { tab: "events", data: events };
  }

  if (tab === "giving") {
    const data = await getMemberPortalGiving(churchSlug);
    if (!data) {
      return {
        tab: "giving",
        data: {
          totalGiving: 0,
          yearToDateTotal: 0,
          currentMonthTotal: 0,
          currentMonthCount: 0,
          totalTithe: 0,
          totalOffering: 0,
          totalDonation: 0,
          recent: [],
        },
      };
    }
    return { tab: "giving", data };
  }

  const exhaustiveTab: never = tab;
  throw new Error(`Unsupported member portal tab: ${exhaustiveTab}`);
}







