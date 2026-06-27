import Link from "next/link";
import {
  ChevronRight,
  ClipboardCheck,
  Inbox,
  Megaphone,
  ShieldCheck,
  UserCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Translations } from "@/features/i18n/en";
import type { DashboardActionItem } from "../types";
import type { DashboardData } from "../types";
import { CompactEmptyState, DashboardPanel } from "./DashboardPanel";

type DashboardLabels = Translations["pages"]["dashboard"]["workspace"];

function actionLabel(key: DashboardActionItem["key"], labels: DashboardLabels) {
  const map: Record<DashboardActionItem["key"], string> = {
    access_requests: labels.accessRequests,
    leadership_requests: labels.leadershipRequests,
    announcements_awaiting_publication: labels.announcementsAwaitingPublication,
    event_approvals: labels.eventApprovals,
    profiles_needing_completion: labels.profilesNeedingCompletion,
    other_approvals: labels.otherApprovals,
  };

  return map[key];
}

function actionIcon(key: DashboardActionItem["key"]) {
  const map = {
    access_requests: UserCheck,
    leadership_requests: UsersRound,
    announcements_awaiting_publication: Megaphone,
    event_approvals: ClipboardCheck,
    profiles_needing_completion: UserCog,
    other_approvals: Inbox,
  };

  return map[key];
}

function actionTone(key: DashboardActionItem["key"]) {
  const map: Record<DashboardActionItem["key"], string> = {
    access_requests: "bg-[#E6F0E7] text-[#145C44]",
    leadership_requests: "bg-[#EAF3E4] text-[#0F4D3A]",
    announcements_awaiting_publication: "bg-[#FBF0D8] text-[#9A6B12]",
    event_approvals: "bg-[#F4E8F7] text-[#9B3EA4]",
    profiles_needing_completion: "bg-[#E6F2FF] text-[#2563B8]",
    other_approvals: "bg-[#FCE5D8] text-[#C74B1E]",
  };

  return map[key];
}

function countPillClass(count: number) {
  if (count <= 0) return "bg-[#EAF2ED] text-[#315D4B]";
  if (count <= 3) return "bg-[#FFF0DF] text-[#C7541E]";
  return "bg-[#FDE1DA] text-[#B42318]";
}

export function DashboardActionCenter({
  data,
  labels,
}: {
  data: DashboardData;
  labels: DashboardLabels;
}) {
  const hasAttention = data.actionItems.some((item) => item.count > 0);

  return (
    <DashboardPanel title={labels.actionCenter} icon={ShieldCheck}>
      {!hasAttention ? (
        <CompactEmptyState icon={ShieldCheck} title={labels.allCaughtUp} message={labels.noRequests} />
      ) : (
        <div className="grid gap-1">
          {data.actionItems.map((item) => {
            const Icon = actionIcon(item.key);
            return (
              <Link
                key={item.key}
                href={item.href}
                className="grid min-h-12 grid-cols-[2.25rem_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg px-1.5 transition hover:bg-[#F8F5EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#145C44]"
              >
                <span className={cn("flex size-8 items-center justify-center rounded-lg", actionTone(item.key))}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 truncate text-sm text-[#26312B]">{actionLabel(item.key, labels)}</span>
                <span
                  className={cn(
                    "inline-flex min-w-9 items-center justify-center rounded-full px-2 py-1 text-sm font-semibold tabular-nums",
                    countPillClass(item.count)
                  )}
                >
                  {item.count}
                </span>
                <ChevronRight className="size-4 text-[#1E2635]" aria-hidden="true" />
              </Link>
            );
          })}

          {data.routes.reviewAll ? (
            <Button
              asChild
              variant="outline"
              className="mt-2 h-11 rounded-lg border-[#DCD5C9] bg-[#FFFDF8] text-sm font-semibold text-[#145C44] hover:bg-[#F4F0E7]"
            >
              <Link href={data.routes.reviewAll}>
                {labels.reviewAll}
                <ChevronRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
        </div>
      )}
    </DashboardPanel>
  );
}
