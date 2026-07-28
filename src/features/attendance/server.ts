import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ChurchAccessContext } from "@/features/access/types";
import {
  createAttendanceDeviceToken,
  getAttendanceDeviceToken,
  hashAttendanceDeviceToken,
  setAttendanceDeviceToken,
  clearAttendanceDeviceToken,
} from "./device-token";
import { createAttendancePublicCode } from "./qr";
import {
  getAttendanceDisplayName,
  getChurchTodayIsoDate,
} from "./utils";
import type {
  AttendanceCheckInMethod,
  AttendanceChurch,
  AttendanceOccurrence,
  AttendanceQrCode,
  PublicAttendanceMember,
} from "./types";

type DbClient = ReturnType<typeof createAdminClient>;

interface ResolvedQr {
  qrCode: any;
  church: any;
}

export function getAttendanceAdminClient() {
  return createAdminClient() as any as DbClient;
}

export function mapQrCode(row: any): AttendanceQrCode {
  return {
    id: row.id,
    publicCode: row.public_code,
    qrType: row.qr_type,
    title: row.title,
    description: row.description ?? null,
    isPermanent: Boolean(row.is_permanent),
    isActive: Boolean(row.is_active),
    startsAt: row.starts_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOccurrence(row: any): AttendanceOccurrence {
  return {
    id: row.id,
    occurrenceDate: row.occurrence_date,
    title: row.title,
    sourceType: row.source_type,
    startsAt: row.starts_at ?? null,
    endedAt: row.ended_at ?? null,
  };
}

export function mapChurch(row: any): AttendanceChurch {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    timezone: row.timezone || "UTC",
    logoUrl: row.logo_url ?? null,
  };
}

export function mapPublicMember(row: any, householdName: string | null = null): PublicAttendanceMember {
  return {
    id: row.id,
    displayName: getAttendanceDisplayName(row),
    memberCode: row.member_code ?? null,
    householdId: row.household_id ?? null,
    householdName,
  };
}

export function ensureAttendanceError(error: any, fallback: string): never {
  throw new Error(error?.message || fallback);
}

export async function resolveQrByPublicCode(db: DbClient, publicCode: string): Promise<ResolvedQr | null> {
  const { data: qrCode, error } = await (db as any)
    .from("attendance_qr_codes")
    .select("id, church_id, public_code, qr_type, title, description, is_permanent, is_active, starts_at, expires_at, created_at, updated_at")
    .eq("public_code", publicCode)
    .maybeSingle();

  if (error) ensureAttendanceError(error, "Attendance QR could not be loaded.");
  if (!qrCode) return null;

  const { data: church, error: churchError } = await (db as any)
    .from("churches")
    .select("id, slug, name, timezone, logo_url")
    .eq("id", qrCode.church_id)
    .eq("is_active", true)
    .maybeSingle();

  if (churchError) ensureAttendanceError(churchError, "Church could not be loaded.");
  if (!church) return null;

  return { qrCode, church };
}

export function isQrAvailable(qrCode: any) {
  if (!qrCode?.is_active) return false;

  const now = new Date();
  if (qrCode.starts_at && new Date(qrCode.starts_at) > now) return false;
  if (qrCode.expires_at && new Date(qrCode.expires_at) < now) return false;

  return true;
}

export async function ensureUniversalQrForChurch(db: DbClient, ctx: ChurchAccessContext) {
  const { data: existing, error: existingError } = await (db as any)
    .from("attendance_qr_codes")
    .select("id, church_id, public_code, qr_type, title, description, is_permanent, is_active, starts_at, expires_at, created_at, updated_at")
    .eq("church_id", ctx.churchId)
    .eq("qr_type", "sabbath_universal")
    .eq("is_permanent", true)
    .eq("is_active", true)
    .maybeSingle();

  if (existingError) ensureAttendanceError(existingError, "Attendance QR could not be loaded.");
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await (db as any)
      .from("attendance_qr_codes")
      .insert({
        church_id: ctx.churchId,
        public_code: createAttendancePublicCode(),
        qr_type: "sabbath_universal",
        title: "Sabbath attendance",
        description: "Universal Sabbath attendance link for members and visitors.",
        is_permanent: true,
        is_active: true,
        created_by_user_id: ctx.userId,
      })
      .select("id, church_id, public_code, qr_type, title, description, is_permanent, is_active, starts_at, expires_at, created_at, updated_at")
      .single();

    if (!error && data) {
      await logAttendanceAudit(db, {
        churchId: ctx.churchId,
        actorUserId: ctx.userId,
        action: "attendance_qr_created",
        entityType: "attendance_qr_codes",
        entityId: data.id,
      });
      return data;
    }

    if (!String(error?.message ?? "").toLowerCase().includes("duplicate")) {
      ensureAttendanceError(error, "Attendance QR could not be created.");
    }
  }

  throw new Error("Attendance QR could not be created after several attempts.");
}

export async function replaceUniversalQrForChurch(db: DbClient, ctx: ChurchAccessContext) {
  await (db as any)
    .from("attendance_qr_codes")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("church_id", ctx.churchId)
    .eq("qr_type", "sabbath_universal")
    .eq("is_permanent", true)
    .eq("is_active", true);

  const qrCode = await ensureUniversalQrForChurch(db, ctx);
  await logAttendanceAudit(db, {
    churchId: ctx.churchId,
    actorUserId: ctx.userId,
    action: "attendance_qr_replaced",
    entityType: "attendance_qr_codes",
    entityId: qrCode.id,
  });

  return qrCode;
}

export async function ensureTodayOccurrence(db: DbClient, qrCode: any, church: any, actorUserId?: string | null) {
  const occurrenceDate = getChurchTodayIsoDate(church.timezone);

  const { data: existing, error: existingError } = await (db as any)
    .from("attendance_occurrences")
    .select("id, church_id, qr_code_id, occurrence_date, title, source_type, starts_at, ended_at")
    .eq("church_id", qrCode.church_id)
    .eq("qr_code_id", qrCode.id)
    .eq("occurrence_date", occurrenceDate)
    .maybeSingle();

  if (existingError) ensureAttendanceError(existingError, "Attendance service could not be loaded.");
  if (existing) return existing;

  const { data, error } = await (db as any)
    .from("attendance_occurrences")
    .insert({
      church_id: qrCode.church_id,
      qr_code_id: qrCode.id,
      occurrence_date: occurrenceDate,
      title: qrCode.qr_type === "temporary_activity" ? qrCode.title : "Sabbath Worship",
      source_type: qrCode.qr_type,
      starts_at: new Date().toISOString(),
      created_by_user_id: actorUserId ?? null,
    })
    .select("id, church_id, qr_code_id, occurrence_date, title, source_type, starts_at, ended_at")
    .single();

  if (error) {
    const message = String(error.message ?? "").toLowerCase();
    if (message.includes("duplicate")) {
      const { data: duplicate } = await (db as any)
        .from("attendance_occurrences")
        .select("id, church_id, qr_code_id, occurrence_date, title, source_type, starts_at, ended_at")
        .eq("church_id", qrCode.church_id)
        .eq("qr_code_id", qrCode.id)
        .eq("occurrence_date", occurrenceDate)
        .maybeSingle();
      if (duplicate) return duplicate;
    }
    ensureAttendanceError(error, "Attendance service could not be prepared.");
  }

  return data;
}

export async function getUniversalQrAndOccurrenceForChurch(db: DbClient, ctx: ChurchAccessContext) {
  const qrCode = await ensureUniversalQrForChurch(db, ctx);

  const { data: church, error: churchError } = await (db as any)
    .from("churches")
    .select("id, slug, name, timezone, logo_url")
    .eq("id", ctx.churchId)
    .single();

  if (churchError) ensureAttendanceError(churchError, "Church could not be loaded.");

  const occurrence = await ensureTodayOccurrence(db, qrCode, church, ctx.userId);
  return { qrCode, occurrence, church };
}

export async function recordMemberAttendance(
  db: DbClient,
  params: {
    churchId: string;
    occurrenceId: string;
    memberId: string;
    method: AttendanceCheckInMethod;
    actorUserId?: string | null;
    actorMemberId?: string | null;
    deviceTokenHash?: string | null;
    notes?: string | null;
  }
) {
  const { data: member, error: memberError } = await (db as any)
    .from("members")
    .select("id, church_id, household_id, membership_status")
    .eq("id", params.memberId)
    .eq("church_id", params.churchId)
    .maybeSingle();

  if (memberError) ensureAttendanceError(memberError, "Member could not be checked.");
  if (!member) throw new Error("This member could not be found for this church.");
  if (member.membership_status === "transferred") throw new Error("Transferred members cannot be marked present.");

  const { data: existing, error: existingError } = await (db as any)
    .from("attendance_records")
    .select("id, checked_in_at, status, check_in_method")
    .eq("occurrence_id", params.occurrenceId)
    .eq("member_id", params.memberId)
    .neq("status", "removed")
    .maybeSingle();

  if (existingError) ensureAttendanceError(existingError, "Attendance record could not be checked.");
  if (existing) return { record: existing, duplicate: true };

  const { data, error } = await (db as any)
    .from("attendance_records")
    .insert({
      church_id: params.churchId,
      occurrence_id: params.occurrenceId,
      member_id: params.memberId,
      status: "present",
      check_in_method: params.method,
      checked_in_by_user_id: params.actorUserId ?? null,
      checked_in_by_member_id: params.actorMemberId ?? null,
      device_token_hash: params.deviceTokenHash ?? null,
      household_id: member.household_id ?? null,
      notes: params.notes ?? null,
    })
    .select("id, checked_in_at, status, check_in_method")
    .single();

  if (error) {
    const message = String(error.message ?? "").toLowerCase();
    if (message.includes("duplicate")) {
      const { data: duplicate } = await (db as any)
        .from("attendance_records")
        .select("id, checked_in_at, status, check_in_method")
        .eq("occurrence_id", params.occurrenceId)
        .eq("member_id", params.memberId)
        .neq("status", "removed")
        .maybeSingle();
      if (duplicate) return { record: duplicate, duplicate: true };
    }
    ensureAttendanceError(error, "Attendance could not be saved.");
  }

  await logAttendanceAudit(db, {
    churchId: params.churchId,
    actorUserId: params.actorUserId ?? null,
    actorMemberId: params.actorMemberId ?? null,
    action: "member_marked_present",
    entityType: "attendance_records",
    entityId: data.id,
    metadata: { method: params.method, member_id: params.memberId },
  });

  return { record: data, duplicate: false };
}

export async function rememberMemberDevice(db: DbClient, params: { churchId: string; memberId: string }) {
  const existingToken = await getAttendanceDeviceToken();
  const token = existingToken || createAttendanceDeviceToken();
  const tokenHash = hashAttendanceDeviceToken(token);
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await (db as any)
    .from("attendance_member_devices")
    .select("id, member_id, revoked_at")
    .eq("device_token_hash", tokenHash)
    .maybeSingle();

  if (existingError) ensureAttendanceError(existingError, "Device recognition could not be checked.");
  if (existing && existing.member_id !== params.memberId && !existing.revoked_at) {
    throw new Error("This device is already remembered for another member. Please ask an usher to help reset it.");
  }

  const { error } = await (db as any)
    .from("attendance_member_devices")
    .upsert(
      {
        church_id: params.churchId,
        member_id: params.memberId,
        device_token_hash: tokenHash,
        label: "Confirmed Sabbath attendance device",
        last_seen_at: now,
        confirmed_at: now,
        revoked_at: null,
      },
      { onConflict: "device_token_hash" }
    );

  if (error) ensureAttendanceError(error, "This device could not be remembered.");
  await setAttendanceDeviceToken(token);

  return tokenHash;
}

export async function findRecognizedMember(db: DbClient, churchId: string) {
  const token = await getAttendanceDeviceToken();
  if (!token) return null;

  const tokenHash = hashAttendanceDeviceToken(token);
  const { data: device, error: deviceError } = await (db as any)
    .from("attendance_member_devices")
    .select("id, member_id")
    .eq("church_id", churchId)
    .eq("device_token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (deviceError) ensureAttendanceError(deviceError, "Remembered device could not be checked.");
  if (!device) return null;

  const { data: member, error: memberError } = await (db as any)
    .from("members")
    .select("id, display_name, first_name, last_name, member_code, household_id, membership_status")
    .eq("church_id", churchId)
    .eq("id", device.member_id)
    .maybeSingle();

  if (memberError) ensureAttendanceError(memberError, "Remembered member could not be loaded.");
  if (!member || member.membership_status === "transferred") return null;

  await (db as any)
    .from("attendance_member_devices")
    .update({ last_used_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
    .eq("id", device.id);

  return { member, tokenHash };
}

export async function recordVisitorAttendance(
  db: DbClient,
  params: {
    churchId: string;
    occurrenceId: string;
    fullName: string;
    phone?: string | null;
    email?: string | null;
    householdName?: string | null;
    notes?: string | null;
    wantsFollowUp: boolean;
    interestedInMembership: boolean;
  }
) {
  const now = new Date().toISOString();
  const phone = params.phone?.trim() || null;
  const email = params.email?.trim().toLowerCase() || null;
  const fullName = params.fullName.trim();

  let visitor: any = null;
  if (email || phone) {
    let query = (db as any)
      .from("visitor_contacts")
      .select("id, visit_count")
      .eq("church_id", params.churchId);

    query = email ? query.eq("email", email) : query.eq("phone", phone);
    const { data, error } = await query.maybeSingle();
    if (error) ensureAttendanceError(error, "Visitor contact could not be checked.");
    visitor = data;
  }

  if (visitor) {
    const { data, error } = await (db as any)
      .from("visitor_contacts")
      .update({
        full_name: fullName,
        phone,
        email,
        household_name: params.householdName || null,
        notes: params.notes || null,
        wants_follow_up: params.wantsFollowUp,
        interested_in_membership: params.interestedInMembership,
        visit_count: Number(visitor.visit_count ?? 0) + 1,
        last_seen_at: now,
        updated_at: now,
      })
      .eq("id", visitor.id)
      .select("id, visit_count")
      .single();

    if (error) ensureAttendanceError(error, "Visitor contact could not be updated.");
    visitor = data;
  } else {
    const { data, error } = await (db as any)
      .from("visitor_contacts")
      .insert({
        church_id: params.churchId,
        full_name: fullName,
        phone,
        email,
        household_name: params.householdName || null,
        notes: params.notes || null,
        wants_follow_up: params.wantsFollowUp,
        interested_in_membership: params.interestedInMembership,
      })
      .select("id, visit_count")
      .single();

    if (error) ensureAttendanceError(error, "Visitor contact could not be saved.");
    visitor = data;
  }

  const { data: existing, error: existingError } = await (db as any)
    .from("attendance_records")
    .select("id, checked_in_at, status, check_in_method")
    .eq("occurrence_id", params.occurrenceId)
    .eq("visitor_contact_id", visitor.id)
    .neq("status", "removed")
    .maybeSingle();

  if (existingError) ensureAttendanceError(existingError, "Visitor attendance could not be checked.");
  if (existing) return { record: existing, visitorId: visitor.id, duplicate: true };

  const { data: record, error: recordError } = await (db as any)
    .from("attendance_records")
    .insert({
      church_id: params.churchId,
      occurrence_id: params.occurrenceId,
      visitor_contact_id: visitor.id,
      status: "present",
      check_in_method: "visitor",
      notes: params.notes || null,
    })
    .select("id, checked_in_at, status, check_in_method")
    .single();

  if (recordError) ensureAttendanceError(recordError, "Visitor attendance could not be saved.");

  if (params.wantsFollowUp || params.interestedInMembership) {
    const itemType = params.interestedInMembership ? "membership_interest" : "visitor_follow_up";
    await (db as any)
      .from("attendance_review_items")
      .insert({
        church_id: params.churchId,
        occurrence_id: params.occurrenceId,
        attendance_record_id: record.id,
        visitor_contact_id: visitor.id,
        item_type: itemType,
        title: params.interestedInMembership ? "Visitor asked about membership" : "Visitor asked for follow-up",
        description: `${fullName} marked present as a visitor today.`,
      });
  }

  await logAttendanceAudit(db, {
    churchId: params.churchId,
    action: "visitor_attendance_recorded",
    entityType: "attendance_records",
    entityId: record.id,
    metadata: { visitor_id: visitor.id },
  });

  return { record, visitorId: visitor.id, duplicate: false };
}

export async function logAttendanceAudit(
  db: DbClient,
  params: {
    churchId: string;
    actorUserId?: string | null;
    actorMemberId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  await (db as any)
    .from("attendance_audit_logs")
    .insert({
      church_id: params.churchId,
      actor_user_id: params.actorUserId ?? null,
      actor_member_id: params.actorMemberId ?? null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
}


const ATTENDANCE_SERVER_MANAGE_ROLES = [
  "platform_owner",
  "platform_admin",
  "platform_support",
  "church_admin",
  "pastor",
  "elder",
  "clerk",
  "church_secretary",
  "tech_team",
] as const;

function normalizeLookupText(value: string) {
  return value.trim().toLowerCase();
}

function digitsOnly(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

function maskPhone(value: string | null | undefined) {
  const digits = digitsOnly(value);
  if (!digits) return null;
  return digits.length <= 4 ? `•••• ${digits}` : `•••• ${digits.slice(-4)}`;
}

function maskEmail(value: string | null | undefined) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email.includes("@")) return null;
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}•••@${domain}`;
}

function isAttendanceManagerRole(role: string) {
  return ATTENDANCE_SERVER_MANAGE_ROLES.includes(role as (typeof ATTENDANCE_SERVER_MANAGE_ROLES)[number]);
}

export function assertAttendanceManager(ctx: ChurchAccessContext) {
  if (ctx.isPlatformAdmin || ctx.roles.some(isAttendanceManagerRole)) return;
  throw new Error("You do not have permission to manage attendance.");
}

export async function lookupPublicMembers(
  db: DbClient,
  params: { churchId: string; lookupValue: string }
) {
  const raw = params.lookupValue.trim();
  const normalized = normalizeLookupText(raw);
  const rawDigits = digitsOnly(raw);

  if (normalized.length < 3 && rawDigits.length < 4) {
    throw new Error("Enter a phone number, email, or member code to find your member record.");
  }

  const { data: members, error } = await (db as any)
    .from("members")
    .select("id, first_name, last_name, display_name, member_code, household_id, phone, email, membership_status")
    .eq("church_id", params.churchId)
    .eq("membership_status", "active")
    .limit(750);

  if (error) ensureAttendanceError(error, "Member lookup could not be completed.");

  const matches = (members ?? []).filter((member: any) => {
    const memberCode = normalizeLookupText(member.member_code ?? "");
    const email = normalizeLookupText(member.email ?? "");
    const phoneDigits = digitsOnly(member.phone);

    return (
      (memberCode && memberCode === normalized) ||
      (email && email === normalized) ||
      (rawDigits.length >= 4 && phoneDigits.endsWith(rawDigits.slice(-4))) ||
      (rawDigits.length >= 7 && phoneDigits.includes(rawDigits))
    );
  }).slice(0, 5);

  const householdIds = Array.from(new Set(matches.map((member: any) => member.household_id).filter(Boolean)));
  let householdMap = new Map<string, string>();

  if (householdIds.length > 0) {
    const { data: households, error: householdError } = await (db as any)
      .from("households")
      .select("id, household_name")
      .in("id", householdIds);

    if (householdError) ensureAttendanceError(householdError, "Household context could not be loaded.");
    householdMap = new Map((households ?? []).map((row: any) => [row.id, row.household_name]));
  }

  return matches.map((member: any) => ({
    id: member.id,
    displayName: getAttendanceDisplayName(member),
    householdName: member.household_id ? householdMap.get(member.household_id) ?? null : null,
    memberCode: member.member_code ?? null,
    maskedPhone: maskPhone(member.phone),
    maskedEmail: maskEmail(member.email),
  }));
}

export async function verifyPublicMemberLookup(
  db: DbClient,
  params: { churchId: string; memberId: string; lookupValue: string }
) {
  const matches = await lookupPublicMembers(db, {
    churchId: params.churchId,
    lookupValue: params.lookupValue,
  });

  if (!matches.some((match: { id: string }) => match.id === params.memberId)) {
    throw new Error("We could not confirm that member record with the phone, email, or member code you entered.");
  }

  return true;
}

export async function forgetRecognizedAttendanceDevice(db: DbClient, churchId: string) {
  const token = await getAttendanceDeviceToken();
  if (!token) {
    await clearAttendanceDeviceToken();
    return { reset: true };
  }

  const tokenHash = hashAttendanceDeviceToken(token);
  await (db as any)
    .from("attendance_member_devices")
    .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("church_id", churchId)
    .eq("device_token_hash", tokenHash);

  await clearAttendanceDeviceToken();
  return { reset: true };
}

export async function createTemporaryActivityQrForChurch(
  db: DbClient,
  ctx: ChurchAccessContext,
  params: { title: string; description?: string | null; startsAt?: string | null; expiresAt?: string | null }
) {
  assertAttendanceManager(ctx);

  const title = params.title.trim();
  if (title.length < 3) throw new Error("Activity title is required.");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await (db as any)
      .from("attendance_qr_codes")
      .insert({
        church_id: ctx.churchId,
        public_code: createAttendancePublicCode(),
        qr_type: "temporary_activity",
        title,
        description: params.description?.trim() || "Temporary activity attendance link.",
        is_permanent: false,
        is_active: true,
        starts_at: params.startsAt || null,
        expires_at: params.expiresAt || null,
        created_by_user_id: ctx.userId,
      })
      .select("id, church_id, public_code, qr_type, title, description, is_permanent, is_active, starts_at, expires_at, created_at, updated_at")
      .single();

    if (!error && data) {
      await logAttendanceAudit(db, {
        churchId: ctx.churchId,
        actorUserId: ctx.userId,
        action: "temporary_attendance_qr_created",
        entityType: "attendance_qr_codes",
        entityId: data.id,
        metadata: { title },
      });
      return data;
    }

    if (!String(error?.message ?? "").toLowerCase().includes("duplicate")) {
      ensureAttendanceError(error, "Temporary attendance QR could not be created.");
    }
  }

  throw new Error("Temporary attendance QR could not be created after several attempts.");
}

export async function removeAttendanceRecordForChurch(
  db: DbClient,
  params: { churchId: string; recordId: string; actorUserId: string; reason?: string | null }
) {
  const { data: record, error: loadError } = await (db as any)
    .from("attendance_records")
    .select("id, notes")
    .eq("church_id", params.churchId)
    .eq("id", params.recordId)
    .maybeSingle();

  if (loadError) ensureAttendanceError(loadError, "Attendance record could not be loaded.");
  if (!record) throw new Error("Attendance record was not found.");

  const reason = params.reason?.trim() || "Corrected by attendance team.";
  const note = `${record.notes ? `${record.notes}\n` : ""}Correction: ${reason}`;

  const { error } = await (db as any)
    .from("attendance_records")
    .update({ status: "removed", notes: note, updated_at: new Date().toISOString() })
    .eq("church_id", params.churchId)
    .eq("id", params.recordId);

  if (error) ensureAttendanceError(error, "Attendance record could not be corrected.");

  await logAttendanceAudit(db, {
    churchId: params.churchId,
    actorUserId: params.actorUserId,
    action: "attendance_record_removed",
    entityType: "attendance_records",
    entityId: params.recordId,
    metadata: { reason },
  });
}

export async function markVisitorContactFollowUp(
  db: DbClient,
  params: { churchId: string; visitorContactId: string; actorUserId: string; status: string; notes?: string | null }
) {
  const status = params.status || "contacted";
  const now = new Date().toISOString();

  const { error } = await (db as any)
    .from("visitor_contacts")
    .update({
      follow_up_status: status,
      follow_up_notes: params.notes?.trim() || null,
      contacted_at: status === "contacted" ? now : null,
      contacted_by_user_id: params.actorUserId,
      updated_at: now,
    })
    .eq("church_id", params.churchId)
    .eq("id", params.visitorContactId);

  if (error) ensureAttendanceError(error, "Visitor follow-up could not be updated. Make sure the attendance MVP hardening migration has been applied.");

  if (status === "needs_membership_review") {
    await (db as any)
      .from("attendance_review_items")
      .insert({
        church_id: params.churchId,
        visitor_contact_id: params.visitorContactId,
        item_type: "membership_interest",
        title: "Visitor membership interest",
        description: params.notes?.trim() || "Visitor needs membership follow-up.",
      });
  }

  await logAttendanceAudit(db, {
    churchId: params.churchId,
    actorUserId: params.actorUserId,
    action: "visitor_follow_up_updated",
    entityType: "visitor_contacts",
    entityId: params.visitorContactId,
    metadata: { status },
  });
}
