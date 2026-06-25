"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireChurchWorkspaceAccess } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";
import { CHURCH_GENDER_VALUES } from "@/lib/domain/church-gender";
import { normalizeDateOnly } from "@/lib/domain/date-only";
import { getString } from "@/lib/domain/validation";

export type StaffSelfProfileState =
  | { ok: true; message: string; error?: undefined; fieldErrors?: undefined }
  | {
      ok: false;
      error: string;
      message?: undefined;
      fieldErrors?: Record<string, string>;
    };

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => value || null);

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    try {
      return normalizeDateOnly(value, "Date of birth");
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Date of birth must be valid.",
      });
      return z.NEVER;
    }
  });

const optionalChurchGender = z
  .union([z.literal(""), z.enum(CHURCH_GENDER_VALUES)])
  .optional()
  .transform((value) => value || null);

const staffSelfProfileSchema = z.object({
  churchSlug: z.string().trim().min(1, "Church is required."),
  fullName: z.string().trim().min(1, "Full name is required.").max(160),
  phone: z.string().trim().max(50).optional().transform((value) => value || null),
  preferredLanguage: z.enum(["en", "fr"]),
  displayName: z.string().trim().max(160).optional().transform((value) => value || null),
  dateOfBirth: optionalDate,
  gender: optionalChurchGender,
  address: optionalText,
  city: z.string().trim().max(120).optional().transform((value) => value || null),
  country: z.string().trim().max(120).optional().transform((value) => value || null),
  emergencyContactName: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((value) => value || null),
  emergencyContactPhone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((value) => value || null),
});

function flattenFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export async function updateStaffSelfProfileAction(
  _prevState: StaffSelfProfileState | null,
  formData: FormData
): Promise<StaffSelfProfileState> {
  const rawGender = getString(formData, "gender");
  const parsed = staffSelfProfileSchema.safeParse({
    churchSlug: getString(formData, "churchSlug"),
    fullName: getString(formData, "fullName"),
    phone: getString(formData, "phone"),
    preferredLanguage: getString(formData, "preferredLanguage") || "en",
    displayName: getString(formData, "displayName"),
    dateOfBirth: getString(formData, "dateOfBirth"),
    gender: rawGender === "__none" ? "" : rawGender,
    address: getString(formData, "address"),
    city: getString(formData, "city"),
    country: getString(formData, "country"),
    emergencyContactName: getString(formData, "emergencyContactName"),
    emergencyContactPhone: getString(formData, "emergencyContactPhone"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const ctx = await requireChurchWorkspaceAccess(input.churchSlug);
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      preferred_language: input.preferredLanguage,
      updated_at: now,
    })
    .eq("id", ctx.userId);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const { data: member, error: memberLookupError } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", ctx.churchId)
    .eq("profile_id", ctx.userId)
    .maybeSingle();

  if (memberLookupError) {
    return { ok: false, error: memberLookupError.message };
  }

  if (member?.id) {
    const { error: memberError } = await supabase
      .from("members")
      .update({
        display_name: input.displayName || input.fullName,
        phone: input.phone,
        date_of_birth: input.dateOfBirth,
        gender: input.gender,
        address: input.address,
        city: input.city,
        country: input.country,
        emergency_contact_name: input.emergencyContactName,
        emergency_contact_phone: input.emergencyContactPhone,
        updated_at: now,
      })
      .eq("church_id", ctx.churchId)
      .eq("profile_id", ctx.userId)
      .eq("id", member.id);

    if (memberError) {
      return { ok: false, error: memberError.message };
    }
  }

  revalidatePath(`/c/${ctx.churchSlug}/settings`);
  revalidatePath(`/my/${ctx.churchSlug}`);

  return { ok: true, message: "Profile updated." };
}
