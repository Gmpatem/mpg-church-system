import { Button } from "@/components/ui/button";
import type { ChurchMemberRegistration, RegistrationDuplicateState } from "@/features/member-registration/types";
import { formatRegistrationName, formatHouseholdAction, formatRegistrationStatus } from "@/features/member-registration/presentation";

type RegistrationDetailsRailProps = {
  churchSlug: string;
  registration: ChurchMemberRegistration | null;
  familyMembers: { id: string; first_name: string; last_name: string; relationship: string }[];
  duplicateState: RegistrationDuplicateState | null;
  onReview: () => void;
};

export function RegistrationDetailsRail({
  registration,
  familyMembers,
  duplicateState,
  onReview,
}: RegistrationDetailsRailProps) {
  if (!registration) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
        Select a registration to review details.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">{formatRegistrationName(registration)}</h2>
          <p className="text-xs text-muted-foreground">{formatRegistrationStatus(registration.status)}</p>
        </div>
        {registration.status !== "converted" && registration.status !== "merged" && registration.status !== "rejected" && (
          <Button size="sm" onClick={onReview}>
            Review
          </Button>
        )}
      </div>

      <div className="space-y-3 text-sm">
        <DetailGroup title="Contact">
          {registration.email && <DetailItem label="Email" value={registration.email} />}
          {registration.phone && <DetailItem label="Phone" value={registration.phone} />}
          {(registration.address || registration.city || registration.country) && (
            <DetailItem
              label="Address"
              value={[registration.address, registration.city, registration.country].filter(Boolean).join(", ")}
            />
          )}
        </DetailGroup>

        <DetailGroup title="Household request">
          <DetailItem label="Action" value={formatHouseholdAction(registration.household_action)} />
          {registration.suggested_household_name && (
            <DetailItem label="Suggested name" value={registration.suggested_household_name} />
          )}
        </DetailGroup>

        {familyMembers.length > 0 && (
          <DetailGroup title="Family members">
            <ul className="space-y-1">
              {familyMembers.map(member => (
                <li key={member.id} className="text-foreground">
                  {[member.first_name, member.last_name].filter(Boolean).join(" ") || "Unnamed"} ({member.relationship})
                </li>
              ))}
            </ul>
          </DetailGroup>
        )}

        {duplicateState && duplicateState.memberCandidates.length > 0 && (
          <DetailGroup title="Possible member matches">
            <ul className="space-y-1">
              {duplicateState.memberCandidates.map(candidate => (
                <li key={candidate.memberId} className="text-xs text-amber-700">
                  {candidate.firstName} {candidate.lastName} — {candidate.reason}
                </li>
              ))}
            </ul>
          </DetailGroup>
        )}

        {duplicateState && duplicateState.householdCandidates.length > 0 && (
          <DetailGroup title="Possible household matches">
            <ul className="space-y-1">
              {duplicateState.householdCandidates.map(candidate => (
                <li key={candidate.householdId} className="text-xs text-amber-700">
                  {candidate.householdName} — {candidate.reason}
                </li>
              ))}
            </ul>
          </DetailGroup>
        )}
      </div>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
