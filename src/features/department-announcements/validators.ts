import { z } from "zod";

const optionalDateTime = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      throw new Error("Invalid date/time value.");
    }
    return value;
  });

export const createDepartmentAnnouncementSchema = z.object({
  churchId: z.string().uuid("Invalid church."),
  departmentId: z.string().uuid("Invalid department."),
  title: z.string().trim().min(1, "Title is required.").max(200, "Title is too long."),
  body: z.string().trim().min(1, "Announcement body is required."),
  audienceScope: z.enum(["department_members", "leaders_only", "selected_members"]),
  requiresAcknowledgement: z.boolean().default(false),
  expiresAt: optionalDateTime,
});

export function parseCreateDepartmentAnnouncementInput(input: Record<string, unknown>) {
  return createDepartmentAnnouncementSchema.parse(input);
}
