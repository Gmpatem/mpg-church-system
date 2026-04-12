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

export const eventTypeLabels: Record<string, string> = {
  worship: "Worship Service",
  prayer: "Prayer Meeting",
  youth: "Youth Program",
  children: "Children's Ministry",
  bible_study: "Bible Study",
  outreach: "Outreach",
  fellowship: "Fellowship",
  conference: "Conference",
  seminar: "Seminar",
  department: "Department Event",
  other: "Other",
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
  donation: "Donation Fund",
  project: "Project Fund",
  department: "Department Fund",
  mission: "Mission Fund",
  welfare: "Welfare Fund",
  general: "General Fund",
};

export const allocationKindLabels: Record<string, string> = {
  mission_remittance: "Mission Remittance",
  local_retained: "Local Retained",
};

export const allocationStatusLabels: Record<string, string> = {
  pending: "Pending",
  applied: "Applied",
  posted: "Posted",
  skipped: "Skipped",
  failed: "Failed",
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
// Commerce display maps
export const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  credit: "Credit",
};

export const paymentMethodBadgeColors: Record<string, string> = {
  cash: "bg-emerald-100 text-emerald-800",
  gcash: "bg-blue-100 text-blue-800",
  credit: "bg-amber-100 text-amber-800",
};

export const orderStatusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const orderStatusBadgeColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
};

export const paymentStatusLabels: Record<string, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  refunded: "Refunded",
};

export const paymentStatusBadgeColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export const printingStatusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const printingStatusBadgeColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const paperSizeLabels: Record<string, string> = {
  letter: "Letter (8.5\" × 11\")",
  legal: "Legal (8.5\" × 14\")",
  a4: "A4 (210mm × 297mm)",
  short: "Short (8.5\" × 11\")",
  long: "Long (8.5\" × 13\")",
};

export const colorModeLabels: Record<string, string> = {
  black_white: "Black & White",
  color: "Full Color",
  grayscale: "Grayscale",
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
