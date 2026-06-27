"use client";

import { useState, useActionState, useEffect, useCallback, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { submitPublicRegistrationAction } from "@/features/member-registration/public-actions";
import { validateRegistrationKeyAction } from "@/features/member-registration/public-queries";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getPublicSiteUrl } from "@/lib/site-url";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";
import { RegistrationHeader } from "./RegistrationHeader";
import { RegistrationProgress } from "./RegistrationProgress";
import { WelcomeStep } from "./WelcomeStep";
import { PersonalInformationStep } from "./PersonalInformationStep";
import { ContactAddressStep } from "./ContactAddressStep";
import { MembershipInformationStep } from "./MembershipInformationStep";
import { HouseholdFamilyStep } from "./HouseholdFamilyStep";
import { HouseholdMembersStep } from "./HouseholdMembersStep";
import { MinistryInterestsStep } from "./MinistryInterestsStep";
import { RegistrationReviewStep } from "./RegistrationReviewStep";
import { RegistrationSuccess } from "./RegistrationSuccess";
import type { RegistrationHouseholdMemberInput } from "@/features/member-registration/schemas";

const TOTAL_STEPS = 8;
const STEP_TITLES = [
  "Welcome",
  "Personal information",
  "Contact details",
  "Membership background",
  "Household",
  "Family members",
  "Ministry interests",
  "Review & account",
] as const;

const ERROR_FIELD_IDS: Record<string, string> = {
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  privacyConsent: "privacyConsent",
  loginEmail: "loginEmail",
  password: "portalPassword",
  confirmPassword: "portalConfirmPassword",
};

export type WizardData = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  profession: string;
  address: string;
  city: string;
  country: string;
  preferredContactMethod: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  howHeardAboutChurch: string;
  christianStatus: string;
  isBaptized: boolean;
  baptismDate: string;
  previousChurch: string;
  wantsMembership: boolean;
  requestedMembershipType: string;
  transferInDate: string;
  householdAction: "self_only" | "existing_household" | "new_household" | "not_sure";
  suggestedHouseholdName: string;
  suggestedHouseholdHeadName: string;
  suggestedHouseholdHeadPhone: string;
  suggestedHouseholdRole: string;
  suggestedHouseholdAddress: string;
  suggestedHouseholdCity: string;
  suggestedHouseholdCountry: string;
  suggestedHouseholdPhone: string;
  suggestedHouseholdEmail: string;
  householdNotes: string;
  householdMembers: RegistrationHouseholdMemberInput[];
  departmentInterestIds: string[];
  notes: string;
  privacyConsent: boolean;
  accountSetupRequested: boolean;
  loginEmail: string;
  password: string;
  confirmPassword: string;
};

const emptyData: WizardData = {
  firstName: "",
  lastName: "",
  displayName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  profession: "",
  address: "",
  city: "",
  country: "",
  preferredContactMethod: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  howHeardAboutChurch: "",
  christianStatus: "",
  isBaptized: false,
  baptismDate: "",
  previousChurch: "",
  wantsMembership: false,
  requestedMembershipType: "",
  transferInDate: "",
  householdAction: "self_only",
  suggestedHouseholdName: "",
  suggestedHouseholdHeadName: "",
  suggestedHouseholdHeadPhone: "",
  suggestedHouseholdRole: "",
  suggestedHouseholdAddress: "",
  suggestedHouseholdCity: "",
  suggestedHouseholdCountry: "",
  suggestedHouseholdPhone: "",
  suggestedHouseholdEmail: "",
  householdNotes: "",
  householdMembers: [],
  departmentInterestIds: [],
  notes: "",
  privacyConsent: false,
  accountSetupRequested: true,
  loginEmail: "",
  password: "",
  confirmPassword: "",
};

type RegistrationWizardProps = {
  church: NonNullable<PublicRegistrationPageData["church"]>;
  settings: PublicRegistrationPageData["settings"];
  departments: PublicRegistrationPageData["departments"];
  registrationKey: string;
};

export function RegistrationWizard({ church, settings, departments, registrationKey }: RegistrationWizardProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(emptyData);
  const [touchedSteps, setTouchedSteps] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientError, setClientError] = useState<string | null>(null);
  const [existingAccountNotice, setExistingAccountNotice] = useState(false);
  const [isClientSubmitting, setIsClientSubmitting] = useState(false);
  const [createdAccountLink, setCreatedAccountLink] = useState<{ authUserId: string; loginEmail: string } | null>(null);
  const [isDispatchPending, startSubmitTransition] = useTransition();

  const [state, formAction, isPending] = useActionState(submitPublicRegistrationAction, null);
  const submitting = isPending || isClientSubmitting || isDispatchPending;
  const currentStepTitle = STEP_TITLES[step - 1] ?? STEP_TITLES[0];

  useEffect(() => {
    if (state?.ok) {
      setData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      setCreatedAccountLink(null);
      setStep(9);
    }
  }, [state]);

  const updateField = useCallback(<K extends keyof WizardData>(field: K, value: WizardData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const focusFirstInvalidField = useCallback((field: string) => {
    const id = ERROR_FIELD_IDS[field] ?? field;

    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (!target) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    });
  }, []);

  const validateStep = useCallback((currentStep: number): boolean => {
    const nextErrors: Record<string, string> = {};

    if (currentStep === 2) {
      if (!data.firstName.trim()) nextErrors.firstName = t.common?.required || "First name is required.";
      if (!data.lastName.trim()) nextErrors.lastName = t.common?.required || "Last name is required.";
    }

    if (currentStep === 3) {
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        nextErrors.email = "Invalid email address.";
      }
    }

    if (currentStep === 8 && !data.privacyConsent) {
      nextErrors.privacyConsent = "Privacy consent is required.";
    }

    if (currentStep === 8) {
      const loginEmail = (data.loginEmail || data.email).trim();

      if (!loginEmail) {
        nextErrors.loginEmail = "Email address is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
        nextErrors.loginEmail = "Invalid email address.";
      }

      if (!createdAccountLink) {
        if (!data.password) {
          nextErrors.password = "Password is required.";
        } else if (data.password.length < 6) {
          nextErrors.password = "Password must be at least 6 characters long.";
        }

        if (!data.confirmPassword) {
          nextErrors.confirmPassword = "Please confirm your password.";
        } else if (data.password !== data.confirmPassword) {
          nextErrors.confirmPassword = "Passwords do not match.";
        }
      }
    }

    setErrors(nextErrors);
    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      focusFirstInvalidField(firstInvalidField);
      return false;
    }

    return true;
  }, [createdAccountLink, data, focusFirstInvalidField, t]);

  const handleNext = useCallback(() => {
    setTouchedSteps(prev => new Set(prev).add(step));
    if (!validateStep(step)) return;
    setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const addHouseholdMember = useCallback(() => {
    setData(prev => ({
      ...prev,
      householdMembers: [
        ...prev.householdMembers,
        {
          firstName: "",
          lastName: "",
          relationship: "child",
          dateOfBirth: null,
          gender: null,
          email: null,
          phone: null,
          membershipStatusSuggestion: null,
        },
      ],
    }));
  }, []);

  const updateHouseholdMember = useCallback((index: number, updates: Partial<RegistrationHouseholdMemberInput>) => {
    setData(prev => ({
      ...prev,
      householdMembers: prev.householdMembers.map((m, i) => (i === index ? { ...m, ...updates } : m)),
    }));
  }, []);

  const removeHouseholdMember = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      householdMembers: prev.householdMembers.filter((_, i) => i !== index),
    }));
  }, []);

  const toggleDepartment = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      departmentInterestIds: prev.departmentInterestIds.includes(id)
        ? prev.departmentInterestIds.filter(d => d !== id)
        : [...prev.departmentInterestIds, id],
    }));
  }, []);

  const createPortalAccount = useCallback(async () => {
    const loginEmail = (data.loginEmail || data.email).trim().toLowerCase();
    const supabase = createBrowserSupabaseClient();
    const { data: currentUserData } = await supabase.auth.getUser();
    const currentUser = currentUserData.user;

    if (currentUser) {
      const currentEmail = (currentUser.email ?? "").trim().toLowerCase();
      if (currentEmail !== loginEmail) {
        return {
          ok: false as const,
          existingAccount: false,
          error: "Sign out before linking this registration to a different account.",
        };
      }

      return {
        ok: true as const,
        authUserId: currentUser.id,
        loginEmail,
      };
    }

    const publicSiteUrl = getPublicSiteUrl();
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: loginEmail,
      password: data.password,
      options: {
        emailRedirectTo: `${publicSiteUrl}/auth/callback?next=registration-pending`,
        data: {
          registration_source: "public_church_registration",
          church_slug: church.slug,
        },
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      const existingAccount =
        message.includes("already") ||
        message.includes("registered") ||
        message.includes("exists");

      return {
        ok: false as const,
        existingAccount,
        error: existingAccount
          ? "An account may already exist for this email. Sign in or reset your password to continue."
          : "Portal account could not be created. Please check the email and password and try again.",
      };
    }

    if (!signUpData.user?.id) {
      return {
        ok: false as const,
        existingAccount: false,
        error: "Portal account could not be created. Please try again.",
      };
    }

    setData(prev => ({ ...prev, password: "", confirmPassword: "" }));

    return {
      ok: true as const,
      authUserId: signUpData.user.id,
      loginEmail,
    };
  }, [church.slug, data.email, data.loginEmail, data.password]);

  const submitFinalRegistration = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    setTouchedSteps(prev => new Set(prev).add(TOTAL_STEPS));
    setClientError(null);
    setExistingAccountNotice(false);

    if (!validateStep(TOTAL_STEPS)) return;

    setIsClientSubmitting(true);

    try {
      let accountLink = createdAccountLink;

      if (data.accountSetupRequested) {
        const keyCheck = await validateRegistrationKeyAction(church.slug, registrationKey);
        if (!keyCheck.ok) {
          setClientError("Registration could not be validated. Please refresh the link and try again.");
          return;
        }

        if (!accountLink) {
          const account = await createPortalAccount();
          if (!account.ok) {
            setExistingAccountNotice(account.existingAccount);
            setClientError(account.error);
            return;
          }

          accountLink = {
            authUserId: account.authUserId,
            loginEmail: account.loginEmail,
          };
          setCreatedAccountLink(accountLink);
        }
      }

      const formData = new FormData(form);
      formData.set("accountSetupRequested", String(data.accountSetupRequested));
      if (accountLink) {
        formData.set("authUserId", accountLink.authUserId);
        formData.set("loginEmail", accountLink.loginEmail);
      }

      startSubmitTransition(() => {
        formAction(formData);
      });
    } finally {
      setIsClientSubmitting(false);
    }
  }, [
    church.slug,
    createPortalAccount,
    createdAccountLink,
    data.accountSetupRequested,
    formAction,
    registrationKey,
    validateStep,
  ]);

  if (state?.ok) {
    return (
      <div className="mx-auto min-h-dvh max-w-2xl px-0 py-4 sm:px-2 sm:py-8">
        <RegistrationSuccess
          church={church}
          settings={settings}
          accountSetupRequested={state.accountSetupRequested}
          accountSetupStatus={state.accountSetupStatus}
          loginEmail={state.loginEmail}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl">
      <RegistrationHeader church={church} currentStep={currentStepTitle} />

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-6 md:p-8">
        <RegistrationProgress current={step} total={TOTAL_STEPS} label={currentStepTitle} />

        <div className="mt-6">
          {step === 1 && (
            <WelcomeStep
              church={church}
              settings={settings}
              onNext={handleNext}
            />
          )}

          {step === 2 && (
            <PersonalInformationStep
              data={data}
              onChange={updateField}
              errors={touchedSteps.has(2) ? errors : {}}
              settings={settings}
            />
          )}

          {step === 3 && (
            <ContactAddressStep
              data={data}
              onChange={updateField}
              errors={touchedSteps.has(3) ? errors : {}}
              settings={settings}
            />
          )}

          {step === 4 && (
            <MembershipInformationStep
              data={data}
              onChange={updateField}
              settings={settings}
            />
          )}

          {step === 5 && (
            <HouseholdFamilyStep
              data={data}
              onChange={updateField}
              settings={settings}
            />
          )}

          {step === 6 && (
            <HouseholdMembersStep
              members={data.householdMembers}
              onAdd={addHouseholdMember}
              onUpdate={updateHouseholdMember}
              onRemove={removeHouseholdMember}
              settings={settings}
            />
          )}

          {step === 7 && (
            <MinistryInterestsStep
              departments={departments}
              selectedIds={data.departmentInterestIds}
              onToggle={toggleDepartment}
              settings={settings}
            />
          )}

          {step === 8 && (
            <RegistrationReviewStep
              data={data}
              departments={departments}
              errors={touchedSteps.has(8) ? errors : {}}
              onChange={updateField}
            />
          )}

          {(clientError || (state && !state.ok)) && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {createdAccountLink && !existingAccountNotice && (
                <p className="mb-2 font-medium">
                  Your portal account was created, but we could not finish submitting the registration. Try submitting again.
                </p>
              )}
              <p>{clientError || (state && !state.ok ? state.error : "")}</p>
              {existingAccountNotice && (
                <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                  <a className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-red-800 ring-1 ring-red-200" href="/login">
                    Sign in
                  </a>
                  <a className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-red-800 ring-1 ring-red-200" href="/login?forgot=1">
                    Forgot password
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {step > 1 && step < 9 && (
          <div
            className="sticky bottom-0 z-20 mt-8 -mx-4 -mb-4 border-t border-stone-100 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(41,37,36,0.06)] backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6 md:-mx-8 md:-mb-8 md:px-8"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="inline-flex h-12 min-w-20 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-base font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50 sm:px-5 sm:text-sm"
              >
                {t.common?.back || "Back"}
              </button>

              {step === TOTAL_STEPS ? (
                <form onSubmit={submitFinalRegistration} className="contents">
                  <input type="hidden" name="churchSlug" value={church.slug} />
                  <input type="hidden" name="key" value={registrationKey} />
                  <input type="hidden" name="firstName" value={data.firstName} />
                  <input type="hidden" name="lastName" value={data.lastName} />
                  <input type="hidden" name="displayName" value={data.displayName} />
                  <input type="hidden" name="email" value={data.email} />
                  <input type="hidden" name="phone" value={data.phone} />
                  <input type="hidden" name="dateOfBirth" value={data.dateOfBirth} />
                  <input type="hidden" name="gender" value={data.gender} />
                  <input type="hidden" name="maritalStatus" value={data.maritalStatus} />
                  <input type="hidden" name="profession" value={data.profession} />
                  <input type="hidden" name="address" value={data.address} />
                  <input type="hidden" name="city" value={data.city} />
                  <input type="hidden" name="country" value={data.country} />
                  <input type="hidden" name="preferredContactMethod" value={data.preferredContactMethod} />
                  <input type="hidden" name="emergencyContactName" value={data.emergencyContactName} />
                  <input type="hidden" name="emergencyContactPhone" value={data.emergencyContactPhone} />
                  <input type="hidden" name="howHeardAboutChurch" value={data.howHeardAboutChurch} />
                  <input type="hidden" name="christianStatus" value={data.christianStatus} />
                  <input type="hidden" name="isBaptized" value={String(data.isBaptized)} />
                  <input type="hidden" name="baptismDate" value={data.baptismDate} />
                  <input type="hidden" name="previousChurch" value={data.previousChurch} />
                  <input type="hidden" name="wantsMembership" value={String(data.wantsMembership)} />
                  <input type="hidden" name="requestedMembershipType" value={data.requestedMembershipType} />
                  <input type="hidden" name="transferInDate" value={data.transferInDate} />
                  <input type="hidden" name="householdAction" value={data.householdAction} />
                  <input type="hidden" name="suggestedHouseholdName" value={data.suggestedHouseholdName} />
                  <input type="hidden" name="suggestedHouseholdHeadName" value={data.suggestedHouseholdHeadName} />
                  <input type="hidden" name="suggestedHouseholdHeadPhone" value={data.suggestedHouseholdHeadPhone} />
                  <input type="hidden" name="suggestedHouseholdRole" value={data.suggestedHouseholdRole} />
                  <input type="hidden" name="suggestedHouseholdAddress" value={data.suggestedHouseholdAddress} />
                  <input type="hidden" name="suggestedHouseholdCity" value={data.suggestedHouseholdCity} />
                  <input type="hidden" name="suggestedHouseholdCountry" value={data.suggestedHouseholdCountry} />
                  <input type="hidden" name="suggestedHouseholdPhone" value={data.suggestedHouseholdPhone} />
                  <input type="hidden" name="suggestedHouseholdEmail" value={data.suggestedHouseholdEmail} />
                  <input type="hidden" name="householdNotes" value={data.householdNotes} />
                  <input type="hidden" name="notes" value={data.notes} />
                  <input type="hidden" name="privacyConsent" value={String(data.privacyConsent)} />
                  <input type="hidden" name="accountSetupRequested" value={String(data.accountSetupRequested)} />
                  {data.departmentInterestIds.map((id, i) => (
                    <input key={id} type="hidden" name={`departmentInterestIds[${i}]`} value={id} />
                  ))}
                  {data.householdMembers.map((m, i) => (
                    <div key={i} className="contents">
                      <input type="hidden" name={`householdMembers[${i}].firstName`} value={m.firstName} />
                      <input type="hidden" name={`householdMembers[${i}].lastName`} value={m.lastName} />
                      <input type="hidden" name={`householdMembers[${i}].relationship`} value={m.relationship} />
                      <input type="hidden" name={`householdMembers[${i}].dateOfBirth`} value={m.dateOfBirth ?? ""} />
                      <input type="hidden" name={`householdMembers[${i}].gender`} value={m.gender ?? ""} />
                      <input type="hidden" name={`householdMembers[${i}].email`} value={m.email ?? ""} />
                      <input type="hidden" name={`householdMembers[${i}].phone`} value={m.phone ?? ""} />
                      <input type="hidden" name={`householdMembers[${i}].membershipStatusSuggestion`} value={m.membershipStatusSuggestion ?? ""} />
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-12 min-w-0 items-center justify-center rounded-xl bg-emerald-800 px-4 text-base font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60 sm:px-6 sm:text-sm"
                    aria-live="polite"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                        Creating account...
                      </>
                    ) : (
                      "Create account & submit"
                    )}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting}
                  className="inline-flex h-12 min-w-0 items-center justify-center rounded-xl bg-emerald-800 px-4 text-base font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60 sm:px-6 sm:text-sm"
                >
                  {t.common?.continue || "Continue"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
