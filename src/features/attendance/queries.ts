import "server-only";

import QRCode from "qrcode";
import { requireChurchAccess, requireChurchWorkspaceAccess } from "@/features/access/queries";
import {
  findRecognizedMember,
  getAttendanceAdminClient,
  isQrAvailable,
  mapChurch,
  mapOccurrence,
  mapPublicMember,
  mapQrCode,
  recordMemberAttendance,
  resolveQrByPublicCode,
  ensureTodayOccurrence,
} from "./server";
import {
  buildPublicAttendanceScanUrl,
  getAttendanceDisplayName,
  getAttendanceWelcomeMessage,
  getChurchTodayIsoDate,
} from "./utils";
import type {
  AttendanceMemberOption,
  AttendanceRecordRow,
  AttendanceReviewItemRow,
  AttendanceSummary,
  AttendanceSummaryRecord,
  AttendanceWorkspaceData,
  PublicAttendanceHouseholdMember,
  PublicAttendanceInitialData,
  PublicAttendanceMember,
  VisitorContactRow,
} from "./types";

function toIdList(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

async function getRowsById(db: any, table: string, columns: string, ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await db.from(table).select(columns).in("id", ids);
  if (error) throw new Error(error.message);
  return data ?? [];
}

function mapVisitor(row: any): VisitorContactRow {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone ?? null,
    email: row.email ?? null,
    householdName: row.household_name ?? null,
    wantsFollowUp: Boolean(row.wants_follow_up),
    interestedInMembership: Boolean(row.interested_in_membership),
    visitCount: Number(row.visit_count ?? 0),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  };
}

function mapRecord(row: any, memberMap: Map<string, any>, visitorMap: Map<string, any>, householdMap: Map<string, any>): AttendanceRecordRow {
  const member = row.member_id ? memberMap.get(row.member_id) : null;
  const visitor = row.visitor_contact_id ? visitorMap.get(row.visitor_contact_id) : null;
  const household = row.household_id ? householdMap.get(row.household_id) : null;

  return {
    id: row.id,
    subjectKind: row.member_id ? "member" : "visitor",
    subjectName: member ? getAttendanceDisplayName(member) : visitor?.full_name ?? "Visitor",
    memberId: row.member_id ?? null,
    visitorContactId: row.visitor_contact_id ?? null,
    householdId: row.household_id ?? null,
    householdName: household?.household_name ?? visitor?.household_name ?? null,
    status: row.status,
    checkInMethod: row.check_in_method,
    checkedInAt: row.checked_in_at,
    checkedInByMemberId: row.checked_in_by_member_id ?? null,
    notes: row.notes ?? null,
    contact: member?.phone ?? member?.email ?? visitor?.phone ?? visitor?.email ?? null,
  };
}

async function getChurchById(db: any, churchId: string) {
  const { data, error } = await db
    .from("churches")
    .select("id, slug, name, timezone, logo_url")
    .eq("id", churchId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAttendanceWorkspaceData(churchSlug: string): Promise<AttendanceWorkspaceData> {
  const ctx = await requireChurchWorkspaceAccess(churchSlug);
  const db = getAttendanceAdminClient() as any;
  const church = await getChurchById(db, ctx.churchId);
  const today = getChurchTodayIsoDate(church.timezone);

  const { data: qrRow, error: qrError } = await db
    .from("attendance_qr_codes")
    .select("id, church_id, public_code, qr_type, title, description, is_permanent, is_active, starts_at, expires_at, created_at, updated_at")
    .eq("church_id", ctx.churchId)
    .eq("qr_type", "sabbath_universal")
    .eq("is_permanent", true)
    .eq("is_active", true)
    .maybeSingle();

  if (qrError) throw new Error(qrError.message);

  let occurrenceRow: any = null;
  if (qrRow) {
    const { data, error } = await db
      .from("attendance_occurrences")
      .select("id, church_id, qr_code_id, occurrence_date, title, source_type, starts_at, ended_at")
      .eq("church_id", ctx.churchId)
      .eq("qr_code_id", qrRow.id)
      .eq("occurrence_date", today)
      .maybeSingle();

    if (error) throw new Error(error.message);
    occurrenceRow = data;
  }

  const [
    memberResult,
    householdResult,
    recordResult,
    visitorResult,
    reviewResult,
    recentOccurrenceResult,
  ] = await Promise.all([
    db
      .from("members")
      .select("id, first_name, last_name, display_name, member_code, membership_status, household_id, household_role, phone, email")
      .eq("church_id", ctx.churchId)
      .neq("membership_status", "transferred")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .limit(500),
    db
      .from("households")
      .select("id, household_name, head_of_household_id")
      .eq("church_id", ctx.churchId)
      .order("household_name", { ascending: true })
      .limit(300),
    occurrenceRow
      ? db
          .from("attendance_records")
          .select("id, member_id, visitor_contact_id, status, check_in_method, checked_in_at, checked_in_by_member_id, household_id, notes")
          .eq("church_id", ctx.churchId)
          .eq("occurrence_id", occurrenceRow.id)
          .neq("status", "removed")
          .order("checked_in_at", { ascending: false })
          .limit(300)
      : Promise.resolve({ data: [], error: null }),
    db
      .from("visitor_contacts")
      .select("id, full_name, phone, email, household_name, wants_follow_up, interested_in_membership, visit_count, first_seen_at, last_seen_at")
      .eq("church_id", ctx.churchId)
      .order("last_seen_at", { ascending: false })
      .limit(50),
    db
      .from("attendance_review_items")
      .select("id, item_type, status, title, description, created_at, member_id, visitor_contact_id")
      .eq("church_id", ctx.churchId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(30),
    db
      .from("attendance_occurrences")
      .select("id, church_id, qr_code_id, occurrence_date, title, source_type, starts_at, ended_at")
      .eq("church_id", ctx.churchId)
      .order("occurrence_date", { ascending: false })
      .limit(8),
  ]);

  for (const result of [memberResult, householdResult, recordResult, visitorResult, reviewResult, recentOccurrenceResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const memberRows = memberResult.data ?? [];
  const householdRows = householdResult.data ?? [];
  const recordRows = recordResult.data ?? [];
  const visitorRows = visitorResult.data ?? [];
  const reviewRows = reviewResult.data ?? [];
  const presentMemberIds = new Set<string>(recordRows.map((row: any) => row.member_id).filter(Boolean));
  const householdMap = new Map<string, any>(householdRows.map((row: any) => [row.id, row]));
  const memberMap = new Map<string, any>(memberRows.map((row: any) => [row.id, row]));
  const visitorMap = new Map<string, any>(visitorRows.map((row: any) => [row.id, row]));

  const missingVisitorIds = toIdList([
    ...recordRows.map((row: any) => row.visitor_contact_id),
    ...reviewRows.map((row: any) => row.visitor_contact_id),
  ]).filter((id) => !visitorMap.has(id));
  const missingMemberIds = toIdList(reviewRows.map((row: any) => row.member_id)).filter((id) => !memberMap.has(id));

  const [extraVisitors, extraMembers] = await Promise.all([
    getRowsById(db, "visitor_contacts", "id, full_name, phone, email, household_name, wants_follow_up, interested_in_membership, visit_count, first_seen_at, last_seen_at", missingVisitorIds),
    getRowsById(db, "members", "id, first_name, last_name, display_name, member_code, membership_status, household_id, household_role, phone, email", missingMemberIds),
  ]);

  for (const visitor of extraVisitors) visitorMap.set(visitor.id, visitor);
  for (const member of extraMembers) memberMap.set(member.id, member);

  const householdMemberCounts = new Map<string, number>();
  for (const member of memberRows) {
    if (!member.household_id) continue;
    householdMemberCounts.set(member.household_id, (householdMemberCounts.get(member.household_id) ?? 0) + 1);
  }

  const records: AttendanceRecordRow[] = recordRows.map((row: any) => mapRecord(row, memberMap, visitorMap, householdMap));
  const reviewItems: AttendanceReviewItemRow[] = reviewRows.map((row: any) => ({
    id: row.id,
    itemType: row.item_type,
    status: row.status,
    title: row.title,
    description: row.description ?? null,
    createdAt: row.created_at,
    memberName: row.member_id ? getAttendanceDisplayName(memberMap.get(row.member_id) ?? {}) : null,
    visitorName: row.visitor_contact_id ? visitorMap.get(row.visitor_contact_id)?.full_name ?? null : null,
  }));

  const memberOptions: AttendanceMemberOption[] = memberRows.map((row: any) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: getAttendanceDisplayName(row),
    memberCode: row.member_code ?? null,
    membershipStatus: row.membership_status,
    householdId: row.household_id ?? null,
    householdName: row.household_id ? householdMap.get(row.household_id)?.household_name ?? null : null,
    householdRole: row.household_role ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    presentToday: presentMemberIds.has(row.id),
  }));

  const householdOptions = householdRows.map((row: any) => {
    const head = row.head_of_household_id ? memberMap.get(row.head_of_household_id) : null;
    return {
      id: row.id,
      name: row.household_name,
      headName: head ? getAttendanceDisplayName(head) : null,
      memberCount: householdMemberCounts.get(row.id) ?? 0,
    };
  });

  const stats = {
    presentMembers: records.filter((record) => record.subjectKind === "member").length,
    visitors: records.filter((record) => record.subjectKind === "visitor").length,
    expectedMembers: memberRows.filter((member: any) => member.membership_status === "active").length,
    pendingReview: reviewItems.length,
    householdCheckIns: records.filter((record) => record.checkInMethod === "household").length,
    totalToday: records.length,
  };

  const scanUrl = qrRow ? await buildPublicAttendanceScanUrl(qrRow.public_code) : null;
  const qrImageDataUrl = scanUrl
    ? await QRCode.toDataURL(scanUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        scale: 8,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
    : null;

  return {
    church: mapChurch(church),
    qrCode: qrRow ? mapQrCode(qrRow) : null,
    scanUrl,
    qrImageDataUrl,
    occurrence: occurrenceRow ? mapOccurrence(occurrenceRow) : null,
    stats,
    members: memberOptions,
    households: householdOptions,
    records,
    visitors: visitorRows.map(mapVisitor),
    reviewItems,
    recentOccurrences: (recentOccurrenceResult.data ?? []).map(mapOccurrence),
  };
}

async function getPublicMemberOptions(db: any, churchId: string) {
  const [membersResult, householdsResult] = await Promise.all([
    db
      .from("members")
      .select("id, first_name, last_name, display_name, member_code, household_id")
      .eq("church_id", churchId)
      .eq("membership_status", "active")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .limit(500),
    db
      .from("households")
      .select("id, household_name")
      .eq("church_id", churchId)
      .limit(300),
  ]);

  if (membersResult.error) throw new Error(membersResult.error.message);
  if (householdsResult.error) throw new Error(householdsResult.error.message);

  const householdMap = new Map<string, string>((householdsResult.data ?? []).map((row: any) => [row.id, row.household_name]));
  return (membersResult.data ?? []).map((member: any) =>
    mapPublicMember(member, member.household_id ? householdMap.get(member.household_id) ?? null : null)
  );
}

export async function getPublicAttendanceScanData(publicCode: string): Promise<PublicAttendanceInitialData> {
  const db = getAttendanceAdminClient() as any;
  const resolved = await resolveQrByPublicCode(db, publicCode);
  const welcomeMessage = getAttendanceWelcomeMessage(publicCode);

  if (!resolved) {
    return {
      publicCode,
      church: null,
      qrCode: null,
      occurrence: null,
      scanUrl: null,
      isAvailable: false,
      unavailableReason: "This attendance link could not be found. Please ask an usher or deacon for today’s QR code.",
      welcomeMessage,
      recognizedMember: null,
      recognizedDuplicate: false,
      householdMembers: [],
      memberOptions: [],
    };
  }

  const { qrCode, church } = resolved;
  const available = isQrAvailable(qrCode);
  if (!available) {
    return {
      publicCode,
      church: mapChurch(church),
      qrCode: mapQrCode(qrCode),
      occurrence: null,
      scanUrl: await buildPublicAttendanceScanUrl(qrCode.public_code),
      isAvailable: false,
      unavailableReason: "This attendance link is not open right now. Please ask a church team member for help.",
      welcomeMessage,
      recognizedMember: null,
      recognizedDuplicate: false,
      householdMembers: [],
      memberOptions: [],
    };
  }

  const occurrence = await ensureTodayOccurrence(db, qrCode, church, null);
  const memberOptions = await getPublicMemberOptions(db, church.id);
  const recognized = await findRecognizedMember(db, church.id);
  let recognizedMember: PublicAttendanceMember | null = null;
  let recognizedDuplicate = false;

  if (recognized) {
    const result = await recordMemberAttendance(db, {
      churchId: church.id,
      occurrenceId: occurrence.id,
      memberId: recognized.member.id,
      method: "recognized_device",
      deviceTokenHash: recognized.tokenHash,
    });
    recognizedDuplicate = result.duplicate;
    recognizedMember = mapPublicMember(recognized.member, null);
  }

  let householdMembers: PublicAttendanceHouseholdMember[] = [];
  if (recognized?.member?.household_id) {
    const [householdMembersResult, presentResult, householdResult] = await Promise.all([
      db
        .from("members")
        .select("id, first_name, last_name, display_name, member_code, household_id")
        .eq("church_id", church.id)
        .eq("household_id", recognized.member.household_id)
        .eq("membership_status", "active")
        .order("last_name", { ascending: true }),
      db
        .from("attendance_records")
        .select("member_id")
        .eq("church_id", church.id)
        .eq("occurrence_id", occurrence.id)
        .neq("status", "removed"),
      db
        .from("households")
        .select("id, household_name")
        .eq("id", recognized.member.household_id)
        .maybeSingle(),
    ]);

    if (householdMembersResult.error) throw new Error(householdMembersResult.error.message);
    if (presentResult.error) throw new Error(presentResult.error.message);
    if (householdResult.error) throw new Error(householdResult.error.message);

    const presentIds = new Set((presentResult.data ?? []).map((row: any) => row.member_id).filter(Boolean));
    const householdName = householdResult.data?.household_name ?? null;
    householdMembers = (householdMembersResult.data ?? []).map((member: any) => ({
      ...mapPublicMember(member, householdName),
      presentToday: presentIds.has(member.id),
    }));

    if (recognizedMember) {
      recognizedMember.householdName = householdName;
    }
  }

  return {
    publicCode,
    church: mapChurch(church),
    qrCode: mapQrCode(qrCode),
    occurrence: mapOccurrence(occurrence),
    scanUrl: await buildPublicAttendanceScanUrl(qrCode.public_code),
    isAvailable: true,
    unavailableReason: null,
    welcomeMessage,
    recognizedMember,
    recognizedDuplicate,
    householdMembers,
    memberOptions,
  };
}

async function loadAttendanceSummaryRows(db: any, churchId: string, filters: { memberId?: string; householdId?: string }) {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  let query = db
    .from("attendance_records")
    .select("id, occurrence_id, checked_in_at, check_in_method, status")
    .eq("church_id", churchId)
    .neq("status", "removed")
    .gte("checked_in_at", since.toISOString())
    .order("checked_in_at", { ascending: false })
    .limit(12);

  query = filters.memberId ? query.eq("member_id", filters.memberId) : query.eq("household_id", filters.householdId);

  const { data: records, error } = await query;
  if (error) throw new Error(error.message);

  const occurrenceIds = toIdList((records ?? []).map((row: any) => row.occurrence_id));
  const occurrences = await getRowsById(
    db,
    "attendance_occurrences",
    "id, occurrence_date, title, source_type, starts_at, ended_at",
    occurrenceIds
  );
  const occurrenceMap = new Map<string, any>(occurrences.map((row: any) => [row.id, row]));

  const recentRecords: AttendanceSummaryRecord[] = (records ?? []).map((row: any) => {
    const occurrence = occurrenceMap.get(row.occurrence_id);
    return {
      id: row.id,
      title: occurrence?.title ?? "Attendance",
      occurrenceDate: occurrence?.occurrence_date ?? row.checked_in_at.slice(0, 10),
      checkedInAt: row.checked_in_at,
      method: row.check_in_method,
      status: row.status,
    };
  });

  return {
    lastSeenAt: recentRecords[0]?.checkedInAt ?? null,
    lastMethod: recentRecords[0]?.method ?? null,
    presentCountLast90Days: recentRecords.length,
    currentMonthPresent: recentRecords.filter((record) => new Date(record.checkedInAt) >= monthStart).length,
    recentRecords: recentRecords.slice(0, 6),
  } satisfies AttendanceSummary;
}

export async function getMemberAttendanceSummary(churchSlug: string, memberId: string): Promise<AttendanceSummary> {
  const ctx = await requireChurchAccess(churchSlug);
  const db = getAttendanceAdminClient() as any;

  return loadAttendanceSummaryRows(db, ctx.churchId, { memberId });
}

export async function getHouseholdAttendanceSummary(churchSlug: string, householdId: string): Promise<AttendanceSummary> {
  const ctx = await requireChurchAccess(churchSlug);
  const db = getAttendanceAdminClient() as any;

  return loadAttendanceSummaryRows(db, ctx.churchId, { householdId });
}
