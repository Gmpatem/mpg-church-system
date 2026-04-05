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

  return { ok: true };
}

export async function signOutMemberPortalAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
