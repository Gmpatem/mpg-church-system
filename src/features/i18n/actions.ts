"use server";

import { createClient } from "@/lib/supabase/server";
import type { Language } from "./I18nProvider";

export async function updateUserPreferredLanguage(
  language: Language
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ preferred_language: language, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
