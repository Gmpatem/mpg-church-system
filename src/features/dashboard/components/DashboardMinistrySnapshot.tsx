import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Translations } from "@/features/i18n/en";
import type { DashboardData } from "../types";
import { CompactEmptyState, DashboardPanel } from "./DashboardPanel";
import { DashboardMinistryChart } from "./DashboardMinistryChart";

type DashboardLabels = Translations["pages"]["dashboard"]["workspace"];

export function DashboardMinistrySnapshot({
  data,
  labels,
}: {
  data: DashboardData;
  labels: DashboardLabels;
}) {
  return (
    <DashboardPanel title={labels.ministrySnapshot} contentClassName="py-5">
      {data.ministries.length === 0 ? (
        <CompactEmptyState
          icon={Building2}
          title={labels.noActiveMinistries}
          message={labels.createMinistryHint}
          action={
            data.capabilities.canManageMembers ? (
              <Button asChild size="sm" className="rounded-lg bg-[#0F4D3A] hover:bg-[#145C44]">
                <Link href={`/c/${data.church.slug}/departments/new`}>{labels.createMinistry}</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center xl:grid-cols-1 2xl:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex min-w-0 justify-center lg:justify-start xl:justify-center 2xl:justify-start">
            <DashboardMinistryChart
              ministries={data.ministries}
              total={data.pulse.activeMinistryCount}
              label={labels.ministries}
            />
          </div>

          <div className="grid min-w-0 gap-2.5">
            {data.ministries.map((ministry) => (
              <Link
                key={ministry.id}
                href={ministry.id === "other" ? data.routes.ministries : `${data.routes.ministries}/${ministry.id}`}
                className="grid min-h-8 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-1.5 text-sm transition hover:bg-[#F8F5EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C44]"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: ministry.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate text-[#4E5952]">
                  {ministry.id === "other" ? labels.other : ministry.name}
                </span>
                <span className="font-semibold tabular-nums text-[#172018]">{ministry.count}</span>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl bg-[#F3EFE7] p-4 text-[#172018] lg:col-span-2 xl:col-span-1 2xl:col-span-2">
            <p className="text-xs font-medium text-[#5D665F]">{labels.thisMonth}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-2xl font-semibold leading-none tabular-nums">{data.monthly.eventsHeld}</p>
                <p className="mt-1 text-xs text-[#66706A]">{labels.eventsHeld}</p>
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none tabular-nums">{data.monthly.newMinistries}</p>
                <p className="mt-1 text-xs text-[#66706A]">{labels.newMinistries}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
