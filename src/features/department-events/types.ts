export interface DepartmentEventItem {
  id: string;
  church_id: string;
  department_id?: string | null;
  title: string;
  description?: string | null;
  event_type: string;
  location?: string | null;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  status: "scheduled" | "completed" | "cancelled";
  workflow_state: "draft" | "pending_approval" | "approved" | "published" | "rejected";
  approval_note?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  department_name?: string | null;
}

export interface DepartmentEventDepartment {
  id: string;
  department_name: string;
  description?: string | null;
}
