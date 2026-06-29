import { parsePhoneNumberFromString, isSupportedCountry } from "libphonenumber-js/min";
import type { CountryCode } from "libphonenumber-js";
import { z } from "zod";

const emailSchema = z.string().trim().email();

export const LOGIN_COUNTRY_OPTIONS = [
  { code: "CM", callingCode: "+237", label: "Cameroon" },
  { code: "PH", callingCode: "+63", label: "Philippines" },
  { code: "SG", callingCode: "+65", label: "Singapore" },
  { code: "US", callingCode: "+1", label: "United States" },
  { code: "CA", callingCode: "+1", label: "Canada" },
  { code: "GB", callingCode: "+44", label: "United Kingdom" },
  { code: "FR", callingCode: "+33", label: "France" },
  { code: "NG", callingCode: "+234", label: "Nigeria" },
  { code: "GH", callingCode: "+233", label: "Ghana" },
  { code: "KE", callingCode: "+254", label: "Kenya" },
  { code: "ZA", callingCode: "+27", label: "South Africa" },
] as const satisfies ReadonlyArray<{
  code: CountryCode;
  callingCode: string;
  label: string;
}>;

export type LoginCountryCode = (typeof LOGIN_COUNTRY_OPTIONS)[number]["code"];

export const DEFAULT_LOGIN_COUNTRY: LoginCountryCode = "CM";

export type NormalizedLoginIdentifier =
  | { type: "email"; email: string }
  | { type: "phone"; phone: string; country: LoginCountryCode };

type NormalizeLoginIdentifierResult =
  | { ok: true; identifier: NormalizedLoginIdentifier }
  | { ok: false; error: string };

export function identifierLooksLikeEmail(value: string) {
  return value.includes("@");
}

export function isLoginCountryCode(value: string): value is LoginCountryCode {
  return LOGIN_COUNTRY_OPTIONS.some((country) => country.code === value);
}

export function normalizeLoginCountry(value: string | null | undefined): LoginCountryCode {
  if (value && isLoginCountryCode(value) && isSupportedCountry(value)) {
    return value;
  }

  return DEFAULT_LOGIN_COUNTRY;
}

export function normalizeRecoveryEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase() ?? "";
  if (!email) return null;

  return emailSchema.safeParse(email).success ? email : null;
}

export function normalizeLoginPhone(
  value: string,
  defaultCountry: string | null | undefined = DEFAULT_LOGIN_COUNTRY
) {
  const raw = value.trim();
  if (!raw) return "";

  const country = normalizeLoginCountry(defaultCountry);
  const phoneNumber = parsePhoneNumberFromString(raw, raw.startsWith("+") ? undefined : country);

  if (!phoneNumber?.isValid()) {
    return "";
  }

  return phoneNumber.number;
}

export function normalizeLoginIdentifier(params: {
  value: string | null | undefined;
  defaultCountry?: string | null;
}): NormalizeLoginIdentifierResult {
  const raw = params.value?.trim() ?? "";

  if (!raw) {
    return { ok: false, error: "Enter your email address or mobile number." };
  }

  if (identifierLooksLikeEmail(raw)) {
    const email = raw.toLowerCase();
    const parsed = emailSchema.safeParse(email);

    if (!parsed.success) {
      return { ok: false, error: "Enter a valid email address." };
    }

    return { ok: true, identifier: { type: "email", email: parsed.data } };
  }

  const country = normalizeLoginCountry(params.defaultCountry);
  const phone = normalizeLoginPhone(raw, country);

  if (!phone) {
    return { ok: false, error: "Enter a valid mobile number." };
  }

  return { ok: true, identifier: { type: "phone", phone, country } };
}
