"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { completeRichInviteOnboardingAction } from "@/features/member-invite/actions";
import type { RichSecureInvitePageData } from "@/features/member-invite/types";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { FormSection } from "@/components/ui/FormSection";
import { CHURCH_GENDER_OPTIONS } from "@/lib/domain/church-gender";

type RichInviteOnboardingFormProps = {
  data: RichSecureInvitePageData;
  token: string;
};

const initialState = null;

export function RichInviteOnboardingForm({
  data,
  token,
}: RichInviteOnboardingFormProps) {
  const [state, formAction, isPending] = useActionState(
    completeRichInviteOnboardingAction,
    initialState
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selectedRoleOptions = useMemo(() => data.roleOptions, [data.roleOptions]);

  function validateStep1(): boolean {
    const form = formRef.current;
    if (!form) return false;
    const fields = ["firstName", "lastName", "email", "password", "confirmPassword"];
    for (const name of fields) {
      const el = form.elements.namedItem(name) as HTMLInputElement;
      if (!el || !el.value.trim()) {
        setStepError("Please fill in all required fields.");
        return false;
      }
    }
    const pw = (form.elements.namedItem("password") as HTMLInputElement).value;
    const cpw = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
    if (pw !== cpw) {
      setStepError("Passwords do not match.");
      return false;
    }
    setStepError(null);
    return true;
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="selectedRoleName" value="" />

      {/* Step progress indicator */}
      <StepIndicator
        steps={["Create Account", "Your Profile", "Church Involvement"]}
        currentStep={step}
      />

      {/* ── Step 1 — Account ──────────────────────────────────────── */}
      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <FormSection title="Create Your Account">
          <div className="rounded-3xl border p-5">
            <h2 className="text-lg font-semibold">
              {data.claimMode === "open_onboarding"
                ? "Create your account and member profile"
                : "Account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.claimMode === "open_onboarding"
                ? `This secure onboarding invite will create your new member record in ${data.context.churchName}.`
                : `Create your login and complete the member profile already linked to ${data.context.churchName}.`}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="First name"
                name="firstName"
                required
                defaultValue={data.context.memberFirstName ?? ""}
              />
              <Field
                label="Last name"
                name="lastName"
                required
                defaultValue={data.context.memberLastName ?? ""}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                required
                defaultValue={data.context.memberEmail ?? data.context.inviteEmail ?? ""}
              />
              <Field label="Phone" name="phone" />
              <Field label="Password" name="password" type="password" required />
              <Field label="Confirm password" name="confirmPassword" type="password" required />
            </div>
          </div>
        </FormSection>
      </div>

      {/* ── Step 2 — Profile ──────────────────────────────────────── */}
      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <FormSection
          title="Your Profile"
          description="All fields below are optional — you can complete them later."
        >
          <div className="rounded-3xl border p-5">
            <h2 className="text-lg font-semibold">Member profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in the details that help the church complete your member profile.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Date of birth" name="dateOfBirth" type="date" />
              <SelectField
                label="Gender"
                name="gender"
                options={[
                  { value: "", label: "Select gender" },
                  ...CHURCH_GENDER_OPTIONS,
                ]}
              />
              <Field label="Address" name="address" />
              <Field label="City" name="city" />
              <Field label="Country" name="country" />
              <SelectField
                label="Marital status"
                name="maritalStatus"
                options={[
                  { value: "", label: "Select marital status" },
                  { value: "single", label: "Single" },
                  { value: "married", label: "Married" },
                  { value: "widowed", label: "Widowed" },
                  { value: "divorced", label: "Divorced" },
                  { value: "separated", label: "Separated" },
                ]}
              />
              <Field label="Baptism date" name="baptismDate" type="date" />
              <SelectField
                label="Membership type"
                name="membershipType"
                options={[
                  { value: "", label: "Select membership type" },
                  { value: "regular", label: "Regular" },
                  { value: "adherent", label: "Adherent" },
                  { value: "child", label: "Child" },
                  { value: "youth", label: "Youth" },
                  { value: "senior", label: "Senior" },
                ]}
              />
            </div>
          </div>
        </FormSection>
      </div>

      {/* ── Step 3 — Church Involvement ───────────────────────────── */}
      <div className={step === 3 ? "space-y-4" : "hidden"}>
        <FormSection title="Church Involvement">
          <div className="rounded-3xl border p-5">
            <h2 className="text-lg font-semibold">Church function</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell the church what current role you serve in. Elevated access still needs approval.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="selectedRoleCode">
                  Current church role
                </label>
                <select
                  id="selectedRoleCode"
                  name="selectedRoleCode"
                  defaultValue="regular_member"
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                >
                  {selectedRoleOptions.map((role) => (
                    <option key={`${role.code}-${role.id ?? "fallback"}`} value={role.code}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <Field
                label="If role is not listed, type it here"
                name="otherRoleName"
                placeholder="Example: Treasurer or Elder"
              />
            </div>
          </div>

          <div className="rounded-3xl border p-5">
            <h2 className="text-lg font-semibold">Departments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the departments you belong to. If you currently lead one, mark it and enter the title.
            </p>

            {data.departments.length > 0 ? (
              <div className="mt-4 space-y-4">
                {data.departments.map((department) => (
                  <div key={department.id} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 text-sm font-medium">
                          <input
                            type="checkbox"
                            name="departmentIds"
                            value={department.id}
                            className="h-4 w-4 rounded border"
                          />
                          <span>{department.name}</span>
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {department.code ? `Code: ${department.code}` : "Department membership"}
                        </p>
                      </div>

                      <div className="grid gap-3 md:min-w-[320px] md:grid-cols-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name={`departmentLeader:${department.id}`}
                            className="h-4 w-4 rounded border"
                          />
                          <span>I am a leader here</span>
                        </label>

                        <input
                          type="text"
                          name={`departmentLeaderTitle:${department.id}`}
                          placeholder="Leadership title"
                          className="h-10 rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                No active departments were found for this church yet.
              </div>
            )}
          </div>

          <div className="rounded-3xl border p-5">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="accessAcknowledged"
                className="mt-1 h-4 w-4 rounded border"
                required
              />
              <span>
                I understand that any staff, leadership, or elevated access claim must still be
                reviewed and approved by church leadership.
              </span>
            </label>
          </div>
        </FormSection>
      </div>

      {/* Server action error — only surfaces after a submit attempt on step 3 */}
      {state && !state.ok ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-700 dark:text-rose-300">
          {state.error}
        </div>
      ) : null}

      {/* Navigation buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 2) setStep(1);
              else if (step === 3) setStep(2);
              setStepError(null);
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium transition hover:bg-accent"
          >
            Back
          </button>
        ) : null}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1) {
                if (!validateStep1()) return;
                setStep(2);
              } else if (step === 2) {
                setStep(3);
              }
              setStepError(null);
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
          >
            Next
          </button>
        ) : null}

        {step === 3 ? (
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <ButtonSpinner />
                Creating account...
              </span>
            ) : "Complete onboarding"}
          </button>
        ) : null}

        {stepError ? (
          <p className="text-sm text-red-500">{stepError}</p>
        ) : null}

        {step === 3 ? (
          <p className="text-sm text-muted-foreground">
            You will receive basic member access first. Any elevated role request will wait for
            approval.
          </p>
        ) : null}
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
};

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  placeholder,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
};

function SelectField({ label, name, options }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
      >
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
