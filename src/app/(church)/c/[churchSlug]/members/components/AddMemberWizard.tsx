"use client";

import type { FormEvent, ReactNode } from "react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Pencil,
  Plus,
  UserPlus,
} from "lucide-react";
import { createMemberInviteAction } from "@/features/member-invite/actions";
import { createMemberAction } from "@/features/members/actions";
import { createMemberSchema } from "@/features/members/validators";
import { saveMemberDraft } from "@/lib/offline/form-bridge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils/cn";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MemberFormValues = {
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  membershipStatus: string;
  membershipType: string;
  memberCode: string;
  dateJoined: string;
  baptismDate: string;
  previousChurch: string;
  maritalStatus: string;
  householdId: string;
  householdRole: string;
  departmentId: string;
  profession: string;
  address: string;
  city: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  transferInDate: string;
  transferOutDate: string;
};

type FieldName = keyof MemberFormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

export interface AddMemberWizardDepartment {
  id: string;
  department_name: string;
  description?: string | null;
}

export interface AddMemberWizardHousehold {
  id: string;
  household_name: string;
}

interface AddMemberWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string;
  churchSlug: string;
  departments: AddMemberWizardDepartment[];
  households: AddMemberWizardHousehold[];
  onCreated?: (memberId: string) => void;
}

const defaultValues: MemberFormValues = {
  firstName: "",
  lastName: "",
  displayName: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  membershipStatus: "active",
  membershipType: "",
  memberCode: "",
  dateJoined: "",
  baptismDate: "",
  previousChurch: "",
  maritalStatus: "",
  householdId: "",
  householdRole: "",
  departmentId: "",
  profession: "",
  address: "",
  city: "",
  country: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
  transferInDate: "",
  transferOutDate: "",
};

const hiddenFieldNames = Object.keys(defaultValues) as FieldName[];

const steps = [
  {
    label: "Personal",
    title: "Personal Information",
    description: "Start with the member's basic personal details.",
    fields: ["firstName", "lastName", "displayName", "gender", "dateOfBirth", "phone", "email"] as FieldName[],
  },
  {
    label: "Membership",
    title: "Membership Details",
    description: "Set the member's church status, dates, and membership context.",
    fields: ["membershipStatus", "membershipType", "memberCode", "dateJoined", "baptismDate", "previousChurch", "maritalStatus"] as FieldName[],
  },
  {
    label: "Household",
    title: "Household and Ministry",
    description: "Connect a household and optionally create one initial department assignment.",
    fields: ["householdId", "householdRole", "departmentId", "profession"] as FieldName[],
  },
  {
    label: "Contact",
    title: "Contact and Notes",
    description: "Capture location, emergency contact, and notes for follow-up.",
    fields: ["address", "city", "country", "emergencyContactName", "emergencyContactPhone", "notes"] as FieldName[],
  },
  {
    label: "Review",
    title: "Review and Create",
    description: "Confirm the details before creating this member.",
    fields: [] as FieldName[],
  },
];

const fieldLabels: Record<FieldName, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  displayName: "Display Name",
  gender: "Gender",
  dateOfBirth: "Date of Birth",
  phone: "Phone",
  email: "Email",
  membershipStatus: "Membership Status",
  membershipType: "Membership Type",
  memberCode: "Member Code",
  dateJoined: "Date Joined",
  baptismDate: "Baptism Date",
  previousChurch: "Previous Church",
  maritalStatus: "Marital Status",
  householdId: "Household",
  householdRole: "Household Role",
  departmentId: "Initial Department",
  profession: "Profession",
  address: "Address",
  city: "City",
  country: "Country",
  emergencyContactName: "Emergency Contact Name",
  emergencyContactPhone: "Emergency Contact Phone",
  notes: "Notes",
  transferInDate: "Transfer In Date",
  transferOutDate: "Transfer Out Date",
};

const selectPlaceholder = "__none";

function labelForOption(value: string, options: Array<{ value: string; label: string }>) {
  return options.find((option) => option.value === value)?.label ?? "";
}

function normalizeValues(values: MemberFormValues, churchId: string) {
  return {
    churchId,
    ...values,
    membershipStatus: values.membershipStatus || "active",
  };
}

function getStepIndexForField(fieldName: FieldName) {
  const index = steps.findIndex((step) => step.fields.includes(fieldName));
  return index >= 0 ? index : 0;
}

function inferStepFromServerError(error: string) {
  const lower = error.toLowerCase();

  if (lower.includes("household") || lower.includes("department")) return 2;
  if (lower.includes("member code") || lower.includes("membership") || lower.includes("date")) return 1;
  if (lower.includes("email") || lower.includes("first name") || lower.includes("last name")) return 0;

  return 4;
}

function SummaryRow({ label, value }: { label: string; value?: ReactNode }) {
  if (!value) return null;

  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ReviewSection({
  title,
  stepIndex,
  onEdit,
  children,
}: {
  title: string;
  stepIndex: number;
  onEdit: (stepIndex: number) => void;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(stepIndex)}
          className="h-8 gap-2 px-2 text-xs"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Button>
      </div>
      <dl className="flex flex-col gap-2">{children}</dl>
    </section>
  );
}

function WizardField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="flex min-w-0 flex-col gap-2" data-invalid={error ? true : undefined}>
      <Label htmlFor={id} className="text-sm text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AddMemberWizard({
  open,
  onOpenChange,
  churchId,
  churchSlug,
  departments = [],
  households = [],
  onCreated,
}: AddMemberWizardProps) {
  const [state, formAction, isPending] = useActionState(createMemberAction, null);
  const [values, setValues] = useState<MemberFormValues>(defaultValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [sendInvite, setSendInvite] = useState(false);
  const [invitePending, setInvitePending] = useState(false);
  const [householdOpen, setHouseholdOpen] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const handledMemberIdRef = useRef<string | null>(null);
  const handledServerErrorRef = useRef<string | null>(null);
  const sendInviteRef = useRef(sendInvite);

  useEffect(() => {
    sendInviteRef.current = sendInvite;
  }, [sendInvite]);

  const isDirty = useMemo(() => {
    if (sendInvite) return true;
    return hiddenFieldNames.some((field) => values[field] !== defaultValues[field]);
  }, [sendInvite, values]);

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        value: department.id,
        label: department.department_name,
      })),
    [departments]
  );

  const householdOptions = useMemo(
    () =>
      households.map((household) => ({
        value: household.id,
        label: household.household_name,
      })),
    [households]
  );

  const selectedHouseholdLabel = labelForOption(values.householdId, householdOptions);
  const selectedDepartmentLabel = labelForOption(values.departmentId, departmentOptions);
  const selectedStep = steps[currentStep];
  const busy = isPending || invitePending;
  const serverError = state && !state.ok ? state.error : null;

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      firstInputRef.current?.focus();
    }, 60);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!state?.ok || !state.memberId) return;
    if (handledMemberIdRef.current === state.memberId) return;

    handledMemberIdRef.current = state.memberId;
    const createdMemberId = state.memberId;
    const successMessage = state.message ?? "Member created successfully.";

    async function finishCreation(memberId: string) {
      let inviteDescription = "";
      setInvitePending(Boolean(sendInviteRef.current));

      if (sendInviteRef.current) {
        try {
          const result = await createMemberInviteAction(churchSlug, memberId);
          if (result.ok) {
            inviteDescription = ` Portal invite link generated: ${window.location.origin}${result.path}`;
          } else {
            inviteDescription = ` Member created, but the invite link could not be generated: ${result.error}`;
          }
        } catch {
          inviteDescription = " Member created, but the invite link could not be generated.";
        } finally {
          setInvitePending(false);
        }
      }

      toast({
        title: "Member created",
        description: `${successMessage}${inviteDescription}`,
      });

      resetWizard();
      onCreated?.(memberId);
    }

    finishCreation(createdMemberId);
  }, [churchSlug, onCreated, state]);

  useEffect(() => {
    if (!serverError) return;
    if (handledServerErrorRef.current === serverError) return;
    handledServerErrorRef.current = serverError;
    setCurrentStep(inferStepFromServerError(serverError));
  }, [serverError]);

  function resetWizard() {
    setValues(defaultValues);
    setErrors({});
    setCurrentStep(0);
    setDiscardOpen(false);
    setSendInvite(false);
    setHouseholdOpen(false);
    setOfflineMessage(null);
    formRef.current?.reset();
  }

  function requestClose(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (busy) return;

    if (isDirty) {
      setDiscardOpen(true);
      return;
    }

    onOpenChange(false);
  }

  function discardChanges() {
    resetWizard();
    onOpenChange(false);
  }

  function updateValue(field: FieldName, nextValue: string) {
    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function focusFirstInvalid(nextErrors: FieldErrors) {
    const firstField = hiddenFieldNames.find((field) => nextErrors[field]);
    if (!firstField) return;

    window.setTimeout(() => {
      document.getElementById(`add-member-${firstField}`)?.focus();
    }, 80);
  }

  function validateStep(stepIndex: number) {
    const parsed = createMemberSchema.safeParse(normalizeValues(values, churchId));
    const relevantFields = steps[stepIndex].fields;
    const nextErrors: FieldErrors = { ...errors };

    for (const field of relevantFields) {
      delete nextErrors[field];
    }

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as FieldName | undefined;
        if (!field || !relevantFields.includes(field)) continue;
        nextErrors[field] = issue.message;
      }
    }

    const hasStepError = relevantFields.some((field) => nextErrors[field]);
    setErrors(nextErrors);

    if (hasStepError) {
      focusFirstInvalid(nextErrors);
      return false;
    }

    return true;
  }

  function validateAll() {
    const parsed = createMemberSchema.safeParse(normalizeValues(values, churchId));
    if (parsed.success) {
      setErrors({});
      return true;
    }

    const nextErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as FieldName | undefined;
      if (!field) continue;
      nextErrors[field] = issue.message;
    }

    setErrors(nextErrors);
    const firstField = hiddenFieldNames.find((field) => nextErrors[field]);
    if (firstField) {
      setCurrentStep(getStepIndexForField(firstField));
      focusFirstInvalid(nextErrors);
    }

    return false;
  }

  function handleContinue() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  function handleBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!validateAll()) {
      event.preventDefault();
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const result = await saveMemberDraft({
        churchId,
        churchSlug,
        formData,
      });

      if (result.ok) {
        setOfflineMessage(result.message);
        toast({ title: "Draft saved", description: result.message });
        resetWizard();
        onOpenChange(false);
      } else {
        setOfflineMessage(result.error);
      }
    }
  }

  function textInput(field: FieldName, props: React.InputHTMLAttributes<HTMLInputElement> = {}) {
    const id = `add-member-${field}`;

    return (
      <WizardField id={id} label={fieldLabels[field]} required={field === "firstName" || field === "lastName"} error={errors[field]}>
        <Input
          {...props}
          ref={field === "firstName" ? firstInputRef : undefined}
          id={id}
          value={values[field]}
          onChange={(event) => updateValue(field, event.target.value)}
          aria-invalid={errors[field] ? true : undefined}
          aria-describedby={errors[field] ? `${id}-error` : undefined}
          className={cn("h-11 rounded-lg", props.className)}
        />
      </WizardField>
    );
  }

  function textareaInput(field: FieldName, rows = 3) {
    const id = `add-member-${field}`;

    return (
      <WizardField id={id} label={fieldLabels[field]} error={errors[field]}>
        <Textarea
          id={id}
          value={values[field]}
          rows={rows}
          onChange={(event) => updateValue(field, event.target.value)}
          aria-invalid={errors[field] ? true : undefined}
          aria-describedby={errors[field] ? `${id}-error` : undefined}
          className="rounded-lg"
        />
      </WizardField>
    );
  }

  function selectInput(
    field: FieldName,
    options: Array<{ value: string; label: string }>,
    placeholder: string
  ) {
    const id = `add-member-${field}`;

    return (
      <WizardField id={id} label={fieldLabels[field]} error={errors[field]}>
        <Select
          value={values[field] || selectPlaceholder}
          onValueChange={(nextValue) => updateValue(field, nextValue === selectPlaceholder ? "" : nextValue)}
        >
          <SelectTrigger
            id={id}
            aria-invalid={errors[field] ? true : undefined}
            aria-describedby={errors[field] ? `${id}-error` : undefined}
            className="h-11 rounded-lg"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={selectPlaceholder}>{placeholder}</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </WizardField>
    );
  }

  function renderPersonalStep() {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {textInput("firstName", { autoComplete: "given-name" })}
        {textInput("lastName", { autoComplete: "family-name" })}
        <div className="md:col-span-2">
          {textInput("displayName", { autoComplete: "name" })}
        </div>
        {selectInput(
          "gender",
          [
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ],
          "Select gender"
        )}
        {textInput("dateOfBirth", { type: "date" })}
        {textInput("phone", { type: "tel", autoComplete: "tel" })}
        {textInput("email", { type: "email", autoComplete: "email" })}
      </div>
    );
  }

  function renderMembershipStep() {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {selectInput(
          "membershipStatus",
          [
            { value: "active", label: "Active" },
            { value: "visitor", label: "Visitor" },
            { value: "inactive", label: "Inactive" },
            { value: "transferred", label: "Transferred" },
          ],
          "Select status"
        )}
        {selectInput(
          "membershipType",
          [
            { value: "regular", label: "Regular" },
            { value: "adherent", label: "Adherent" },
            { value: "child", label: "Child" },
            { value: "youth", label: "Youth" },
            { value: "senior", label: "Senior" },
          ],
          "Select type"
        )}
        {textInput("memberCode", { placeholder: "Leave blank to auto-generate" })}
        {textInput("dateJoined", { type: "date" })}
        {textInput("baptismDate", { type: "date" })}
        {textInput("previousChurch")}
        {selectInput(
          "maritalStatus",
          [
            { value: "single", label: "Single" },
            { value: "married", label: "Married" },
            { value: "widowed", label: "Widowed" },
            { value: "divorced", label: "Divorced" },
            { value: "separated", label: "Separated" },
          ],
          "Select status"
        )}
      </div>
    );
  }

  function renderHouseholdStep() {
    const householdId = "add-member-householdId";

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <WizardField id={householdId} label={fieldLabels.householdId} error={errors.householdId}>
          <Popover open={householdOpen} onOpenChange={setHouseholdOpen}>
            <PopoverTrigger asChild>
              <Button
                id={householdId}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={householdOpen}
                aria-invalid={errors.householdId ? true : undefined}
                aria-describedby={errors.householdId ? `${householdId}-error` : undefined}
                className="h-11 w-full justify-between rounded-lg bg-background px-3 font-normal"
              >
                <span className={cn("truncate", !selectedHouseholdLabel && "text-muted-foreground")}>
                  {selectedHouseholdLabel || "No household yet"}
                </span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(420px,calc(100vw-2rem))] p-0">
              <Command>
                <CommandInput placeholder="Search households..." />
                <CommandList>
                  <CommandEmpty>No household found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="No household"
                      onSelect={() => {
                        updateValue("householdId", "");
                        setHouseholdOpen(false);
                      }}
                    >
                      <Check
                        className={cn("size-4", !values.householdId ? "opacity-100" : "opacity-0")}
                        aria-hidden="true"
                      />
                      No household yet
                    </CommandItem>
                    {householdOptions.map((household) => (
                      <CommandItem
                        key={household.value}
                        value={`${household.label} ${household.value}`}
                        onSelect={() => {
                          updateValue("householdId", household.value);
                          setHouseholdOpen(false);
                        }}
                      >
                        <Check
                          className={cn("size-4", values.householdId === household.value ? "opacity-100" : "opacity-0")}
                          aria-hidden="true"
                        />
                        <span className="truncate">{household.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </WizardField>

        {selectInput(
          "householdRole",
          [
            { value: "head", label: "Head" },
            { value: "spouse", label: "Spouse" },
            { value: "child", label: "Child" },
            { value: "relative", label: "Relative" },
            { value: "guardian", label: "Guardian" },
            { value: "other", label: "Other" },
          ],
          "Select household role"
        )}
        {selectInput("departmentId", departmentOptions, "No department yet")}
        {textInput("profession")}
        <p className="text-sm text-muted-foreground md:col-span-2">
          The existing create flow supports one initial department assignment. Additional assignments can be managed from the member profile after creation.
        </p>
      </div>
    );
  }

  function renderContactStep() {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">{textareaInput("address", 3)}</div>
        {textInput("city")}
        {textInput("country")}
        {textInput("emergencyContactName")}
        {textInput("emergencyContactPhone", { type: "tel" })}
        <div className="md:col-span-2">{textareaInput("notes", 4)}</div>
      </div>
    );
  }

  function renderReviewStep() {
    const membershipStatus = labelForOption(values.membershipStatus, [
      { value: "active", label: "Active" },
      { value: "visitor", label: "Visitor" },
      { value: "inactive", label: "Inactive" },
      { value: "transferred", label: "Transferred" },
    ]);
    const membershipType = labelForOption(values.membershipType, [
      { value: "regular", label: "Regular" },
      { value: "adherent", label: "Adherent" },
      { value: "child", label: "Child" },
      { value: "youth", label: "Youth" },
      { value: "senior", label: "Senior" },
    ]);
    const gender = labelForOption(values.gender, [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "other", label: "Other" },
    ]);
    const householdRole = labelForOption(values.householdRole, [
      { value: "head", label: "Head" },
      { value: "spouse", label: "Spouse" },
      { value: "child", label: "Child" },
      { value: "relative", label: "Relative" },
      { value: "guardian", label: "Guardian" },
      { value: "other", label: "Other" },
    ]);
    const maritalStatus = labelForOption(values.maritalStatus, [
      { value: "single", label: "Single" },
      { value: "married", label: "Married" },
      { value: "widowed", label: "Widowed" },
      { value: "divorced", label: "Divorced" },
      { value: "separated", label: "Separated" },
    ]);

    return (
      <div className="flex flex-col gap-5">
        <ReviewSection title="Personal Information" stepIndex={0} onEdit={setCurrentStep}>
          <SummaryRow label="Name" value={[values.firstName, values.lastName].filter(Boolean).join(" ")} />
          <SummaryRow label={fieldLabels.displayName} value={values.displayName} />
          <SummaryRow label={fieldLabels.gender} value={gender} />
          <SummaryRow label={fieldLabels.dateOfBirth} value={values.dateOfBirth} />
          <SummaryRow label={fieldLabels.phone} value={values.phone} />
          <SummaryRow label={fieldLabels.email} value={values.email} />
        </ReviewSection>
        <Separator />
        <ReviewSection title="Membership" stepIndex={1} onEdit={setCurrentStep}>
          <SummaryRow label={fieldLabels.membershipStatus} value={membershipStatus || "Active"} />
          <SummaryRow label={fieldLabels.membershipType} value={membershipType} />
          <SummaryRow label={fieldLabels.memberCode} value={values.memberCode || "Auto-generated"} />
          <SummaryRow label={fieldLabels.dateJoined} value={values.dateJoined} />
          <SummaryRow label={fieldLabels.baptismDate} value={values.baptismDate} />
          <SummaryRow label={fieldLabels.previousChurch} value={values.previousChurch} />
          <SummaryRow label={fieldLabels.maritalStatus} value={maritalStatus} />
        </ReviewSection>
        <Separator />
        <ReviewSection title="Household and Ministry" stepIndex={2} onEdit={setCurrentStep}>
          <SummaryRow label={fieldLabels.householdId} value={selectedHouseholdLabel || "No household"} />
          <SummaryRow label={fieldLabels.householdRole} value={householdRole} />
          <SummaryRow label={fieldLabels.departmentId} value={selectedDepartmentLabel || "No initial department"} />
          <SummaryRow label={fieldLabels.profession} value={values.profession} />
        </ReviewSection>
        <Separator />
        <ReviewSection title="Contact" stepIndex={3} onEdit={setCurrentStep}>
          <SummaryRow label={fieldLabels.address} value={values.address} />
          <SummaryRow label={fieldLabels.city} value={values.city} />
          <SummaryRow label={fieldLabels.country} value={values.country} />
          <SummaryRow label={fieldLabels.emergencyContactName} value={values.emergencyContactName} />
          <SummaryRow label={fieldLabels.emergencyContactPhone} value={values.emergencyContactPhone} />
          <SummaryRow label={fieldLabels.notes} value={values.notes} />
        </ReviewSection>
      </div>
    );
  }

  function renderCurrentStep() {
    if (currentStep === 0) return renderPersonalStep();
    if (currentStep === 1) return renderMembershipStep();
    if (currentStep === 2) return renderHouseholdStep();
    if (currentStep === 3) return renderContactStep();
    return renderReviewStep();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent
          aria-describedby="add-member-wizard-description"
          className="left-0 top-0 flex h-[100dvh] max-h-none w-screen max-w-none translate-x-0 translate-y-0 grid-cols-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-2xl sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[88vh] sm:w-[min(900px,calc(100vw-2rem))] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border"
          onEscapeKeyDown={(event) => {
            if (busy || isDirty) event.preventDefault();
          }}
        >
          <DialogHeader className="gap-1 border-b border-border px-5 py-5 text-left sm:px-6">
            <div className="flex items-start gap-3 pr-10">
              <div className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:flex">
                <UserPlus className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                  Add New Member
                </DialogTitle>
                <DialogDescription id="add-member-wizard-description" className="mt-1">
                  Complete the member registration in a few guided steps.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="border-b border-border px-5 py-4 sm:px-6">
            <div className="md:hidden">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedStep.title}</p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}%
                </span>
              </div>
              <Progress className="mt-3" value={((currentStep + 1) / steps.length) * 100} />
            </div>

            <nav aria-label="Member registration progress" className="hidden md:block">
              <ol className="flex items-center">
                {steps.map((step, index) => {
                  const isCompleted = index < currentStep;
                  const isCurrent = index === currentStep;
                  const canNavigate = index <= currentStep;

                  return (
                    <li key={step.label} className="flex min-w-0 flex-1 items-center">
                      <button
                        type="button"
                        disabled={!canNavigate || busy}
                        onClick={() => setCurrentStep(index)}
                        className="flex min-w-0 items-center gap-2 rounded-md text-left disabled:cursor-default"
                        aria-current={isCurrent ? "step" : undefined}
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                            (isCompleted || isCurrent) && "border-primary bg-primary text-primary-foreground",
                            !isCompleted && !isCurrent && "border-border bg-background text-muted-foreground"
                          )}
                        >
                          {isCompleted ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                        </span>
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            isCurrent ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </span>
                      </button>
                      {index < steps.length - 1 ? (
                        <span
                          className={cn(
                            "mx-3 h-px min-w-6 flex-1",
                            isCompleted ? "bg-primary" : "bg-border"
                          )}
                          aria-hidden="true"
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <form
            ref={formRef}
            action={formAction}
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
            aria-busy={busy}
          >
            <input type="hidden" name="churchSlug" value={churchSlug} />
            {hiddenFieldNames.map((field) => (
              <input key={field} type="hidden" name={field} value={values[field]} />
            ))}

            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{selectedStep.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedStep.description}</p>
                </div>

                {serverError ? <InlineAlert variant="error" message={serverError} /> : null}
                {offlineMessage ? <InlineAlert variant="warning" message={offlineMessage} /> : null}

                {renderCurrentStep()}

                {currentStep === steps.length - 1 ? (
                  <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="add-member-sendInvite"
                        checked={sendInvite}
                        onCheckedChange={(checked) => setSendInvite(checked === true)}
                        className="mt-0.5"
                      />
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="add-member-sendInvite" className="text-sm font-medium text-foreground">
                          Generate portal invite after creation
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Uses the existing member invite flow after the record is created.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </ScrollArea>

            <div className="border-t border-border bg-background px-5 py-4 sm:px-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => requestClose(false)}
                  disabled={busy}
                  className={cn("h-11 rounded-lg", currentStep > 0 && "sm:mr-auto")}
                >
                  Cancel
                </Button>

                <div className="flex items-center justify-end gap-2">
                  {currentStep > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={busy}
                      className="h-11 rounded-lg"
                    >
                      Back
                    </Button>
                  ) : null}

                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleContinue}
                      disabled={busy}
                      className="h-11 gap-2 rounded-lg px-5 font-semibold"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={busy}
                      className="h-11 gap-2 rounded-lg px-5 font-semibold"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          {invitePending ? "Generating invite..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" aria-hidden="true" />
                          Create Member
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved member?</AlertDialogTitle>
            <AlertDialogDescription>
              The details entered in this wizard will be erased.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={discardChanges}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
