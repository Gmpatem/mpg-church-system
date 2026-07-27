import crypto from "node:crypto";

export function createAttendancePublicCode() {
  return crypto.randomBytes(18).toString("base64url");
}

export function normalizeAttendancePublicCode(value: string) {
  return value.trim().replace(/[^A-Za-z0-9_-]/g, "");
}
