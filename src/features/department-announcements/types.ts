export interface DepartmentAnnouncementListItem {
  id: string;
  church_id: string;
  department_id: string;
  title: string;
  body: string;
  audience_scope: "department_members" | "leaders_only" | "selected_members";
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

export interface DepartmentAnnouncementDepartment {
  id: string;
  department_name: string;
  description?: string | null;
}
