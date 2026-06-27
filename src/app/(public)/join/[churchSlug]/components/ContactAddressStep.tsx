import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WizardData } from "./RegistrationWizard";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";

type ContactAddressStepProps = {
  data: WizardData;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
  errors: Record<string, string>;
  settings: PublicRegistrationPageData["settings"];
};

export function ContactAddressStep({ data, onChange, errors, settings }: ContactAddressStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Contact & Address</h2>
        <p className="text-sm text-stone-600">How can we reach you?</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          value={data.email}
          onChange={e => onChange("email", e.target.value)}
          placeholder="e.g. john@example.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="h-12 rounded-xl text-base sm:text-sm"
        />
        {errors.email && <p id="email-error" className="text-xs text-red-600">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          value={data.phone}
          onChange={e => onChange("phone", e.target.value)}
          placeholder="e.g. +1 555 123 4567"
          autoComplete="tel"
          enterKeyHint="next"
          className="h-12 rounded-xl text-base sm:text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="preferredContactMethod">Preferred contact method</Label>
        <Select
          value={data.preferredContactMethod}
          onValueChange={value => onChange("preferredContactMethod", value)}
        >
          <SelectTrigger id="preferredContactMethod" className="h-12 rounded-xl text-base sm:text-sm">
            <SelectValue placeholder="Select preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="any">Any</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={data.address}
          onChange={e => onChange("address", e.target.value)}
          placeholder="Street address"
          autoComplete="street-address"
          enterKeyHint="next"
          className="h-12 rounded-xl text-base sm:text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={data.city}
            onChange={e => onChange("city", e.target.value)}
            placeholder="City"
            autoComplete="address-level2"
            enterKeyHint="next"
            className="h-12 rounded-xl text-base sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={data.country}
            onChange={e => onChange("country", e.target.value)}
            placeholder="Country"
            autoComplete="country-name"
            enterKeyHint="next"
            className="h-12 rounded-xl text-base sm:text-sm"
          />
        </div>
      </div>

      {settings.collectEmergencyContact && (
        <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-800">Emergency contact</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="emergencyContactName">Name</Label>
              <Input
                id="emergencyContactName"
                value={data.emergencyContactName}
                onChange={e => onChange("emergencyContactName", e.target.value)}
                placeholder="Contact name"
                autoComplete="name"
                enterKeyHint="next"
                className="h-12 rounded-xl text-base sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emergencyContactPhone">Phone</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                inputMode="tel"
                value={data.emergencyContactPhone}
                onChange={e => onChange("emergencyContactPhone", e.target.value)}
                placeholder="Contact phone"
                autoComplete="tel"
                enterKeyHint="done"
                className="h-12 rounded-xl text-base sm:text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
