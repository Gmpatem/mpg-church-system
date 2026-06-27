import Link from "next/link";
import { Activity, Building2, CalendarDays, ChevronRight, Megaphone, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Translations } from "@/features/i18n/en";
import type { DashboardData, DashboardUpdate } from "../types";
import { CompactEmptyState, DashboardPanel } from "./DashboardPanel";

type DashboardLabels = Translations["pages"]["dashboard"]["workspace"];

function formatRelative(value: string, nowIso: string, locale: string, timeZone: string) {
  const date = new Date(value);
  const now = new Date(nowIso);
  if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) return "";

  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return relative.format(diffMinutes, "minute");
  if (Math.abs(diffHours) < 24) return relative.format(diffHours, "hour");
  if (Math.abs(diffDays) < 7) return relative.format(diffDays, "day");

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(date);
}

function updateTitle(type: DashboardUpdate["type"], labels: DashboardLabels) {
  const map: Record<DashboardUpdate["type"], string> = {
    member_added: labels.newMemberAdded,
    treasury_entry: labels.treasuryEntryRecorded,
    department_created: labels.departmentCreated,
    announcement_published: labels.announcementPublished,
    event_created: labels.eventCreated,
  };

  return map[type];
}

function updateIcon(type: DashboardUpdate["type"]) {
  const map = {
    member_added: UserPlus,
    treasury_entry: Wallet,
    department_created: Building2,
    announcement_published: Megaphone,
    event_created: CalendarDays,
  };

  return map[type];
}

function updateTone(type: DashboardUpdate["type"]) {
  const map: Record<DashboardUpdate["type"], string> = {
    member_added: "bg-[#E6F2FF] text-[#1D65C1]",
    treasury_entry: "bg-[#E6F0E7] text-[#145C44]",
    department_created: "bg-[#F0E8FF] text-[#6B3EC6]",
    announcement_published: "bg-[#FFE7F0] text-[#C3346D]",
    event_created: "bg-[#E6F2FF] text-[#2671D9]",
  };

  return map[type];
}

function formatDetail(update: DashboardUpdate, labels: DashboardLabels, locale: string) {
  if (update.type === "treasury_entry" && typeof update.amount === "number") {
    const amount = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "XAF",
      maximumFractionDigits: 0,
    }).format(update.amount);
    return [labels.inflow, update.entityName, amount].filter(Boolean).join(" \u2022 ");
  }

  return update.detail || update.entityName;
}

export function DashboardUpdatesPanel({
  data,
  labels,
  locale,
}: {
  data: DashboardData;
  labels: DashboardLabels;
  locale: string;
}) {
  return (
    <DashboardPanel
      title={labels.latestUpdates}
      icon={Activity}
      action={
        data.routes.auditTrail ? (
          <Link href={data.routes.auditTrail} className="text-xs font-semibold text-[#145C44] hover:underline">
            {labels.viewAuditTrail}
          </Link>
        ) : null
      }
    >
      {data.updates.length === 0 ? (
        <CompactEmptyState icon={Activity} title={labels.noRecentUpdates} message={labels.newActivityAppear} />
      ) : (
        <div className="grid gap-1">
          {data.updates.map((update) => {
            const Icon = updateIcon(update.type);
            return (
              <Link
                key={update.id}
                href={update.href}
                className="grid min-h-14 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-1.5 py-1.5 transition hover:bg-[#F8F5EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C44]"
              >
                <span className={cn("flex size-9 items-center justify-center rounded-lg", updateTone(update.type))}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#18231D]">
                    {updateTitle(update.type, labels)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#66706A]">
                    {formatDetail(update, labels, locale)}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-[#667085]">
                  {formatRelative(update.createdAt, data.generatedAt, locale, data.church.timezone)}
                </span>
              </Link>
            );
          })}

          {data.routes.latestUpdates ? (
            <Button
              asChild
              variant="outline"
              className="mt-2 h-11 rounded-lg border-[#DCD5C9] bg-[#FFFDF8] text-sm font-semibold text-[#145C44] hover:bg-[#F4F0E7]"
            >
              <Link href={data.routes.latestUpdates}>
                {labels.seeAllUpdates}
                <ChevronRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
        </div>
      )}
    </DashboardPanel>
  );
}
