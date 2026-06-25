"use client";

import Link from "next/link";
import { CalendarPlus, ChevronDown, ClipboardCheck, FileBarChart, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EventDialogIntent, EventsCanonicalTab, EventsSummaryMetrics } from "@/features/events/types";

export function EventsWorkspaceHeader({
  churchSlug,
  activeTab,
  summary,
  canCreate,
  canOpenApprovalQueue,
  onDialogChange,
}: {
  churchSlug: string;
  activeTab: EventsCanonicalTab;
  summary: EventsSummaryMetrics;
  canCreate: boolean;
  canOpenApprovalQueue: boolean;
  onDialogChange: (dialog: EventDialogIntent) => void;
}) {
  const actionLabel = activeTab === "calendar" ? "Add Event" : "Create Event";

  return (
    <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan, review, approve, and publish church events across departments.
        </p>
        <div className="mt-3 flex min-w-0 flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{summary.totalEvents} total</span>
          <span>{summary.upcomingCount} upcoming</span>
          <span>{summary.pendingApprovalCount} awaiting approval</span>
          <span>{summary.departmentLinkedCount} department linked</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {canCreate ? (
          <div className="inline-flex overflow-hidden rounded-lg shadow-sm">
            <Button
              type="button"
              onClick={() => onDialogChange({ type: "create" })}
              className="h-10 gap-2 rounded-none rounded-l-lg px-4 font-semibold"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              {actionLabel}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  className="h-10 rounded-none rounded-r-lg border-l border-primary-foreground/20 px-3"
                  aria-label="Open Events action menu"
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg">
                {canOpenApprovalQueue ? (
                  <DropdownMenuItem asChild className="h-10 gap-2">
                    <Link href={`/c/${churchSlug}/approvals`}>
                      <ClipboardCheck className="size-4" aria-hidden="true" />
                      Review approvals
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild className="h-10 gap-2">
                  <Link href={`/c/${churchSlug}/reports?tab=events`}>
                    <FileBarChart className="size-4" aria-hidden="true" />
                    Event reports
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-lg bg-background"
              aria-label="More Events actions"
            >
              <MoreVertical className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg">
            <DropdownMenuItem asChild className="h-10 gap-2">
              <Link href={`/c/${churchSlug}/calendar`}>
                <CalendarPlus className="size-4" aria-hidden="true" />
                Open church calendar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="h-10 gap-2">
              <Link href={`/c/${churchSlug}/reports?tab=events`}>
                <FileBarChart className="size-4" aria-hidden="true" />
                Event reports
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
