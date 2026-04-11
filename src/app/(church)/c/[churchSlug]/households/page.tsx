import Link from "next/link";
import { getChurchHouseholds } from "@/features/households/queries";
import { requireChurchAccess } from "@/features/access/queries";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import { en } from "@/features/i18n/en";
import { fr } from "@/features/i18n/fr";
import { cookies } from "next/headers";

interface HouseholdsPageProps {
  params: Promise<{ churchSlug: string }>;
}

async function getTranslations() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("preferred_language")?.value;
  return lang === "fr" ? fr : en;
}

function locationLabel(city?: string | null, country?: string | null) {
  return [city, country].filter(Boolean).join(", ");
}

export default async function HouseholdsPage({ params }: HouseholdsPageProps) {
  const { churchSlug } = await params;
  const ctx = await requireChurchAccess(churchSlug);
  const t = await getTranslations();
  const households = await getChurchHouseholds(churchSlug);

  const canManage =
    ctx.roles.includes("platform_owner") ||
    ctx.roles.includes("platform_admin") ||
    ctx.roles.includes("platform_support") ||
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor") ||
    ctx.roles.includes("elder") ||
    ctx.roles.includes("clerk");

  const totalMembers = households.reduce((sum, household) => sum + household.member_count, 0);
  const noHeadCount = households.filter((household) => !household.head_of_household_name).length;
  const missingContactCount = households.filter((household) => !household.email && !household.phone).length;
  const largestHouseholds = [...households]
    .sort((a, b) => b.member_count - a.member_count || a.household_name.localeCompare(b.household_name))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <WorkspaceHero
        size="compact"
        eyebrow="Households"
        title={t.pages.households.title}
        description={t.pages.households.description}
        badges={[
          `${households.length} households`,
          `${totalMembers} members linked`,
        ]}
        actions={[
          ...(canManage
            ? [{ label: t.pages.households.addHousehold, href: `/c/${churchSlug}/households/new`, variant: "primary" as const }]
            : []),
          { label: t.navigation.members, href: `/c/${churchSlug}/members`, variant: "secondary" as const },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <WorkspaceStatCard label={t.pages.households.title} value={households.length} hint="Total household records" />
        <WorkspaceStatCard label={t.pages.households.table.members} value={totalMembers} hint="Members linked to households" />
        <WorkspaceStatCard label={t.pages.households.table.head} value={households.length - noHeadCount} hint="Households with a designated head" />
        <WorkspaceStatCard label="Needs review" value={missingContactCount} hint="Households missing phone and email" />
      </div>

      <WorkspaceControlRail
        title="Household Utility Bar"
        description="Table-first registry for household review, coverage checks, and quick record actions."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>Sorted by household name. Use the table to drill into details quickly.</p>
          {canManage ? (
            <Link
              href={`/c/${churchSlug}/households/new`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {t.pages.households.addHousehold}
            </Link>
          ) : null}
        </div>
      </WorkspaceControlRail>

      {households.length === 0 ? (
        <WorkspaceSectionCard
          title={t.pages.households.title}
          description={t.pages.households.description}
        >
          <WorkspaceEmptyState
            title={t.pages.households.noHouseholds}
            message={t.pages.households.description}
            actionLabel={canManage ? t.pages.households.addHousehold : undefined}
            actionHref={canManage ? `/c/${churchSlug}/households/new` : undefined}
          />
        </WorkspaceSectionCard>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <WorkspaceSectionCard
            title={t.pages.households.title}
            description="Household registry with contact and location visibility."
            contentClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.household}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.head}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.members}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.location}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.phone}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {households.map((household) => (
                    <tr key={household.id}>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-slate-900">{household.household_name}</p>
                        <p className="text-xs text-slate-500">{household.email ?? t.common.noEmail}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{household.head_of_household_name ?? "-"}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{household.member_count}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{locationLabel(household.city, household.country) || "-"}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{household.phone ?? "-"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end">
                          <Link
                            href={`/c/${churchSlug}/households/${household.id}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            {t.pages.households.viewHousehold}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WorkspaceSectionCard>

          <aside className="space-y-5">
            <WorkspaceSectionCard
              title="Household Snapshot"
              description="Coverage and contact watchpoints for household records."
            >
              <div className="space-y-3 text-sm text-slate-700">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  Heads assigned: <span className="font-semibold text-slate-900">{households.length - noHeadCount}</span> / {households.length}
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  Missing contact info: <span className="font-semibold text-slate-900">{missingContactCount}</span>
                </div>
              </div>
            </WorkspaceSectionCard>

            <WorkspaceSectionCard
              title="Largest Households"
              description="Fast visibility into households with the biggest member counts."
            >
              <div className="space-y-2">
                {largestHouseholds.map((household) => (
                  <Link
                    key={household.id}
                    href={`/c/${churchSlug}/households/${household.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">{household.household_name}</span>
                    <span className="text-slate-500">{household.member_count}</span>
                  </Link>
                ))}
              </div>
            </WorkspaceSectionCard>
          </aside>
        </div>
      )}
    </div>
  );
}
