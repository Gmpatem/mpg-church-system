export interface ChurchAnnouncementListItem {
  id: string;
  church_id: string;
  department_id?: string | null;
  title: string;
  body: string;
  audience_scope: "church_wide" | "leaders_only" | "members_only" | "department_members";
  status: "draft" | "pending_approval" | "published" | "archived" | "rejected";
  requires_acknowledgement: boolean;
  published_at?: string | null;
  expires_at?: string | null;
  created_by_user_id?: string | null;
  approved_by_user_id?: string | null;
  approval_note?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  department_name?: string | null;
  created_by_name?: string | null;
}

export interface AnnouncementWorkspaceItem {
  id: string;
  workspace_id: string;
  church_id: string;
  department_id?: string | null;
  title: string;
  body: string;
  audience_scope: string;
  status: string;
  requires_acknowledgement: boolean;
  published_at?: string | null;
  expires_at?: string | null;
  created_by_user_id?: string | null;
  approved_by_user_id?: string | null;
  approval_note?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  department_name?: string | null;
  created_by_name?: string | null;
  source_type: "church" | "department";
  source_label: string;
  approval_status?: string | null;
  approval_stage?: string | null;
  approval_request_id?: string | null;
}

export interface CreateChurchAnnouncementInput {
  churchId: string;
  departmentId?: string | null;
  title: string;
  body: string;
  audienceScope: "church_wide" | "leaders_only" | "members_only" | "department_members";
  requiresAcknowledgement?: boolean;
  expiresAt?: string | null;
}
