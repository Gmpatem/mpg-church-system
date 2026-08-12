import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import type { WizardData } from "./RegistrationWizard";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";

type HouseholdFamilyStepProps = {
  data: WizardData;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
  settings: PublicRegistrationPageData["settings"];
};

const householdOptions = [
  {
    value: "new_household",
    label: "My household",
    description: "Register myself and my family members.",
  },
  {
    value: "self_only",
    label: "Just me",
    description: "Register myself only.",
  },
  {
    value: "existing_household",
    label: "I already belong to a household",
    description: "I want to be added to an existing household.",
  },
  {
    value: "not_sure",
    label: "Not sure",
    description: "The church office can help me decide.",
  },
];

export function HouseholdFamilyStep({ data, onChange, settings }: HouseholdFamilyStepProps) {
  if (!settings.collectHouseholdInformation) {
    return (
      <div className="py-8 text-center text-sm text-stone-500">
        Household information is not being collected at this time.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
          <span className="text-4xl" aria-hidden="true">⌂</span>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-stone-950">Your Household</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">Select the option that best describes you.</p>
      </div>

      <div className="grid gap-3">
        {householdOptions.map(option => {
          const selected = data.householdAction === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange("householdAction", option.value as WizardData["householdAction"])}
              className={`flex min-h-20 w-full cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
                selected
                  ? "border-emerald-400 bg-emerald-50/80"
                  : "border-stone-200 hover:border-emerald-200 hover:bg-emerald-50/30"
              }`}
            >
              <span className={selected ? "flex size-5 items-center justify-center rounded-full bg-emerald-800 text-white" : "size-5 rounded-full border border-stone-300 bg-white"}>
                {selected ? <Check className="size-3.5" aria-hidden="true" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-950">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-stone-600">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {data.householdAction === "new_household" && (
        <div className="space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-800">Suggested new household</p>

          <div className="space-y-1.5">
            <Label htmlFor="suggestedHouseholdName">Household name</Label>
            <Input
              id="suggestedHouseholdName"
              value={data.suggestedHouseholdName}
              onChange={e => onChange("suggestedHouseholdName", e.target.value)}
              placeholder="e.g. The Smith Family"
              autoComplete="organization"
              enterKeyHint="next"
              className="h-12 rounded-xl text-base sm:text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="suggestedHouseholdPhone">Household phone</Label>
              <Input
                id="suggestedHouseholdPhone"
                type="tel"
                inputMode="tel"
                value={data.suggestedHouseholdPhone}
                onChange={e => onChange("suggestedHouseholdPhone", e.target.value)}
                placeholder="Household phone"
                autoComplete="tel"
                enterKeyHint="next"
                className="h-12 rounded-xl text-base sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suggestedHouseholdEmail">Household email</Label>
              <Input
                id="suggestedHouseholdEmail"
                type="email"
                inputMode="email"
                value={data.suggestedHouseholdEmail}
                onChange={e => onChange("suggestedHouseholdEmail", e.target.value)}
                placeholder="Household email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
                className="h-12 rounded-xl text-base sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suggestedHouseholdAddress">Address</Label>
            <Input
              id="suggestedHouseholdAddress"
              value={data.suggestedHouseholdAddress}
              onChange={e => onChange("suggestedHouseholdAddress", e.target.value)}
              placeholder="Street address"
              autoComplete="street-address"
              enterKeyHint="next"
              className="h-12 rounded-xl text-base sm:text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="suggestedHouseholdCity">City</Label>
              <Input
                id="suggestedHouseholdCity"
                value={data.suggestedHouseholdCity}
                onChange={e => onChange("suggestedHouseholdCity", e.target.value)}
                placeholder="City"
                autoComplete="address-level2"
                enterKeyHint="next"
                className="h-12 rounded-xl text-base sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suggestedHouseholdCountry">Country</Label>
              <Input
                id="suggestedHouseholdCountry"
                value={data.suggestedHouseholdCountry}
                onChange={e => onChange("suggestedHouseholdCountry", e.target.value)}
                placeholder="Country"
                autoComplete="country-name"
                enterKeyHint="next"
                className="h-12 rounded-xl text-base sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suggestedHouseholdRole">Your role in this household</Label>
            <Select
              value={data.suggestedHouseholdRole}
              onValueChange={value => onChange("suggestedHouseholdRole", value)}
            >
              <SelectTrigger id="suggestedHouseholdRole" className="h-12 rounded-xl text-base sm:text-sm">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="head">Head</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="relative">Relative</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {data.householdAction === "existing_household" && (
        <div className="space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-800">Existing household suggestion</p>
          <div className="space-y-1.5">
            <Label htmlFor="suggestedHouseholdHeadName">Head of household name</Label>
            <Input
              id="suggestedHouseholdHeadName"
              value={data.suggestedHouseholdHeadName}
              onChange={e => onChange("suggestedHouseholdHeadName", e.target.value)}
              placeholder="e.g. Robert Smith"
              autoComplete="name"
              enterKeyHint="next"
              className="h-12 rounded-xl text-base sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="suggestedHouseholdHeadPhone">Head of household phone</Label>
            <Input
              id="suggestedHouseholdHeadPhone"
              type="tel"
              inputMode="tel"
              value={data.suggestedHouseholdHeadPhone}
              onChange={e => onChange("suggestedHouseholdHeadPhone", e.target.value)}
              placeholder="Phone number"
              autoComplete="tel"
              enterKeyHint="done"
              className="h-12 rounded-xl text-base sm:text-sm"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="householdNotes">Household notes</Label>
        <Input
          id="householdNotes"
          value={data.householdNotes}
          onChange={e => onChange("householdNotes", e.target.value)}
          placeholder="Anything else about your household"
          enterKeyHint="done"
          className="h-12 rounded-xl text-base sm:text-sm"
        />
      </div>
    </div>
  );
}
