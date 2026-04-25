import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireChurchAccess } from "@/features/access/queries";
import type { ApprovalModuleKey, ApprovalPolicyRecord, ApprovalRequestRecord } from "./types";

const APPROVAL_POLICY_FIELDS =
  "id, church_id, module_key, request_type, requires_office_review, requires_leadership_review, requires_treasury_review, final_approver_role_code, is_active";
const APPROVAL_REQUEST_FIELDS =
  "id, church_id, module_key, entity_type, entity_id, request_type, submitted_by_user_id, current_stage, status, priority, current_assignee_role_code, payload, submitted_at, decided_at, decided_by_user_id, decision_note, created_at, updated_at";

export async function getApprovalPolicy(
  churchSlug: string,
  moduleKey: ApprovalModuleKey,
  requestType: string
): Promise<ApprovalPolicyRecord | null> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("approval_policies")
    .select(APPROVAL_POLICY_FIELDS)
    .eq("church_id", ctx.churchId)
    .eq("module_key", moduleKey)
    .eq("request_type", requestType)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as ApprovalPolicyRecord | null;
}

export async function getApprovalRequestByEntity(
  churchSlug: string,
  entityType: string,
  entityId: string
): Promise<ApprovalRequestRecord | null> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("approval_requests")
    .select(APPROVAL_REQUEST_FIELDS)
    .eq("church_id", ctx.churchId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as ApprovalRequestRecord | null;
}

export async function getPendingApprovalQueue(
  churchSlug: string,
  moduleKey?: ApprovalModuleKey
): Promise<ApprovalRequestRecord[]> {
  const ctx = await requireChurchAccess(churchSlug);
  const supabase = await createClient();

  let query = supabase
    .from("approval_requests")
    .select(APPROVAL_REQUEST_FIELDS)
    .eq("church_id", ctx.churchId)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });

  if (moduleKey) {
    query = query.eq("module_key", moduleKey);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ApprovalRequestRecord[]);
}

export async function getMyPendingApprovalCount(
  churchId: string,
  userId: string,
  roles: string[]
): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("church_id", churchId)
      .eq("status", "pending")
      .in("current_assignee_role_code", roles);
    return count ?? 0;
  } catch {
    return 0;
  }
}
