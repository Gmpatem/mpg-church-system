export type DepartmentRecord = {
  id: string;
  church_id: string;
  department_name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DepartmentAssignmentRecord = {
  id: string;
  church_id: string;
  member_id: string;
  department_id: string | null;
  department_name: string | null;
  role_title: string | null;
  start_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member?: {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
    member_code: string | null;
    email: string | null;
    phone: string | null;
    membership_status: string | null;
  } | null;
};

export type DepartmentListItem = DepartmentRecord & {
  member_count: number;
  active_member_count: number;
};

export type DepartmentFormValues = {
  department_name: string;
  code: string;
  description: string;
  is_active: boolean;
};

export type DepartmentAssignmentFormValues = {
  member_id: string;
  department_id: string;
  role_title: string;
  start_date: string;
  is_active: boolean;
};

export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};
