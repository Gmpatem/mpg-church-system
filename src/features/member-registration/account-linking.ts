import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeLoginPhone as normalizeSharedLoginPhone } from "@/lib/auth/login-identifier";

export const ACCOUNT_SETUP_STATUSES = [
  "not_requested",
  "pending_email_confirmation",
  "pending_phone_verification",
  "pending_approval",
  "active",
  "rejected",
  "link_failed",
] as const;

export type AccountSetupStatus = (typeof ACCOUNT_SETUP_STATUSES)[number];

export function normalizeLoginEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeLoginPhone(phone: string) {
  return normalizeSharedLoginPhone(phone);
}

export type RegistrationLoginIdentity =
  | { type: "email"; email: string }
  | { type: "phone"; phone: string; recoveryEmail?: string | null };

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

function isEmailConfirmed(user: SupabaseAuthUser) {
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

function isPhoneConfirmed(user: SupabaseAuthUser) {
  return Boolean(user.phone_confirmed_at || user.confirmed_at);
}

function resolveIdentity(
  params:
    | { authUserId: string; loginEmail: string; identity?: never }
    | { authUserId: string; loginEmail?: never; identity: RegistrationLoginIdentity }
): RegistrationLoginIdentity | null {
  if ("identity" in params) {
    return params.identity ?? null;
  }

  const loginEmail = normalizeLoginEmail(params.loginEmail);
  return loginEmail ? { type: "email", email: loginEmail } : null;
}

export async function verifyRegistrationAuthUser(
  params:
    | { authUserId: string; loginEmail: string; identity?: never }
    | { authUserId: string; loginEmail?: never; identity: RegistrationLoginIdentity }
): Promise<
  | {
      ok: true;
      authUserId: string;
      loginIdentifierType: "email" | "phone";
      loginEmail: string | null;
      loginPhone: string | null;
      recoveryEmail: string | null;
      emailConfirmed: boolean;
      phoneConfirmed: boolean;
      pendingStatus: AccountSetupStatus;
    }
  | { ok: false; error: string }
> {
  const authUserId = params.authUserId.trim();
  const identity = resolveIdentity(params);

  if (!authUserId || !identity) {
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

  if (identity.type === "email") {
    const loginEmail = normalizeLoginEmail(identity.email);
    const verifiedEmail = normalizeLoginEmail(data.user.email ?? "");

    if (!verifiedEmail || verifiedEmail !== loginEmail) {
      return { ok: false, error: "Portal account email does not match this registration." };
    }

    const emailConfirmed = isEmailConfirmed(data.user);

    return {
      ok: true,
      authUserId,
      loginIdentifierType: "email",
      loginEmail: verifiedEmail,
      loginPhone: null,
      recoveryEmail: null,
      emailConfirmed,
      phoneConfirmed: false,
      pendingStatus: emailConfirmed ? "pending_approval" : "pending_email_confirmation",
    };
  }

  const loginPhone = normalizeLoginPhone(identity.phone);
  const verifiedPhone = normalizeLoginPhone(data.user.phone ?? "");

  if (!verifiedPhone || verifiedPhone !== loginPhone) {
    return { ok: false, error: "Portal account mobile number does not match this registration." };
  }

  const phoneConfirmed = isPhoneConfirmed(data.user);

  return {
    ok: true,
    authUserId,
    loginIdentifierType: "phone",
    loginEmail: null,
    loginPhone: verifiedPhone,
    recoveryEmail: identity.recoveryEmail ?? null,
    emailConfirmed: false,
    phoneConfirmed,
    pendingStatus: phoneConfirmed ? "pending_approval" : "pending_phone_verification",
  };
}
