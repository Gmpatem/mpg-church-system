"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess, requireChurchRole } from "@/features/access/queries";
import type { ApprovalDecision, ApprovalModuleKey } from "./types";
import { getApprovalPolicy } from "./queries";

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

  const terminalStage =
    params.decision === "approved"
      ? "approved"
      : params.decision === "rejected"
      ? "rejected"
      : params.decision === "changes_requested"
      ? "changes_requested"
      : "cancelled";

  const terminalStatus =
    params.decision === "approved"
      ? "approved"
      : params.decision === "rejected"
      ? "rejected"
      : params.decision === "changes_requested"
      ? "changes_requested"
      : "cancelled";

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
