export type TreasuryFundType =
  | "tithe"
  | "offering"
  | "donation"
  | "project"
  | "department"
  | "mission"
  | "welfare"
  | "general";

export type TreasuryInflowType =
  | "tithe"
  | "offering"
  | "donation"
  | "special_contribution";

export type TreasuryOutflowType =
  | "project"
  | "evangelism"
  | "mission_remittance"
  | "department_expense"
  | "operations"
  | "welfare"
  | "equipment"
  | "other";

export type TreasuryAllocationKind = "mission_remittance" | "local_retained";

export interface TreasuryFinanceSettings {
  tithe_auto_allocate: boolean;
  offering_auto_allocate: boolean;
  require_reference_numbers: boolean;
  require_member_for_named_inflows: boolean;
  allow_tithe_outflow_only_for_remittance: boolean;
  updated_at?: string | null;
}

export interface TreasuryAllocationPreviewEntry {
  id: string;
  inflow_id: string | null;
  inflow_reference: string | null;
  inflow_type: string;
  inflow_date: string | null;
  inflow_amount: number | null;
  allocation_kind: TreasuryAllocationKind | string;
  target_fund_id: string | null;
  target_fund_name: string | null;
  allocated_amount: number;
  status: string;
  rule_name: string | null;
  created_at: string | null;
}
