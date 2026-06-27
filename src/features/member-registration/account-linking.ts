import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const ACCOUNT_SETUP_STATUSES = [
  "not_requested",
  "pending_email_confirmation",
  "pending_approval",
  "active",
  "rejected",
  "link_failed",
] as const;

export type AccountSetupStatus = (typeof ACCOUNT_SETUP_STATUSES)[number];

export function normalizeLoginEmail(email: string) {
  return email.trim().toLowerCase();
}

function isConfirmed(user: {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
}) {
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

export async function verifyRegistrationAuthUser(params: {
  authUserId: string;
  loginEmail: string;
}): Promise<
  | {
      ok: true;
      authUserId: string;
      loginEmail: string;
      emailConfirmed: boolean;
      pendingStatus: AccountSetupStatus;
    }
  | { ok: false; error: string }
> {
  const authUserId = params.authUserId.trim();
  const loginEmail = normalizeLoginEmail(params.loginEmail);

  if (!authUserId || !loginEmail) {
    return { ok: false, error: "Portal account details could not be verified." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Portal account details could not be verified." };
  }

  const { data, error } = await admin.auth.admin.getUserById(authUserId);

  if (error || !data.user) {
    return { ok: false, error: "Portal account details could not be verified." };
  }

  const verifiedEmail = normalizeLoginEmail(data.user.email ?? "");
  if (!verifiedEmail || verifiedEmail !== loginEmail) {
    return { ok: false, error: "Portal account email does not match this registration." };
  }

  const emailConfirmed = isConfirmed(data.user);

  return {
    ok: true,
    authUserId,
    loginEmail: verifiedEmail,
    emailConfirmed,
    pendingStatus: emailConfirmed ? "pending_approval" : "pending_email_confirmation",
  };
}
