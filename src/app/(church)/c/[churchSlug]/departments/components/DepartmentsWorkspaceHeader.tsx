"use client";

import {
  CalendarPlus,
  FileText,
  Plus,
  Upload,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  DepartmentDialog,
  DepartmentTabKey,
  DepartmentWorkspaceBundle,
  DepartmentWorkspaceCapabilities,
} from "./types";

const tabCopy: Record<DepartmentTabKey, { title: string; description: string }> = {
  overview: {
    title: "Departments",
    description: "Manage church departments, leaders, members, and resources.",
  },
  "action-plan": {
    title: "Department Action Plan",
    description: "Track real department assignments when action-plan storage is available.",
  },
  activities: {
    title: "Department Activities",
    description: "Review department events and announcements in one activity register.",
  },
  people: {
    title: "Department People",
    description: "Manage member assignments and review verified leadership records.",
  },
  budget: {
    title: "Department Budget",
    description: "Review treasury-linked balances, transactions, and department fund requests.",
  },
  documents: {
    title: "Department Documents",
    description: "Prepare document categories without showing files until storage is configured.",
  },
};

function DisabledAction({
  icon: Icon,
  label,
  reason,
}: {
  icon: typeof Upload;
  label: string;
  reason: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button type="button" variant="outline" className="h-10 gap-2 rounded-lg bg-background" disabled>
              <Icon data-icon="inline-start" aria-hidden="true" />
              {label}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DepartmentsWorkspaceHeader({
  activeTab,
  selectedBundle,
  capabilities,
  onDialogChange,
}: {
  activeTab: DepartmentTabKey;
  selectedBundle: DepartmentWorkspaceBundle | null;
  capabilities: DepartmentWorkspaceCapabilities;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  const copy = tabCopy[activeTab];
  const selectedDepartmentId = selectedBundle?.department.id ?? null;
  const budgetPermissions = selectedBundle?.budget?.permissions ?? null;

  let action = (
    <Button
      type="button"
      className="h-11 gap-2 rounded-lg font-semibold"
      disabled={!capabilities.canManageDepartments}
      onClick={() => onDialogChange({ type: "create-department" })}
    >
      <Plus data-icon="inline-start" aria-hidden="true" />
      Add Department
    </Button>
  );

  if (activeTab === "action-plan") {
    action = (
      <DisabledAction
        icon={FileText}
        label="New Action Item"
        reason="Department action-plan mutations are unavailable until church_assignments RLS and ownership checks are verified."
      />
    );
  }

  if (activeTab === "activities") {
    action = selectedDepartmentId && capabilities.canManageActivities ? (
      <Button
        type="button"
        className="h-10 gap-2 rounded-lg font-semibold"
        onClick={() => onDialogChange({ type: "create-activity", departmentId: selectedDepartmentId })}
      >
        <CalendarPlus data-icon="inline-start" aria-hidden="true" />
        Add Activity
      </Button>
    ) : (
      <Button type="button" className="h-10 gap-2 rounded-lg font-semibold" disabled>
        <CalendarPlus data-icon="inline-start" aria-hidden="true" />
        Add Activity
      </Button>
    );
  }

  if (activeTab === "people") {
    action = selectedDepartmentId && capabilities.canManageAssignments ? (
      <Button
        type="button"
        className="h-10 gap-2 rounded-lg font-semibold"
        onClick={() => onDialogChange({ type: "add-member", departmentId: selectedDepartmentId })}
      >
        <UserPlus data-icon="inline-start" aria-hidden="true" />
        Add Person
      </Button>
    ) : (
      <Button type="button" className="h-10 gap-2 rounded-lg font-semibold" disabled>
        <UserPlus data-icon="inline-start" aria-hidden="true" />
        Add Person
      </Button>
    );
  }

  if (activeTab === "budget") {
    action =
      selectedDepartmentId && budgetPermissions?.canSubmitRequests ? (
        <Button
          type="button"
          className="h-10 gap-2 rounded-lg font-semibold"
          onClick={() => onDialogChange({ type: "request-funds", departmentId: selectedDepartmentId })}
        >
          <WalletCards data-icon="inline-start" aria-hidden="true" />
          Request Funds
        </Button>
      ) : (
        <DisabledAction
          icon={WalletCards}
          label="Request Funds"
          reason="Only active department leaders can submit department finance requests."
        />
      );
  }

  if (activeTab === "documents") {
    action = (
      <DisabledAction
        icon={Upload}
        label="Upload Document"
        reason="Department document storage has not been configured."
      />
    );
  }

  return (
    <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">{action}</div>
    </header>
  );
}
