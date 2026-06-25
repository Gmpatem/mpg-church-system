"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChurchContentGrid, ChurchMainPanel, ChurchRightRail } from "@/components/church-workspace";
import type { ChurchMemberRegistration, RegistrationDuplicateState } from "@/features/member-registration/types";
import { OnboardingToolbar } from "./OnboardingToolbar";
import { OnboardingQueueTable } from "./OnboardingQueueTable";
import { RegistrationDetailsRail } from "./RegistrationDetailsRail";
import { RegistrationReviewDialog } from "./RegistrationReviewDialog";
import { RegistrationShareDialog } from "./RegistrationShareDialog";

type MembersOnboardingWorkspaceProps = {
  churchSlug: string;
  registrations: (ChurchMemberRegistration & { family_count: number })[];
  total: number;
  page: number;
  pageSize: number;
  selectedRegistration: {
    registration: ChurchMemberRegistration;
    family_members: { id: string; first_name: string; last_name: string; relationship: string }[];
  } | null;
  duplicateState: RegistrationDuplicateState | null;
};

export function MembersOnboardingWorkspace({
  churchSlug,
  registrations,
  total,
  page,
  pageSize,
  selectedRegistration,
  duplicateState,
}: MembersOnboardingWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      { value: "pending", label: "Pending" },
      { value: "needs_member_duplicate_review", label: "Member duplicates" },
      { value: "needs_household_duplicate_review", label: "Household matches" },
      { value: "needs_review", label: "Needs review" },
      { value: "converted", label: "Converted" },
      { value: "merged", label: "Merged" },
      { value: "rejected", label: "Rejected" },
    ],
    []
  );

  const setStatus = useCallback(
    (status: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", "onboarding");
      if (status && status !== "all") {
        params.set("onboardingStatus", status);
      } else {
        params.delete("onboardingStatus");
      }
      router.replace(`/c/${churchSlug}/members?${params.toString()}`);
    },
    [churchSlug, router, searchParams]
  );

  const selectRegistration = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", "onboarding");
      if (id) {
        params.set("registrationId", id);
      } else {
        params.delete("registrationId");
      }
      router.replace(`/c/${churchSlug}/members?${params.toString()}`);
    },
    [churchSlug, router, searchParams]
  );

  const selectedId = searchParams.get("registrationId");
  const currentStatus = searchParams.get("onboardingStatus") ?? "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">Review public registrations and manage member onboarding.</p>
        </div>
        <OnboardingToolbar
          churchSlug={churchSlug}
          currentStatus={currentStatus}
          statusOptions={statusOptions}
          onStatusChange={setStatus}
          onShare={() => setShareOpen(true)}
        />
      </div>

      <ChurchContentGrid>
        <ChurchMainPanel className="p-0">
          <OnboardingQueueTable
            registrations={registrations}
            selectedId={selectedId}
            total={total}
            page={page}
            pageSize={pageSize}
            churchSlug={churchSlug}
            onSelect={selectRegistration}
            onReview={id => {
              selectRegistration(id);
              setReviewOpen(true);
            }}
          />
        </ChurchMainPanel>

        <ChurchRightRail className="hidden p-5 xl:block">
          <RegistrationDetailsRail
            churchSlug={churchSlug}
            registration={selectedRegistration?.registration ?? null}
            familyMembers={selectedRegistration?.family_members ?? []}
            duplicateState={duplicateState}
            onReview={() => setReviewOpen(true)}
          />
        </ChurchRightRail>
      </ChurchContentGrid>

      {selectedRegistration && (
        <RegistrationReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          churchSlug={churchSlug}
          registration={selectedRegistration.registration}
          familyMembers={selectedRegistration.family_members}
          duplicateState={duplicateState}
        />
      )}

      <RegistrationShareDialog open={shareOpen} onOpenChange={setShareOpen} churchSlug={churchSlug} />
    </div>
  );
}
