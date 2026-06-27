"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import type { WizardData } from "./RegistrationWizard";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";
import { formatHouseholdAction, formatRelationship } from "@/features/member-registration/presentation";

type RegistrationReviewStepProps = {
  data: WizardData;
  departments: PublicRegistrationPageData["departments"];
  errors: Record<string, string>;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
};

export function RegistrationReviewStep({ data, departments, errors, onChange }: RegistrationReviewStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const selectedDepartments = departments.filter(d => data.departmentInterestIds.includes(d.id));
  const passwordMeetsPolicy = data.password.length >= 6;
  const hasConfirmPassword = data.confirmPassword.length > 0;
  const passwordsMatch = hasConfirmPassword && data.password === data.confirmPassword;

  useEffect(() => {
    if (!data.accountSetupRequested) {
      onChange("accountSetupRequested", true);
    }

    if (!data.loginEmail && data.email) {
      onChange("loginEmail", data.email);
    }
  }, [data.accountSetupRequested, data.email, data.loginEmail, onChange]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Review & Submit</h2>
        <p className="text-sm text-stone-600">Please review your information before submitting.</p>
      </div>

      <div className="space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm">
        <ReviewGroup title="Personal">
          <ReviewItem label="Name" value={[data.firstName, data.lastName].filter(Boolean).join(" ")} />
          {data.displayName && <ReviewItem label="Preferred name" value={data.displayName} />}
          {data.dateOfBirth && <ReviewItem label="Date of birth" value={data.dateOfBirth} />}
          {data.gender && <ReviewItem label="Gender" value={data.gender} />}
          {data.maritalStatus && <ReviewItem label="Marital status" value={data.maritalStatus} />}
        </ReviewGroup>

        <ReviewGroup title="Contact">
          {data.email && <ReviewItem label="Email" value={data.email} />}
          {data.phone && <ReviewItem label="Phone" value={data.phone} />}
          {(data.address || data.city || data.country) && (
            <ReviewItem
              label="Address"
              value={[data.address, data.city, data.country].filter(Boolean).join(", ")}
            />
          )}
        </ReviewGroup>

        <ReviewGroup title="Household">
          <ReviewItem label="Household request" value={formatHouseholdAction(data.householdAction)} />
          {data.suggestedHouseholdName && <ReviewItem label="Household name" value={data.suggestedHouseholdName} />}
          {data.householdMembers.length > 0 && (
            <ReviewItem
              label="Family members"
              value={data.householdMembers.map(m => `${m.firstName} ${m.lastName} (${formatRelationship(m.relationship)})`).join(", ")}
            />
          )}
        </ReviewGroup>

        {selectedDepartments.length > 0 && (
          <ReviewGroup title="Ministry interests">
            <ReviewItem label="Departments" value={selectedDepartments.map(d => d.department_name).join(", ")} />
          </ReviewGroup>
        )}
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-stone-900">Create your Member Portal account</h3>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              You will use these credentials to sign in after your registration has been approved.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="loginEmail">Login email</Label>
            <Input
              id="loginEmail"
              type="email"
              inputMode="email"
              value={data.loginEmail}
              onChange={event => onChange("loginEmail", event.target.value)}
              aria-invalid={Boolean(errors.loginEmail)}
              aria-describedby={errors.loginEmail ? "loginEmail-error" : "loginEmail-help"}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              className="h-12 rounded-xl bg-white text-base sm:text-sm"
            />
            {errors.loginEmail ? (
              <p id="loginEmail-error" className="text-xs text-red-600">{errors.loginEmail}</p>
            ) : (
              <p id="loginEmail-help" className="text-xs text-stone-500">
                This may differ from your contact email if needed.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PasswordField
              id="portalPassword"
              label="Password"
              value={data.password}
              onChange={value => onChange("password", value)}
              show={showPassword}
              onToggle={() => setShowPassword(value => !value)}
              error={errors.password}
              autoComplete="new-password"
              enterKeyHint="next"
            />

            <PasswordField
              id="portalConfirmPassword"
              label="Confirm password"
              value={data.confirmPassword}
              onChange={value => onChange("confirmPassword", value)}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(value => !value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
              enterKeyHint="done"
            />
          </div>

          <div className="grid gap-2 text-sm">
            <PasswordRequirement met={passwordMeetsPolicy}>
              At least 6 characters
            </PasswordRequirement>
            <PasswordRequirement met={passwordsMatch} muted={!hasConfirmPassword}>
              Passwords match
            </PasswordRequirement>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50 p-4">
        <Checkbox
          id="privacyConsent"
          checked={data.privacyConsent}
          onCheckedChange={checked => onChange("privacyConsent", checked === true)}
          aria-invalid={Boolean(errors.privacyConsent)}
          aria-describedby={errors.privacyConsent ? "privacyConsent-error" : undefined}
          className="mt-1"
        />
        <Label htmlFor="privacyConsent" className="text-sm font-normal leading-relaxed text-stone-700">
          I consent to this information being stored and reviewed by the church office. I understand my Member Portal access starts only after church approval.
        </Label>
      </div>
      {errors.privacyConsent && <p id="privacyConsent-error" className="text-xs text-red-600">{errors.privacyConsent}</p>}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
  autoComplete,
  enterKeyHint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  autoComplete: string;
  enterKeyHint: "next" | "done";
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={event => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint={enterKeyHint}
          className="h-12 rounded-xl bg-white pr-12 text-base sm:text-sm"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-0 top-0 inline-flex size-12 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      {error && <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function PasswordRequirement({
  met,
  muted,
  children,
}: {
  met: boolean;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        met ? "text-emerald-800" : muted ? "text-stone-500" : "text-stone-700"
      )}
    >
      <CheckCircle2 className={cn("size-4", met ? "text-emerald-700" : "text-stone-300")} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function ReviewGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-2">
      <span className="text-stone-500">{label}:</span>
      <span className="min-w-0 break-words font-medium text-stone-800">{value}</span>
    </div>
  );
}
