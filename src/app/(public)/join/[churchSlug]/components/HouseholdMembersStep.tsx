import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { RegistrationHouseholdMemberInput } from "@/features/member-registration/schemas";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";
import { CHURCH_GENDER_OPTIONS } from "@/lib/domain/church-gender";

const EMPTY_GENDER_VALUE = "__none";

type HouseholdMembersStepProps = {
  members: RegistrationHouseholdMemberInput[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<RegistrationHouseholdMemberInput>) => void;
  onRemove: (index: number) => void;
  settings: PublicRegistrationPageData["settings"];
};

export function HouseholdMembersStep({ members, onAdd, onUpdate, onRemove, settings }: HouseholdMembersStepProps) {
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
        <h2 className="text-lg font-semibold text-stone-900">Other Household Members</h2>
        <p className="text-sm text-stone-600">Add family members you&apos;d like to register together.</p>
      </div>

      {members.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-500">
          No additional household members added yet.
        </div>
      )}

      <div className="space-y-4">
        {members.map((member, index) => (
          <div
            key={index}
            className="relative rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              aria-label="Remove family member"
            >
              <X className="size-4" />
            </button>

            <p className="mb-3 text-sm font-medium text-stone-800">Family member {index + 1}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`family-${index}-firstName`}>First name</Label>
                <Input
                  id={`family-${index}-firstName`}
                  value={member.firstName}
                  onChange={e => onUpdate(index, { firstName: e.target.value })}
                  placeholder="First name"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`family-${index}-lastName`}>Last name</Label>
                <Input
                  id={`family-${index}-lastName`}
                  value={member.lastName}
                  onChange={e => onUpdate(index, { lastName: e.target.value })}
                  placeholder="Last name"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`family-${index}-relationship`}>Relationship</Label>
                <Select
                  value={member.relationship}
                  onValueChange={value => onUpdate(index, { relationship: value as RegistrationHouseholdMemberInput["relationship"] })}
                >
                  <SelectTrigger id={`family-${index}-relationship`} className="h-11 rounded-xl">
                    <SelectValue placeholder="Relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="relative">Relative</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`family-${index}-dateOfBirth`}>Date of birth</Label>
                <Input
                  id={`family-${index}-dateOfBirth`}
                  type="date"
                  value={member.dateOfBirth ?? ""}
                  onChange={e => onUpdate(index, { dateOfBirth: e.target.value || null })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`family-${index}-gender`}>Gender</Label>
                <Select
                  value={member.gender ?? EMPTY_GENDER_VALUE}
                  onValueChange={(value) =>
                    onUpdate(index, {
                      gender:
                        value === EMPTY_GENDER_VALUE
                          ? null
                          : (value as RegistrationHouseholdMemberInput["gender"]),
                    })
                  }
                >
                  <SelectTrigger id={`family-${index}-gender`} className="h-11 rounded-xl">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_GENDER_VALUE}>Not specified</SelectItem>
                    {CHURCH_GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="h-12 w-full gap-2 rounded-xl border-stone-200 text-stone-700"
      >
        <Plus className="size-4" />
        Add family member
      </Button>
    </div>
  );
}
