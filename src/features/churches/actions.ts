"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCoreChurchDepartments } from "@/features/departments/core";
import { validateCreateChurchInput } from "./validators";
import type { ActionState } from "@/features/access/types";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createChurchAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState | null> {
  const input = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug").toLowerCase(),
    defaultLanguage: (getString(formData, "default_language") || "en") as "en" | "fr",
    timezone: getString(formData, "timezone") || "UTC",
    country: getString(formData, "country"),
    city: getString(formData, "city"),
  };

  // Validate input before any side effects
  const validationError = validateCreateChurchInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "You must be logged in to create a church." };
  }

  const { data, error } = await supabase.rpc("create_church_with_owner", {
    p_name: input.name,
    p_slug: input.slug,
    p_country: input.country || null,
    p_city: input.city || null,
    p_timezone: input.timezone || "UTC",
    p_user_id: user.id,
  });

  if (error) {
    if (error.message?.includes("churches_slug_unique")) {
      return {
        ok: false,
        error: "That church slug is already in use. Please choose another one.",
      };
    }

    return { ok: false, error: error.message };
  }

  const churchId =
    typeof data === "string"
      ? data
      : data?.id ?? null;
  const slug =
    typeof data === "object" && data?.slug
      ? data.slug
      : input.slug;

  const { data: church, error: churchLookupError } = await supabase
    .from("churches")
    .select("id")
    .eq(churchId ? "id" : "slug", churchId ?? slug)
    .maybeSingle();

  if (churchLookupError || !church) {
    return {
      ok: false,
      error:
        "The church was created, but its default ministries could not be initialized. Open the church and retry the ministry setup.",
    };
  }

  const departmentSetup = await ensureCoreChurchDepartments(supabase, church.id);
  if (!departmentSetup.ok) {
    return {
      ok: false,
      error: `The church was created, but its default ministries could not be initialized: ${departmentSetup.error}`,
    };
  }

  // Redirect to the final destination - NOT inside try-catch
  // redirect() throws NEXT_REDIRECT which must not be caught
  redirect(`/c/${slug}`);
}
