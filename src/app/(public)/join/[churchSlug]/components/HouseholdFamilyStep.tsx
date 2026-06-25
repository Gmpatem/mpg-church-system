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
  { value: "self_only", label: "Registering only myself" },
  { value: "existing_household", label: "I belong to an existing household" },
  { value: "new_household", label: "I want to create a new household" },
  { value: "not_sure", label: "I'm not sure" },
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
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Household & Family</h2>
        <p className="text-sm text-stone-600">Let us know about your household situation.</p>
      </div>

      <div className="space-y-3">
        {householdOptions.map(option => {
          const selected = data.householdAction === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange("householdAction", option.value as WizardData["householdAction"])}
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition ${
                selected
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-stone-200 hover:border-emerald-200 hover:bg-emerald-50/30"
              }`}
            >
              <span className="text-sm font-medium text-stone-700">{option.label}</span>
              {selected && <Check className="size-5 text-emerald-700" />}
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
              className="h-12 rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="suggestedHouseholdPhone">Household phone</Label>
              <Input
                id="suggestedHouseholdPhone"
                value={data.suggestedHouseholdPhone}
                onChange={e => onChange("suggestedHouseholdPhone", e.target.value)}
                placeholder="Household phone"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suggestedHouseholdEmail">Household email</Label>
              <Input
                id="suggestedHouseholdEmail"
                value={data.suggestedHouseholdEmail}
                onChange={e => onChange("suggestedHouseholdEmail", e.target.value)}
                placeholder="Household email"
                className="h-12 rounded-xl"
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
              className="h-12 rounded-xl"
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
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="suggestedHouseholdCountry">Country</Label>
              <Input
                id="suggestedHouseholdCountry"
                value={data.suggestedHouseholdCountry}
                onChange={e => onChange("suggestedHouseholdCountry", e.target.value)}
                placeholder="Country"
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suggestedHouseholdRole">Your role in this household</Label>
            <Select
              value={data.suggestedHouseholdRole}
              onValueChange={value => onChange("suggestedHouseholdRole", value)}
            >
              <SelectTrigger id="suggestedHouseholdRole" className="h-12 rounded-xl">
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
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="suggestedHouseholdHeadPhone">Head of household phone</Label>
            <Input
              id="suggestedHouseholdHeadPhone"
              value={data.suggestedHouseholdHeadPhone}
              onChange={e => onChange("suggestedHouseholdHeadPhone", e.target.value)}
              placeholder="Phone number"
              className="h-12 rounded-xl"
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
          className="h-12 rounded-xl"
        />
      </div>
    </div>
  );
}
