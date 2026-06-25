import { z } from "zod";
import { CHURCH_GENDER_VALUES } from "@/lib/domain/church-gender";
import { normalizeDateOnly } from "@/lib/domain/date-only";

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value, ctx) => {
    try {
      return normalizeDateOnly(value);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Date must be valid.",
      });
      return z.NEVER;
    }
  });

const optionalChurchGender = z
  .union([z.literal(""), z.enum(CHURCH_GENDER_VALUES)])
  .optional()
  .transform((v) => v || null);

export const memberDirectoryFiltersSchema = z.object({
  q: z.string().trim().optional().default(""),
  status: z.string().trim().optional().default(""),
  householdId: z.string().trim().optional().default(""),
  department: z.string().trim().optional().default(""),
  membershipType: z.string().trim().optional().default(""),
  sort: z.enum(["name_asc", "joined_desc", "status_asc"]).optional().default("name_asc"),
});

export const createMemberSchema = z.object({
  churchId: z.string().uuid("Invalid church."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  displayName: z.string().trim().optional().transform(v => v || null),
  email: z.union([z.literal(""), z.string().trim().email("Invalid email address.")]).optional().transform(v => v || null),
  phone: z.string().trim().optional().transform(v => v || null),
  gender: optionalChurchGender,
  membershipStatus: z.enum(["active", "inactive", "visitor", "transferred"]).default("active"),
  membershipType: z.union([z.literal(""), z.enum(["regular", "adherent", "child", "youth", "senior"])]).optional().transform(v => v || null),
  memberCode: z.string().trim().max(50).optional().transform(v => v || null),
  householdId: z.string().trim().optional().transform(v => v || null),
  householdRole: z.union([z.literal(""), z.enum(["head", "spouse", "child", "relative", "guardian", "other"])]).optional().transform(v => v || null),
  dateJoined: optionalDate,
  dateOfBirth: optionalDate,
  baptismDate: optionalDate,
  transferInDate: optionalDate,
  transferOutDate: optionalDate,
  previousChurch: z.string().trim().optional().transform(v => v || null),
  city: z.string().trim().optional().transform(v => v || null),
  country: z.string().trim().optional().transform(v => v || null),
  address: z.string().trim().optional().transform(v => v || null),
  profession: z.string().trim().optional().transform(v => v || null),
  maritalStatus: z.union([z.literal(""), z.enum(["single", "married", "widowed", "divorced", "separated"])]).optional().transform(v => v || null),
  emergencyContactName: z.string().trim().optional().transform(v => v || null),
  emergencyContactPhone: z.string().trim().optional().transform(v => v || null),
  notes: z.string().trim().optional().transform(v => v || null),
  departmentId: z.string().trim().optional().transform(v => v || null),
});

export const updateMemberSchema = createMemberSchema.extend({
  memberId: z.string().uuid("Invalid member."),
});

export function parseMemberDirectoryFilters(input: Record<string, unknown>) {
  return memberDirectoryFiltersSchema.parse(input);
}

export function parseCreateMemberInput(input: Record<string, unknown>) {
  return createMemberSchema.parse(input);
}

export function parseUpdateMemberInput(input: Record<string, unknown>) {
  return updateMemberSchema.parse(input);
}
