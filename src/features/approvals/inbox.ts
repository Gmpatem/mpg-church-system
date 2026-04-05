import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import { getApprovalModuleLabel } from "@/features/approvals/presentation";




function getRequestDisplayTitle(
  moduleKey: string,
  requestType: string,
  payload: any
) {
  if (moduleKey === "events") {
    return payload?.title
      ? `Event: ${payload.title}`
      : "Department event approval";
  }

  if (moduleKey === "announcements") {
    return payload?.title
      ? `Announcement: ${payload.title}`
      : "Announcement publish request";
  }

  if (moduleKey === "access") {
    return payload?.requestedRoleName
      ? `Access: ${payload.requestedRoleName}`
      : "Role access request";
  }

  if (moduleKey === "leadership") {
    return payload?.requestedRoleName
      ? `Leadership: ${payload.requestedRoleName}`
      : "Department leadership request";
  }

  return requestType.replaceAll("_", " ");
}
function buildEntityHref(churchSlug: string, moduleKey: string, entityType: string, payload: any) {
  if (moduleKey === "events") {
    if (payload?.departmentId) {
      return `/c/${churchSlug}/departments/${payload.departmentId}/events`;
    }
    return `/c/${churchSlug}/events`;
  }

  if (moduleKey === "announcements") {
    if (entityType === "department_announcement" && payload?.departmentId) {
      return `/c/${churchSlug}/departments/${payload.departmentId}/announcements`;
    }
    return `/c/${churchSlug}/announcements`;
  }

  if (moduleKey === "access") {
    return `/c/${churchSlug}/access-control?tab=pending_access`;
  }

  if (moduleKey === "leadership") {
    return `/c/${churchSlug}/leadership?tab=requests`;
  }

  if (moduleKey === "treasury") {
    return `/c/${churchSlug}/treasury`;
  }

  return `/c/${churchSlug}/office`;
}

export async function getApprovalsInboxData(
  churchSlug: string,
  filters?: {
    module?: string;
    status?: string;
    stage?: string;
  }
) {
  const ctx = await requireChurchRole(churchSlug, [
    "church_admin",
    "pastor",
    "clerk",
    "church_secretary",
    "treasurer",
  ]);

  const supabase = await createClient();

  let query = supabase
    .from("approval_requests")
    .select(`
      id,
      church_id,
      module_key,
      entity_type,
      entity_id,
      request_type,
      submitted_by_user_id,
      current_stage,
      status,
      priority,
      current_assignee_role_code,
      payload,
      submitted_at,
      decided_at,
      decided_by_user_id,
      decision_note,
      created_at,
      updated_at
    `)
    .eq("church_id", ctx.churchId)
    .order("submitted_at", { ascending: false });

  if (filters?.module) {
    query = query.eq("module_key", filters.module);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.stage) {
    query = query.eq("current_stage", filters.stage);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];

  const submittedByIds = Array.from(
    new Set(rows.map((row) => row.submitted_by_user_id).filter(Boolean))
  );

  let profileMap = new Map<string, string>();
  if (submittedByIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", submittedByIds);

    if (profileError) {
      throw new Error(profileError.message);
    }

    profileMap = new Map(
      (profiles ?? []).map((profile: any) => [
        profile.id,
        profile.full_name || profile.email || "Unknown user",
      ])
    );
  }

  const items = rows.map((row) => ({
    id: row.id,
    moduleKey: row.module_key,
    moduleLabel: getApprovalModuleLabel(row.module_key),
    entityType: row.entity_type,
    entityId: row.entity_id,
    requestType: row.request_type,
    displayTitle: getRequestDisplayTitle(row.module_key, row.request_type, row.payload ?? {}),
    currentStage: row.current_stage,
    status: row.status,
    priority: row.priority,
    currentAssigneeRoleCode: row.current_assignee_role_code ?? null,
    payload: row.payload ?? {},
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at ?? null,
    decidedByUserId: row.decided_by_user_id ?? null,
    decisionNote: row.decision_note ?? null,
    submittedByUserId: row.submitted_by_user_id ?? null,
    submittedByName: row.submitted_by_user_id ? profileMap.get(row.submitted_by_user_id) ?? null : null,
    href: buildEntityHref(churchSlug, row.module_key, row.entity_type, row.payload ?? {}),
  }));

  const summary = items.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      changes_requested: 0,
      cancelled: 0,
    } as Record<string, number>
  );

  return {
    church: {
      id: ctx.churchId,
      slug: ctx.churchSlug,
      name: ctx.churchName ?? ctx.churchSlug,
    },
    items,
    summary,
    filters: {
      module: filters?.module ?? "",
      status: filters?.status ?? "",
      stage: filters?.stage ?? "",
    },
  };
}



