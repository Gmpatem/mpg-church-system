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
import { CHURCH_GENDER_OPTIONS } from "@/lib/domain/church-gender";

type PersonalInformationStepProps = {
  data: WizardData;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
  errors: Record<string, string>;
  settings: PublicRegistrationPageData["settings"];
};

export function PersonalInformationStep({ data, onChange, errors, settings }: PersonalInformationStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Personal Information</h2>
        <p className="text-sm text-stone-600">Tell us a little about yourself.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name *</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={e => onChange("firstName", e.target.value)}
            placeholder="e.g. John"
            className="h-12 rounded-xl"
          />
          {errors.firstName && <p className="text-xs text-red-600">{errors.firstName}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name *</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={e => onChange("lastName", e.target.value)}
            placeholder="e.g. Smith"
            className="h-12 rounded-xl"
          />
          {errors.lastName && <p className="text-xs text-red-600">{errors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name / preferred name</Label>
        <Input
          id="displayName"
          value={data.displayName}
          onChange={e => onChange("displayName", e.target.value)}
          placeholder="e.g. Johnny"
          className="h-12 rounded-xl"
        />
      </div>

      {settings.collectDateOfBirth && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={data.dateOfBirth}
              onChange={e => onChange("dateOfBirth", e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Select value={data.gender} onValueChange={value => onChange("gender", value)}>
              <SelectTrigger id="gender" className="h-12 rounded-xl">
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
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="maritalStatus">Marital status</Label>
          <Select value={data.maritalStatus} onValueChange={value => onChange("maritalStatus", value)}>
            <SelectTrigger id="maritalStatus" className="h-12 rounded-xl">
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
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profession">Profession / occupation</Label>
          <Input
            id="profession"
            value={data.profession}
            onChange={e => onChange("profession", e.target.value)}
            placeholder="e.g. Teacher"
            className="h-12 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
