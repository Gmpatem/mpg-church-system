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

export const optionalFormStringSchema = z.preprocess(nullishToEmptyString, z.string());

export const optionalEmailSchema = z.preprocess(
  nullishToEmptyString,
  z.union([z.literal(""), z.string().email("Invalid email address.")])
);

const membershipTypeEnum = z.enum(["regular", "adherent", "child", "youth", "senior"]);

export const optionalMembershipTypeSchema = z.preprocess(
  nullishToEmptyString,
  z.union([z.literal(""), membershipTypeEnum])
);

const e164PhoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/, "Invalid mobile number.");
const optionalNullableFormStringSchema = optionalFormStringSchema.transform((v) => v || null);
const optionalNullableEmailSchema = optionalEmailSchema.transform((v) => v || null);
const optionalNullableMembershipTypeSchema = optionalMembershipTypeSchema.transform((v) => v || null);
const optionalNullableE164PhoneSchema = z
  .preprocess(nullishToEmptyString, z.union([z.literal(""), e164PhoneSchema]))
  .transform((v) => v || null);
const loginIdentifierTypeSchema = z
  .preprocess(nullishToEmptyString, z.union([z.literal(""), z.enum(["email", "phone"])]))
  .transform((v) => v || null);

const optionalHouseholdRoleSchema = z
  .preprocess(
    nullishToEmptyString,
    z.union([z.literal(""), z.enum(["head", "spouse", "child", "relative", "guardian", "other"])])
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

const optionalChurchGender = z
  .preprocess(nullishToEmptyString, z.union([z.literal(""), z.enum(CHURCH_GENDER_VALUES)]))
  .transform((v) => v || null);

export const formBooleanSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "on", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "off", "no", ""].includes(normalized)) {
      return false;
    }
  }

  if (value === null || value === undefined) {
    return false;
  }

  return value;
}, z.boolean());

export const householdActionSchema = z.enum([
  "self_only",
  "existing_household",
  "new_household",
  "not_sure",
]);

export const accountSetupStatusSchema = z.enum([
  "not_requested",
  "pending_email_confirmation",
  "pending_phone_verification",
  "pending_approval",
  "active",
  "rejected",
  "link_failed",
]);

export const registrationHouseholdMemberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  relationship: z.enum(["spouse", "child", "relative", "guardian", "other"]),
  dateOfBirth: optionalDate,
  gender: optionalChurchGender,
  email: optionalNullableEmailSchema,
  phone: optionalNullableFormStringSchema,
  membershipStatusSuggestion: optionalNullableFormStringSchema,
});

export const publicRegistrationSchema = z.object({
  churchSlug: z.string().trim().min(1, "Church is required."),
  key: z.string().trim().min(1, "Registration key is required."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  displayName: optionalNullableFormStringSchema,
  email: optionalNullableEmailSchema,
  phone: optionalNullableFormStringSchema,
  dateOfBirth: optionalDate,
  gender: optionalChurchGender,
  maritalStatus: z.preprocess(nullishToEmptyString, z.union([z.literal(""), z.enum(["single", "married", "widowed", "divorced", "separated"])])).transform(v => v || null),
  profession: optionalNullableFormStringSchema,
  address: optionalNullableFormStringSchema,
  city: optionalNullableFormStringSchema,
  country: optionalNullableFormStringSchema,
  preferredContactMethod: z.preprocess(nullishToEmptyString, z.union([z.literal(""), z.enum(["email", "phone", "any"])])).transform(v => v || null),
  emergencyContactName: optionalNullableFormStringSchema,
  emergencyContactPhone: optionalNullableFormStringSchema,
  howHeardAboutChurch: optionalNullableFormStringSchema,
  christianStatus: optionalNullableFormStringSchema,
  isBaptized: z.boolean().optional().default(false),
  baptismDate: optionalDate,
  previousChurch: optionalNullableFormStringSchema,
  wantsMembership: z.boolean().optional().default(false),
  requestedMembershipType: optionalNullableMembershipTypeSchema,
  transferInDate: optionalDate,
  householdAction: householdActionSchema.default("self_only"),
  suggestedHouseholdName: optionalNullableFormStringSchema,
  suggestedHouseholdHeadName: optionalNullableFormStringSchema,
  suggestedHouseholdHeadPhone: optionalNullableFormStringSchema,
  suggestedHouseholdRole: optionalHouseholdRoleSchema,
  suggestedHouseholdAddress: optionalNullableFormStringSchema,
  suggestedHouseholdCity: optionalNullableFormStringSchema,
  suggestedHouseholdCountry: optionalNullableFormStringSchema,
  suggestedHouseholdPhone: optionalNullableFormStringSchema,
  suggestedHouseholdEmail: optionalNullableEmailSchema,
  householdNotes: optionalNullableFormStringSchema,
  departmentInterestIds: z.array(z.string().uuid()).default([]),
  notes: optionalNullableFormStringSchema,
  privacyConsent: z.boolean().refine(v => v === true, {
    message: "Privacy consent is required.",
  }),
  accountSetupRequested: formBooleanSchema.default(false),
  authUserId: z.string().uuid().optional().nullable(),
  loginIdentifierType: loginIdentifierTypeSchema,
  loginEmail: z.preprocess(
    nullishToEmptyString,
    z.union([z.literal(""), z.string().email("Invalid login email address.")])
  ).transform(v => v || null),
  loginPhone: optionalNullableE164PhoneSchema,
  recoveryEmail: optionalNullableEmailSchema,
  householdMembers: z.array(registrationHouseholdMemberSchema).default([]),
});

export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;
export type RegistrationHouseholdMemberInput = z.infer<typeof registrationHouseholdMemberSchema>;

export const registrationReviewDecisionSchema = z.object({
  registrationId: z.string().uuid(),
  churchSlug: z.string().trim().min(1),
  memberResolution: z.enum(["create", "merge"]),
  memberId: z.string().uuid().optional().nullable(),
  membershipStatus: z.enum(["active", "inactive", "visitor", "transferred"]).default("visitor"),
  householdResolution: z.enum(["none", "existing", "new"]),
  householdId: z.string().uuid().optional().nullable(),
  newHouseholdName: optionalNullableFormStringSchema,
  householdRole: optionalHouseholdRoleSchema,
  setAsHead: formBooleanSchema.default(false),
  familyMemberResolutions: z.array(z.object({
    registrationHouseholdMemberId: z.string().uuid(),
    resolution: z.enum(["create", "link", "skip"]),
    memberId: z.string().uuid().optional().nullable(),
    householdRole: optionalHouseholdRoleSchema,
  })).default([]),
  approvedDepartmentIds: z.array(z.string().uuid()).default([]),
  reviewNote: optionalNullableFormStringSchema,
});

export type RegistrationReviewDecision = z.infer<typeof registrationReviewDecisionSchema>;

export const registrationSettingsSchema = z.object({
  isEnabled: z.boolean().default(false),
  requireAdminReview: z.boolean().default(true),
  autoCreateAsVisitor: z.boolean().default(false),
  collectDateOfBirth: z.boolean().default(true),
  collectEmergencyContact: z.boolean().default(true),
  collectHouseholdInformation: z.boolean().default(true),
  collectDepartmentInterests: z.boolean().default(true),
  welcomeMessage: z.string().trim().optional().nullable(),
  successMessage: z.string().trim().optional().nullable(),
});

export type RegistrationSettingsInput = z.infer<typeof registrationSettingsSchema>;
