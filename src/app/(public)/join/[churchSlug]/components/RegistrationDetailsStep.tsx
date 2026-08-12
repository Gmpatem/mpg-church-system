import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHURCH_GENDER_OPTIONS } from "@/lib/domain/church-gender";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";
import type { WizardData } from "./RegistrationWizard";

type RegistrationDetailsStepProps = {
  data: WizardData;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
  errors: Record<string, string>;
  settings: PublicRegistrationPageData["settings"];
};

export function RegistrationDetailsStep({
  data,
  onChange,
  errors,
  settings,
}: RegistrationDetailsStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-3xl font-semibold text-emerald-900 shadow-inner">
          {[data.firstName?.[0], data.lastName?.[0]].filter(Boolean).join("") || "?"}
        </div>
        <h2 className="mt-4 text-xl font-semibold text-stone-950">Your Details</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Tell the church office who is registering and how to reach you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="First name" htmlFor="firstName" required error={errors.firstName}>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(event) => onChange("firstName", event.target.value)}
            placeholder="John"
            autoComplete="given-name"
            enterKeyHint="next"
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            className="h-12 rounded-xl bg-white text-base sm:text-sm"
          />
        </FieldShell>

        <FieldShell label="Last name" htmlFor="lastName" required error={errors.lastName}>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(event) => onChange("lastName", event.target.value)}
            placeholder="Doe"
            autoComplete="family-name"
            enterKeyHint="next"
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            className="h-12 rounded-xl bg-white text-base sm:text-sm"
          />
        </FieldShell>
      </div>

      <FieldShell label="Preferred name" htmlFor="displayName">
        <Input
          id="displayName"
          value={data.displayName}
          onChange={(event) => onChange("displayName", event.target.value)}
          placeholder="Optional"
          autoComplete="name"
          enterKeyHint="next"
          className="h-12 rounded-xl bg-white text-base sm:text-sm"
        />
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Phone number" htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={data.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="+233 24 123 4567"
            autoComplete="tel"
            enterKeyHint="next"
            className="h-12 rounded-xl bg-white text-base sm:text-sm"
          />
        </FieldShell>

        <FieldShell label="Email address" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={data.email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="john.doe@example.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-12 rounded-xl bg-white text-base sm:text-sm"
          />
        </FieldShell>
      </div>

      {settings.collectDateOfBirth ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Date of birth" htmlFor="dateOfBirth">
            <Input
              id="dateOfBirth"
              type="date"
              value={data.dateOfBirth}
              onChange={(event) => onChange("dateOfBirth", event.target.value)}
              className="h-12 rounded-xl bg-white text-base sm:text-sm"
            />
          </FieldShell>

          <FieldShell label="Gender" htmlFor="gender">
            <Select value={data.gender} onValueChange={(value) => onChange("gender", value)}>
              <SelectTrigger id="gender" className="h-12 rounded-xl bg-white text-base sm:text-sm">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {CHURCH_GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Marital status" htmlFor="maritalStatus">
          <Select
            value={data.maritalStatus}
            onValueChange={(value) => onChange("maritalStatus", value)}
          >
            <SelectTrigger id="maritalStatus" className="h-12 rounded-xl bg-white text-base sm:text-sm">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="separated">Separated</SelectItem>
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell label="Profession / occupation" htmlFor="profession">
          <Input
            id="profession"
            value={data.profession}
            onChange={(event) => onChange("profession", event.target.value)}
            placeholder="Teacher"
            autoComplete="organization-title"
            enterKeyHint="next"
            className="h-12 rounded-xl bg-white text-base sm:text-sm"
          />
        </FieldShell>
      </div>

      <div className="grid gap-4">
        <FieldShell label="Address" htmlFor="address">
          <Input
            id="address"
            value={data.address}
            onChange={(event) => onChange("address", event.target.value)}
            placeholder="Street address"
            autoComplete="street-address"
            enterKeyHint="next"
            className="h-12 rounded-xl bg-white text-base sm:text-sm"
          />
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="City" htmlFor="city">
            <Input
              id="city"
              value={data.city}
              onChange={(event) => onChange("city", event.target.value)}
              placeholder="City"
              autoComplete="address-level2"
              enterKeyHint="next"
              className="h-12 rounded-xl bg-white text-base sm:text-sm"
            />
          </FieldShell>

          <FieldShell label="Country" htmlFor="country">
            <Input
              id="country"
              value={data.country}
              onChange={(event) => onChange("country", event.target.value)}
              placeholder="Country"
              autoComplete="country-name"
              enterKeyHint="next"
              className="h-12 rounded-xl bg-white text-base sm:text-sm"
            />
          </FieldShell>
        </div>
      </div>

      {settings.collectEmergencyContact ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-sm font-semibold text-emerald-950">Emergency contact</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FieldShell label="Name" htmlFor="emergencyContactName">
              <Input
                id="emergencyContactName"
                value={data.emergencyContactName}
                onChange={(event) => onChange("emergencyContactName", event.target.value)}
                placeholder="Contact name"
                autoComplete="name"
                enterKeyHint="next"
                className="h-12 rounded-xl bg-white text-base sm:text-sm"
              />
            </FieldShell>

            <FieldShell label="Phone" htmlFor="emergencyContactPhone">
              <Input
                id="emergencyContactPhone"
                type="tel"
                inputMode="tel"
                value={data.emergencyContactPhone}
                onChange={(event) => onChange("emergencyContactPhone", event.target.value)}
                placeholder="Contact phone"
                autoComplete="tel"
                enterKeyHint="done"
                className="h-12 rounded-xl bg-white text-base sm:text-sm"
              />
            </FieldShell>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldShell({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
