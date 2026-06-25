"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import { getString } from "@/lib/domain/validation";
import type { ActionState } from "@/features/access/types";

export async function rejectRegistrationAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const churchSlug = getString(formData, "churchSlug");
    const registrationId = getString(formData, "registrationId");
    const reviewNote = getString(formData, "reviewNote");

    const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
    const supabase = await createClient();

    if (!registrationId) {
      return { ok: false, error: "Registration ID is required." };
    }

    const { error } = await supabase
      .from("church_member_registrations")
      .update({
        status: "rejected",
        reviewed_by_user_id: ctx.userId,
        reviewed_at: new Date().toISOString(),
        review_note: reviewNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId)
      .eq("church_id", ctx.churchId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(`/c/${churchSlug}/members?view=onboarding`);

    return { ok: true, message: "Registration rejected." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to reject registration.",
    };
  }
}
