import { headers } from "next/headers";
import { ATTENDANCE_WELCOME_MESSAGES } from "./constants";

export function getAttendanceDisplayName(person: {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  member_code?: string | null;
}) {
  return (
    person.display_name ||
    person.full_name ||
    [person.first_name, person.last_name].filter(Boolean).join(" ") ||
    person.member_code ||
    "Guest"
  );
}

export function getChurchTodayIsoDate(timeZone: string | null | undefined) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

export function formatAttendanceDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatAttendanceTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getAttendanceWelcomeMessage(seed: string | null | undefined) {
  if (!seed) return ATTENDANCE_WELCOME_MESSAGES[0];

  let total = 0;
  for (let index = 0; index < seed.length; index += 1) {
    total += seed.charCodeAt(index);
  }

  return ATTENDANCE_WELCOME_MESSAGES[total % ATTENDANCE_WELCOME_MESSAGES.length];
}

export async function getRequestOrigin() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");

  return host ? `${protocol}://${host}` : "";
}

export async function buildPublicAttendanceScanUrl(publicCode: string) {
  const origin = await getRequestOrigin();
  return `${origin}/a/${publicCode}`;
}

export function getStringFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getBooleanFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}
