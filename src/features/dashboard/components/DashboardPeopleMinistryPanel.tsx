import Link from "next/link";
import { Home, Mail, ShieldCheck, UserCog, UserPlus, Users, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Translations } from "@/features/i18n/en";
import type { DashboardData, DashboardIndicator } from "../types";
import { CompactEmptyState, DashboardPanel } from "./DashboardPanel";

type DashboardLabels = Translations["pages"]["dashboard"]["workspace"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatShortDate(value: string, locale: string, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(date);
}

function indicatorLabel(key: DashboardIndicator["key"], labels: DashboardLabels) {
  const map: Record<DashboardIndicator["key"], string> = {
    profiles_needing_completion: labels.profilesNeedingCompletion,
    members_without_households: labels.membersWithoutHouseholds,
    households_without_heads: labels.householdsWithoutHeads,
    departments_without_leaders: labels.departmentsWithoutLeaders,
    unassigned_members: labels.unassignedMembers,
  };

  return map[key];
}

function indicatorIcon(key: DashboardIndicator["key"]) {
  const map = {
    profiles_needing_completion: UserCog,
    members_without_households: UsersRound,
    households_without_heads: Home,
    departments_without_leaders: ShieldCheck,
    unassigned_members: Users,
  };

  return map[key];
}

function indicatorTone(key: DashboardIndicator["key"]) {
  const map: Record<DashboardIndicator["key"], string> = {
    profiles_needing_completion: "bg-sky-50 text-sky-700",
    members_without_households: "bg-amber-50 text-amber-700",
    households_without_heads: "bg-violet-50 text-violet-700",
    departments_without_leaders: "bg-purple-50 text-purple-700",
    unassigned_members: "bg-cyan-50 text-cyan-700",
  };

  return map[key];
}

export function DashboardPeopleMinistryPanel({
  data,
  labels,
  locale,
}: {
  data: DashboardData;
  labels: DashboardLabels;
  locale: string;
}) {
  const avatarTones = ["bg-[#1F9F67]", "bg-[#7C55DD]", "bg-[#0EA5B7]", "bg-[#D69A18]"];

  return (
    <DashboardPanel
      title={labels.peopleMinistry}
      icon={UsersRound}
      contentClassName="grid gap-3"
    >
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[#18231D]">{labels.recentMembers}</h3>
          <Link href={data.routes.members} className="text-xs font-semibold text-[#145C44] hover:underline">
            {labels.viewAll}
          </Link>
        </div>

        {data.recentMembers.length === 0 ? (
          <CompactEmptyState
            icon={UsersRound}
            title={labels.noMembersAdded}
            message={labels.addMembersToSee}
            action={
              data.capabilities.canManageMembers ? (
                <Button asChild size="sm" className="rounded-lg bg-[#0F4D3A] hover:bg-[#145C44]">
                  <Link href={`/c/${data.church.slug}/members/new`}>
                    <UserPlus className="mr-2 size-4" aria-hidden="true" />
                    {labels.addMember}
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="divide-y divide-[#ECE7DC]">
            {data.recentMembers.map((member, index) => (
              <Link
                key={member.id}
                href={member.href}
                className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-2.5 transition hover:bg-[#F9F6EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C44]"
              >
                <Avatar className="size-10">
                  <AvatarFallback
                    className={cn("text-xs font-semibold text-white", avatarTones[index % avatarTones.length])}
                  >
                    {initials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#18231D]">{member.name}</span>
                  <span
                    className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-xs text-[#66706A]"
                    title={member.email ?? member.membershipStatus ?? labels.noEmail}
                  >
                    {member.email ? <Mail className="size-3.5 shrink-0" aria-hidden="true" /> : null}
                    <span className="truncate">{member.email ?? member.membershipStatus ?? labels.noEmail}</span>
                  </span>
                </span>
                <span className="shrink-0 text-xs text-[#667085]">
                  {formatShortDate(member.createdAt, locale, data.church.timezone)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0 border-t border-[#ECE7DC] pt-3">
        <h3 className="mb-2 text-sm font-semibold text-[#18231D]">{labels.followUpIndicators}</h3>
        <div className="grid gap-1">
          {data.followUpIndicators.map((indicator) => {
            const Icon = indicatorIcon(indicator.key);
            return (
              <Link
                key={indicator.key}
                href={indicator.href}
                className="flex min-h-10 items-center gap-3 rounded-lg px-1.5 text-sm transition hover:bg-[#F8F5EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C44]"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    indicatorTone(indicator.key)
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-[#4E5952]">
                  {indicatorLabel(indicator.key, labels)}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[#172018]">
                  {indicator.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardPanel>
  );
}
