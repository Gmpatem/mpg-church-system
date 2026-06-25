import { getMembersWorkspaceData } from "@/features/members/queries";
import { MembersWorkspaceUnified } from "./components/MembersWorkspaceUnified";
import { MembersOnboardingWorkspace } from "./components/onboarding/MembersOnboardingWorkspace";
import { WorkspaceRouteStateBridge } from "@/components/workspace/WorkspaceRouteStateBridge";
import { getRegistrationDuplicateCandidates } from "@/features/member-registration/duplicates";
import { getRegistrationById, getOnboardingRegistrations } from "@/features/member-registration/queries";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface MembersPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function parseView(value: string | string[] | undefined): "registry" | "onboarding" {
  const single = pickSingle(value);
  return single === "onboarding" ? "onboarding" : "registry";
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const view = parseView(filters.view);
  const t = await getTranslations();

  const registryData = view === "registry"
    ? await getMembersWorkspaceData(churchSlug, {
        q: pickSingle(filters.q),
        status: pickSingle(filters.status),
        departmentId: pickSingle(filters.departmentId),
        departmentAssignmentStatus: pickSingle(filters.departmentAssignmentStatus),
      })
    : null;

  const selectedRegistrationId = pickSingle(filters.registrationId);
  const onboardingData = view === "onboarding"
    ? await getOnboardingRegistrations(churchSlug, {
        onboardingStatus: pickSingle(filters.onboardingStatus),
        q: pickSingle(filters.q),
        page: selectedRegistrationId ? 1 : undefined,
        pageSize: 25,
      })
    : null;

  const selectedRegistration =
    view === "onboarding" && selectedRegistrationId
      ? await getRegistrationById(churchSlug, selectedRegistrationId)
      : null;

  const duplicateState =
    selectedRegistration
      ? await getRegistrationDuplicateCandidates(churchSlug, selectedRegistrationId)
      : null;

  return (
    <div className="min-w-0">
      <WorkspaceRouteStateBridge
        churchSlug={churchSlug}
        moduleKey="members"
        restoreQueryState={view === "registry"}
        persistQueryKeys={["q", "status", "departmentId", "departmentAssignmentStatus"]}
        prefetchHrefs={[
          `/c/${churchSlug}/households`,
          `/c/${churchSlug}/departments`,
          `/c/${churchSlug}/reports`,
        ]}
      />
      {view === "registry" && registryData && (
        <MembersWorkspaceUnified churchSlug={churchSlug} data={registryData} />
      )}
      {view === "onboarding" && onboardingData && (
        <MembersOnboardingWorkspace
          churchSlug={churchSlug}
          registrations={onboardingData.registrations}
          total={onboardingData.total}
          page={onboardingData.page}
          pageSize={onboardingData.pageSize}
          selectedRegistration={selectedRegistration}
          duplicateState={duplicateState}
        />
      )}
    </div>
  );
}
