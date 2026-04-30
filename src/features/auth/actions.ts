"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginDestination } from "./queries";
import type { AuthActionState } from "./types";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState | null> {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
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

