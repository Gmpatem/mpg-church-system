"use client";

import { startTransition, useState, useActionState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { convertRegistrationAction } from "@/features/member-registration/conversion";
import { rejectRegistrationAction } from "@/features/member-registration/actions";
import type { ChurchMemberRegistration, RegistrationDuplicateState } from "@/features/member-registration/types";
import { formatRegistrationName } from "@/features/member-registration/presentation";
import { useRouter } from "next/navigation";

type RegistrationReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchSlug: string;
  registration: ChurchMemberRegistration;
  familyMembers: { id: string; first_name: string; last_name: string; relationship: string }[];
  duplicateState: RegistrationDuplicateState | null;
};

type TabId = "member" | "household" | "family";

function formatAccountSetupStatus(status: string | null | undefined) {
  switch (status) {
    case "pending_email_confirmation":
      return "Pending email confirmation";
    case "pending_approval":
      return "Pending approval";
    case "active":
      return "Active";
    case "rejected":
      return "Rejected";
    case "link_failed":
      return "Link failed";
    case "not_requested":
    default:
      return "Not requested";
  }
}

export function RegistrationReviewDialog({
  open,
  onOpenChange,
  churchSlug,
  registration,
  familyMembers,
  duplicateState,
}: RegistrationReviewDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("member");
  const [memberResolution, setMemberResolution] = useState<"create" | "merge">("create");
  const [memberId, setMemberId] = useState("");
  const [membershipStatus, setMembershipStatus] = useState("visitor");
  const [householdResolution, setHouseholdResolution] = useState<"none" | "existing" | "new">("none");
  const [householdId, setHouseholdId] = useState("");
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [householdRole, setHouseholdRole] = useState("");
  const [setAsHead, setSetAsHead] = useState(false);
  const [familyResolutions, setFamilyResolutions] = useState<
    Record<string, { resolution: "create" | "link" | "skip"; memberId: string; householdRole: string }>
  >({});
  const [reviewNote, setReviewNote] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [conversionState, convertAction, converting] = useActionState(convertRegistrationAction, null);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectRegistrationAction, null);
  const accountRequested = Boolean(
    registration.account_setup_requested ||
      registration.auth_user_id ||
      registration.login_email
  );

  useEffect(() => {
    if (conversionState?.ok) {
      router.refresh();
      if (conversionState.message) {
        setSuccessMessage(conversionState.message);
      } else {
        onOpenChange(false);
      }
    }
  }, [conversionState, onOpenChange, router]);

  useEffect(() => {
    if (rejectState?.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [rejectState, onOpenChange, router]);

  const submitConversion = () => {
    setSuccessMessage(null);
    const formData = new FormData();
    formData.append("churchSlug", churchSlug);
    formData.append("registrationId", registration.id);
    formData.append("memberResolution", memberResolution);
    if (memberId) formData.append("memberId", memberId);
    formData.append("membershipStatus", membershipStatus);
    formData.append("householdResolution", householdResolution);
    if (householdId) formData.append("householdId", householdId);
    if (newHouseholdName) formData.append("newHouseholdName", newHouseholdName);
    if (householdRole) formData.append("householdRole", householdRole);
    formData.append("setAsHead", String(setAsHead));
    formData.append("reviewNote", reviewNote);

    Object.entries(familyResolutions).forEach(([id, res], i) => {
      formData.append(`familyMemberResolutions[${i}].registrationHouseholdMemberId`, id);
      formData.append(`familyMemberResolutions[${i}].resolution`, res.resolution);
      if (res.memberId) formData.append(`familyMemberResolutions[${i}].memberId`, res.memberId);
      if (res.householdRole) formData.append(`familyMemberResolutions[${i}].householdRole`, res.householdRole);
    });

    startTransition(() => {
      convertAction(formData);
    });
  };

  const submitReject = () => {
    setSuccessMessage(null);
    const formData = new FormData();
    formData.append("churchSlug", churchSlug);
    formData.append("registrationId", registration.id);
    formData.append("reviewNote", reviewNote);
    startTransition(() => {
      rejectAction(formData);
    });
  };

  const householdRoleOptions = [
    { value: "head", label: "Head" },
    { value: "spouse", label: "Spouse" },
    { value: "child", label: "Child" },
    { value: "relative", label: "Relative" },
    { value: "guardian", label: "Guardian" },
    { value: "other", label: "Other" },
  ];

  const tabs: { id: TabId; label: string }[] = [
    { id: "member", label: "Member" },
    { id: "household", label: "Household" },
    { id: "family", label: "Family" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-3xl flex-col overflow-hidden p-0 sm:max-h-[90vh]">
        <DialogHeader className="border-b border-border px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="leading-snug">Review registration: {formatRegistrationName(registration)}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
        {accountRequested && (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">Portal account requested</p>
            <div className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
              <span>Login email: {registration.login_email || registration.email || "Not provided"}</span>
              <span>Auth account linked: {registration.auth_user_id ? "Yes" : "No"}</span>
              <span>Account setup status: {formatAccountSetupStatus(registration.account_setup_status)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 items-center gap-1 rounded-lg border p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-0 rounded-md px-2 py-2 text-sm font-medium transition ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === "member" && (
            <>
              <div className="space-y-2">
                <Label>Member resolution</Label>
                <Select value={memberResolution} onValueChange={v => setMemberResolution(v as "create" | "merge")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create">Create new member</SelectItem>
                    <SelectItem value="merge">Merge with existing member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {memberResolution === "merge" && (
                <div className="space-y-2">
                  <Label>Existing member ID</Label>
                  <Input value={memberId} onChange={e => setMemberId(e.target.value)} placeholder="Member UUID" />
                  {duplicateState?.memberCandidates.map(c => (
                    <button
                      key={c.memberId}
                      type="button"
                      onClick={() => setMemberId(c.memberId)}
                      className="block w-full rounded-lg border p-2 text-left text-sm hover:bg-muted"
                    >
                      {c.firstName} {c.lastName} — {c.reason}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Membership status</Label>
                <Select value={membershipStatus} onValueChange={setMembershipStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visitor">Visitor</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {activeTab === "household" && (
            <>
              <div className="space-y-2">
                <Label>Household resolution</Label>
                <Select
                  value={householdResolution}
                  onValueChange={v => setHouseholdResolution(v as "none" | "existing" | "new")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No household</SelectItem>
                    <SelectItem value="existing">Link existing household</SelectItem>
                    <SelectItem value="new">Create new household</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {householdResolution === "existing" && (
                <div className="space-y-2">
                  <Label>Existing household ID</Label>
                  <Input value={householdId} onChange={e => setHouseholdId(e.target.value)} placeholder="Household UUID" />
                  {duplicateState?.householdCandidates.map(c => (
                    <button
                      key={c.householdId}
                      type="button"
                      onClick={() => setHouseholdId(c.householdId)}
                      className="block w-full rounded-lg border p-2 text-left text-sm hover:bg-muted"
                    >
                      {c.householdName} — {c.reason}
                    </button>
                  ))}
                </div>
              )}

              {householdResolution === "new" && (
                <div className="space-y-2">
                  <Label>New household name</Label>
                  <Input
                    value={newHouseholdName}
                    onChange={e => setNewHouseholdName(e.target.value)}
                    placeholder="e.g. The Smith Family"
                  />
                </div>
              )}

              {householdResolution !== "none" && (
                <>
                  <div className="space-y-2">
                    <Label>Primary member household role</Label>
                    <Select value={householdRole} onValueChange={setHouseholdRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {householdRoleOptions.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="setAsHead"
                      checked={setAsHead}
                      onCheckedChange={c => setSetAsHead(c === true)}
                    />
                    <Label htmlFor="setAsHead" className="font-normal">Set primary member as head of household</Label>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === "family" && (
            <>
              {familyMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">No additional family members were submitted.</p>
              )}
              {familyMembers.map(member => {
                const res = familyResolutions[member.id] || { resolution: "skip", memberId: "", householdRole: "" };
                return (
                  <div key={member.id} className="rounded-lg border p-3">
                    <p className="font-medium">
                      {member.first_name} {member.last_name} ({member.relationship})
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <Select
                        value={res.resolution}
                        onValueChange={v =>
                          setFamilyResolutions(prev => ({
                            ...prev,
                            [member.id]: { ...res, resolution: v as "create" | "link" | "skip" },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="create">Create</SelectItem>
                          <SelectItem value="link">Link existing</SelectItem>
                          <SelectItem value="skip">Skip</SelectItem>
                        </SelectContent>
                      </Select>
                      {res.resolution === "link" && (
                        <Input
                          placeholder="Member ID"
                          value={res.memberId}
                          onChange={e =>
                            setFamilyResolutions(prev => ({
                              ...prev,
                              [member.id]: { ...res, memberId: e.target.value },
                            }))
                          }
                        />
                      )}
                      {res.resolution !== "skip" && (
                        <Select
                          value={res.householdRole}
                          onValueChange={v =>
                            setFamilyResolutions(prev => ({
                              ...prev,
                              [member.id]: { ...res, householdRole: v },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {householdRoleOptions.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reviewNote">Review note</Label>
          <Input
            id="reviewNote"
            value={reviewNote}
            onChange={e => setReviewNote(e.target.value)}
            placeholder="Optional note about this decision"
            className="h-11 text-base sm:text-sm"
          />
        </div>

        {(conversionState && !conversionState.ok) && (
          <InlineAlert
            variant="error"
            title="Approval could not be completed"
            message={conversionState.error}
            className="max-h-32 overflow-y-auto break-words rounded-lg"
          />
        )}
        {successMessage && (
          <p className="text-sm text-emerald-700">{successMessage}</p>
        )}
        {(rejectState && !rejectState.ok) && (
          <InlineAlert
            variant="error"
            title="Rejection could not be completed"
            message={rejectState.error}
            className="max-h-32 overflow-y-auto break-words rounded-lg"
          />
        )}
        </div>

        <div
          className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="grid gap-2 sm:flex sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="destructive" onClick={submitReject} disabled={rejecting} className="h-11 w-full sm:w-auto">
            {rejecting ? "Rejecting..." : "Reject"}
          </Button>
          <Button onClick={submitConversion} disabled={converting} className="h-11 w-full sm:w-auto">
            {converting ? "Converting..." : "Approve & convert"}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
