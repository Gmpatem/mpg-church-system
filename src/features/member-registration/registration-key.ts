"use server";

import { createClient } from "@/lib/supabase/server";
import { requireChurchRole } from "@/features/access/queries";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";
import { generateRegistrationKey } from "./registration-key-utils";

export async function rotateRegistrationKeyAction(churchSlug: string): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  try {
    const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
    const supabase = await createClient();
    const key = await generateRegistrationKey();

    const { error } = await supabase.rpc("rotate_member_registration_key", {
      p_church_id: ctx.churchId,
      p_plain_key: key,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, key };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to rotate registration key.",
    };
  }
}

export async function enableRegistrationAction(
  churchSlug: string,
  input: { isEnabled: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
    const supabase = await createClient();

    const { error } = await supabase
      .from("church_member_registration_settings")
      .upsert({
        church_id: ctx.churchId,
        is_enabled: input.isEnabled,
        updated_by_user_id: ctx.userId,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update registration settings.",
    };
  }
}
