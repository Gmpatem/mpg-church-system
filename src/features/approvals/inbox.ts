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

function canReviewApprovalFromInbox(
  roles: string[],
  isPlatformAdmin: boolean,
  item: {
    currentStage: string;
    status: string;
    currentAssigneeRoleCode: string | null;
  }
) {
  if (item.status !== "pending") return false;
  if (isPlatformAdmin) return true;

  const roleSet = new Set(roles);
  const hasGlobalReviewRole = roleSet.has("church_admin") || roleSet.has("pastor");

  if (item.currentAssigneeRoleCode && roleSet.has(item.currentAssigneeRoleCode)) {
    return true;
  }

  if (item.currentStage === "office_review") {
    return hasGlobalReviewRole || roleSet.has("church_secretary") || roleSet.has("clerk");
  }

  if (item.currentStage === "leadership_review") {
    return hasGlobalReviewRole || roleSet.has("elder");
  }

  if (item.currentStage === "treasury_review") {
    return hasGlobalReviewRole || roleSet.has("treasurer");
  }

  if (item.currentStage === "submitted") {
    return hasGlobalReviewRole || roleSet.has("church_secretary") || roleSet.has("clerk");
  }

  return hasGlobalReviewRole;
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

  const items = rows.map((row) => {
    const item = {
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
    };

    const canReview = canReviewApprovalFromInbox(ctx.roles, ctx.isPlatformAdmin, item);
    return {
      ...item,
      canReview,
      isInboxItem: canReview,
    };
  });

  const [auditResult, policyResult] = await Promise.all([
    supabase
      .from("approval_audit_logs")
      .select("id, approval_request_id, action_type, actor_user_id, payload, created_at")
      .eq("church_id", ctx.churchId)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("approval_policies")
      .select("id, module_key, request_type, requires_office_review, requires_leadership_review, requires_treasury_review, final_approver_role_code, is_active")
      .eq("church_id", ctx.churchId)
      .order("module_key", { ascending: true }),
  ]);

  if (auditResult.error) {
    throw new Error(auditResult.error.message);
  }

  if (policyResult.error) {
    throw new Error(policyResult.error.message);
  }

  const auditActorIds = Array.from(
    new Set(((auditResult.data ?? []) as any[]).map((row) => row.actor_user_id).filter(Boolean))
  );

  let auditProfileMap = new Map<string, string>();
  if (auditActorIds.length > 0) {
    const { data: auditProfiles, error: auditProfileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", auditActorIds);

    if (auditProfileError) {
      throw new Error(auditProfileError.message);
    }

    auditProfileMap = new Map(
      (auditProfiles ?? []).map((profile: any) => [
        profile.id,
        profile.full_name || profile.email || "Unknown user",
      ])
    );
  }

  const summary = items.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    },
    {
      total: 0,
      inbox: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      changes_requested: 0,
      cancelled: 0,
    } as Record<string, number>
  );
  summary.inbox = items.filter((item) => item.isInboxItem).length;

  return {
    church: {
      id: ctx.churchId,
      slug: ctx.churchSlug,
      name: ctx.churchName ?? ctx.churchSlug,
    },
    items,
    auditLogs: ((auditResult.data ?? []) as any[]).map((row) => ({
      id: row.id,
      approvalRequestId: row.approval_request_id,
      actionType: row.action_type,
      actorUserId: row.actor_user_id ?? null,
      actorName: row.actor_user_id ? auditProfileMap.get(row.actor_user_id) ?? null : null,
      payload: row.payload ?? {},
      createdAt: row.created_at,
    })),
    policies: ((policyResult.data ?? []) as any[]).map((row) => ({
      id: row.id,
      moduleKey: row.module_key,
      moduleLabel: getApprovalModuleLabel(row.module_key),
      requestType: row.request_type,
      requiresOfficeReview: Boolean(row.requires_office_review),
      requiresLeadershipReview: Boolean(row.requires_leadership_review),
      requiresTreasuryReview: Boolean(row.requires_treasury_review),
      finalApproverRoleCode: row.final_approver_role_code ?? null,
      isActive: Boolean(row.is_active),
    })),
    summary,
    filters: {
      module: filters?.module ?? "",
      status: filters?.status ?? "",
      stage: filters?.stage ?? "",
    },
  };
}



