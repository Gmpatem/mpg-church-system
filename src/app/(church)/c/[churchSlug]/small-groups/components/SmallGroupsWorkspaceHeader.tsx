"use client";

import {
  CalendarPlus,
  ChevronDown,
  FileBarChart,
  MoreVertical,
  Plus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SmallGroupsDialog, SmallGroupsTabKey } from "./types";

const actionByTab: Record<
  SmallGroupsTabKey,
  {
    label: string;
    icon: typeof Plus;
    dialog: Exclude<SmallGroupsDialog, null>;
  }
> = {
  overview: { label: "New Group", icon: Plus, dialog: { type: "create-group" } },
  groups: { label: "New Group", icon: Plus, dialog: { type: "create-group" } },
  meetings: { label: "Schedule Meeting", icon: CalendarPlus, dialog: { type: "schedule-meeting" } },
  members: { label: "Add Member to Group", icon: UserPlus, dialog: { type: "add-member" } },
  outreach: { label: "New Outreach Activity", icon: Plus, dialog: { type: "create-outreach" } },
};

export function SmallGroupsWorkspaceHeader({
  activeTab,
  onDialogChange,
}: {
  activeTab: SmallGroupsTabKey;
  onDialogChange: (dialog: SmallGroupsDialog) => void;
}) {
  const action = actionByTab[activeTab];
  const Icon = action.icon;

  return (
    <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Small Groups
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage small groups, meetings, members, and outreach.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-lg shadow-sm">
          <Button
            type="button"
            onClick={() => onDialogChange(action.dialog)}
            className="h-10 gap-2 rounded-none rounded-l-lg px-4 font-semibold"
          >
            <Icon className="size-4" aria-hidden="true" />
            {action.label}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                className="h-10 rounded-none rounded-r-lg border-l border-primary-foreground/20 px-3"
                aria-label="Open Small Groups action menu"
              >
                <ChevronDown className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-lg">
              <DropdownMenuItem
                className="h-10 gap-2"
                onSelect={() => onDialogChange({ type: "generate-report" })}
              >
                <FileBarChart className="size-4" aria-hidden="true" />
                Generate report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-lg bg-background"
              aria-label="More Small Groups actions"
            >
              <MoreVertical className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg">
            <DropdownMenuItem
              className="h-10 gap-2"
              onSelect={() => onDialogChange({ type: "generate-report" })}
            >
              <FileBarChart className="size-4" aria-hidden="true" />
              Generate report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
