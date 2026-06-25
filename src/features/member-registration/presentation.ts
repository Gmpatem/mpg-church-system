import type { ChurchMemberRegistration, ChurchMemberRegistrationHouseholdMember } from "./types";

export function formatRegistrationName(registration: ChurchMemberRegistration): string {
  const parts = [registration.first_name, registration.last_name].filter(Boolean);
  return parts.join(" ") || "Unnamed applicant";
}

export function formatHouseholdAction(action: string | null): string {
  switch (action) {
    case "self_only":
      return "Registering only myself";
    case "existing_household":
      return "Belongs to an existing household";
    case "new_household":
      return "Create a new household";
    case "not_sure":
      return "Not sure";
    default:
      return "Unknown";
  }
}

export function formatRegistrationStatus(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "needs_member_duplicate_review":
      return "Member duplicate";
    case "needs_household_duplicate_review":
      return "Household match";
    case "needs_review":
      return "Needs review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "converted":
      return "Converted";
    case "merged":
      return "Merged";
    default:
      return status;
  }
}

export function getRegistrationStatusTone(status: string): "default" | "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "converted":
    case "merged":
      return "success";
    case "pending":
      return "neutral";
    case "needs_member_duplicate_review":
    case "needs_household_duplicate_review":
    case "needs_review":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
}

export function familyMemberDisplayName(member: ChurchMemberRegistrationHouseholdMember): string {
  return [member.first_name, member.last_name].filter(Boolean).join(" ") || "Unnamed family member";
}

export function formatRelationship(relationship: string | null): string {
  if (!relationship) return "Other";
  return relationship.charAt(0).toUpperCase() + relationship.slice(1);
}
