"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/features/access/types";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function completeMemberOnboardingAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState | null> {
  const churchSlug = getString(formData, "churchSlug").toLowerCase();
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const email = getString(formData, "email").toLowerCase();
  const phone = getString(formData, "phone");
  const memberCode = getString(formData, "memberCode");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!churchSlug) {
    return { ok: false, error: "Church slug is required." };
  }

  if (!firstName || !lastName || !email || !password) {
    return { ok: false, error: "First name, last name, email, and password are required." };
  }

  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: [firstName, lastName].filter(Boolean).join(" "),
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const user = data.user;
  if (!user) {
    return { ok: false, error: "Account creation succeeded but no user was returned." };
  }

  // Public join onboarding - uses DB RPC for RLS-safe privileged writes
  // NOTE: The RPC complete_member_onboarding should NOT set portal_joined_at
  // portal_joined_at will be set later by completeFirstLoginPasswordChangeAction
  const { data: resolvedSlug, error: onboardingError } = await supabase.rpc(
    "complete_member_onboarding",
    {
      p_user_id: user.id,
      p_church_slug: churchSlug,
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: email || null,
      p_phone: phone || null,
      p_member_code: memberCode || null,
    }
  );

  if (onboardingError) {
    return { ok: false, error: onboardingError.message };
  }

  const slug =
    typeof resolvedSlug === "string" && resolvedSlug.trim()
      ? resolvedSlug.trim()
      : churchSlug;

  if (data.session) {
    redirect(`/my/${slug}?tab=overview`);
  }

  redirect(`/login?registered=1&church=${slug}`);
}
