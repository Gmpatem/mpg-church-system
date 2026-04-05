export type ApprovalModuleKey =
  | "events"
  | "announcements"
  | "access"
  | "leadership"
  | "members"
  | "treasury";

export type ApprovalStage =
  | "submitted"
  | "office_review"
  | "leadership_review"
  | "treasury_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "cancelled";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "cancelled";

export type ApprovalDecision =
  | "approved"
  | "rejected"
  | "changes_requested"
  | "cancelled";

export interface ApprovalRequestRecord {
  id: string;
  church_id: string;
  module_key: ApprovalModuleKey;
  entity_type: string;
  entity_id: string;
  request_type: string;
  submitted_by_user_id: string | null;
  current_stage: ApprovalStage;
  status: ApprovalStatus;
  priority: "low" | "normal" | "high" | "urgent";
  current_assignee_role_code: string | null;
  payload: Record<string, unknown>;
  submitted_at: string;
  decided_at: string | null;
  decided_by_user_id: string | null;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalPolicyRecord {
  id: string;
  church_id: string;
  module_key: ApprovalModuleKey;
  request_type: string;
  requires_office_review: boolean;
  requires_leadership_review: boolean;
  requires_treasury_review: boolean;
  final_approver_role_code: string | null;
  is_active: boolean;
}
