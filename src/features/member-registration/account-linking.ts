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

const PORTAL_ACCOUNT_DETAILS_UNVERIFIED = "Portal account details could not be verified.";
const PORTAL_ACCOUNT_SIGN_IN_REQUIRED =
  "This portal login could not be verified. If you already created or already have a portal account, sign in or reset your password, then submit the registration again.";

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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isAuthUserNotFoundError(error: unknown) {
  const candidate = error as { code?: string; message?: string; status?: number } | null;
  const message = candidate?.message?.toLowerCase() ?? "";

  return (
    candidate?.status === 404 ||
    candidate?.code === "user_not_found" ||
    message.includes("user not found")
  );
}

function isRetryableAuthLookupError(error: unknown) {
  const candidate = error as { code?: string; status?: number } | null;

  return (
    !candidate ||
    candidate.status === 404 ||
    (typeof candidate.status === "number" && candidate.status >= 500) ||
    candidate.code === "request_timeout" ||
    candidate.code === "unexpected_failure" ||
    candidate.code === "user_not_found"
  );
}

async function getAuthUserByIdWithRetry(
  admin: ReturnType<typeof createAdminClient>,
  authUserId: string
) {
  const delays = [0, 150, 400];
  let lastError: unknown = null;

  for (const delay of delays) {
    if (delay > 0) {
      await sleep(delay);
    }

    const { data, error } = await admin.auth.admin.getUserById(authUserId);
    if (data.user) {
      return { user: data.user as SupabaseAuthUser, error: null };
    }

    lastError = error;
    if (!isRetryableAuthLookupError(error)) {
      break;
    }
  }

  return { user: null, error: lastError };
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
    return { ok: false, error: PORTAL_ACCOUNT_DETAILS_UNVERIFIED };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: PORTAL_ACCOUNT_DETAILS_UNVERIFIED };
  }

  const { user, error } = await getAuthUserByIdWithRetry(admin, authUserId);

  if (!user) {
    return {
      ok: false,
      error: isAuthUserNotFoundError(error)
        ? PORTAL_ACCOUNT_SIGN_IN_REQUIRED
        : PORTAL_ACCOUNT_DETAILS_UNVERIFIED,
    };
  }

  if (identity.type === "email") {
    const loginEmail = normalizeLoginEmail(identity.email);
    const verifiedEmail = normalizeLoginEmail(user.email ?? "");

    if (!verifiedEmail || verifiedEmail !== loginEmail) {
      return { ok: false, error: "Portal account email does not match this registration." };
    }

    const emailConfirmed = isEmailConfirmed(user);

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
  const verifiedPhone = normalizeLoginPhone(user.phone ?? "");

  if (!verifiedPhone || verifiedPhone !== loginPhone) {
    return { ok: false, error: "Portal account mobile number does not match this registration." };
  }

  const phoneConfirmed = isPhoneConfirmed(user);

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
