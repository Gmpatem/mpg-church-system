"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginDestination } from "./queries";
import {
  normalizeLoginCountry,
  normalizeLoginIdentifier,
} from "@/lib/auth/login-identifier";
import type { AuthActionState, PasswordRecoveryActionState } from "./types";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getAuthRedirectUrl(path: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
    "https://mpg-church-system.vercel.app";

  return `${baseUrl}${path}`;
}

export async function loginAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState | null> {
  const identifier = normalizeLoginIdentifier({
    value: getString(formData, "identifier") || getString(formData, "email"),
    defaultCountry: getString(formData, "loginCountry"),
  });
  const password = getString(formData, "password");

  if (!identifier.ok || !password) {
    return { ok: false, error: "Email or mobile number and password are required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    ...(identifier.identifier.type === "email"
      ? { email: identifier.identifier.email }
      : { phone: identifier.identifier.phone }),
    password,
  });

  if (error) {
    return { ok: false, error: "Invalid login credentials." };
  }

  const user = data.user;
  if (!user) {
    return { ok: false, error: "Login succeeded but no user was returned." };
  }

  const redirectTo = getString(formData, "redirect");
  const fallbackDestination = await getPostLoginDestination(user.id);

  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : fallbackDestination;

  redirect(safeRedirect);
}

export async function requestPasswordRecoveryAction(
  _prevState: PasswordRecoveryActionState | null,
  formData: FormData
): Promise<PasswordRecoveryActionState> {
  const identifier = normalizeLoginIdentifier({
    value: getString(formData, "recoveryIdentifier"),
    defaultCountry: getString(formData, "recoveryCountry"),
  });

  if (!identifier.ok) {
    return { ok: false, error: identifier.error };
  }

  const supabase = await createClient();

  if (identifier.identifier.type === "email") {
    const { error } = await supabase.auth.resetPasswordForEmail(identifier.identifier.email, {
      redirectTo: getAuthRedirectUrl("/auth/callback?next=/auth/update-password"),
    });

    if (error) {
      return {
        ok: false,
        error: "Password recovery could not be started. Please try again.",
      };
    }

    return {
      ok: true,
      method: "email",
      message: "If that email is registered, a password reset link has been sent.",
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: identifier.identifier.phone,
    options: {
      channel: "sms",
    },
  });

  if (error) {
    return {
      ok: false,
      error: "SMS recovery could not be started. Please check the number and try again.",
    };
  }

  return {
    ok: true,
    method: "phone",
    phone: identifier.identifier.phone,
    message: "Enter the verification code sent to your mobile number.",
  };
}

export async function completePhonePasswordRecoveryAction(
  _prevState: PasswordRecoveryActionState | null,
  formData: FormData
): Promise<PasswordRecoveryActionState | null> {
  const country = normalizeLoginCountry(getString(formData, "recoveryCountry"));
  const identifier = normalizeLoginIdentifier({
    value: getString(formData, "recoveryPhone"),
    defaultCountry: country,
  });
  const token = getString(formData, "recoveryOtp");
  const password = getString(formData, "newPassword");
  const confirmPassword = getString(formData, "confirmNewPassword");

  if (!identifier.ok || identifier.identifier.type !== "phone") {
    return { ok: false, error: "Enter a valid mobile number." };
  }

  if (!token) {
    return { ok: false, error: "Enter the verification code." };
  }

  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: identifier.identifier.phone,
    token,
    type: "sms",
  });

  if (error || !data.user) {
    return { ok: false, error: "Verification code could not be confirmed." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
    return { ok: false, error: "Password could not be updated. Please try again." };
  }

  const destination = await getPostLoginDestination(data.user.id);
  redirect(destination);
}

export async function updatePasswordAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState | null> {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { ok: false, error: "Password recovery session has expired. Please start again." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { ok: false, error: "Password could not be updated. Please try again." };
  }

  const destination = await getPostLoginDestination(userData.user.id);
  redirect(destination);
}

export async function registerAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState | null> {
  const fullName = getString(formData, "full_name");
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  if (!fullName || !email || !password) {
    return { ok: false, error: "Full name, email, and password are required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mpg-church-system.vercel.app"}/auth/callback`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data.session) {
    const destination = await getPostLoginDestination(data.session.user.id);
    redirect(destination);
  }

  redirect("/login?registered=1&check_email=1");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

