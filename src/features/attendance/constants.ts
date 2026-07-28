import type { AttendanceCheckInMethod, AttendanceRecordStatus, AttendanceReviewType } from "./types";

export const ATTENDANCE_DEVICE_COOKIE = "mpg_attendance_device";
export const ATTENDANCE_DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 395;

export const ATTENDANCE_MANAGE_ROLES = [
  "platform_owner",
  "platform_admin",
  "platform_support",
  "church_admin",
  "pastor",
  "elder",
  "clerk",
  "church_secretary",
  "treasurer",
] as const;

export const ATTENDANCE_WELCOME_MESSAGES = [
  "We are grateful to worship with you today.",
  "May the Lord bless your Sabbath worship.",
  "Welcome home. We are glad you are here.",
  "Happy Sabbath. May your heart find rest today.",
  "Thank you for joining the church family today.",
];

export const ATTENDANCE_METHOD_LABELS: Record<AttendanceCheckInMethod, string> = {
  qr_self: "QR self check-in",
  recognized_device: "Remembered device",
  household: "Family attendance",
  kiosk: "Kiosk check-in",
  manual_admin: "Manual entry",
  visitor: "Visitor welcome",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceRecordStatus, string> = {
  present: "Present",
  late: "Late",
  excused: "Excused",
  removed: "Removed",
};

export const ATTENDANCE_REVIEW_TYPE_LABELS: Record<AttendanceReviewType, string> = {
  visitor_follow_up: "Visitor follow-up",
  membership_interest: "Membership interest",
  duplicate_scan: "Duplicate scan",
  manual_review: "Manual review",
};
