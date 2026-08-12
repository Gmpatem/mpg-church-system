"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { PhoneVerificationState, WizardData } from "./RegistrationWizard";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";
import { formatHouseholdAction, formatRelationship } from "@/features/member-registration/presentation";
import { LOGIN_COUNTRY_OPTIONS, type LoginCountryCode } from "@/lib/auth/login-identifier";

type RegistrationReviewStepProps = {
  data: WizardData;
  departments: PublicRegistrationPageData["departments"];
  errors: Record<string, string>;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
  accountCreated: boolean;
  phoneVerification: PhoneVerificationState;
  onPhoneVerificationCodeChange: (code: string) => void;
  onResendPhoneCode: () => void;
};

export function RegistrationReviewStep({
  data,
  departments,
  errors,
  onChange,
  accountCreated,
  phoneVerification,
  onPhoneVerificationCodeChange,
  onResendPhoneCode,
}: RegistrationReviewStepProps) {
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

    if (data.loginIdentifierType === "email" && !data.loginEmail && data.email) {
      onChange("loginEmail", data.email);
    }

    if (data.loginIdentifierType === "phone" && !data.loginPhone && data.phone) {
      onChange("loginPhone", data.phone);
    }
  }, [
    data.accountSetupRequested,
    data.email,
    data.loginEmail,
    data.loginIdentifierType,
    data.loginPhone,
    data.phone,
    onChange,
  ]);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-stone-950">Portal Account</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Review your registration and choose how you will access the member portal after approval.
        </p>
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
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-800">
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
            <Label htmlFor="loginIdentifierType">Login method</Label>
            <Select
              value={data.loginIdentifierType}
              onValueChange={value => onChange("loginIdentifierType", value as WizardData["loginIdentifierType"])}
              disabled={accountCreated}
            >
              <SelectTrigger id="loginIdentifierType" className="h-12 rounded-xl bg-white text-base sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email address</SelectItem>
                <SelectItem value="phone">Mobile number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data.loginIdentifierType === "email" ? (
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
                disabled={accountCreated}
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
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <div className="grid gap-1.5">
                  <Label htmlFor="loginCountry">Country</Label>
                  <Select
                    value={data.loginCountry}
                    onValueChange={value => onChange("loginCountry", value as LoginCountryCode)}
                    disabled={accountCreated}
                  >
                    <SelectTrigger id="loginCountry" className="h-12 rounded-xl bg-white text-base sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOGIN_COUNTRY_OPTIONS.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.callingCode} {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="loginPhone">Login mobile number</Label>
                  <Input
                    id="loginPhone"
                    type="tel"
                    inputMode="tel"
                    value={data.loginPhone}
                    onChange={event => onChange("loginPhone", event.target.value)}
                    aria-invalid={Boolean(errors.loginPhone)}
                    aria-describedby={errors.loginPhone ? "loginPhone-error" : "loginPhone-help"}
                    autoComplete="tel"
                    disabled={accountCreated}
                    className="h-12 rounded-xl bg-white text-base sm:text-sm"
                  />
                  {errors.loginPhone ? (
                    <p id="loginPhone-error" className="text-xs text-red-600">{errors.loginPhone}</p>
                  ) : (
                    <p id="loginPhone-help" className="text-xs text-stone-500">
                      We will format this number securely before creating your account.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="recoveryEmail">Recovery email</Label>
                <Input
                  id="recoveryEmail"
                  type="email"
                  inputMode="email"
                  value={data.recoveryEmail}
                  onChange={event => onChange("recoveryEmail", event.target.value)}
                  aria-invalid={Boolean(errors.recoveryEmail)}
                  aria-describedby={errors.recoveryEmail ? "recoveryEmail-error" : "recoveryEmail-help"}
                  autoComplete="email"
                  disabled={accountCreated}
                  className="h-12 rounded-xl bg-white text-base sm:text-sm"
                />
                {errors.recoveryEmail ? (
                  <p id="recoveryEmail-error" className="text-xs text-red-600">{errors.recoveryEmail}</p>
                ) : (
                  <p id="recoveryEmail-help" className="text-xs text-stone-500">
                    Optional, but helpful if you ever lose access to your mobile number.
                  </p>
                )}
              </div>
            </div>
          )}

          {accountCreated ? (
            <div className="rounded-xl border border-emerald-100 bg-white p-3 text-sm text-emerald-800">
              Portal account created. Finish any verification step shown here, then submit the registration.
            </div>
          ) : (
            <>
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
            </>
          )}

          {phoneVerification.required && (
            <div className="grid gap-3 rounded-xl border border-emerald-100 bg-white p-3">
              <div className="grid gap-1.5">
                <Label htmlFor="portalPhoneOtp">SMS verification code</Label>
                <Input
                  id="portalPhoneOtp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={phoneVerification.code}
                  onChange={event => onPhoneVerificationCodeChange(event.target.value)}
                  aria-invalid={Boolean(phoneVerification.error)}
                  aria-describedby={phoneVerification.error ? "portalPhoneOtp-error" : "portalPhoneOtp-help"}
                  disabled={phoneVerification.verified}
                  className="h-12 rounded-xl bg-stone-50 text-base tracking-[0.25em] sm:text-sm"
                />
                {phoneVerification.error ? (
                  <p id="portalPhoneOtp-error" className="text-xs text-red-600">{phoneVerification.error}</p>
                ) : (
                  <p id="portalPhoneOtp-help" className="text-xs text-stone-500">
                    {phoneVerification.message || "Enter the code sent by SMS."}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onResendPhoneCode}
                  disabled={phoneVerification.verified}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
                >
                  Resend code
                </button>
                {phoneVerification.verified && (
                  <span className="text-sm font-medium text-emerald-800">Mobile number verified.</span>
                )}
              </div>
            </div>
          )}
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
