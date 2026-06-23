"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  DepartmentDialog,
  DepartmentFilterState,
  DepartmentViewModel,
  DepartmentsWorkspaceData,
} from "../types";
import { BudgetOverviewPanel } from "./BudgetOverviewPanel";
import { DepartmentOverviewKpiRow } from "./DepartmentOverviewKpiRow";
import { DepartmentStatusPanel } from "./DepartmentStatusPanel";
import { DepartmentsRegistrySheet } from "./DepartmentsRegistrySheet";
import { RecentDepartmentUpdatesPanel } from "./RecentDepartmentUpdatesPanel";
import { TopDepartmentsByMembersPanel } from "./TopDepartmentsByMembersPanel";
import { UpcomingDepartmentActivitiesPanel } from "./UpcomingDepartmentActivitiesPanel";

export function OverviewTab({
  data,
  state,
  selectedDepartment,
  onStateChange,
  onSelectDepartment,
  onOpenPeople,
  onOpenBudget,
  onOpenActivities,
  onDialogChange,
}: {
  data: DepartmentsWorkspaceData;
  state: DepartmentFilterState;
  selectedDepartment: DepartmentViewModel | null;
  onStateChange: (next: Partial<DepartmentFilterState>) => void;
  onSelectDepartment: (departmentId: string) => void;
  onOpenPeople: (departmentId: string) => void;
  onOpenBudget: (departmentId: string) => void;
  onOpenActivities: () => void;
  onDialogChange: (dialog: DepartmentDialog) => void;
}) {
  const [registryOpen, setRegistryOpen] = useState(false);
  const overview = data.overview;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <DepartmentOverviewKpiRow overview={overview} />

      {overview.totalDepartments === 0 ? (
        <section className="rounded-xl border border-border bg-background px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                No Departments have been created
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create the church&apos;s first Department to begin assigning leaders, members,
                activities, and Department funds.
              </p>
            </div>
            <Button
              type="button"
              className="h-10 gap-2 rounded-lg font-semibold"
              onClick={() => onDialogChange({ type: "create-department" })}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add Department
            </Button>
          </div>
        </section>
      ) : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <BudgetOverviewPanel overview={overview} />
        <DepartmentStatusPanel overview={overview} />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <TopDepartmentsByMembersPanel
          overview={overview}
          onOpenPeople={onOpenPeople}
          onOpenRegistry={() => setRegistryOpen(true)}
        />
        <UpcomingDepartmentActivitiesPanel
          overview={overview}
          onOpenActivities={onOpenActivities}
        />
        <RecentDepartmentUpdatesPanel
          overview={overview}
          onOpenUpdates={onOpenActivities}
        />
      </div>

      <DepartmentsRegistrySheet
        open={registryOpen}
        data={data.departments}
        state={state}
        selectedDepartment={selectedDepartment}
        onOpenChange={setRegistryOpen}
        onStateChange={onStateChange}
        onSelectDepartment={onSelectDepartment}
        onOpenPeople={onOpenPeople}
        onOpenBudget={onOpenBudget}
        onDialogChange={onDialogChange}
      />
    </div>
  );
}
