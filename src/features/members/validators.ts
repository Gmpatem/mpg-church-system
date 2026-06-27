import { z } from "zod";
import { CHURCH_GENDER_VALUES } from "@/lib/domain/church-gender";
import { normalizeDateOnly } from "@/lib/domain/date-only";

const nullishToEmptyString = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return value;
};

const optionalTextToNull = z
  .preprocess(nullishToEmptyString, z.string())
  .transform((v) => v || null);

const optionalEmailToNull = z
  .preprocess(
    nullishToEmptyString,
    z.union([z.literal(""), z.string().email("Invalid email address.")])
  )
  .transform((v) => v || null);

const optionalChurchGender = z
  .preprocess(nullishToEmptyString, z.union([z.literal(""), z.enum(CHURCH_GENDER_VALUES)]))
  .transform((v) => v || null);

const optionalMembershipType = z
  .preprocess(
    nullishToEmptyString,
    z.union([z.literal(""), z.enum(["regular", "adherent", "child", "youth", "senior"])])
  )
  .transform((v) => v || null);

const optionalHouseholdRole = z
  .preprocess(
    nullishToEmptyString,
    z.union([z.literal(""), z.enum(["head", "spouse", "child", "relative", "guardian", "other"])])
  )
  .transform((v) => v || null);

const optionalMaritalStatus = z
  .preprocess(
    nullishToEmptyString,
    z.union([z.literal(""), z.enum(["single", "married", "widowed", "divorced", "separated"])])
  )
  .transform((v) => v || null);

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
  displayName: optionalTextToNull,
  email: optionalEmailToNull,
  phone: optionalTextToNull,
  gender: optionalChurchGender,
  membershipStatus: z.enum(["active", "inactive", "visitor", "transferred"]).default("active"),
  membershipType: optionalMembershipType,
  memberCode: optionalTextToNull.pipe(z.string().max(50).nullable()),
  householdId: optionalTextToNull,
  householdRole: optionalHouseholdRole,
  dateJoined: optionalDate,
  dateOfBirth: optionalDate,
  baptismDate: optionalDate,
  transferInDate: optionalDate,
  transferOutDate: optionalDate,
  previousChurch: optionalTextToNull,
  city: optionalTextToNull,
  country: optionalTextToNull,
  address: optionalTextToNull,
  profession: optionalTextToNull,
  maritalStatus: optionalMaritalStatus,
  emergencyContactName: optionalTextToNull,
  emergencyContactPhone: optionalTextToNull,
  notes: optionalTextToNull,
  departmentId: optionalTextToNull,
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
