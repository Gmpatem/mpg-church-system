"use server";

import { revalidatePath } from "next/cache";
import { requireChurchWorkspaceAccess } from "@/features/access/queries";
import {
  assertAttendanceManager,
  createTemporaryActivityQrForChurch,
  ensureTodayOccurrence,
  forgetRecognizedAttendanceDevice,
  getAttendanceAdminClient,
  getUniversalQrAndOccurrenceForChurch,
  isQrAvailable,
  logAttendanceAudit,
  lookupPublicMembers,
  markVisitorContactFollowUp,
  rememberMemberDevice,
  recordMemberAttendance,
  recordVisitorAttendance,
  resolveAttendanceSessionMember,
  removeAttendanceRecordForChurch,
  replaceUniversalQrForChurch,
  resolveQrByPublicCode,
  verifyPublicMemberLookup,
} from "./server";
import { normalizeAttendancePublicCode } from "./qr";
import {
  buildPublicAttendanceScanUrl,
  getBooleanFromForm,
  getStringFromForm,
} from "./utils";
import type { AttendanceActionState } from "./types";

type ActionInput = AttendanceActionState | FormData;

function resolveFormData(first: ActionInput, second?: FormData) {
  return second ?? (first instanceof FormData ? first : new FormData());
}

function success(message: string, extra: Partial<AttendanceActionState> = {}): AttendanceActionState {
  return { ok: true, message, ...extra };
}

function failure(error: unknown): AttendanceActionState {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Attendance could not be saved. Please try again.",
  };
}

async function getPublicScanContext(publicCodeValue: string) {
  const publicCode = normalizeAttendancePublicCode(publicCodeValue);
  const db = getAttendanceAdminClient() as any;
  const resolved = await resolveQrByPublicCode(db, publicCode);

  if (!resolved) throw new Error("This attendance link could not be found. Please ask an usher for today’s QR code.");
  if (!isQrAvailable(resolved.qrCode)) throw new Error("This attendance link is not open right now.");

  const occurrence = await ensureTodayOccurrence(db, resolved.qrCode, resolved.church, null);
  return { db, ...resolved, occurrence };
}

export async function createUniversalSabbathQrAction(first: ActionInput, second?: FormData): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const churchSlug = getStringFromForm(formData, "churchSlug");
    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    assertAttendanceManager(ctx);
    const db = getAttendanceAdminClient() as any;
    const qrCode = await getUniversalQrAndOccurrenceForChurch(db, ctx);

    revalidatePath(`/c/${churchSlug}/attendance`);
    return success(`Universal Sabbath QR is ready for ${ctx.churchName ?? "this church"}. Code: ${qrCode.qrCode.public_code}`);
  } catch (error) {
    return failure(error);
  }
}

export async function regenerateUniversalSabbathQrAction(first: ActionInput, second?: FormData): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const churchSlug = getStringFromForm(formData, "churchSlug");
    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    assertAttendanceManager(ctx);
    const db = getAttendanceAdminClient() as any;
    await replaceUniversalQrForChurch(db, ctx);

    revalidatePath(`/c/${churchSlug}/attendance`);
    return success("A fresh Sabbath QR link has been created. Print or share the new code.");
  } catch (error) {
    return failure(error);
  }
}

export async function createTemporaryActivityQrAction(first: ActionInput, second?: FormData): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const churchSlug = getStringFromForm(formData, "churchSlug");
    const title = getStringFromForm(formData, "title");
    const description = getStringFromForm(formData, "description");
    const startsAt = getStringFromForm(formData, "startsAt");
    const expiresAt = getStringFromForm(formData, "expiresAt");
    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    assertAttendanceManager(ctx);
    const db = getAttendanceAdminClient() as any;
    const qrCode = await createTemporaryActivityQrForChurch(db, ctx, {
      title,
      description,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    const scanUrl = await buildPublicAttendanceScanUrl(qrCode.public_code);

    revalidatePath(`/c/${churchSlug}/attendance`);
    return success("Temporary activity QR created. Use the link below for this program.", {
      publicCode: qrCode.public_code,
      scanUrl,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function markKioskAttendanceAction(first: ActionInput, second?: FormData): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const churchSlug = getStringFromForm(formData, "churchSlug");
    const memberId = getStringFromForm(formData, "memberId");
    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    assertAttendanceManager(ctx);
    const db = getAttendanceAdminClient() as any;
    const { occurrence } = await getUniversalQrAndOccurrenceForChurch(db, ctx);
    const result = await recordMemberAttendance(db, {
      churchId: ctx.churchId,
      occurrenceId: occurrence.id,
      memberId,
      method: "kiosk",
      actorUserId: ctx.userId,
    });

    revalidatePath(`/c/${churchSlug}/attendance`);
    return success(result.duplicate ? "Already marked present for today." : "Marked present by attendance support.", result.duplicate ? { duplicate: true } : {});
  } catch (error) {
    return failure(error);
  }
}

export async function removeAttendanceRecordAction(first: ActionInput, second?: FormData): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const churchSlug = getStringFromForm(formData, "churchSlug");
    const recordId = getStringFromForm(formData, "recordId");
    const reason = getStringFromForm(formData, "reason");
    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    assertAttendanceManager(ctx);
    const db = getAttendanceAdminClient() as any;
    await removeAttendanceRecordForChurch(db, {
      churchId: ctx.churchId,
      recordId,
      actorUserId: ctx.userId,
      reason,
    });

    revalidatePath(`/c/${churchSlug}/attendance`);
    return success("Attendance record corrected and removed from today’s present list.");
  } catch (error) {
    return failure(error);
  }
}

export async function markVisitorFollowUpAction(first: ActionInput, second?: FormData): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const churchSlug = getStringFromForm(formData, "churchSlug");
    const visitorContactId = getStringFromForm(formData, "visitorContactId");
    const status = getStringFromForm(formData, "status") || "contacted";
    const notes = getStringFromForm(formData, "notes");
    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    assertAttendanceManager(ctx);
    const db = getAttendanceAdminClient() as any;
    await markVisitorContactFollowUp(db, {
      churchId: ctx.churchId,
      visitorContactId,
      actorUserId: ctx.userId,
      status,
      notes,
    });

    revalidatePath(`/c/${churchSlug}/attendance`);
    return success("Visitor follow-up updated.");
  } catch (error) {
    return failure(error);
  }
}

export async function resolveAttendanceReviewItemAction(first: ActionInput, second?: FormData): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const churchSlug = getStringFromForm(formData, "churchSlug");
    const reviewItemId = getStringFromForm(formData, "reviewItemId");
    const nextStatus = getStringFromForm(formData, "status") || "resolved";
    const ctx = await requireChurchWorkspaceAccess(churchSlug);
    assertAttendanceManager(ctx);
    const db = getAttendanceAdminClient() as any;

    const { error } = await db
      .from("attendance_review_items")
      .update({
        status: nextStatus,
        resolved_at: new Date().toISOString(),
        resolved_by_user_id: ctx.userId,
      })
      .eq("church_id", ctx.churchId)
      .eq("id", reviewItemId);

    if (error) throw new Error(error.message);

    await logAttendanceAudit(db, {
      churchId: ctx.churchId,
      actorUserId: ctx.userId,
      action: "attendance_review_item_resolved",
      entityType: "attendance_review_items",
      entityId: reviewItemId,
      metadata: { status: nextStatus },
    });

    revalidatePath(`/c/${churchSlug}/attendance`);
    return success("Review item updated.");
  } catch (error) {
    return failure(error);
  }
}

export async function lookupPublicMemberAction(first: ActionInput, second?: FormData): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const publicCode = getStringFromForm(formData, "publicCode");
    const lookupValue = getStringFromForm(formData, "lookupValue");
    const { db, church } = await getPublicScanContext(publicCode);
    const matches = await lookupPublicMembers(db, { churchId: church.id, lookupValue });

    return success(
      matches.length === 0
        ? "No matching active member record was found. Check your phone, email, or member code, or ask an usher for help."
        : "Please confirm the matching member record below.",
      { matches, lookupValue }
    );
  } catch (error) {
    return failure(error);
  }
}

export async function confirmPublicMemberAttendanceAction(
  first: ActionInput,
  second?: FormData
): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const publicCode = getStringFromForm(formData, "publicCode");
    const memberId = getStringFromForm(formData, "memberId");
    const lookupValue = getStringFromForm(formData, "lookupValue");
    const rememberDevice = getBooleanFromForm(formData, "rememberDevice");
    const { db, church, occurrence } = await getPublicScanContext(publicCode);

    await verifyPublicMemberLookup(db, { churchId: church.id, memberId, lookupValue });
    const tokenHash = rememberDevice ? await rememberMemberDevice(db, { churchId: church.id, memberId }) : null;

    const result = await recordMemberAttendance(db, {
      churchId: church.id,
      occurrenceId: occurrence.id,
      memberId,
      method: "qr_self",
      deviceTokenHash: tokenHash,
    });

    return success(
      result.duplicate
        ? "You are already marked present for today. Happy Sabbath."
        : "Your attendance has been recorded. Happy Sabbath, and God bless you.",
      result.duplicate ? { duplicate: true } : {}
    );
  } catch (error) {
    return failure(error);
  }
}

export async function rememberPublicAttendancePhoneAction(
  first: ActionInput,
  second?: FormData
): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const publicCode = getStringFromForm(formData, "publicCode");
    const memberId = getStringFromForm(formData, "memberId");
    const { db, church } = await getPublicScanContext(publicCode);
    const sessionMember = await resolveAttendanceSessionMember(db, church.id);

    if (sessionMember.status !== "linked" || sessionMember.member.id !== memberId) {
      throw new Error("We could not confirm this Member Portal session for that member. Please use member lookup or ask Attendance Support.");
    }

    await rememberMemberDevice(db, {
      churchId: church.id,
      memberId: sessionMember.member.id,
      profileId: sessionMember.profileId,
    });

    return success("This phone is now trusted for future Sabbath attendance.", { rememberedDevice: true });
  } catch (error) {
    return failure(error);
  }
}

export async function forgetPublicAttendanceDeviceAction(
  first: ActionInput,
  second?: FormData
): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const publicCode = getStringFromForm(formData, "publicCode");
    const { db, church } = await getPublicScanContext(publicCode);
    await forgetRecognizedAttendanceDevice(db, church.id);
    return success("This phone will no longer mark attendance automatically.", { resetDevice: true });
  } catch (error) {
    return failure(error);
  }
}

export async function requestPublicAttendanceReviewAction(
  first: ActionInput,
  second?: FormData
): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const publicCode = getStringFromForm(formData, "publicCode");
    const memberId = getStringFromForm(formData, "memberId");
    const attendanceRecordId = getStringFromForm(formData, "attendanceRecordId");
    const { db, church, occurrence } = await getPublicScanContext(publicCode);

    const { data: record, error: recordError } = await db
      .from("attendance_records")
      .select("id, member_id")
      .eq("church_id", church.id)
      .eq("occurrence_id", occurrence.id)
      .eq("id", attendanceRecordId)
      .eq("member_id", memberId)
      .neq("status", "removed")
      .maybeSingle();

    if (recordError) throw new Error(recordError.message);
    if (!record) throw new Error("We could not find today’s attendance mark to send for review.");

    const { data: existingReview, error: existingError } = await db
      .from("attendance_review_items")
      .select("id")
      .eq("church_id", church.id)
      .eq("occurrence_id", occurrence.id)
      .eq("attendance_record_id", record.id)
      .eq("item_type", "manual_review")
      .eq("status", "open")
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (!existingReview) {
      const { error: reviewError } = await db
        .from("attendance_review_items")
        .insert({
          church_id: church.id,
          occurrence_id: occurrence.id,
          attendance_record_id: record.id,
          member_id: memberId,
          item_type: "manual_review",
          title: "Attendance identity review requested",
          description: "A scanner tapped This is not me after automatic attendance recognition.",
        });

      if (reviewError) throw new Error(reviewError.message);
    }

    await logAttendanceAudit(db, {
      churchId: church.id,
      action: "attendance_identity_review_requested",
      entityType: "attendance_records",
      entityId: record.id,
      metadata: { member_id: memberId, public_code: publicCode },
    });

    return success("We’ll ask an admin/deacon to review this attendance mark.", { reviewRequested: true });
  } catch (error) {
    return failure(error);
  }
}

export async function recordPublicVisitorAttendanceAction(
  first: ActionInput,
  second?: FormData
): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const publicCode = getStringFromForm(formData, "publicCode");
    const fullName = getStringFromForm(formData, "fullName");
    const phone = getStringFromForm(formData, "phone");
    const email = getStringFromForm(formData, "email");
    const householdName = getStringFromForm(formData, "householdName");
    const notes = getStringFromForm(formData, "notes");
    const wantsFollowUp = getBooleanFromForm(formData, "wantsFollowUp");
    const interestedInMembership = getBooleanFromForm(formData, "interestedInMembership");

    if (fullName.length < 2) throw new Error("Please enter your name so we can welcome you properly.");

    const { db, church, occurrence } = await getPublicScanContext(publicCode);
    const result = await recordVisitorAttendance(db, {
      churchId: church.id,
      occurrenceId: occurrence.id,
      fullName,
      phone,
      email,
      householdName,
      notes,
      wantsFollowUp,
      interestedInMembership,
    });

    return success(
      result.duplicate
        ? "Your visit has already been recorded for today. We are still glad you are here."
        : `Welcome, ${fullName}. Your visit has been recorded. Happy Sabbath.`,
      result.duplicate ? { duplicate: true } : {}
    );
  } catch (error) {
    return failure(error);
  }
}

export async function recordPublicHouseholdAttendanceAction(
  first: ActionInput,
  second?: FormData
): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const publicCode = getStringFromForm(formData, "publicCode");
    const selectedMemberIds = formData
      .getAll("memberIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    if (selectedMemberIds.length === 0) throw new Error("Please choose at least one family member.");

    const { db, church, occurrence } = await getPublicScanContext(publicCode);
    const recognized = await import("./server").then((mod) => mod.findRecognizedMember(db, church.id));

    if (!recognized?.member?.household_id) {
      throw new Error("Family attendance needs a remembered member device. Please mark yourself present first.");
    }

    const { data: allowedMembers, error: allowedError } = await db
      .from("members")
      .select("id")
      .eq("church_id", church.id)
      .eq("household_id", recognized.member.household_id)
      .in("id", selectedMemberIds);

    if (allowedError) throw new Error(allowedError.message);

    const allowedIds = new Set((allowedMembers ?? []).map((row: any) => row.id));
    if (allowedIds.size === 0) throw new Error("Those family members could not be verified.");

    let saved = 0;
    let duplicates = 0;
    for (const memberId of selectedMemberIds) {
      if (!allowedIds.has(memberId)) continue;
      const result = await recordMemberAttendance(db, {
        churchId: church.id,
        occurrenceId: occurrence.id,
        memberId,
        method: "household",
        actorMemberId: recognized.member.id,
        deviceTokenHash: recognized.tokenHash,
      });
      if (result.duplicate) duplicates += 1;
      else saved += 1;
    }

    return success(
      saved > 0
        ? `${saved} family member${saved === 1 ? "" : "s"} marked present. God bless your family today.`
        : "Everyone selected was already marked present for today.",
      saved === 0 && duplicates > 0 ? { duplicate: true } : {}
    );
  } catch (error) {
    return failure(error);
  }
}
