import type { MinistryDutyStatus, MinistryPriority, MinistryTaskStatus } from "./types";

export const MINISTRY_DUTY_STATUS_LABELS: Record<MinistryDutyStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  served: "Served",
  missed: "Missed",
  replacement_requested: "Replacement requested",
  replaced: "Replaced",
  cancelled: "Cancelled",
};

export const MINISTRY_TASK_STATUS_LABELS: Record<MinistryTaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

export const MINISTRY_PRIORITY_LABELS: Record<MinistryPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};

export const DEACON_DUTY_TEMPLATE = [
  { name: "Attendance Support", systemKey: "attendance_support", iconKey: "users", description: "Help mark present members who could not scan the QR.", requiresAttendanceSupport: true, sortOrder: 5 },
  { name: "Door Welcome", systemKey: "door_welcome", iconKey: "door", description: "Welcome members and visitors at the entrance.", requiresAttendanceSupport: false, sortOrder: 10 },
  { name: "Offering Collection", systemKey: "offering_collection", iconKey: "hand-coins", description: "Assist with collecting offerings during worship.", requiresAttendanceSupport: false, sortOrder: 20 },
  { name: "Offering Count", systemKey: "offering_count", iconKey: "calculator", description: "Count offerings with the assigned treasury team.", requiresAttendanceSupport: false, sortOrder: 30 },
  { name: "Sanctuary Cleaning", systemKey: "sanctuary_cleaning", iconKey: "sparkles", description: "Coordinate cleaning and sanctuary readiness.", requiresAttendanceSupport: false, sortOrder: 40 },
  { name: "Communion Prep", systemKey: "communion_prep", iconKey: "cup", description: "Support communion preparation and order.", requiresAttendanceSupport: false, sortOrder: 50 },
];

export const GENERIC_MINISTRY_DUTY_TEMPLATE = [
  { name: "Service Lead", systemKey: "service_lead", iconKey: "crown", description: "Lead or coordinate this ministry activity.", requiresAttendanceSupport: false, sortOrder: 10 },
  { name: "Support Role", systemKey: "support_role", iconKey: "users", description: "Support the ministry activity or event.", requiresAttendanceSupport: false, sortOrder: 20 },
  { name: "Setup / Preparation", systemKey: "setup", iconKey: "calendar", description: "Prepare people, equipment, or resources before the activity.", requiresAttendanceSupport: false, sortOrder: 30 },
  { name: "Follow-up", systemKey: "follow_up", iconKey: "message", description: "Follow up with members or visitors after the activity.", requiresAttendanceSupport: false, sortOrder: 40 },
];

export function templateForScopeName(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("deacon") || lower.includes("usher")) return DEACON_DUTY_TEMPLATE;
  return GENERIC_MINISTRY_DUTY_TEMPLATE;
}