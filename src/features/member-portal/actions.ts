"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeFirstLoginPasswordChangeAction({
  churchSlug,
  password,
}: {
  churchSlug: string;
  password: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: userError?.message || "Not authenticated" };
  }

  const { error: authError } = await supabase.auth.updateUser({
    password,
  });

  if (authError) {
    return { ok: false, error: authError.message };
  }

  const { error: rpcError } = await supabase.rpc(
    "complete_first_login_security",
    {
      p_user_id: user.id,
    }
  );

  if (rpcError) {
    return { ok: false, error: rpcError.message };
  }

  // Set portal_joined_at now that must_change_password has been cleared
  // This must happen AFTER the password change is complete per DB lifecycle rules
  const { error: memberUpdateError } = await supabase
    .from("members")
    .update({
      portal_joined_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", user.id)
    .is("portal_joined_at", null);

  if (memberUpdateError) {
    // Log but don't fail - the member may not exist or already has portal_joined_at set
    console.warn("Could not set portal_joined_at:", memberUpdateError.message);
  }

  return { ok: true };
}

export async function signOutMemberPortalAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
