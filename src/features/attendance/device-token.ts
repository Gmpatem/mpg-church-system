import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  ATTENDANCE_DEVICE_COOKIE,
  ATTENDANCE_DEVICE_COOKIE_MAX_AGE,
} from "./constants";

export function createAttendanceDeviceToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashAttendanceDeviceToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getAttendanceDeviceToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ATTENDANCE_DEVICE_COOKIE)?.value ?? null;
}

export async function setAttendanceDeviceToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ATTENDANCE_DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ATTENDANCE_DEVICE_COOKIE_MAX_AGE,
  });
}

export async function clearAttendanceDeviceToken() {
  const cookieStore = await cookies();
  cookieStore.set(ATTENDANCE_DEVICE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
