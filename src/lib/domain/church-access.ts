import type { RoleCode } from "@/features/access/types";

export const CHURCH_MANAGEMENT_ROLE_CODES: RoleCode[] = [
  "church_admin",
  "pastor",
  "elder",
  "clerk",
];

export const TREASURY_MANAGEMENT_ROLE_CODES: RoleCode[] = [
  "church_admin",
  "treasurer",
  "pastor",
];
