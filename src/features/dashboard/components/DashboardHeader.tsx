import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarPlus,
  ChevronDown,
  FileBarChart,
  Megaphone,
  Settings,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Translations } from "@/features/i18n/en";
import type { DashboardData } from "../types";

type DashboardLabels = Translations["pages"]["dashboard"]["workspace"];

function formatDashboardDate(dateIso: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(new Date(dateIso));
}

export function DashboardHeader({
  data,
  labels,
  locale,
}: {
  data: DashboardData;
  labels: DashboardLabels;
  locale: string;
}) {
  const base = `/c/${data.church.slug}`;
  const createItems = [
    data.capabilities.canManageMembers
      ? {
          label: labels.addMember,
          href: `${base}/members/new`,
          icon: UserPlus,
        }
      : null,
    data.capabilities.canCreateEvents
      ? {
          label: labels.createEvent,
          href: `${base}/events?tab=events&dialog=create`,
          icon: CalendarPlus,
        }
      : null,
    data.capabilities.canManageTreasury
      ? {
          label: labels.recordMoneyIn,
          href: `${base}/treasury/in/new`,
          icon: Wallet,
        }
      : null,
    data.capabilities.canCreateAnnouncements
      ? {
          label: labels.createAnnouncement,
          href: `${base}/announcements?tab=announcements&dialog=create`,
          icon: Megaphone,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string; icon: typeof UserPlus }>;

  const moreItems = [
    data.capabilities.canViewReports
      ? {
          label: labels.openReports,
          href: `${base}/reports`,
          icon: FileBarChart,
        }
      : null,
    data.capabilities.canViewOffice
      ? {
          label: labels.openChurchOffice,
          href: `${base}/office`,
          icon: BriefcaseBusiness,
        }
      : null,
    data.capabilities.canViewSettings
      ? {
          label: labels.openSettings,
          href: `${base}/settings`,
          icon: Settings,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string; icon: typeof UserPlus }>;

  return (
    <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)] sm:items-center sm:gap-5">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight tracking-normal text-[#151A18] sm:text-[30px]">
            {labels.title}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-[#145C44]">
            {formatDashboardDate(data.generatedAt, locale, data.church.timezone)}
          </p>
        </div>
        <p className="min-w-0 max-w-md border-[#D9D3C8] text-sm leading-6 text-[#5D665F] sm:border-l sm:pl-5">
          {labels.description}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {createItems.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                className="h-11 gap-2 rounded-lg bg-[#0F3F31] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#145C44]"
              >
                {labels.create}
                <ChevronDown className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-[#E5E0D6] bg-[#FFFDF8] p-2">
              {createItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild className="h-10 cursor-pointer gap-3 rounded-lg">
                    <Link href={item.href}>
                      <Icon className="size-4 text-[#145C44]" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {moreItems.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 rounded-lg border-[#DCD5C9] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#26312B] hover:bg-[#F4F0E7]"
              >
                {labels.more}
                <ChevronDown className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl border-[#E5E0D6] bg-[#FFFDF8] p-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild className="h-10 cursor-pointer gap-3 rounded-lg">
                    <Link href={item.href}>
                      <Icon className="size-4 text-[#59645D]" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
