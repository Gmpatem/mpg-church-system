"use client";

export type TreasuryTabKey =
  | "overview"
  | "transactions"
  | "funds"
  | "requests"
  | "transfers"
  | "reconciliation";

export type TreasuryReconciliationView =
  | "exceptions"
  | "remittance"
  | "allocations"
  | "audit";

export type TreasuryPeriodKey =
  | "this-week"
  | "this-month"
  | "this-quarter"
  | "this-year"
  | "custom";

export type TreasuryDialog =
  | null
  | { type: "money-in" }
  | { type: "money-out" }
  | { type: "create-fund" }
  | { type: "transfer" }
  | { type: "run-remittance" };

export const TREASURY_TABS: Array<{ key: TreasuryTabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "transactions", label: "Transactions" },
  { key: "funds", label: "Funds" },
  { key: "requests", label: "Requests" },
  { key: "transfers", label: "Transfers" },
  { key: "reconciliation", label: "Reconciliation" },
];

export const RECONCILIATION_VIEWS: Array<{
  key: TreasuryReconciliationView;
  label: string;
}> = [
  { key: "exceptions", label: "Exceptions" },
  { key: "remittance", label: "Remittance" },
  { key: "allocations", label: "Allocations" },
  { key: "audit", label: "Audit Trail" },
];

export const PERIOD_OPTIONS: Array<{ key: TreasuryPeriodKey; label: string }> = [
  { key: "this-week", label: "This Week" },
  { key: "this-month", label: "This Month" },
  { key: "this-quarter", label: "This Quarter" },
  { key: "this-year", label: "This Year" },
  { key: "custom", label: "Custom Range" },
];

