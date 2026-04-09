import { Suspense } from "react";
import Link from "next/link";
import { getChurchHouseholds } from "@/features/households/queries";
import { requireChurchAccess } from "@/features/access/queries";
import { WorkspaceHero } from "@/components/workspace";
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

function HouseholdsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="animate-pulse">
        <div className="bg-slate-100 px-6 py-4">
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-4 w-48 rounded bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function HouseholdsTable({ churchSlug }: { churchSlug: string }) {
  const t = await getTranslations();
  const households = await getChurchHouseholds(churchSlug);

  if (households.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-sm text-slate-600">
        {t.pages.households.noHouseholds}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.household}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.head}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.members}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.location}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.phone}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {households.map((household) => (
              <tr key={household.id}>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{household.household_name}</p>
                    <p className="text-xs text-slate-500">{household.email ?? t.common.noEmail}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {household.head_of_household_name ?? "—"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {household.member_count}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {[household.city, household.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{household.phone ?? "—"}</td>
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/c/${churchSlug}/households/${household.id}`}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {t.pages.households.viewHousehold}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function HouseholdsPage({ params }: HouseholdsPageProps) {
  const { churchSlug } = await params;
  const ctx = await requireChurchAccess(churchSlug);
  const t = await getTranslations();

  const canManage =
    ctx.roles.includes("platform_owner") ||
    ctx.roles.includes("platform_admin") ||
    ctx.roles.includes("platform_support") ||
    ctx.roles.includes("church_admin") ||
    ctx.roles.includes("pastor") ||
    ctx.roles.includes("elder") ||
    ctx.roles.includes("clerk");

  return (
    <div className="space-y-6">
      <WorkspaceHero
        title={t.pages.households.title}
        description={t.pages.households.description}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.pages.households.title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {t.pages.households.subtitle}
          </p>
        </div>

        {canManage ? (
          <Link
            href={`/c/${churchSlug}/households/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {t.pages.households.addHousehold}
          </Link>
        ) : null}
      </div>

      <Suspense fallback={<HouseholdsTableSkeleton />}>
        <HouseholdsTable churchSlug={churchSlug} />
      </Suspense>
    </div>
  );
}
