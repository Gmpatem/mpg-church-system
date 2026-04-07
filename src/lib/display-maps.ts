export const memberStatusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  visitor: "Visitor",
  transferred: "Transferred",
  deceased: "Deceased",
};

export const memberTypeLabels: Record<string, string> = {
  regular: "Regular Member",
  adherent: "Adherent",
  child: "Child",
  youth: "Youth",
  senior: "Senior",
};

export const inviteStatusLabels: Record<string, string> = {
  pending: "Waiting to be used",
  claimed: "Completed",
  revoked: "Cancelled",
  expired: "Expired",
};

export const inviteTypeLabels: Record<string, string> = {
  member: "Direct Member Invite",
  church_open: "Open Registration Link",
};

export const workflowStateLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Awaiting Approval",
  approved: "Approved",
  published: "Published",
  rejected: "Not Approved",
};

export const eventStatusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const approvalStageLabels: Record<string, string> = {
  submitted: "Submitted",
  office_review: "Office Review",
  leadership_review: "Leadership Review",
  treasury_review: "Finance Review",
  approved: "Approved",
  rejected: "Not Approved",
  cancelled: "Cancelled",
};

export const approvalSourceLabels: Record<string, string> = {
  invite_onboarding: "From Invite",
  manual_request: "Manual Request",
};

export const inflowTypeLabels: Record<string, string> = {
  tithe: "Tithe",
  offering: "Offering",
  donation: "Donation",
  special_contribution: "Special Contribution",
};

export const outflowTypeLabels: Record<string, string> = {
  project: "Project",
  evangelism: "Evangelism",
  mission_remittance: "Mission Remittance",
  department_expense: "Department Expense",
  operations: "Operations",
  welfare: "Welfare",
  equipment: "Equipment",
  other: "Other",
};

export const fundTypeLabels: Record<string, string> = {
  tithe: "Tithe Fund",
  offering: "Offering Fund",
  special: "Special Fund",
};

export const genderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const maritalStatusLabels: Record<string, string> = {
  single: "Single",
  married: "Married",
  widowed: "Widowed",
  divorced: "Divorced",
  separated: "Separated",
};

/**
 * Returns the display label for a DB enum value.
 * Falls back to a capitalized, space-separated version of the raw value
 * so unknown values still render readably (e.g. "new_status" → "New Status").
 */
export function getLabel(
  map: Record<string, string>,
  value: string | null | undefined
): string {
  if (!value) return "—";
  return map[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
