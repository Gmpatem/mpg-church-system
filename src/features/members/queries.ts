import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import { parseMemberDirectoryFilters } from "./validators";
import type { MemberDirectoryFilters, MemberProfile, MemberMembershipEvent } from "./types";

function buildMembershipEvents(member: any, statusHistory: any[]): MemberMembershipEvent[] {
  const events: MemberMembershipEvent[] = [];

  if (member.created_at) {
    events.push({
      id: "created-" + member.id,
      type: "created",
      title: "Member record created",
      description: null,
      occurred_at: member.created_at,
    });
  }

  if (member.date_joined) {
    events.push({
      id: "joined-" + member.id,
      type: "joined",
      title: "Joined church",
      description: null,
      occurred_at: member.date_joined,
    });
  }

  if (member.baptism_date) {
    events.push({
      id: "baptism-" + member.id,
      type: "baptism",
      title: "Baptism date recorded",
      description: null,
      occurred_at: member.baptism_date,
    });
  }

  if (member.transfer_in_date) {
    events.push({
      id: "transfer-in-" + member.id,
      type: "transfer_in",
      title: "Transfer in processed",
      description: member.previous_church ? "Previous church: " + member.previous_church : null,
      occurred_at: member.transfer_in_date,
    });
  }

  if (member.transfer_out_date) {
    events.push({
      id: "transfer-out-" + member.id,
      type: "transfer_out",
      title: "Transfer out processed",
      description: member.previous_church ? "Related church: " + member.previous_church : null,
      occurred_at: member.transfer_out_date,
    });
  }

  for (const entry of statusHistory) {
    events.push({
      id: "status-" + entry.id,
      type: "status_change",
      title: "Status changed",
      description: `${entry.old_status ?? "—"} → ${entry.new_status}${entry.reason ? " | Reason: " + entry.reason : ""}`,
      occurred_at: entry.created_at,
    });
  }

  return events.sort((a, b) => {
    const aTime = new Date(a.occurred_at).getTime();
    const bTime = new Date(b.occurred_at).getTime();
    return bTime - aTime;
  });
}

function buildProfileHealth(member: any, departments: any[]) {
  const missing: string[] = [];

  if (!member.email) missing.push("Missing email");
  if (!member.phone) missing.push("Missing phone");
  if (!member.member_code) missing.push("Missing member code");
  if (!member.date_joined) missing.push("Missing join date");
  if (!member.household_id) missing.push("No household linked");
  if (!member.emergency_contact_name || !member.emergency_contact_phone) missing.push("Incomplete emergency contact");
  if (!departments.length) missing.push("No department assignment");

  return missing;
}

export async function getChurchMembers(
  churchSlug: string,
  rawFilters?: Partial<MemberDirectoryFilters>
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();
  const filters = parseMemberDirectoryFilters(rawFilters ?? {});

  let memberIdsByDepartment: string[] | null = null;

  if (filters.department) {
    const { data: assignments, error: departmentError } = await supabase
      .from("member_departments")
      .select("member_id")
      .eq("department_name", filters.department);

    if (departmentError) throw new Error(departmentError.message);

    memberIdsByDepartment = (assignments ?? []).map((row: any) => row.member_id);
    if (memberIdsByDepartment.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("members")
    .select("id, church_id, first_name, last_name, display_name, email, phone, member_code, membership_status, membership_type, household_id, gender, date_joined, created_at")
    .eq("church_id", ctx.churchId);

  if (filters.q) {
    const safe = filters.q.replace(/,/g, " ");
    query = query.or(
      [
        "first_name.ilike.%" + safe + "%",
        "last_name.ilike.%" + safe + "%",
        "display_name.ilike.%" + safe + "%",
        "email.ilike.%" + safe + "%",
        "phone.ilike.%" + safe + "%",
        "member_code.ilike.%" + safe + "%",
      ].join(",")
    );
  }

  if (filters.status) {
    query = query.eq("membership_status", filters.status);
  }

  if (filters.householdId) {
    query = query.eq("household_id", filters.householdId);
  }

  if (filters.membershipType) {
    query = query.eq("membership_type", filters.membershipType);
  }

  if (memberIdsByDepartment) {
    query = query.in("id", memberIdsByDepartment);
  }

  if (filters.sort === "joined_desc") {
    query = query.order("date_joined", { ascending: false, nullsFirst: false });
  } else if (filters.sort === "status_asc") {
    query = query.order("membership_status", { ascending: true }).order("last_name", { ascending: true });
  } else {
    query = query.order("last_name", { ascending: true }).order("first_name", { ascending: true });
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getMemberById(churchSlug: string, memberId: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("church_id", ctx.churchId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function getMemberProfile(churchSlug: string, memberId: string): Promise<MemberProfile | null> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const member = await getMemberById(churchSlug, memberId);
  if (!member) return null;

  let household = null;

  if (member.household_id) {
    const { data: householdData, error: householdError } = await supabase
      .from("households")
      .select("id, household_name, city, country, phone, email")
      .eq("church_id", ctx.churchId)
      .eq("id", member.household_id)
      .maybeSingle();

    if (householdError) throw new Error(householdError.message);
    household = householdData;
  }

  const { data: departments, error: departmentError } = await supabase
    .from("member_departments")
    .select("id, department_name, role_in_department, joined_date")
    .eq("member_id", member.id)
    .order("department_name", { ascending: true });

  if (departmentError) throw new Error(departmentError.message);

  const { data: statusHistory, error: statusError } = await supabase
    .from("member_status_history")
    .select("id, old_status, new_status, reason, created_at")
    .eq("church_id", ctx.churchId)
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });

  if (statusError) throw new Error(statusError.message);

  return {
    member,
    household,
    departments: departments ?? [],
    statusHistory: statusHistory ?? [],
    membershipEvents: buildMembershipEvents(member, statusHistory ?? []),
    profileHealth: buildProfileHealth(member, departments ?? []),
  } as any;
}

export async function getChurchDepartments(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_departments")
    .select("id, department_name, description")
    .eq("church_id", ctx.churchId)
    .eq("is_active", true)
    .order("department_name", { ascending: true });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getChurchHouseholds(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("households")
    .select("id, household_name")
    .eq("church_id", ctx.churchId)
    .order("household_name", { ascending: true });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getMemberReportSummary(churchSlug: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [
    { count: totalMembers, error: totalError },
    { count: activeMembers, error: activeError },
    { count: inactiveMembers, error: inactiveError },
    { count: visitorMembers, error: visitorError },
    { count: transferredMembers, error: transferredError },
    { count: missingHousehold, error: missingHouseholdError },
  ] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId).eq("membership_status", "active"),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId).eq("membership_status", "inactive"),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId).eq("membership_status", "visitor"),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId).eq("membership_status", "transferred"),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("church_id", ctx.churchId).is("household_id", null),
  ]);

  if (totalError) throw new Error(totalError.message);
  if (activeError) throw new Error(activeError.message);
  if (inactiveError) throw new Error(inactiveError.message);
  if (visitorError) throw new Error(visitorError.message);
  if (transferredError) throw new Error(transferredError.message);
  if (missingHouseholdError) throw new Error(missingHouseholdError.message);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentMembers, error: recentError } = await supabase
    .from("members")
    .select("id, display_name, first_name, last_name, created_at, membership_status")
    .eq("church_id", ctx.churchId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  if (recentError) throw new Error(recentError.message);

  const { data: deptAssignments, error: deptError } = await supabase
    .from("member_departments")
    .select("member_id, department_name");

  if (deptError) throw new Error(deptError.message);

  const byDepartment = Object.entries(
    (deptAssignments ?? []).reduce((acc: Record<string, number>, row: any) => {
      const key = row.department_name || "Unassigned";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => a.department.localeCompare(b.department));

  return {
    totalMembers: totalMembers ?? 0,
    activeMembers: activeMembers ?? 0,
    inactiveMembers: inactiveMembers ?? 0,
    visitorMembers: visitorMembers ?? 0,
    transferredMembers: transferredMembers ?? 0,
    missingHousehold: missingHousehold ?? 0,
    recentMembers: recentMembers ?? [],
    byDepartment,
  };
}export async function getMemberFinancialProfile(churchSlug: string, memberId: string) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data: inflows, error } = await supabase
    .from("treasury_inflows")
    .select("amount, inflow_type, inflow_date")
    .eq("church_id", ctx.churchId)
    .eq("member_id", memberId)
    .order("inflow_date", { ascending: false });

  if (error) throw new Error(error.message);

  const totalTithe = (inflows ?? [])
    .filter((i: any) => i.inflow_type === "tithe")
    .reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

  const totalOffering = (inflows ?? [])
    .filter((i: any) => i.inflow_type === "offering")
    .reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

  const totalGiving = (inflows ?? [])
    .reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

  const byType = Object.entries(
    (inflows ?? []).reduce((acc: any, i: any) => {
      const key = i.inflow_type || "other";
      acc[key] = (acc[key] || 0) + Number(i.amount || 0);
      return acc;
    }, {})
  ).map(([type, amount]) => ({ type, amount }));

  const yearly = Object.entries(
    (inflows ?? []).reduce((acc: any, i: any) => {
      const year = new Date(i.inflow_date).getFullYear();
      acc[year] = (acc[year] || 0) + Number(i.amount || 0);
      return acc;
    }, {})
  ).map(([year, amount]) => ({ year, amount }));

  return {
    totalTithe,
    totalOffering,
    totalGiving,
    byType,
    yearly,
    recent: (inflows ?? []).slice(0, 10),
  };
}

export async function getMembersDepartmentAware(
  churchSlug: string,
  rawFilters?: Record<string, string | string[] | undefined>
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const pickSingle = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value ?? "";

  const q = pickSingle(rawFilters?.q);
  const status = pickSingle(rawFilters?.status);
  const departmentId = pickSingle(rawFilters?.departmentId);
  const departmentAssignmentStatus = pickSingle(rawFilters?.departmentAssignmentStatus);

  let query = supabase
    .from("members")
    .select(`
      id,
      church_id,
      first_name,
      last_name,
      display_name,
      member_code,
      membership_status,
      phone,
      email,
      created_at
    `)
    .eq("church_id", ctx.churchId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (status) {
    query = query.eq("membership_status", status);
  }

  if (q) {
    const safe = q.replace(/,/g, " ");
    query = query.or(
      [
        `first_name.ilike.%${safe}%`,
        `last_name.ilike.%${safe}%`,
        `display_name.ilike.%${safe}%`,
        `member_code.ilike.%${safe}%`,
        `phone.ilike.%${safe}%`,
        `email.ilike.%${safe}%`,
      ].join(",")
    );
  }

  if (departmentId) {
    let assignmentQuery = supabase
      .from("member_departments")
      .select("member_id")
      .eq("church_id", ctx.churchId)
      .eq("department_id", departmentId);

    if (departmentAssignmentStatus === "active") {
      assignmentQuery = assignmentQuery.eq("is_active", true);
    }

    if (departmentAssignmentStatus === "inactive") {
      assignmentQuery = assignmentQuery.eq("is_active", false);
    }

    const { data: assignmentRows, error: assignmentError } = await assignmentQuery;
    if (assignmentError) throw new Error(assignmentError.message);

    const memberIds = Array.from(
      new Set((assignmentRows ?? []).map((row: any) => row.member_id).filter(Boolean))
    );

    if (memberIds.length === 0) {
      return [];
    }

    query = query.in("id", memberIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getMembersWorkspaceData(
  churchSlug: string,
  filters: {
    q?: string;
    status?: string;
    departmentId?: string;
    departmentAssignmentStatus?: string;
  } = {}
) {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const [members, departments, householdRows] = await Promise.all([
    getMembersDepartmentAware(churchSlug, filters),
    supabase
      .from("church_departments")
      .select("id, department_name, code")
      .eq("church_id", ctx.churchId)
      .eq("is_active", true)
      .order("department_name", { ascending: true }),
    supabase
      .from("households")
      .select("id, household_name")
      .eq("church_id", ctx.churchId)
      .order("household_name", { ascending: true }),
  ]);

  if (departments.error) throw new Error(departments.error.message);
  if (householdRows.error) throw new Error(householdRows.error.message);

  const memberIds = (members ?? []).map((member: any) => member.id);

  let assignments: any[] = [];
  if (memberIds.length > 0) {
    const { data: assignmentRows, error: assignmentError } = await supabase
      .from("member_departments")
      .select("member_id, department_name, is_active")
      .in("member_id", memberIds);

    if (assignmentError) throw new Error(assignmentError.message);
    assignments = assignmentRows ?? [];
  }

  const householdNameById = new Map<string, string>();
  for (const household of householdRows.data ?? []) {
    householdNameById.set(household.id, household.household_name);
  }

  const activeAssignmentsByMemberId = new Map<string, string[]>();
  const inactiveAssignmentsByMemberId = new Map<string, string[]>();

  for (const row of assignments) {
    const bucket = row.is_active === false ? inactiveAssignmentsByMemberId : activeAssignmentsByMemberId;
    const list = bucket.get(row.member_id) ?? [];
    list.push(row.department_name);
    bucket.set(row.member_id, list);
  }

  const enrichedMembers = (members ?? []).map((member: any) => ({
    ...member,
    household_name: member.household_id ? householdNameById.get(member.household_id) ?? null : null,
    active_departments: (activeAssignmentsByMemberId.get(member.id) ?? []).sort((a, b) => a.localeCompare(b)),
    inactive_departments: (inactiveAssignmentsByMemberId.get(member.id) ?? []).sort((a, b) => a.localeCompare(b)),
  }));

  const totalMembers = enrichedMembers.length;
  const activeMembers = enrichedMembers.filter((member: any) => member.membership_status === "active").length;
  const inactiveMembers = enrichedMembers.filter((member: any) => member.membership_status === "inactive").length;
  const visitorMembers = enrichedMembers.filter((member: any) => member.membership_status === "visitor").length;
  const transferredMembers = enrichedMembers.filter((member: any) => member.membership_status === "transferred").length;
  const assignedMembersCount = enrichedMembers.filter((member: any) => (member.active_departments?.length ?? 0) > 0).length;
  const unassignedMembersCount = totalMembers - assignedMembersCount;

  const householdCounts = new Map<string, number>();
  for (const member of enrichedMembers) {
    if (!member.household_id) continue;
    householdCounts.set(member.household_id, (householdCounts.get(member.household_id) ?? 0) + 1);
  }

  const households = (householdRows.data ?? [])
    .map((household: any) => ({
      id: household.id,
      household_name: household.household_name,
      member_count: householdCounts.get(household.id) ?? 0,
    }))
    .sort((a: any, b: any) => b.member_count - a.member_count || a.household_name.localeCompare(b.household_name))
    .slice(0, 8);

  const recentMembers = [...enrichedMembers]
    .sort((a: any, b: any) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 6)
    .map((member: any) => ({
      id: member.id,
      display_name:
        member.display_name ||
        [member.first_name, member.last_name].filter(Boolean).join(" ") ||
        member.member_code ||
        "Member",
      membership_status: member.membership_status,
      created_at: member.created_at ?? null,
    }));

  return {
    church: {
      id: ctx.churchId,
      slug: ctx.churchSlug,
      name: ctx.churchName ?? ctx.churchSlug,
    },
    filters,
    stats: {
      totalMembers,
      activeMembers,
      inactiveMembers,
      visitorMembers,
      transferredMembers,
      householdsCount: (householdRows.data ?? []).length,
      assignedMembersCount,
      unassignedMembersCount,
    },
    members: enrichedMembers,
    departments: (departments.data ?? []).map((department: any) => ({
      id: department.id,
      name: department.department_name,
      code: department.code ?? null,
    })),
    households,
    recentMembers,
  };
}
