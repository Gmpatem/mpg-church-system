import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WizardData } from "./RegistrationWizard";
import type { PublicRegistrationPageData } from "@/features/member-registration/public-queries";

type MembershipInformationStepProps = {
  data: WizardData;
  onChange: <K extends keyof WizardData>(field: K, value: WizardData[K]) => void;
  settings: PublicRegistrationPageData["settings"];
};

export function MembershipInformationStep({ data, onChange, settings }: MembershipInformationStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Church Membership</h2>
        <p className="text-sm text-stone-600">Help us understand your church background.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="howHeardAboutChurch">How did you hear about us?</Label>
        <Input
          id="howHeardAboutChurch"
          value={data.howHeardAboutChurch}
          onChange={e => onChange("howHeardAboutChurch", e.target.value)}
          placeholder="e.g. Friend invitation, online search"
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="christianStatus">Christian status</Label>
        <Select
          value={data.christianStatus}
          onValueChange={value => onChange("christianStatus", value)}
        >
          <SelectTrigger id="christianStatus" className="h-12 rounded-xl">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="believer">Believer</SelectItem>
            <SelectItem value="seeker">Seeker</SelectItem>
            <SelectItem value="new_convert">New convert</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 p-4">
        <Checkbox
          id="isBaptized"
          checked={data.isBaptized}
          onCheckedChange={checked => onChange("isBaptized", checked === true)}
        />
        <Label htmlFor="isBaptized" className="text-sm font-normal text-stone-700">
          I have been baptized
        </Label>
      </div>

      {data.isBaptized && (
        <div className="space-y-1.5">
          <Label htmlFor="baptismDate">Baptism date</Label>
          <Input
            id="baptismDate"
            type="date"
            value={data.baptismDate}
            onChange={e => onChange("baptismDate", e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="previousChurch">Previous church (if any)</Label>
        <Input
          id="previousChurch"
          value={data.previousChurch}
          onChange={e => onChange("previousChurch", e.target.value)}
          placeholder="Name of previous church"
          className="h-12 rounded-xl"
        />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 p-4">
        <Checkbox
          id="wantsMembership"
          checked={data.wantsMembership}
          onCheckedChange={checked => onChange("wantsMembership", checked === true)}
        />
        <Label htmlFor="wantsMembership" className="text-sm font-normal text-stone-700">
          I am interested in church membership
        </Label>
      </div>

      {data.wantsMembership && (
        <div className="space-y-1.5">
          <Label htmlFor="requestedMembershipType">Membership type requested</Label>
          <Select
            value={data.requestedMembershipType}
            onValueChange={value => onChange("requestedMembershipType", value)}
          >
            <SelectTrigger id="requestedMembershipType" className="h-12 rounded-xl">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="adherent">Adherent</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="youth">Youth</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="transferInDate">Transfer-in date (if applicable)</Label>
        <Input
          id="transferInDate"
          type="date"
          value={data.transferInDate}
          onChange={e => onChange("transferInDate", e.target.value)}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Anything else we should know?</Label>
        <Input
          id="notes"
          value={data.notes}
          onChange={e => onChange("notes", e.target.value)}
          placeholder="Optional notes"
          className="h-12 rounded-xl"
        />
      </div>
    </div>
  );
}
