"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import type { ActionState } from "@/features/access/types";
import type { ApprovalDecision, ApprovalModuleKey } from "./types";
import { getApprovalPolicy } from "./queries";

type ApprovalRequestEntityRow = {
  id: string;
  church_id: string;
  module_key: string;
  entity_type: string;
  entity_id: string;
  request_type: string;
  current_stage: string;
  status: string;
  current_assignee_role_code: string | null;
  submitted_by_user_id: string | null;
};

type ApprovalStepRow = {
  id: string;
  stage_key: "office_review" | "leadership_review" | "treasury_review" | "final_review";
  approver_role_code: string | null;
  decision: "pending" | "approved" | "rejected" | "changes_requested" | "skipped" | null;
  sort_order: number;
};

const REVIEWABLE_DECISIONS: ApprovalDecision[] = ["approved", "rejected", "changes_requested"];
const SUPPORTED_REVIEW_ENTITY_TYPES = [
  "church_event",
  "church_announcement",
  "department_announcement",
] as const;
const LEADERSHIP_ROLE_CODES = [
  "church_admin",
  "pastor",
  "elder",
  "clerk",
  "church_secretary",
  "treasurer",
  "tech_team",
];

function uniqueUserIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function terminalStageFromDecision(decision: ApprovalDecision) {
  if (decision === "approved") return "approved";
  if (decision === "rejected") return "rejected";
  if (decision === "changes_requested") return "changes_requested";
  return "cancelled";
}

function terminalStatusFromDecision(decision: ApprovalDecision) {
  if (decision === "approved") return "approved";
  if (decision === "rejected") return "rejected";
  if (decision === "changes_requested") return "changes_requested";
  return "cancelled";
}

function requiresDecisionNote(decision: ApprovalDecision) {
  return decision === "rejected" || decision === "changes_requested";
}

function canReviewApprovalRequest(
  roles: string[],
  isPlatformAdmin: boolean,
  request: ApprovalRequestEntityRow
) {
  if (isPlatformAdmin) return true;

  const roleSet = new Set(roles);
  const hasGlobalReviewRole = roleSet.has("church_admin") || roleSet.has("pastor");

  if (request.current_assignee_role_code && roleSet.has(request.current_assignee_role_code)) {
    return true;
  }

  if (request.current_stage === "office_review") {
    return (
      hasGlobalReviewRole ||
      roleSet.has("church_secretary") ||
      roleSet.has("clerk")
    );
  }

  if (request.current_stage === "leadership_review") {
    return hasGlobalReviewRole || roleSet.has("elder");
  }

  if (request.current_stage === "treasury_review") {
    return hasGlobalReviewRole || roleSet.has("treasurer");
  }

  if (request.current_stage === "submitted") {
    return hasGlobalReviewRole || roleSet.has("clerk") || roleSet.has("church_secretary");
  }

  return hasGlobalReviewRole;
}

async function getActiveChurchUserIds(supabase: any, churchId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("church_users")
    .select("user_id")
    .eq("church_id", churchId)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  return uniqueUserIds((data ?? []).map((row: any) => row.user_id));
}

async function getChurchLeaderUserIds(supabase: any, churchId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("church_role_assignments")
    .select("user_id, role_definitions(code)")
    .eq("church_id", churchId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);

  return uniqueUserIds(
    (data ?? [])
      .map((row: any) => {
        const role = Array.isArray(row.role_definitions)
          ? row.role_definitions[0]
          : row.role_definitions;
        if (!role?.code) return null;
        return LEADERSHIP_ROLE_CODES.includes(role.code) ? row.user_id : null;
      })
      .filter(Boolean)
  );
}

async function getMemberProfileIdsByMemberIds(
  supabase: any,
  churchId: string,
  memberIds: string[]
): Promise<string[]> {
  if (memberIds.length === 0) return [];

  const uniqueMemberIds = Array.from(new Set(memberIds));

  const { data, error } = await supabase
    .from("members")
    .select("profile_id")
    .eq("church_id", churchId)
    .in("id", uniqueMemberIds)
    .not("profile_id", "is", null);

  if (error) throw new Error(error.message);

  return uniqueUserIds((data ?? []).map((row: any) => row.profile_id));
}

async function getDepartmentMemberProfileIds(
  supabase: any,
  churchId: string,
  departmentIds: string[]
): Promise<string[]> {
  if (departmentIds.length === 0) return [];

  const uniqueDepartmentIds = Array.from(new Set(departmentIds));

  const { data, error } = await supabase
    .from("member_departments")
    .select("member_id")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .in("department_id", uniqueDepartmentIds);

  if (error) throw new Error(error.message);

  const memberIds = uniqueUserIds((data ?? []).map((row: any) => row.member_id));
  return getMemberProfileIdsByMemberIds(supabase, churchId, memberIds);
}

async function getDepartmentLeaderProfileIds(
  supabase: any,
  churchId: string,
  departmentIds: string[]
): Promise<string[]> {
  if (departmentIds.length === 0) return [];

  const uniqueDepartmentIds = Array.from(new Set(departmentIds));

  const { data, error } = await supabase
    .from("department_leadership_assignments")
    .select("member_id")
    .eq("church_id", churchId)
    .eq("is_active", true)
    .in("department_id", uniqueDepartmentIds);

  if (error) throw new Error(error.message);

  const memberIds = uniqueUserIds((data ?? []).map((row: any) => row.member_id));
  return getMemberProfileIdsByMemberIds(supabase, churchId, memberIds);
}

async function insertChurchNotifications(
  supabase: any,
  rows: Array<{
    church_id: string;
    target_user_id: string;
    event_type: string;
    entity_type: string;
    entity_id: string;
    title: string;
    message: string;
    href: string;
    is_read: boolean;
  }>
) {
  if (rows.length === 0) return;

  const deduped = Array.from(
    new Map(
      rows.map((row) => [
        `${row.church_id}:${row.target_user_id}:${row.entity_type}:${row.entity_id}:${row.event_type}`,
        row,
      ])
    ).values()
  );

  const { error } = await supabase.from("church_notifications").insert(deduped);

  if (error) {
    throw new Error(error.message);
  }
}

async function notifyEventPublished(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  eventId: string;
  eventTitle: string;
  departmentId: string | null;
  createdByUserId: string | null;
  submittedByUserId: string | null;
}) {
  const { supabase, churchId, churchSlug, eventId, eventTitle, departmentId, createdByUserId, submittedByUserId } =
    params;

  const [activeChurchUserIds, departmentLinksResult, assignmentResult] = await Promise.all([
    getActiveChurchUserIds(supabase, churchId),
    supabase
      .from("church_event_departments")
      .select("department_id")
      .eq("church_id", churchId)
      .eq("event_id", eventId),
    supabase
      .from("church_assignments")
      .select("assigned_to_user_id")
      .eq("church_id", churchId)
      .eq("related_event_id", eventId),
  ]);

  if (departmentLinksResult.error) {
    throw new Error(departmentLinksResult.error.message);
  }

  if (assignmentResult.error) {
    throw new Error(assignmentResult.error.message);
  }

  const linkedDepartmentIds = uniqueUserIds([
    departmentId,
    ...(departmentLinksResult.data ?? []).map((row: any) => row.department_id),
  ]);

  const [departmentMemberProfileIds, departmentLeaderProfileIds] = await Promise.all([
    getDepartmentMemberProfileIds(supabase, churchId, linkedDepartmentIds),
    getDepartmentLeaderProfileIds(supabase, churchId, linkedDepartmentIds),
  ]);

  const assignmentUserIds = uniqueUserIds(
    (assignmentResult.data ?? []).map((row: any) => row.assigned_to_user_id)
  );

  const recipientUserIds = uniqueUserIds([
    ...activeChurchUserIds,
    ...departmentMemberProfileIds,
    ...departmentLeaderProfileIds,
    ...assignmentUserIds,
    createdByUserId,
    submittedByUserId,
  ]);

  await insertChurchNotifications(
    supabase,
    recipientUserIds.map((targetUserId) => ({
      church_id: churchId,
      target_user_id: targetUserId,
      event_type: "event",
      entity_type: "church_event",
      entity_id: eventId,
      title: "Event approved",
      message: `${eventTitle} is now published on the church calendar.`,
      href: `/c/${churchSlug}/events?eventId=${eventId}&tab=detail`,
      is_read: false,
    }))
  );
}

async function notifyEventDecisionUpdate(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  eventId: string;
  eventTitle: string;
  decision: ApprovalDecision;
  decisionNote: string | null;
  createdByUserId: string | null;
  submittedByUserId: string | null;
}) {
  const { supabase, churchId, churchSlug, eventId, eventTitle, decision, decisionNote, createdByUserId, submittedByUserId } =
    params;

  const recipientUserIds = uniqueUserIds([createdByUserId, submittedByUserId]);
  if (recipientUserIds.length === 0) return;

  const statusLabel = decision === "changes_requested" ? "changes requested" : "not approved";

  await insertChurchNotifications(
    supabase,
    recipientUserIds.map((targetUserId) => ({
      church_id: churchId,
      target_user_id: targetUserId,
      event_type: "approval",
      entity_type: "church_event",
      entity_id: eventId,
      title: "Event review update",
      message: `${eventTitle} is ${statusLabel}.${decisionNote ? ` ${decisionNote}` : ""}`,
      href: `/c/${churchSlug}/events?eventId=${eventId}&tab=detail`,
      is_read: false,
    }))
  );
}

async function getChurchAnnouncementAudienceUserIds(params: {
  supabase: any;
  churchId: string;
  audienceScope: string;
  departmentId: string | null;
}) {
  const { supabase, churchId, audienceScope, departmentId } = params;

  if (audienceScope === "church_wide") {
    return getActiveChurchUserIds(supabase, churchId);
  }

  if (audienceScope === "leaders_only") {
    return getChurchLeaderUserIds(supabase, churchId);
  }

  if (audienceScope === "members_only") {
    const { data, error } = await supabase
      .from("members")
      .select("profile_id")
      .eq("church_id", churchId)
      .eq("membership_status", "active")
      .not("profile_id", "is", null);

    if (error) throw new Error(error.message);

    return uniqueUserIds((data ?? []).map((row: any) => row.profile_id));
  }

  if (audienceScope === "department_members") {
    if (!departmentId) {
      return getActiveChurchUserIds(supabase, churchId);
    }

    const [memberProfileIds, leaderProfileIds] = await Promise.all([
      getDepartmentMemberProfileIds(supabase, churchId, [departmentId]),
      getDepartmentLeaderProfileIds(supabase, churchId, [departmentId]),
    ]);

    return uniqueUserIds([...memberProfileIds, ...leaderProfileIds]);
  }

  return getActiveChurchUserIds(supabase, churchId);
}

async function getDepartmentAnnouncementAudienceUserIds(params: {
  supabase: any;
  churchId: string;
  departmentId: string;
  audienceScope: string;
}) {
  const { supabase, churchId, departmentId, audienceScope } = params;

  if (audienceScope === "leaders_only") {
    const leaderProfileIds = await getDepartmentLeaderProfileIds(supabase, churchId, [departmentId]);
    if (leaderProfileIds.length > 0) return leaderProfileIds;
    return getChurchLeaderUserIds(supabase, churchId);
  }

  const [memberProfileIds, leaderProfileIds] = await Promise.all([
    getDepartmentMemberProfileIds(supabase, churchId, [departmentId]),
    getDepartmentLeaderProfileIds(supabase, churchId, [departmentId]),
  ]);

  return uniqueUserIds([...memberProfileIds, ...leaderProfileIds]);
}

async function notifyChurchAnnouncementPublished(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  announcementId: string;
  title: string;
  audienceScope: string;
  departmentId: string | null;
  createdByUserId: string | null;
}) {
  const { supabase, churchId, churchSlug, announcementId, title, audienceScope, departmentId, createdByUserId } =
    params;

  const audienceUserIds = await getChurchAnnouncementAudienceUserIds({
    supabase,
    churchId,
    audienceScope,
    departmentId,
  });

  const recipientUserIds = uniqueUserIds([...audienceUserIds, createdByUserId]);

  await insertChurchNotifications(
    supabase,
    recipientUserIds.map((targetUserId) => ({
      church_id: churchId,
      target_user_id: targetUserId,
      event_type: "announcement",
      entity_type: "church_announcement",
      entity_id: announcementId,
      title: "New church announcement",
      message: title,
      href: `/c/${churchSlug}/announcements`,
      is_read: false,
    }))
  );
}

async function notifyDepartmentAnnouncementPublished(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  announcementId: string;
  departmentId: string;
  title: string;
  audienceScope: string;
  createdByUserId: string | null;
}) {
  const { supabase, churchId, churchSlug, announcementId, departmentId, title, audienceScope, createdByUserId } =
    params;

  const audienceUserIds = await getDepartmentAnnouncementAudienceUserIds({
    supabase,
    churchId,
    departmentId,
    audienceScope,
  });

  const recipientUserIds = uniqueUserIds([...audienceUserIds, createdByUserId]);

  await insertChurchNotifications(
    supabase,
    recipientUserIds.map((targetUserId) => ({
      church_id: churchId,
      target_user_id: targetUserId,
      event_type: "department_announcement",
      entity_type: "department_announcement",
      entity_id: announcementId,
      title: "New department announcement",
      message: title,
      href: `/c/${churchSlug}/departments/${departmentId}/announcements`,
      is_read: false,
    }))
  );
}

async function notifyAnnouncementDecisionUpdate(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  entityType: "church_announcement" | "department_announcement";
  announcementId: string;
  departmentId?: string | null;
  title: string;
  decision: ApprovalDecision;
  decisionNote: string | null;
  createdByUserId: string | null;
}) {
  const { supabase, churchId, churchSlug, entityType, announcementId, departmentId, title, decision, decisionNote, createdByUserId } =
    params;

  const recipientUserIds = uniqueUserIds([createdByUserId]);
  if (recipientUserIds.length === 0) return;

  const statusLabel = decision === "changes_requested" ? "needs updates" : "was not approved";
  const href =
    entityType === "department_announcement" && departmentId
      ? `/c/${churchSlug}/departments/${departmentId}/announcements`
      : `/c/${churchSlug}/announcements`;

  await insertChurchNotifications(
    supabase,
    recipientUserIds.map((targetUserId) => ({
      church_id: churchId,
      target_user_id: targetUserId,
      event_type: "approval",
      entity_type: entityType,
      entity_id: announcementId,
      title: "Announcement review update",
      message: `${title} ${statusLabel}.${decisionNote ? ` ${decisionNote}` : ""}`,
      href,
      is_read: false,
    }))
  );
}

async function applyApprovalEntityDecision(params: {
  supabase: any;
  churchId: string;
  churchSlug: string;
  actorUserId: string;
  request: ApprovalRequestEntityRow;
  decision: ApprovalDecision;
  decisionNote: string | null;
}) {
  const { supabase, churchId, churchSlug, actorUserId, request, decision, decisionNote } = params;
  const nowIso = new Date().toISOString();

  if (request.entity_type === "church_event") {
    const { data: eventRow, error: fetchError } = await supabase
      .from("church_events")
      .select("id, title, department_id, created_by_user_id, submitted_by_user_id")
      .eq("church_id", churchId)
      .eq("id", request.entity_id)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!eventRow) throw new Error("Event linked to this approval request was not found.");

    if (decision === "approved") {
      const { error: updateError } = await supabase
        .from("church_events")
        .update({
          workflow_state: "published",
          approved_by_user_id: actorUserId,
          approved_at: nowIso,
          approval_note: null,
          updated_at: nowIso,
        })
        .eq("church_id", churchId)
        .eq("id", eventRow.id);

      if (updateError) throw new Error(updateError.message);

      await notifyEventPublished({
        supabase,
        churchId,
        churchSlug,
        eventId: eventRow.id,
        eventTitle: eventRow.title,
        departmentId: eventRow.department_id,
        createdByUserId: eventRow.created_by_user_id,
        submittedByUserId: eventRow.submitted_by_user_id,
      });

      return;
    }

    const nextWorkflowState = decision === "changes_requested" ? "draft" : "rejected";

    const { error: updateError } = await supabase
      .from("church_events")
      .update({
        workflow_state: nextWorkflowState,
        approval_note:
          decisionNote ??
          (decision === "changes_requested"
            ? "Changes requested during review."
            : "Rejected during approval review."),
        approved_by_user_id: actorUserId,
        approved_at: nowIso,
        updated_at: nowIso,
      })
      .eq("church_id", churchId)
      .eq("id", eventRow.id);

    if (updateError) throw new Error(updateError.message);

    await notifyEventDecisionUpdate({
      supabase,
      churchId,
      churchSlug,
      eventId: eventRow.id,
      eventTitle: eventRow.title,
      decision,
      decisionNote,
      createdByUserId: eventRow.created_by_user_id,
      submittedByUserId: eventRow.submitted_by_user_id,
    });

    return;
  }

  if (request.entity_type === "church_announcement") {
    const { data: announcementRow, error: fetchError } = await supabase
      .from("church_announcements")
      .select("id, title, audience_scope, department_id, created_by_user_id")
      .eq("church_id", churchId)
      .eq("id", request.entity_id)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!announcementRow) throw new Error("Announcement linked to this approval request was not found.");

    if (decision === "approved") {
      const { error: updateError } = await supabase
        .from("church_announcements")
        .update({
          status: "published",
          published_at: nowIso,
          approved_by_user_id: actorUserId,
          approval_note: null,
          updated_at: nowIso,
        })
        .eq("church_id", churchId)
        .eq("id", announcementRow.id);

      if (updateError) throw new Error(updateError.message);

      await notifyChurchAnnouncementPublished({
        supabase,
        churchId,
        churchSlug,
        announcementId: announcementRow.id,
        title: announcementRow.title,
        audienceScope: announcementRow.audience_scope,
        departmentId: announcementRow.department_id,
        createdByUserId: announcementRow.created_by_user_id,
      });

      return;
    }

    const nextStatus = decision === "changes_requested" ? "draft" : "rejected";

    const { error: updateError } = await supabase
      .from("church_announcements")
      .update({
        status: nextStatus,
        approval_note:
          decisionNote ??
          (decision === "changes_requested"
            ? "Changes requested during review."
            : "Rejected during approval review."),
        approved_by_user_id: actorUserId,
        updated_at: nowIso,
      })
      .eq("church_id", churchId)
      .eq("id", announcementRow.id);

    if (updateError) throw new Error(updateError.message);

    await notifyAnnouncementDecisionUpdate({
      supabase,
      churchId,
      churchSlug,
      entityType: "church_announcement",
      announcementId: announcementRow.id,
      title: announcementRow.title,
      decision,
      decisionNote,
      createdByUserId: announcementRow.created_by_user_id,
    });

    return;
  }

  if (request.entity_type === "department_announcement") {
    const { data: announcementRow, error: fetchError } = await supabase
      .from("department_announcements")
      .select("id, title, audience_scope, department_id, created_by_user_id")
      .eq("church_id", churchId)
      .eq("id", request.entity_id)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!announcementRow) throw new Error("Department announcement linked to this approval request was not found.");

    if (decision === "approved") {
      const { error: updateError } = await supabase
        .from("department_announcements")
        .update({
          status: "published",
          published_at: nowIso,
          approved_by_user_id: actorUserId,
          approval_note: null,
          updated_at: nowIso,
        })
        .eq("church_id", churchId)
        .eq("department_id", announcementRow.department_id)
        .eq("id", announcementRow.id);

      if (updateError) throw new Error(updateError.message);

      await notifyDepartmentAnnouncementPublished({
        supabase,
        churchId,
        churchSlug,
        announcementId: announcementRow.id,
        departmentId: announcementRow.department_id,
        title: announcementRow.title,
        audienceScope: announcementRow.audience_scope,
        createdByUserId: announcementRow.created_by_user_id,
      });

      return;
    }

    const nextStatus = decision === "changes_requested" ? "draft" : "rejected";

    const { error: updateError } = await supabase
      .from("department_announcements")
      .update({
        status: nextStatus,
        approval_note:
          decisionNote ??
          (decision === "changes_requested"
            ? "Changes requested during review."
            : "Rejected during approval review."),
        approved_by_user_id: actorUserId,
        updated_at: nowIso,
      })
      .eq("church_id", churchId)
      .eq("department_id", announcementRow.department_id)
      .eq("id", announcementRow.id);

    if (updateError) throw new Error(updateError.message);

    await notifyAnnouncementDecisionUpdate({
      supabase,
      churchId,
      churchSlug,
      entityType: "department_announcement",
      announcementId: announcementRow.id,
      departmentId: announcementRow.department_id,
      title: announcementRow.title,
      decision,
      decisionNote,
      createdByUserId: announcementRow.created_by_user_id,
    });
  }
}

async function recordApprovalStepDecision(params: {
  supabase: any;
  churchId: string;
  approvalRequestId: string;
  currentStage: string;
  decision: ApprovalDecision;
  note: string | null;
}) {
  const { supabase, churchId, approvalRequestId, currentStage, decision, note } = params;

  if (!["office_review", "leadership_review", "treasury_review"].includes(currentStage)) {
    return;
  }

  const stepDecision = decision === "cancelled" ? "skipped" : decision;

  const { error } = await supabase
    .from("approval_steps")
    .update({
      decision: stepDecision,
      decision_note: note,
      acted_at: new Date().toISOString(),
    })
    .eq("approval_request_id", approvalRequestId)
    .eq("church_id", churchId)
    .eq("stage_key", currentStage)
    .eq("decision", "pending");

  if (error) throw new Error(error.message);
}

async function getApprovalSteps(params: {
  supabase: any;
  churchId: string;
  approvalRequestId: string;
}) {
  const { supabase, churchId, approvalRequestId } = params;

  const { data, error } = await supabase
    .from("approval_steps")
    .select("id, stage_key, approver_role_code, decision, sort_order")
    .eq("church_id", churchId)
    .eq("approval_request_id", approvalRequestId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as ApprovalStepRow[];
}

function getStageLabel(stageKey: string) {
  if (stageKey === "office_review") return "Office Review";
  if (stageKey === "leadership_review") return "Leadership Review";
  if (stageKey === "treasury_review") return "Treasury Review";
  return "Final Review";
}

function revalidateApprovalSurfaces(churchSlug: string) {
  revalidatePath(`/c/${churchSlug}/office`);
  revalidatePath(`/c/${churchSlug}/approvals`);
  revalidatePath(`/c/${churchSlug}/events`);
  revalidatePath(`/c/${churchSlug}/announcements`);
  revalidatePath(`/c/${churchSlug}/calendar`);
  revalidatePath(`/my/${churchSlug}`);
}

export async function createApprovalRequest(params: {
  churchSlug: string;
  moduleKey: ApprovalModuleKey;
  entityType: string;
  entityId: string;
  requestType: string;
  payload?: Record<string, unknown>;
  priority?: "low" | "normal" | "high" | "urgent";
}) {
  const ctx = await requireChurchAccess(params.churchSlug);
  const supabase = await createClient();
  const policy = await getApprovalPolicy(params.churchSlug, params.moduleKey, params.requestType);

  const currentStage =
    policy?.requires_office_review
      ? "office_review"
      : policy?.requires_leadership_review
      ? "leadership_review"
      : policy?.requires_treasury_review
      ? "treasury_review"
      : "submitted";

  const currentAssigneeRoleCode =
    policy?.final_approver_role_code ??
    (policy?.requires_office_review
      ? "church_secretary"
      : policy?.requires_leadership_review
      ? "pastor"
      : policy?.requires_treasury_review
      ? "treasurer"
      : null);

  const { data, error } = await supabase
    .from("approval_requests")
    .insert({
      church_id: ctx.churchId,
      module_key: params.moduleKey,
      entity_type: params.entityType,
      entity_id: params.entityId,
      request_type: params.requestType,
      submitted_by_user_id: ctx.userId,
      current_stage: currentStage,
      status: "pending",
      priority: params.priority ?? "normal",
      current_assignee_role_code: currentAssigneeRoleCode,
      payload: params.payload ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const requestId = data.id as string;

  if (policy?.requires_office_review) {
    await supabase.from("approval_steps").insert({
      approval_request_id: requestId,
      church_id: ctx.churchId,
      stage_key: "office_review",
      approver_role_code: "church_secretary",
      decision: "pending",
      sort_order: 1,
    });
  }

  if (policy?.requires_leadership_review) {
    await supabase.from("approval_steps").insert({
      approval_request_id: requestId,
      church_id: ctx.churchId,
      stage_key: "leadership_review",
      approver_role_code: policy.final_approver_role_code ?? "pastor",
      decision: "pending",
      sort_order: policy.requires_office_review ? 2 : 1,
    });
  }

  if (policy?.requires_treasury_review) {
    await supabase.from("approval_steps").insert({
      approval_request_id: requestId,
      church_id: ctx.churchId,
      stage_key: "treasury_review",
      approver_role_code: "treasurer",
      decision: "pending",
      sort_order:
        (policy.requires_office_review ? 1 : 0) +
        (policy.requires_leadership_review ? 1 : 0) + 1,
    });
  }

  await supabase.from("approval_audit_logs").insert({
    church_id: ctx.churchId,
    approval_request_id: requestId,
    action_type: "created",
    actor_user_id: ctx.userId,
    payload: {
      moduleKey: params.moduleKey,
      entityType: params.entityType,
      entityId: params.entityId,
      requestType: params.requestType,
    },
  });

  return data;
}

export async function decideApprovalRequest(params: {
  churchSlug: string;
  approvalRequestId: string;
  decision: ApprovalDecision;
  note?: string;
}) {
  const ctx = await requireChurchRole(params.churchSlug, [
    "church_admin",
    "pastor",
    "clerk",
    "church_secretary",
    "treasurer",
  ]);

  const supabase = await createClient();

  const terminalStage = terminalStageFromDecision(params.decision);
  const terminalStatus = terminalStatusFromDecision(params.decision);

  const { error } = await supabase
    .from("approval_requests")
    .update({
      current_stage: terminalStage,
      status: terminalStatus,
      decided_at: new Date().toISOString(),
      decided_by_user_id: ctx.userId,
      decision_note: params.note ?? null,
    })
    .eq("church_id", ctx.churchId)
    .eq("id", params.approvalRequestId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("approval_audit_logs").insert({
    church_id: ctx.churchId,
    approval_request_id: params.approvalRequestId,
    action_type: params.decision,
    actor_user_id: ctx.userId,
    payload: {
      note: params.note ?? null,
      roles: ctx.roles,
    },
  });

  revalidatePath(`/c/${params.churchSlug}/office`);
  revalidatePath(`/c/${params.churchSlug}/access-control`);
  revalidatePath(`/c/${params.churchSlug}/leadership`);
  revalidatePath(`/c/${params.churchSlug}/events`);
}

export async function reviewApprovalRequestAction(formData: FormData): Promise<ActionState> {
  try {
    const churchSlug = String(formData.get("churchSlug") ?? "").trim();
    const approvalRequestId = String(formData.get("approvalRequestId") ?? "").trim();
    const decision = String(formData.get("decision") ?? "").trim() as ApprovalDecision;
    const noteInput = String(formData.get("note") ?? "").trim();

    if (!churchSlug || !approvalRequestId) {
      return { ok: false, error: "Approval request and church are required." };
    }

    if (!REVIEWABLE_DECISIONS.includes(decision)) {
      return { ok: false, error: "Unsupported approval decision." };
    }

    if (requiresDecisionNote(decision) && !noteInput) {
      return { ok: false, error: "A decision note is required for this review action." };
    }

    const ctx = await requireChurchRole(churchSlug, [
      "church_admin",
      "pastor",
      "clerk",
      "church_secretary",
      "treasurer",
    ]);

    const supabase = await createClient();

    const { data: requestRow, error: requestError } = await supabase
      .from("approval_requests")
      .select(
        "id, church_id, module_key, entity_type, entity_id, request_type, current_stage, status, current_assignee_role_code, submitted_by_user_id"
      )
      .eq("church_id", ctx.churchId)
      .eq("id", approvalRequestId)
      .maybeSingle<ApprovalRequestEntityRow>();

    if (requestError) {
      return { ok: false, error: requestError.message };
    }

    if (!requestRow) {
      return { ok: false, error: "Approval request not found." };
    }

    if (
      !SUPPORTED_REVIEW_ENTITY_TYPES.includes(
        requestRow.entity_type as (typeof SUPPORTED_REVIEW_ENTITY_TYPES)[number]
      )
    ) {
      return {
        ok: false,
        error: "This request type is not yet supported by the approvals decision panel.",
      };
    }

    if (requestRow.status !== "pending") {
      return { ok: false, error: "Only pending requests can be reviewed." };
    }

    if (!canReviewApprovalRequest(ctx.roles, ctx.isPlatformAdmin, requestRow)) {
      return {
        ok: false,
        error: "You are not permitted to review this request at its current approval stage.",
      };
    }

    const decisionNote = noteInput || null;
    const nowIso = new Date().toISOString();
    const approvalSteps = await getApprovalSteps({
      supabase,
      churchId: ctx.churchId,
      approvalRequestId,
    });
    const pendingSteps = approvalSteps.filter((step) => step.decision === "pending");
    const currentPendingStep =
      pendingSteps.find((step) => step.stage_key === requestRow.current_stage) ?? null;
    let currentStageRecorded = false;

    if (decision === "approved" && pendingSteps.length > 0) {
      let nextStageStep: ApprovalStepRow | null = null;

      if (currentPendingStep) {
        await recordApprovalStepDecision({
          supabase,
          churchId: ctx.churchId,
          approvalRequestId,
          currentStage: requestRow.current_stage,
          decision: "approved",
          note: decisionNote,
        });
        currentStageRecorded = true;

        nextStageStep =
          pendingSteps.find((step) => step.sort_order > currentPendingStep.sort_order) ?? null;
      } else if (requestRow.current_stage === "submitted") {
        nextStageStep = pendingSteps[0] ?? null;
      }

      if (nextStageStep) {
        const { error: transitionError } = await supabase
          .from("approval_requests")
          .update({
            current_stage: nextStageStep.stage_key,
            current_assignee_role_code: nextStageStep.approver_role_code ?? null,
            updated_at: nowIso,
          })
          .eq("church_id", ctx.churchId)
          .eq("id", approvalRequestId);

        if (transitionError) {
          return { ok: false, error: transitionError.message };
        }

        const { error: stepAuditError } = await supabase.from("approval_audit_logs").insert({
          church_id: ctx.churchId,
          approval_request_id: approvalRequestId,
          action_type: "step_completed",
          actor_user_id: ctx.userId,
          payload: {
            note: decisionNote,
            reviewedFrom: "approvals_queue",
            nextStage: nextStageStep.stage_key,
            nextAssigneeRole: nextStageStep.approver_role_code,
          },
        });

        if (stepAuditError) {
          return { ok: false, error: stepAuditError.message };
        }

        revalidateApprovalSurfaces(churchSlug);

        return {
          ok: true,
          message: `Stage approved. Request moved to ${getStageLabel(nextStageStep.stage_key)}.`,
        };
      }
    }

    if (currentPendingStep && !currentStageRecorded) {
      await recordApprovalStepDecision({
        supabase,
        churchId: ctx.churchId,
        approvalRequestId,
        currentStage: requestRow.current_stage,
        decision,
        note: decisionNote,
      });
    }

    await applyApprovalEntityDecision({
      supabase,
      churchId: ctx.churchId,
      churchSlug,
      actorUserId: ctx.userId,
      request: requestRow,
      decision,
      decisionNote,
    });

    const terminalStage = terminalStageFromDecision(decision);
    const terminalStatus = terminalStatusFromDecision(decision);

    const { error: updateError } = await supabase
      .from("approval_requests")
      .update({
        current_stage: terminalStage,
        status: terminalStatus,
        current_assignee_role_code: null,
        decided_at: nowIso,
        decided_by_user_id: ctx.userId,
        decision_note: decisionNote,
        updated_at: nowIso,
      })
      .eq("church_id", ctx.churchId)
      .eq("id", approvalRequestId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    const { error: auditError } = await supabase.from("approval_audit_logs").insert({
      church_id: ctx.churchId,
      approval_request_id: approvalRequestId,
      action_type: decision,
      actor_user_id: ctx.userId,
      payload: {
        note: decisionNote,
        reviewedFrom: "approvals_queue",
      },
    });

    if (auditError) {
      return { ok: false, error: auditError.message };
    }

    revalidateApprovalSurfaces(churchSlug);

    return {
      ok: true,
      message:
        decision === "approved"
          ? "Approval request approved and published."
          : decision === "changes_requested"
          ? "Changes requested and requester notified."
          : "Approval request rejected and requester notified.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to review approval request.",
    };
  }
}

export async function reviewApprovalRequestStateAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  return reviewApprovalRequestAction(formData);
}
