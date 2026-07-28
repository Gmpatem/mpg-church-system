export type AttendanceQrType = "sabbath_universal" | "temporary_activity";

export type AttendanceSourceType = "sabbath_universal" | "temporary_activity" | "manual";

export type AttendanceRecordStatus = "present" | "late" | "excused" | "removed";

export type AttendanceCheckInMethod =
  | "qr_self"
  | "recognized_device"
  | "household"
  | "kiosk"
  | "manual_admin"
  | "visitor";

export type AttendanceReviewStatus = "open" | "resolved" | "dismissed";

export type AttendanceReviewType =
  | "visitor_follow_up"
  | "membership_interest"
  | "duplicate_scan"
  | "manual_review";

export interface AttendanceChurch {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  logoUrl: string | null;
}

export interface AttendanceQrCode {
  id: string;
  publicCode: string;
  qrType: AttendanceQrType;
  title: string;
  description: string | null;
  isPermanent: boolean;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceOccurrence {
  id: string;
  occurrenceDate: string;
  title: string;
  sourceType: AttendanceSourceType;
  startsAt: string | null;
  endedAt: string | null;
}

export interface AttendanceHouseholdOption {
  id: string;
  name: string;
  headName: string | null;
  memberCount: number;
}

export interface AttendanceMemberOption {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  memberCode: string | null;
  membershipStatus: string;
  householdId: string | null;
  householdName: string | null;
  householdRole: string | null;
  phone: string | null;
  email: string | null;
  presentToday: boolean;
}

export interface AttendanceRecordRow {
  id: string;
  subjectKind: "member" | "visitor";
  subjectName: string;
  memberId: string | null;
  visitorContactId: string | null;
  householdId: string | null;
  householdName: string | null;
  status: AttendanceRecordStatus;
  checkInMethod: AttendanceCheckInMethod;
  checkedInAt: string;
  checkedInByMemberId: string | null;
  checkedInByUserId?: string | null;
  markedByName?: string | null;
  notes: string | null;
  contact: string | null;
}

export interface VisitorContactRow {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  householdName: string | null;
  wantsFollowUp: boolean;
  interestedInMembership: boolean;
  visitCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  followUpStatus?: "not_contacted" | "contacted" | "needs_membership_review" | "no_follow_up_needed" | null;
  followUpNotes?: string | null;
  contactedAt?: string | null;
}

export interface AttendanceReviewItemRow {
  id: string;
  itemType: AttendanceReviewType;
  status: AttendanceReviewStatus;
  title: string;
  description: string | null;
  createdAt: string;
  memberName: string | null;
  visitorName: string | null;
}

export interface AttendanceWorkspaceStats {
  presentMembers: number;
  visitors: number;
  expectedMembers: number;
  pendingReview: number;
  householdCheckIns: number;
  totalToday: number;
}

export interface AttendanceWorkspaceData {
  church: AttendanceChurch;
  qrCode: AttendanceQrCode | null;
  scanUrl: string | null;
  qrImageDataUrl: string | null;
  occurrence: AttendanceOccurrence | null;
  stats: AttendanceWorkspaceStats;
  members: AttendanceMemberOption[];
  households: AttendanceHouseholdOption[];
  records: AttendanceRecordRow[];
  visitors: VisitorContactRow[];
  reviewItems: AttendanceReviewItemRow[];
  recentOccurrences: AttendanceOccurrence[];
}

export interface PublicAttendanceMember {
  id: string;
  displayName: string;
  memberCode: string | null;
  householdId: string | null;
  householdName: string | null;
}

export interface PublicAttendanceHouseholdMember extends PublicAttendanceMember {
  presentToday: boolean;
}


export interface PublicMemberLookupResult {
  id: string;
  displayName: string;
  householdName: string | null;
  memberCode: string | null;
  maskedPhone: string | null;
  maskedEmail: string | null;
}
export interface PublicAttendanceInitialData {
  publicCode: string;
  church: AttendanceChurch | null;
  qrCode: AttendanceQrCode | null;
  occurrence: AttendanceOccurrence | null;
  scanUrl: string | null;
  isAvailable: boolean;
  unavailableReason: string | null;
  welcomeMessage: string;
  recognizedMember: PublicAttendanceMember | null;
  recognizedDuplicate: boolean;
  householdMembers: PublicAttendanceHouseholdMember[];
  memberOptions: PublicAttendanceMember[];
}

export interface AttendanceActionState {
  ok: boolean;
  message?: string;
  error?: string;
  duplicate?: boolean;
  matches?: PublicMemberLookupResult[];
  lookupValue?: string;
  publicCode?: string;
  scanUrl?: string;
  resetDevice?: boolean;
}

export interface AttendanceSummaryRecord {
  id: string;
  title: string;
  occurrenceDate: string;
  checkedInAt: string;
  method: AttendanceCheckInMethod;
  status: AttendanceRecordStatus;
}

export interface AttendanceSummary {
  lastSeenAt: string | null;
  lastMethod: AttendanceCheckInMethod | null;
  presentCountLast90Days: number;
  currentMonthPresent: number;
  recentRecords: AttendanceSummaryRecord[];
}

