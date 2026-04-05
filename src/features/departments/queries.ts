import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import type {
  DepartmentAssignmentRecord,
  DepartmentListItem,
  DepartmentRecord,
} from "./types";

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

const MANAGE_ROLES = ["church_admin", "clerk"] as const;
const VIEW_ROLES = ["church_admin", "clerk", "pastor", "treasurer"] as const;

export async function getDepartments(
  churchSlug: string,
  rawFilters?: Record<string, string | string[] | undefined>
): Promise<DepartmentListItem[]> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const q = pickSingle(rawFilters?.q);
  const status = pickSingle(rawFilters?.status);

  let query = supabase
    .from("church_departments")
    .select("id, church_id, department_name, code, description, is_active, created_at, updated_at")
    .eq("church_id", ctx.churchId)
    .order("department_name", { ascending: true });

  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  if (q) {
    const safe = q.replace(/,/g, " ");
    query = query.or(
      [
        `department_name.ilike.%${safe}%`,
        `code.ilike.%${safe}%`,
        `description.ilike.%${safe}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const departments = (data ?? []) as DepartmentRecord[];
  if (departments.length === 0) return [];

  const departmentIds = departments.map((item) => item.id);

  const { data: assignments, error: assignmentsError } = await supabase
    .from("member_departments")
    .select("department_id, is_active")
    .eq("church_id", ctx.churchId)
    .in("department_id", departmentIds);

  if (assignmentsError) throw new Error(assignmentsError.message);

  const counts = new Map<string, { member_count: number; active_member_count: number }>();

  for (const row of assignments ?? []) {
    const departmentId = row.department_id as string | null;
    if (!departmentId) continue;

    const current = counts.get(departmentId) ?? { member_count: 0, active_member_count: 0 };
    current.member_count += 1;
    if (row.is_active) current.active_member_count += 1;
    counts.set(departmentId, current);
  }

  return departments.map((item) => {
    const stats = counts.get(item.id) ?? { member_count: 0, active_member_count: 0 };
    return {
      ...item,
      member_count: stats.member_count,
      active_member_count: stats.active_member_count,
    };
  });
}

export async function getDepartmentById(churchSlug: string, departmentId: string): Promise<DepartmentRecord | null> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, church_id, department_name, code, description, is_active, created_at, updated_at")
    .eq("church_id", ctx.churchId)
    .eq("id", departmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as DepartmentRecord | null) ?? null;
}

export async function getDepartmentMembers(
  churchSlug: string,
  departmentId: string,
  rawFilters?: Record<string, string | string[] | undefined>
): Promise<DepartmentAssignmentRecord[]> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const status = pickSingle(rawFilters?.status);
  const q = pickSingle(rawFilters?.q);

  let query = supabase
    .from("member_departments")
    .select(`
      id,
      church_id,
      member_id,
      department_id,
      department_name,
      role_title,
      start_date,
      is_active,
      created_at,
      updated_at,
      member:members!member_departments_member_fkey (
        id,
        first_name,
        last_name,
        display_name,
        member_code,
        email,
        phone,
        membership_status
      )
    `)
    .eq("church_id", ctx.churchId)
    .eq("department_id", departmentId)
    .order("start_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = ((data ?? []) as any[]).map((item) => ({
    ...item,
    member: Array.isArray(item.member) ? item.member[0] ?? null : item.member,
  })) as DepartmentAssignmentRecord[];

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((item) => {
      const displayName =
        item.member?.display_name ||
        [item.member?.first_name, item.member?.last_name].filter(Boolean).join(" ");
      return [
        displayName,
        item.member?.member_code,
        item.member?.email,
        item.role_title,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }

  return rows;
}

export async function getDepartmentOptions(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [{ data: departments, error: departmentsError }, { data: members, error: membersError }] =
    await Promise.all([
      supabase
        .from("church_departments")
        .select("id, department_name, code, is_active")
        .eq("church_id", ctx.churchId)
        .order("department_name", { ascending: true }),
      supabase
        .from("members")
        .select("id, first_name, last_name, display_name, member_code, membership_status")
        .eq("church_id", ctx.churchId)
        .order("first_name", { ascending: true }),
    ]);

  if (departmentsError) throw new Error(departmentsError.message);
  if (membersError) throw new Error(membersError.message);

  return {
    departments: (departments ?? []).map((item: any) => ({
      id: item.id,
      name: item.department_name,
      code: item.code,
      is_active: item.is_active,
    })),
    members: (members ?? []).map((item: any) => ({
      id: item.id,
      label:
        item.display_name ||
        `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() ||
        item.member_code ||
        item.id,
      member_code: item.member_code,
      membership_status: item.membership_status,
    })),
  };
}

export async function getDepartmentSummary(churchSlug: string, departmentId: string) {
  const department = await getDepartmentById(churchSlug, departmentId);
  if (!department) return null;

  const members = await getDepartmentMembers(churchSlug, departmentId);
  return {
    department,
    memberCount: members.length,
    activeMemberCount: members.filter((item) => item.is_active).length,
    leadersCount: members.filter((item) =>
      (item.role_title ?? "").toLowerCase().includes("leader")
    ).length,
    members,
  };
}

export async function requireDepartmentManager(churchSlug: string) {
  return requireChurchRole(churchSlug, [...MANAGE_ROLES]);
}

export async function requireDepartmentViewer(churchSlug: string) {
  return requireChurchRole(churchSlug, [...VIEW_ROLES]);
}

export async function getChurchDepartments(
  churchSlug: string,
  rawFilters?: Record<string, string | string[] | undefined>
) {
  return getDepartments(churchSlug, rawFilters);
}

export async function getMemberDepartmentAssignments(
  churchSlug: string,
  memberId: string
): Promise<DepartmentAssignmentRecord[]> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_departments")
    .select(`
      id,
      church_id,
      member_id,
      department_id,
      department_name,
      role_title,
      start_date,
      is_active,
      created_at,
      updated_at
    `)
    .eq("church_id", ctx.churchId)
    .eq("member_id", memberId)
    .order("is_active", { ascending: false })
    .order("start_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DepartmentAssignmentRecord[];
}

export async function getMemberDepartmentOptions(
  churchSlug: string,
  memberId: string
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const validMember = await supabase
    .from("members")
    .select("id")
    .eq("church_id", ctx.churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (validMember.error) throw new Error(validMember.error.message);
  if (!validMember.data) throw new Error("Member not found in this church.");

  const { data: departments, error } = await supabase
    .from("church_departments")
    .select("id, department_name, code, is_active")
    .eq("church_id", ctx.churchId)
    .order("department_name", { ascending: true });

  if (error) throw new Error(error.message);

  return {
    departments: (departments ?? []).map((item: any) => ({
      id: item.id,
      name: item.department_name,
      code: item.code,
      is_active: item.is_active,
    })),
  };
}

export async function getDepartmentFilterOptions(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, code, is_active")
    .eq("church_id", ctx.churchId)
    .order("department_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((item: any) => ({
    id: item.id,
    name: item.department_name,
    code: item.code,
    is_active: item.is_active,
  }));
}

export async function getDepartmentsWorkspaceData(
  churchSlug: string,
  filters: {
    q?: string;
    status?: string;
  } = {}
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  let departmentsQuery = supabase
    .from("church_departments")
    .select("id, department_name, description, code, is_active")
    .eq("church_id", ctx.churchId)
    .order("department_name", { ascending: true });

  if (filters.status === "active") {
    departmentsQuery = departmentsQuery.eq("is_active", true);
  } else if (filters.status === "inactive") {
    departmentsQuery = departmentsQuery.eq("is_active", false);
  }

  const [
    { data: departments, error: departmentsError },
    { data: assignments, error: assignmentsError },
    { data: events, error: eventsError },
    { data: members, error: membersError },
  ] = await Promise.all([
    departmentsQuery,
    supabase
      .from("member_departments")
      .select("member_id, department_id, department_name, role_title, is_active, start_date")
      .eq("church_id", ctx.churchId),
    supabase
      .from("church_events")
      .select("id, department_id")
      .eq("church_id", ctx.churchId),
    supabase
      .from("members")
      .select("id, first_name, last_name, display_name")
      .eq("church_id", ctx.churchId),
  ]);

  if (departmentsError) throw new Error(departmentsError.message);
  if (assignmentsError) throw new Error(assignmentsError.message);
  if (eventsError) throw new Error(eventsError.message);
  if (membersError) throw new Error(membersError.message);

  let departmentRows = departments ?? [];
  const assignmentRows = assignments ?? [];
  const eventRows = events ?? [];
  const memberRows = members ?? [];

  if (filters.q && filters.q.trim()) {
    const needle = filters.q.trim().toLowerCase();
    departmentRows = departmentRows.filter((department: any) => {
      const haystack = [
        department.department_name,
        department.description,
        department.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }

  const visibleDepartmentIds = new Set<string>(departmentRows.map((department: any) => department.id));
  const memberNameById = new Map<string, string>();

  for (const member of memberRows) {
    const name =
      member.display_name ||
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      "Member";
    memberNameById.set(member.id, name);
  }

  const memberCountByDepartmentId = new Map<string, number>();
  const activeMemberCountByDepartmentId = new Map<string, number>();
  const inactiveMemberCountByDepartmentId = new Map<string, number>();
  const eventCountByDepartmentId = new Map<string, number>();

  for (const row of assignmentRows) {
    if (!row.department_id || !visibleDepartmentIds.has(row.department_id)) continue;

    memberCountByDepartmentId.set(
      row.department_id,
      (memberCountByDepartmentId.get(row.department_id) ?? 0) + 1
    );

    if (row.is_active === false) {
      inactiveMemberCountByDepartmentId.set(
        row.department_id,
        (inactiveMemberCountByDepartmentId.get(row.department_id) ?? 0) + 1
      );
    } else {
      activeMemberCountByDepartmentId.set(
        row.department_id,
        (activeMemberCountByDepartmentId.get(row.department_id) ?? 0) + 1
      );
    }
  }

  for (const row of eventRows) {
    if (!row.department_id || !visibleDepartmentIds.has(row.department_id)) continue;

    eventCountByDepartmentId.set(
      row.department_id,
      (eventCountByDepartmentId.get(row.department_id) ?? 0) + 1
    );
  }

  const enrichedDepartments = departmentRows.map((department: any) => ({
    ...department,
    member_count: memberCountByDepartmentId.get(department.id) ?? 0,
    active_member_count: activeMemberCountByDepartmentId.get(department.id) ?? 0,
    inactive_member_count: inactiveMemberCountByDepartmentId.get(department.id) ?? 0,
    event_count: eventCountByDepartmentId.get(department.id) ?? 0,
  }));

  const filteredAssignments = assignmentRows
    .filter((row) => row.department_id && visibleDepartmentIds.has(row.department_id))
    .map((row) => ({
      member_id: row.member_id,
      member_name: memberNameById.get(row.member_id) ?? "Member",
      department_name: row.department_name,
      role_title: row.role_title ?? null,
      is_active: row.is_active !== false,
      start_date: row.start_date ?? null,
    }))
    .sort((a, b) => a.department_name.localeCompare(b.department_name) || a.member_name.localeCompare(b.member_name));

  const stats = {
    totalDepartments: enrichedDepartments.length,
    activeDepartments: enrichedDepartments.filter((department: any) => department.is_active).length,
    inactiveDepartments: enrichedDepartments.filter((department: any) => !department.is_active).length,
    assignedMembers: enrichedDepartments.reduce((sum: number, department: any) => sum + (department.active_member_count ?? 0), 0),
    unassignedDepartments: enrichedDepartments.filter((department: any) => (department.member_count ?? 0) === 0).length,
    eventLinkedDepartments: enrichedDepartments.filter((department: any) => (department.event_count ?? 0) > 0).length,
  };

  return {
    church: {
      id: ctx.churchId,
      slug: ctx.churchSlug,
      name: ctx.churchName ?? ctx.churchSlug,
    },
    filters,
    stats,
    departments: enrichedDepartments,
    assignments: filteredAssignments.slice(0, 50),
  };
}





