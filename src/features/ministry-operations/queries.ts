import "server-only";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireChurchAccess, requireMemberPortalAccess } from "@/features/access/queries";
import { templateForScopeName } from "./constants";
import type {
  AttendanceSupportData,
  AttendanceSupportMember,
  MemberDutyDetailData,
  MemberMinistryPortalData,
  MinistryDutyAssignment,
  MinistryDutyType,
  MinistryOperationsData,
  MinistryPerson,
  MinistryReport,
  MinistryScopeType,
  MinistryTask,
} from "./types";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function displayName(row: any) {
  return row?.display_name || [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim() || row?.member_code || "Member";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "M";
}

function normalizeJoined<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function roleCanManage(roleTitle: string | null | undefined) {
  const value = String(roleTitle ?? "").toLowerCase();
  return ["leader", "head", "assistant", "coordinator", "deacon", "usher", "secretary", "clerk"].some((word) => value.includes(word));
}

function mapDuty(row: any): MinistryDutyAssignment {
  const member = normalizeJoined<any>(row.member);
  const dutyType = normalizeJoined<any>(row.duty_type);
  const memberName = displayName(member);

  return {
    id: row.id,
    dutyTypeId: row.duty_type_id ?? null,
    dutyName: dutyType?.name ?? "Ministry duty",
    dutySystemKey: dutyType?.system_key ?? null,
    requiresAttendanceSupport: Boolean(dutyType?.requires_attendance_support),
    memberId: row.member_id,
    memberName,
    memberInitials: initials(memberName),
    serviceDate: row.service_date,
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    status: row.status ?? "scheduled",
    leaderNote: row.leader_note ?? null,
    memberNote: row.member_note ?? null,
    replacementReason: row.replacement_reason ?? null,
    confirmedAt: row.confirmed_at ?? null,
    servedAt: row.served_at ?? null,
    requestedReplacementAt: row.requested_replacement_at ?? null,
  };
}

function mapDutyType(row: any): MinistryDutyType {
  return {
    id: row.id,
    name: row.name,
    systemKey: row.system_key ?? null,
    iconKey: row.icon_key ?? null,
    description: row.description ?? null,
    requiresAttendanceSupport: Boolean(row.requires_attendance_support),
    isActive: row.is_active !== false,
  };
}

async function getLinkedMember(admin: any, churchId: string, userId: string) {
  const { data, error } = await admin
    .from("members")
    .select("id, first_name, last_name, display_name, member_code, email, phone, profile_id")
    .eq("church_id", churchId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

async function ensureDutyTemplates(params: {
  admin: any;
  churchId: string;
  userId: string;
  scopeType: MinistryScopeType;
  scopeId: string;
  scopeName: string;
}) {
  const { admin, churchId, userId, scopeType, scopeId, scopeName } = params;
  const { data: existing, error } = await admin
    .from("ministry_duty_types")
    .select("id")
    .eq("church_id", churchId)
    .eq("scope_type", scopeType)
    .eq("scope_id", scopeId)
    .limit(1);

  if (error) throw new Error(error.message);
  if ((existing ?? []).length > 0) return;

  const template = templateForScopeName(scopeName);
  const { error: insertError } = await admin.from("ministry_duty_types").insert(
    template.map((item) => ({
      church_id: churchId,
      scope_type: scopeType,
      scope_id: scopeId,
      name: item.name,
      system_key: item.systemKey,
      icon_key: item.iconKey,
      description: item.description,
      requires_attendance_support: item.requiresAttendanceSupport,
      sort_order: item.sortOrder,
      created_by_user_id: userId,
    }))
  );

  if (insertError) throw new Error(insertError.message);
}

async function getDepartmentAccess(churchSlug: string, departmentId: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const admin = createAdminClient();

  const { data: department, error: departmentError } = await admin
    .from("church_departments")
    .select("id, church_id, department_name, code, description, is_active")
    .eq("church_id", ctx.churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (departmentError) throw new Error(departmentError.message);
  if (!department) redirect(`/c/${churchSlug}/departments`);

  const linkedMember = await getLinkedMember(admin, ctx.churchId, ctx.userId);
  let assignment: any = null;

  if (linkedMember?.id) {
    const { data, error } = await admin
      .from("member_departments")
      .select("id, role_title, is_active")
      .eq("church_id", ctx.churchId)
      .eq("department_id", departmentId)
      .eq("member_id", linkedMember.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    assignment = data ?? null;
  }

  const canManage = Boolean(ctx.isPlatformAdmin || ctx.hasOperationalAccess || (assignment?.is_active && roleCanManage(assignment.role_title)));
  const canView = Boolean(canManage || assignment?.is_active);

  if (!canView) redirect(`/my/${churchSlug}?tab=ministries`);

  return { ctx, admin, department, linkedMember, canManage };
}

export async function getDepartmentOperationsData(churchSlug: string, departmentId: string): Promise<MinistryOperationsData> {
  const { ctx, admin, department, linkedMember, canManage } = await getDepartmentAccess(churchSlug, departmentId);

  await ensureDutyTemplates({
    admin,
    churchId: ctx.churchId,
    userId: ctx.userId,
    scopeType: "department",
    scopeId: departmentId,
    scopeName: department.department_name,
  });

  const today = todayIsoDate();
  const nextMonth = addDaysIso(45);

  const [membersResult, dutyTypesResult, dutiesResult, tasksResult, reportsResult] = await Promise.all([
    admin
      .from("member_departments")
      .select("id, member_id, role_title, is_active, member:members(id, first_name, last_name, display_name, member_code, email, phone)")
      .eq("church_id", ctx.churchId)
      .eq("department_id", departmentId)
      .eq("is_active", true)
      .order("role_title", { ascending: true }),
    admin
      .from("ministry_duty_types")
      .select("id, name, system_key, icon_key, description, requires_attendance_support, is_active, sort_order")
      .eq("church_id", ctx.churchId)
      .eq("scope_type", "department")
      .eq("scope_id", departmentId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    admin
      .from("ministry_duty_assignments")
      .select("id, duty_type_id, member_id, service_date, starts_at, ends_at, status, leader_note, member_note, replacement_reason, confirmed_at, served_at, requested_replacement_at, member:members(id, first_name, last_name, display_name, member_code), duty_type:ministry_duty_types(id, name, system_key, icon_key, requires_attendance_support)")
      .eq("church_id", ctx.churchId)
      .eq("scope_type", "department")
      .eq("scope_id", departmentId)
      .gte("service_date", today)
      .lte("service_date", nextMonth)
      .order("service_date", { ascending: true })
      .order("starts_at", { ascending: true, nullsFirst: false }),
    admin
      .from("ministry_tasks")
      .select("id, title, description, assigned_to_member_id, due_date, priority, status, assignee:members(id, first_name, last_name, display_name, member_code)")
      .eq("church_id", ctx.churchId)
      .eq("scope_type", "department")
      .eq("scope_id", departmentId)
      .neq("status", "cancelled")
      .order("due_date", { ascending: true, nullsFirst: false }),
    admin
      .from("ministry_reports")
      .select("id, title, report_type, period_start, period_end, summary, status, submitted_at")
      .eq("church_id", ctx.churchId)
      .eq("scope_type", "department")
      .eq("scope_id", departmentId)
      .order("period_end", { ascending: false, nullsFirst: false })
      .limit(12),
  ]);

  for (const result of [membersResult, dutyTypesResult, dutiesResult, tasksResult, reportsResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const members: MinistryPerson[] = ((membersResult.data ?? []) as any[]).map((row) => {
    const member = normalizeJoined<any>(row.member);
    const name = displayName(member);
    return {
      id: row.member_id,
      name,
      initials: initials(name),
      memberCode: member?.member_code ?? null,
      email: member?.email ?? null,
      phone: member?.phone ?? null,
      roleTitle: row.role_title ?? null,
    };
  });

  const duties = ((dutiesResult.data ?? []) as any[]).map(mapDuty);
  const tasks: MinistryTask[] = ((tasksResult.data ?? []) as any[]).map((row) => {
    const assignee = normalizeJoined<any>(row.assignee);
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      assignedToMemberId: row.assigned_to_member_id ?? null,
      assignedToName: assignee ? displayName(assignee) : null,
      dueDate: row.due_date ?? null,
      priority: row.priority ?? "normal",
      status: row.status ?? "open",
    };
  });

  const reports: MinistryReport[] = ((reportsResult.data ?? []) as any[]).map((row) => ({
    id: row.id,
    title: row.title,
    reportType: row.report_type ?? "monthly",
    periodStart: row.period_start ?? null,
    periodEnd: row.period_end ?? null,
    summary: row.summary ?? null,
    status: row.status ?? "draft",
    submittedAt: row.submitted_at ?? null,
  }));

  return {
    church: { id: ctx.churchId, slug: ctx.churchSlug, name: ctx.churchName ?? null },
    scope: { type: "department", id: department.id, name: department.department_name, subtitle: "Department Operations", code: department.code ?? null },
    access: { canManage, viewerMemberId: linkedMember?.id ?? null },
    stats: {
      members: members.length,
      upcomingDuties: duties.length,
      openTasks: tasks.filter((task) => ["open", "in_progress"].includes(task.status)).length,
      reportsDue: reports.filter((report) => report.status !== "submitted" && report.status !== "reviewed").length,
    },
    members,
    dutyTypes: ((dutyTypesResult.data ?? []) as any[]).map(mapDutyType),
    duties,
    tasks,
    reports,
  };
}

export async function getMemberMinistryPortalData(churchSlug: string): Promise<MemberMinistryPortalData> {
  const ctx = await requireMemberPortalAccess(churchSlug);
  const admin = createAdminClient();
  const linkedMember = await getLinkedMember(admin, ctx.churchId, ctx.userId);

  if (!linkedMember?.id) redirect(`/my/${churchSlug}?tab=overview`);

  const today = todayIsoDate();
  const nextMonth = addDaysIso(45);

  const [departmentsResult, dutiesResult] = await Promise.all([
    admin
      .from("member_departments")
      .select("id, department_id, department_name, role_title, is_active, church_departments(id, department_name, code)")
      .eq("church_id", ctx.churchId)
      .eq("member_id", linkedMember.id)
      .eq("is_active", true),
    admin
      .from("ministry_duty_assignments")
      .select("id, scope_type, scope_id, duty_type_id, member_id, service_date, starts_at, ends_at, status, leader_note, member_note, replacement_reason, confirmed_at, served_at, requested_replacement_at, member:members(id, first_name, last_name, display_name, member_code), duty_type:ministry_duty_types(id, name, system_key, icon_key, requires_attendance_support)")
      .eq("church_id", ctx.churchId)
      .eq("member_id", linkedMember.id)
      .gte("service_date", today)
      .lte("service_date", nextMonth)
      .order("service_date", { ascending: true })
      .order("starts_at", { ascending: true, nullsFirst: false }),
  ]);

  if (departmentsResult.error) throw new Error(departmentsResult.error.message);
  if (dutiesResult.error) throw new Error(dutiesResult.error.message);

  const duties = ((dutiesResult.data ?? []) as any[]).map(mapDuty);
  const dutiesByScope = new Map<string, MinistryDutyAssignment[]>();
  for (const raw of (dutiesResult.data ?? []) as any[]) {
    const key = `${raw.scope_type}:${raw.scope_id}`;
    const existing = dutiesByScope.get(key) ?? [];
    existing.push(mapDuty(raw));
    dutiesByScope.set(key, existing);
  }

  const ministries = ((departmentsResult.data ?? []) as any[]).map((row) => {
    const department = normalizeJoined<any>(row.church_departments);
    const name = department?.department_name ?? row.department_name ?? "Department";
    const key = `department:${row.department_id}`;
    const scopeDuties = dutiesByScope.get(key) ?? [];
    return {
      id: row.id,
      scopeType: "department" as const,
      scopeId: row.department_id,
      name,
      roleTitle: row.role_title ?? null,
      href: `/c/${churchSlug}/departments/${row.department_id}/operations`,
      upcomingDutyCount: scopeDuties.length,
      nextDutyLabel: scopeDuties[0] ? `${scopeDuties[0].dutyName} • ${scopeDuties[0].serviceDate}` : null,
    };
  });

  const memberName = displayName(linkedMember);

  return {
    church: { slug: churchSlug, name: ctx.churchName ?? null },
    member: { id: linkedMember.id, name: memberName },
    ministries,
    duties,
  };
}

export async function getMemberDutyDetail(churchSlug: string, assignmentId: string): Promise<MemberDutyDetailData> {
  const ctx = await requireMemberPortalAccess(churchSlug);
  const admin = createAdminClient();
  const linkedMember = await getLinkedMember(admin, ctx.churchId, ctx.userId);
  if (!linkedMember?.id) redirect(`/my/${churchSlug}?tab=overview`);

  const { data, error } = await admin
    .from("ministry_duty_assignments")
    .select("id, church_id, scope_type, scope_id, duty_type_id, member_id, service_date, starts_at, ends_at, status, leader_note, member_note, replacement_reason, confirmed_at, served_at, requested_replacement_at, member:members(id, first_name, last_name, display_name, member_code), duty_type:ministry_duty_types(id, name, system_key, icon_key, requires_attendance_support)")
    .eq("church_id", ctx.churchId)
    .eq("id", assignmentId)
    .eq("member_id", linkedMember.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) redirect(`/my/${churchSlug}?tab=ministries`);

  let scopeName = "Ministry";
  if (data.scope_type === "department") {
    const { data: dept } = await admin
      .from("church_departments")
      .select("department_name")
      .eq("church_id", ctx.churchId)
      .eq("id", data.scope_id)
      .maybeSingle();
    scopeName = dept?.department_name ?? scopeName;
  }

  const duty = mapDuty(data);

  return {
    churchSlug,
    churchName: ctx.churchName ?? null,
    memberId: linkedMember.id,
    duty,
    scope: { type: data.scope_type, id: data.scope_id, name: scopeName },
    canOpenAttendanceSupport: duty.requiresAttendanceSupport,
  };
}

export async function getAttendanceSupportData(churchSlug: string, assignmentId: string): Promise<AttendanceSupportData> {
  const detail = await getMemberDutyDetail(churchSlug, assignmentId);
  if (!detail.canOpenAttendanceSupport) redirect(`/my/${churchSlug}/duties/${assignmentId}`);

  const ctx = await requireMemberPortalAccess(churchSlug);
  const admin = createAdminClient();
  const today = todayIsoDate();

  const { data: occurrence, error: occurrenceError } = await admin
    .from("attendance_occurrences")
    .select("id, title, occurrence_date")
    .eq("church_id", ctx.churchId)
    .eq("occurrence_date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (occurrenceError) throw new Error(occurrenceError.message);

  if (!occurrence) {
    return {
      churchSlug,
      churchName: ctx.churchName ?? null,
      assignmentId,
      occurrence: null,
      duty: detail.duty,
      stats: { present: 0, notMarkedYet: 0, visitors: 0, review: 0 },
      notMarkedMembers: [],
    };
  }

  const [membersResult, recordsResult, visitorCountResult, reviewCountResult, departmentsResult] = await Promise.all([
    admin
      .from("members")
      .select("id, first_name, last_name, display_name, member_code, household_id, membership_status")
      .eq("church_id", ctx.churchId)
      .eq("membership_status", "active")
      .order("last_name", { ascending: true })
      .limit(300),
    admin
      .from("attendance_records")
      .select("member_id, visitor_contact_id, status")
      .eq("church_id", ctx.churchId)
      .eq("occurrence_id", occurrence.id)
      .neq("status", "removed"),
    admin
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("church_id", ctx.churchId)
      .eq("occurrence_id", occurrence.id)
      .not("visitor_contact_id", "is", null)
      .neq("status", "removed"),
    admin
      .from("attendance_review_items")
      .select("id", { count: "exact", head: true })
      .eq("church_id", ctx.churchId)
      .eq("occurrence_id", occurrence.id)
      .eq("status", "open"),
    admin
      .from("member_departments")
      .select("member_id, department_name, is_active")
      .eq("church_id", ctx.churchId)
      .eq("is_active", true),
  ]);

  for (const result of [membersResult, recordsResult, visitorCountResult, reviewCountResult, departmentsResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const presentMemberIds = new Set(
    ((recordsResult.data ?? []) as any[])
      .map((row) => row.member_id)
      .filter(Boolean)
  );

  const departmentsByMember = new Map<string, string>();
  for (const row of (departmentsResult.data ?? []) as any[]) {
    if (row.member_id && row.department_name && !departmentsByMember.has(row.member_id)) {
      departmentsByMember.set(row.member_id, row.department_name);
    }
  }

  const notMarkedMembers: AttendanceSupportMember[] = ((membersResult.data ?? []) as any[])
    .filter((member) => !presentMemberIds.has(member.id))
    .slice(0, 80)
    .map((member) => {
      const name = displayName(member);
      return {
        id: member.id,
        name,
        initials: initials(name),
        memberCode: member.member_code ?? null,
        householdName: null,
        departmentLabel: departmentsByMember.get(member.id) ?? null,
      };
    });

  return {
    churchSlug,
    churchName: ctx.churchName ?? null,
    assignmentId,
    occurrence: { id: occurrence.id, title: occurrence.title, occurrenceDate: occurrence.occurrence_date },
    duty: detail.duty,
    stats: {
      present: presentMemberIds.size,
      notMarkedYet: notMarkedMembers.length,
      visitors: visitorCountResult.count ?? 0,
      review: reviewCountResult.count ?? 0,
    },
    notMarkedMembers,
  };
}