"use server";

import { createClient } from "@/lib/supabase/server";

export type PublicRegistrationUnavailableReason =
  | "church_not_found"
  | "church_inactive"
  | "registration_disabled"
  | "missing_key"
  | "malformed_key"
  | "invalid_key"
  | "expired_key"
  | "configuration_error";

export type PublicRegistrationPageData = {
  ok: boolean;
  reason?: PublicRegistrationUnavailableReason;
  church: {
    id: string;
    name: string;
    slug: string;
    country: string | null;
    city: string | null;
    logo_url: string | null;
    default_language: "en" | "fr";
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

type JsonRecord = Record<string, unknown>;

export async function getPublicRegistrationPageData(
  churchSlug: string,
  registrationKey: string
): Promise<PublicRegistrationPageData> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("validate_member_registration_key", {
    p_church_slug: churchSlug,
    p_key: registrationKey,
  });

  if (error) {
    console.error("Public registration validation RPC failed", {
      code: error.code,
      churchSlug,
    });
    return unavailable("configuration_error");
  }

  return normalizePageResult(data);
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

function unavailable(
  reason: PublicRegistrationUnavailableReason,
  church: PublicRegistrationPageData["church"] = null
): PublicRegistrationPageData {
  return {
    ok: false,
    reason,
    church,
    settings: defaultSettings(),
    departments: [],
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeReason(value: unknown): PublicRegistrationUnavailableReason {
  const reasons: PublicRegistrationUnavailableReason[] = [
    "church_not_found",
    "church_inactive",
    "registration_disabled",
    "missing_key",
    "malformed_key",
    "invalid_key",
    "expired_key",
    "configuration_error",
  ];

  return typeof value === "string" && reasons.includes(value as PublicRegistrationUnavailableReason)
    ? (value as PublicRegistrationUnavailableReason)
    : normalizeLegacyErrorReason(value);
}

function normalizeLegacyErrorReason(value: unknown): PublicRegistrationUnavailableReason {
  if (typeof value !== "string") return "configuration_error";

  const message = value.toLowerCase();

  if (message.includes("registration key is required")) return "missing_key";
  if (message.includes("invalid registration key")) return "invalid_key";
  if (message.includes("not enabled")) return "registration_disabled";
  if (message.includes("not configured")) return "configuration_error";
  if (message.includes("church not found")) return "church_not_found";

  return "configuration_error";
}

function normalizeChurch(value: unknown): PublicRegistrationPageData["church"] {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const name = readString(value.name);
  const slug = readString(value.slug);

  if (!id || !name || !slug) return null;

  return {
    id,
    name,
    slug,
    country: readString(value.country),
    city: readString(value.city),
    logo_url: readString(value.logo_url),
    default_language: value.default_language === "fr" ? "fr" : "en",
  };
}

function normalizeSettings(value: unknown): PublicRegistrationPageData["settings"] {
  if (!isRecord(value)) return defaultSettings();

  return {
    isEnabled: readBoolean(value.is_enabled, false),
    welcomeMessage: readString(value.welcome_message),
    successMessage: readString(value.success_message),
    collectDateOfBirth: readBoolean(value.collect_date_of_birth, true),
    collectEmergencyContact: readBoolean(value.collect_emergency_contact, true),
    collectHouseholdInformation: readBoolean(value.collect_household_information, true),
    collectDepartmentInterests: readBoolean(value.collect_department_interests, true),
  };
}

function normalizeDepartments(value: unknown): PublicRegistrationPageData["departments"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((department) => {
    if (!isRecord(department)) return [];

    const id = readString(department.id);
    const departmentName = readString(department.department_name);

    return id && departmentName ? [{ id, department_name: departmentName }] : [];
  });
}

function normalizePageResult(value: unknown): PublicRegistrationPageData {
  if (!isRecord(value)) return unavailable("configuration_error");

  const church = normalizeChurch(value.church);

  if (value.ok !== true) {
    return unavailable(normalizeReason(value.reason ?? value.error), church);
  }

  if (!church) {
    return unavailable("configuration_error");
  }

  return {
    ok: true,
    church,
    settings: normalizeSettings(value.settings),
    departments: normalizeDepartments(value.departments),
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
      const result = data as { ok: boolean; error?: string; reason?: PublicRegistrationUnavailableReason };
      if (!result.ok) {
        return { ok: false, error: result.error || publicReasonMessage(result.reason) };
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

function publicReasonMessage(reason: PublicRegistrationUnavailableReason | undefined) {
  switch (reason) {
    case "missing_key":
      return "Registration key is required.";
    case "malformed_key":
    case "invalid_key":
      return "Invalid registration key.";
    case "registration_disabled":
      return "Registration is not enabled for this church.";
    case "church_inactive":
    case "church_not_found":
      return "Church not found or registration unavailable.";
    case "expired_key":
      return "Registration key has expired.";
    case "configuration_error":
    default:
      return "Registration key could not be validated.";
  }
}
