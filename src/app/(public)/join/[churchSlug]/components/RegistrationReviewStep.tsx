import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  const selectedDepartments = departments.filter(d => data.departmentInterestIds.includes(d.id));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Review & Submit</h2>
        <p className="text-sm text-stone-600">Please review your information before submitting.</p>
      </div>

      <div className="space-y-3 rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm">
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

      <div className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50 p-4">
        <Checkbox
          id="privacyConsent"
          checked={data.privacyConsent}
          onCheckedChange={checked => onChange("privacyConsent", checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor="privacyConsent" className="text-sm font-normal leading-relaxed text-stone-700">
          I consent to this information being stored and reviewed by {data.householdAction ? "the church office" : "the church"}. I understand this does not create a login account.
        </Label>
      </div>
      {errors.privacyConsent && <p className="text-xs text-red-600">{errors.privacyConsent}</p>}
    </div>
  );
}

function ReviewGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-stone-500">{label}:</span>
      <span className="font-medium text-stone-800">{value}</span>
    </div>
  );
}
