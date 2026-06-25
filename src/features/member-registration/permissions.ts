"use server";

import { requireChurchRole } from "@/features/access/queries";
import { CHURCH_MANAGEMENT_ROLE_CODES } from "@/lib/domain/church-access";

export async function requireRegistrationManagement(churchSlug: string) {
  return requireChurchRole(churchSlug, CHURCH_MANAGEMENT_ROLE_CODES);
}
