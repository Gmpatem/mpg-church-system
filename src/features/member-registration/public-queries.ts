"use server";

import { createClient } from "@/lib/supabase/server";

export type PublicRegistrationPageData = {
  church: {
    id: string;
    name: string;
    slug: string;
    country: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  } | null;
  settings: {
    isEnabled: boolean;
    welcomeMessage: string | null;
    successMessage: string | null;
    collectDateOfBirth: boolean;
    collectEmergencyContact: boolean;
    collectHouseholdInformation: boolean;
    collectDepartmentInterests: boolean;
  };
  departments: { id: string; department_name: string }[];
};

export async function getPublicRegistrationPageData(
  churchSlug: string
): Promise<PublicRegistrationPageData> {
  const supabase = await createClient();

  const { data: church, error: churchError } = await supabase
    .from("churches")
    .select("id, name, slug, country, city, address, phone, email, logo_url")
    .eq("slug", churchSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (churchError) {
    throw new Error(churchError.message);
  }

  if (!church) {
    return {
      church: null,
      settings: defaultSettings(),
      departments: [],
    };
  }

  const { data: settings, error: settingsError } = await supabase
    .from("church_member_registration_settings")
    .select(
      "is_enabled, welcome_message, success_message, collect_date_of_birth, collect_emergency_contact, collect_household_information, collect_department_interests"
    )
    .eq("church_id", church.id)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const { data: departments, error: deptError } = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", church.id)
    .eq("is_active", true)
    .order("department_name", { ascending: true });

  if (deptError) {
    throw new Error(deptError.message);
  }

  return {
    church,
    settings: {
      isEnabled: settings?.is_enabled ?? false,
      welcomeMessage: settings?.welcome_message ?? null,
      successMessage: settings?.success_message ?? null,
      collectDateOfBirth: settings?.collect_date_of_birth ?? true,
      collectEmergencyContact: settings?.collect_emergency_contact ?? true,
      collectHouseholdInformation: settings?.collect_household_information ?? true,
      collectDepartmentInterests: settings?.collect_department_interests ?? true,
    },
    departments: departments ?? [],
  };
}

function defaultSettings() {
  return {
    isEnabled: false,
    welcomeMessage: null,
    successMessage: null,
    collectDateOfBirth: true,
    collectEmergencyContact: true,
    collectHouseholdInformation: true,
    collectDepartmentInterests: true,
  };
}

export async function validateRegistrationKeyAction(
  churchSlug: string,
  key: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("validate_member_registration_key", {
      p_church_slug: churchSlug,
      p_key: key,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    if (data && typeof data === "object" && "ok" in data) {
      const result = data as { ok: boolean; error?: string };
      if (!result.ok) {
        return { ok: false, error: result.error || "Registration key could not be validated." };
      }
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to validate key.",
    };
  }
}
