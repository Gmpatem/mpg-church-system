"use server";

import { revalidatePath } from "next/cache";
import { requireChurchWorkspaceAccess } from "@/features/access/queries";
import {
  ensureTodayOccurrence,
  getAttendanceAdminClient,
  getUniversalQrAndOccurrenceForChurch,
  isQrAvailable,
  logAttendanceAudit,
  recordMemberAttendance,
  recordVisitorAttendance,
  rememberMemberDevice,
  replaceUniversalQrForChurch,
  resolveQrByPublicCode,
} from "./server";
import { normalizeAttendancePublicCode } from "./qr";
import {
  getBooleanFromForm,
  getStringFromForm,
} from "./utils";
import type { AttendanceActionState } from "./types";

type ActionInput = AttendanceActionState | FormData;

function resolveFormData(first: ActionInput, second?: FormData) {
  return second ?? (first instanceof FormData ? first : new FormData());
}

function success(message: string, duplicate = false): AttendanceActionState {
  return { ok: true, message, duplicate };
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
    const db = getAttendanceAdminClient() as any;
    await replaceUniversalQrForChurch(db, ctx);

    revalidatePath(`/c/${churchSlug}/attendance`);
    return success("A fresh Sabbath QR link has been created. Print or share the new code.");
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
    return success(result.duplicate ? "Already checked in for today." : "Checked in from kiosk mode.", result.duplicate);
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

export async function confirmPublicMemberAttendanceAction(
  first: ActionInput,
  second?: FormData
): Promise<AttendanceActionState> {
  try {
    const formData = resolveFormData(first, second);
    const publicCode = getStringFromForm(formData, "publicCode");
    const memberId = getStringFromForm(formData, "memberId");
    const rememberDevice = getBooleanFromForm(formData, "rememberDevice");
    const { db, church, occurrence } = await getPublicScanContext(publicCode);
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
        ? "You are already checked in for today. Happy Sabbath."
        : "You are checked in. Happy Sabbath, and God bless you.",
      result.duplicate
    );
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
        ? "You are already checked in for today. We are still glad you are here."
        : `Welcome, ${fullName}. We are grateful to worship with you today.`,
      result.duplicate
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

    if (selectedMemberIds.length === 0) throw new Error("Please choose at least one household member.");

    const { db, church, occurrence } = await getPublicScanContext(publicCode);
    const recognized = await import("./server").then((mod) => mod.findRecognizedMember(db, church.id));

    if (!recognized?.member?.household_id) {
      throw new Error("Household check-in needs a remembered member device. Please check in your own name first.");
    }

    const { data: allowedMembers, error: allowedError } = await db
      .from("members")
      .select("id")
      .eq("church_id", church.id)
      .eq("household_id", recognized.member.household_id)
      .in("id", selectedMemberIds);

    if (allowedError) throw new Error(allowedError.message);

    const allowedIds = new Set((allowedMembers ?? []).map((row: any) => row.id));
    if (allowedIds.size === 0) throw new Error("Those household members could not be verified.");

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
        ? `${saved} household member${saved === 1 ? "" : "s"} checked in. God bless your family today.`
        : "Everyone selected was already checked in for today.",
      saved === 0 && duplicates > 0
    );
  } catch (error) {
    return failure(error);
  }
}
