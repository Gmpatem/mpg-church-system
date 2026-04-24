export type DepartmentFundRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "processed"
  | "cancelled";

export interface DepartmentFinanceTransaction {
  id: string;
  kind: "inflow" | "outflow";
  amount: number;
  date: string;
  category: string;
  referenceNumber: string | null;
  note: string | null;
  memberName: string | null;
  payee: string | null;
}

export interface DepartmentFundRequestRecord {
  id: string;
  church_id: string;
  department_id: string;
  requested_by_user_id: string;
  title: string;
  purpose: string;
  amount: number;
  outflow_type: string;
  fund_id: string | null;
  outflow_date: string;
  reference_number: string | null;
  event_id: string | null;
  preferred_fund_id: string | null;
  payee: string | null;
  project_name: string | null;
  note: string | null;
  requested_date: string;
  status: DepartmentFundRequestStatus;
  treasury_decision_note: string | null;
  treasury_reviewed_by_user_id: string | null;
  treasury_reviewed_at: string | null;
  processed_outflow_id: string | null;
  processed_by_user_id: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentFinancePermissions {
  canSubmitRequests: boolean;
  canReviewRequests: boolean;
  canProcessRequests: boolean;
  isDepartmentLeader: boolean;
}

export interface DepartmentFinanceWorkspaceData {
  department: {
    id: string;
    church_id: string;
    department_name: string;
    code: string | null;
    is_active: boolean;
  };
  totals: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
  transactions: DepartmentFinanceTransaction[];
  requests: Array<
    DepartmentFundRequestRecord & {
      requested_by_label: string;
      reviewed_by_label: string | null;
      preferred_fund_label: string | null;
    }
  >;
  requestSummary: {
    pending: number;
    approved: number;
    rejected: number;
    processed: number;
    cancelled: number;
  };
  financeOptions: {
    funds: Array<{
      id: string;
      name: string;
      code: string;
      fund_type: string;
      department_id: string | null;
      is_department_default: boolean;
    }>;
  };
  permissions: DepartmentFinancePermissions;
}
