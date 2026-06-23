import {
  getChurchHouseholds,
  getChurchMembersForHouseholdAssignment,
} from "@/features/households/queries";
import { requireChurchAccess } from "@/features/access/queries";
import { HouseholdsWorkspace } from "./components/HouseholdsWorkspace";

interface HouseholdsPageProps {
  params: Promise<{ churchSlug: string }>;
}

export default async function HouseholdsPage({ params }: HouseholdsPageProps) {
  const { churchSlug } = await params;
  const ctx = await requireChurchAccess(churchSlug);
  const households = await getChurchHouseholds(churchSlug);

  const canManage =
    ctx.roles.includes("platform_owner") ||
    ctx.roles.includes("platform_admin") ||
    ctx.roles.includes("platform_support") ||
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor") ||
    ctx.roles.includes("elder") ||
    ctx.roles.includes("clerk");

  const availableMembers = canManage
    ? await getChurchMembersForHouseholdAssignment(churchSlug)
    : [];

  return (
    <div className="min-w-0">
      <HouseholdsWorkspace
        churchSlug={churchSlug}
        households={households}
        availableMembers={availableMembers}
        canManage={canManage}
      />
    </div>
  );
}
