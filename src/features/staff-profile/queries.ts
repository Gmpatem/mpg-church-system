import "server-only";

import { requireChurchWorkspaceAccess } from "@/features/access/queries";
import { createClient } from "@/lib/supabase/server";

export type StaffSelfProfileData = {
  churchSlug: string;
  profile: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    preferredLanguage: "en" | "fr";
  };
  member: {
    id: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  } | null;
};

type ProfileSelfRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_language: string | null;
};

type MemberSelfRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};

export async function getStaffSelfProfile(
  churchSlug: string
): Promise<StaffSelfProfileData> {
  const ctx = await requireChurchWorkspaceAccess(churchSlug);
  const supabase = await createClient();

  const [profileResult, memberResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, preferred_language")
      .eq("id", ctx.userId)
      .maybeSingle<ProfileSelfRow>(),
    supabase
      .from("members")
      .select(
        [
          "id",
          "display_name",
          "email",
          "phone",
          "date_of_birth",
          "gender",
          "address",
          "city",
          "country",
          "emergency_contact_name",
          "emergency_contact_phone",
        ].join(", ")
      )
      .eq("church_id", ctx.churchId)
      .eq("profile_id", ctx.userId)
      .maybeSingle<MemberSelfRow>(),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (memberResult.error) {
    throw new Error(memberResult.error.message);
  }

  const profile = profileResult.data ?? ctx.profile;
  const preferredLanguage =
    profile?.preferred_language === "fr" || profile?.preferred_language === "en"
      ? profile.preferred_language
      : "en";

  return {
    churchSlug: ctx.churchSlug,
    profile: {
      id: ctx.userId,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone: (profile as { phone?: string | null } | null)?.phone ?? null,
      preferredLanguage,
    },
    member: memberResult.data
      ? {
          id: memberResult.data.id,
          displayName: memberResult.data.display_name,
          email: memberResult.data.email,
          phone: memberResult.data.phone,
          dateOfBirth: memberResult.data.date_of_birth,
          gender: memberResult.data.gender,
          address: memberResult.data.address,
          city: memberResult.data.city,
          country: memberResult.data.country,
          emergencyContactName: memberResult.data.emergency_contact_name,
          emergencyContactPhone: memberResult.data.emergency_contact_phone,
        }
      : null,
  };
}
