export function getApprovalModuleLabel(moduleKey: string) {
  if (moduleKey === "events") return "Events";
  if (moduleKey === "announcements") return "Announcements";
  if (moduleKey === "access") return "Access Control";
  if (moduleKey === "leadership") return "Leadership";
  if (moduleKey === "members") return "Members";
  if (moduleKey === "treasury") return "Treasury";
  return "Office";
}

export function getApprovalStageLabel(stage: string) {
  if (stage === "submitted") return "Submitted";
  if (stage === "office_review") return "Office Review";
  if (stage === "leadership_review") return "Leadership Review";
  if (stage === "treasury_review") return "Treasury Review";
  if (stage === "approved") return "Approved";
  if (stage === "rejected") return "Rejected";
  if (stage === "changes_requested") return "Changes Requested";
  if (stage === "cancelled") return "Cancelled";
  return stage.replaceAll("_", " ");
}

export function getApprovalStatusLabel(status: string) {
  if (status === "changes_requested") return "Changes Requested";
  return status.replaceAll("_", " ");
}

export function getApprovalReviewLabel(moduleKey: string) {
  if (moduleKey === "events") return "Review Event";
  if (moduleKey === "announcements") return "Review Announcement";
  if (moduleKey === "access") return "Review Access";
  if (moduleKey === "leadership") return "Review Leadership";
  if (moduleKey === "treasury") return "Review Treasury";
  return "Review";
}
