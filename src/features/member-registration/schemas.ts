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
  email: z.union([z.literal(""), z.string().trim().email("Invalid email address.")]).optional().transform(v => v || null),
  phone: z.string().trim().optional().transform(v => v || null),
  membershipStatusSuggestion: z.string().trim().optional().transform(v => v || null),
});

export const publicRegistrationSchema = z.object({
  churchSlug: z.string().trim().min(1, "Church is required."),
  key: z.string().trim().min(1, "Registration key is required."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  displayName: z.string().trim().optional().transform(v => v || null),
  email: z.union([z.literal(""), z.string().trim().email("Invalid email address.")]).optional().transform(v => v || null),
  phone: z.string().trim().optional().transform(v => v || null),
  dateOfBirth: optionalDate,
  gender: optionalChurchGender,
  maritalStatus: z.union([z.literal(""), z.enum(["single", "married", "widowed", "divorced", "separated"])]).optional().transform(v => v || null),
  profession: z.string().trim().optional().transform(v => v || null),
  address: z.string().trim().optional().transform(v => v || null),
  city: z.string().trim().optional().transform(v => v || null),
  country: z.string().trim().optional().transform(v => v || null),
  preferredContactMethod: z.union([z.literal(""), z.enum(["email", "phone", "any"])]).optional().transform(v => v || null),
  emergencyContactName: z.string().trim().optional().transform(v => v || null),
  emergencyContactPhone: z.string().trim().optional().transform(v => v || null),
  howHeardAboutChurch: z.string().trim().optional().transform(v => v || null),
  christianStatus: z.string().trim().optional().transform(v => v || null),
  isBaptized: z.boolean().optional().default(false),
  baptismDate: optionalDate,
  previousChurch: z.string().trim().optional().transform(v => v || null),
  wantsMembership: z.boolean().optional().default(false),
  requestedMembershipType: z.string().trim().optional().transform(v => v || null),
  transferInDate: optionalDate,
  householdAction: householdActionSchema.default("self_only"),
  suggestedHouseholdName: z.string().trim().optional().transform(v => v || null),
  suggestedHouseholdHeadName: z.string().trim().optional().transform(v => v || null),
  suggestedHouseholdHeadPhone: z.string().trim().optional().transform(v => v || null),
  suggestedHouseholdRole: z.union([z.literal(""), z.enum(["head", "spouse", "child", "relative", "guardian", "other"])]).optional().transform(v => v || null),
  suggestedHouseholdAddress: z.string().trim().optional().transform(v => v || null),
  suggestedHouseholdCity: z.string().trim().optional().transform(v => v || null),
  suggestedHouseholdCountry: z.string().trim().optional().transform(v => v || null),
  suggestedHouseholdPhone: z.string().trim().optional().transform(v => v || null),
  suggestedHouseholdEmail: z.string().trim().optional().transform(v => v || null),
  householdNotes: z.string().trim().optional().transform(v => v || null),
  departmentInterestIds: z.array(z.string().uuid()).default([]),
  notes: z.string().trim().optional().transform(v => v || null),
  privacyConsent: z.boolean().refine(v => v === true, {
    message: "Privacy consent is required.",
  }),
  accountSetupRequested: formBooleanSchema.default(false),
  authUserId: z.string().uuid().optional().nullable(),
  loginEmail: z.union([z.literal(""), z.string().trim().email("Invalid login email address.")]).optional().transform(v => v || null),
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
  newHouseholdName: z.string().trim().optional().nullable(),
  householdRole: z.union([z.literal(""), z.enum(["head", "spouse", "child", "relative", "guardian", "other"])]).optional().transform(v => v || null),
  setAsHead: formBooleanSchema.default(false),
  familyMemberResolutions: z.array(z.object({
    registrationHouseholdMemberId: z.string().uuid(),
    resolution: z.enum(["create", "link", "skip"]),
    memberId: z.string().uuid().optional().nullable(),
    householdRole: z.union([z.literal(""), z.enum(["head", "spouse", "child", "relative", "guardian", "other"])]).optional().transform(v => v || null),
  })).default([]),
  approvedDepartmentIds: z.array(z.string().uuid()).default([]),
  reviewNote: z.string().trim().optional().nullable(),
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
