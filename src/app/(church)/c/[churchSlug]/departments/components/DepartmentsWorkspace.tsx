"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChurchLoadingState,
  ChurchPageFrame,
} from "@/components/church-workspace";
import { ActionPlanTab } from "./action-plan/ActionPlanTab";
import { ActivitiesTab } from "./activities/ActivitiesTab";
import { BudgetTab, buildBudgetEntries } from "./budget/BudgetTab";
import { DepartmentsDialogHost } from "./dialogs/DepartmentsDialogHost";
import { DocumentsTab } from "./documents/DocumentsTab";
import { OverviewTab } from "./overview/OverviewTab";
import { PeopleTab } from "./people/PeopleTab";
import { DepartmentsTabBar } from "./DepartmentsTabBar";
import { DepartmentsWorkspaceHeader } from "./DepartmentsWorkspaceHeader";
import { EmptyState } from "./shared";
import type {
  ActionPlanState,
  ActivitiesState,
  BudgetState,
  DepartmentDialog,
  DepartmentTabKey,
  DepartmentWorkspaceBundle,
  DepartmentsWorkspaceData,
  DepartmentsWorkspaceState,
  DocumentsState,
  PeopleState,
} from "./types";

interface DepartmentsWorkspaceProps {
  churchSlug: string;
  data: DepartmentsWorkspaceData;
  initialTab: DepartmentTabKey;
}

function firstBudgetEntryId(bundle: DepartmentWorkspaceBundle | null) {
  if (!bundle?.budget) return null;
  return buildBudgetEntries(bundle.budget)[0]?.id ?? null;
}

function buildInitialState(
  data: DepartmentsWorkspaceData,
  initialTab: DepartmentTabKey
): DepartmentsWorkspaceState {
  const selectedBundle = data.selectedBundle;
  const selectedDepartmentId = data.selectedDepartmentId;

  return {
    activeTab: initialTab,
    selectedDepartmentId,
    selectedActionItemId: selectedBundle?.actionPlan.items[0]?.id ?? null,
    selectedActivityId: selectedBundle?.activities[0]?.id ?? null,
    selectedPersonId: selectedBundle?.people[0]?.assignmentId ?? null,
    selectedBudgetEntryId: firstBudgetEntryId(selectedBundle),
    selectedDocumentId: null,
    overviewState: {
      search: "",
      status: "",
      page: 1,
    },
    actionPlanState: {
      search: "",
      status: "",
      priority: "",
      page: 1,
    },
    activitiesState: {
      search: "",
      status: "",
      source: "",
      page: 1,
    },
    peopleState: {
      search: "",
      role: "",
      status: "",
      page: 1,
    },
    budgetState: {
      search: "",
      kind: "",
      status: "",
      page: 1,
    },
    documentsState: {
      search: "",
      category: "",
      status: "",
      page: 1,
    },
  };
}

function nextSelectionForBundle(bundle: DepartmentWorkspaceBundle) {
  return {
    selectedActionItemId: bundle.actionPlan.items[0]?.id ?? null,
    selectedActivityId: bundle.activities[0]?.id ?? null,
    selectedPersonId: bundle.people[0]?.assignmentId ?? null,
    selectedBudgetEntryId: firstBudgetEntryId(bundle),
    selectedDocumentId: null,
  };
}

export function DepartmentsWorkspace({
  churchSlug,
  data,
  initialTab,
}: DepartmentsWorkspaceProps) {
  const pathname = usePathname();
  const [state, setState] = useState<DepartmentsWorkspaceState>(() =>
    buildInitialState(data, initialTab)
  );
  const [activeDialog, setActiveDialog] = useState<DepartmentDialog>(null);
  const [bundleCache, setBundleCache] = useState<Record<string, DepartmentWorkspaceBundle>>(() =>
    data.selectedBundle ? { [data.selectedBundle.department.id]: data.selectedBundle } : {}
  );
  const [loadingDepartmentId, setLoadingDepartmentId] = useState<string | null>(null);
  const [bundleError, setBundleError] = useState<string | null>(null);

  useEffect(() => {
    if (!data.selectedBundle) return;
    setBundleCache((current) => ({
      ...current,
      [data.selectedBundle!.department.id]: data.selectedBundle!,
    }));
  }, [data.selectedBundle]);

  const selectedBundle =
    state.selectedDepartmentId ? bundleCache[state.selectedDepartmentId] ?? null : null;
  const selectedDepartment =
    data.departments.find((department) => department.id === state.selectedDepartmentId) ?? null;
  const isLoadingSelectedBundle =
    Boolean(state.selectedDepartmentId) &&
    !selectedBundle &&
    loadingDepartmentId === state.selectedDepartmentId;

  const selectedActionItem = useMemo(
    () =>
      selectedBundle?.actionPlan.items.find((item) => item.id === state.selectedActionItemId) ??
      null,
    [selectedBundle, state.selectedActionItemId]
  );
  const selectedActivity = useMemo(
    () =>
      selectedBundle?.activities.find((activity) => activity.id === state.selectedActivityId) ??
      null,
    [selectedBundle, state.selectedActivityId]
  );
  const selectedPerson = useMemo(
    () =>
      selectedBundle?.people.find((person) => person.assignmentId === state.selectedPersonId) ??
      null,
    [selectedBundle, state.selectedPersonId]
  );
  const selectedBudgetEntry = useMemo(() => {
    if (!selectedBundle?.budget) return null;
    return (
      buildBudgetEntries(selectedBundle.budget).find(
        (entry) => entry.id === state.selectedBudgetEntryId
      ) ?? null
    );
  }, [selectedBundle, state.selectedBudgetEntryId]);

  useEffect(() => {
    const departmentId = state.selectedDepartmentId;
    if (!departmentId || bundleCache[departmentId]) return;

    let cancelled = false;
    setLoadingDepartmentId(departmentId);
    setBundleError(null);

    fetch(`/api/churches/${encodeURIComponent(churchSlug)}/departments/${departmentId}/workspace`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load department workspace data.");
        }
        return payload.bundle as DepartmentWorkspaceBundle;
      })
      .then((bundle) => {
        if (cancelled) return;
        setBundleCache((current) => ({ ...current, [bundle.department.id]: bundle }));
        setState((current) => {
          if (current.selectedDepartmentId !== bundle.department.id) return current;
          return { ...current, ...nextSelectionForBundle(bundle) };
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setBundleError(error instanceof Error ? error.message : "Failed to load department workspace data.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDepartmentId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [bundleCache, churchSlug, state.selectedDepartmentId]);

  function replaceWorkspaceQuery(tab: DepartmentTabKey, departmentId: string | null) {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    if (departmentId) {
      params.set("department", departmentId);
    } else {
      params.delete("department");
    }
    params.delete("departmentId");

    const nextQuery = params.toString();
    window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  function setActiveTab(activeTab: DepartmentTabKey) {
    setState((current) => ({ ...current, activeTab }));
    replaceWorkspaceQuery(activeTab, state.selectedDepartmentId);
  }

  function selectDepartment(departmentId: string) {
    const cachedBundle = bundleCache[departmentId] ?? null;
    setState((current) => ({
      ...current,
      selectedDepartmentId: departmentId,
      ...(cachedBundle ? nextSelectionForBundle(cachedBundle) : {}),
    }));
    replaceWorkspaceQuery(state.activeTab, departmentId);
  }

  function openPeople(departmentId: string) {
    const cachedBundle = bundleCache[departmentId] ?? null;
    setState((current) => ({
      ...current,
      activeTab: "people",
      selectedDepartmentId: departmentId,
      ...(cachedBundle ? nextSelectionForBundle(cachedBundle) : {}),
      peopleState: { ...current.peopleState, page: 1 },
    }));
    replaceWorkspaceQuery("people", departmentId);
  }

  function openBudget(departmentId: string) {
    const cachedBundle = bundleCache[departmentId] ?? null;
    setState((current) => ({
      ...current,
      activeTab: "budget",
      selectedDepartmentId: departmentId,
      ...(cachedBundle ? nextSelectionForBundle(cachedBundle) : {}),
      budgetState: { ...current.budgetState, page: 1 },
    }));
    replaceWorkspaceQuery("budget", departmentId);
  }

  function updateOverviewState(next: Partial<DepartmentsWorkspaceState["overviewState"]>) {
    setState((current) => ({
      ...current,
      overviewState: { ...current.overviewState, ...next, page: next.page ?? 1 },
    }));
  }

  function updateActionPlanState(next: Partial<ActionPlanState>) {
    setState((current) => ({
      ...current,
      actionPlanState: { ...current.actionPlanState, ...next, page: next.page ?? 1 },
    }));
  }

  function updateActivitiesState(next: Partial<ActivitiesState>) {
    setState((current) => ({
      ...current,
      activitiesState: { ...current.activitiesState, ...next, page: next.page ?? 1 },
    }));
  }

  function updatePeopleState(next: Partial<PeopleState>) {
    setState((current) => ({
      ...current,
      peopleState: { ...current.peopleState, ...next, page: next.page ?? 1 },
    }));
  }

  function updateBudgetState(next: Partial<BudgetState>) {
    setState((current) => ({
      ...current,
      budgetState: { ...current.budgetState, ...next, page: next.page ?? 1 },
    }));
  }

  function updateDocumentsState(next: Partial<DocumentsState>) {
    setState((current) => ({
      ...current,
      documentsState: { ...current.documentsState, ...next, page: next.page ?? 1 },
    }));
  }

  function renderBundleStatus() {
    if (isLoadingSelectedBundle) return <ChurchLoadingState />;
    if (bundleError) {
      return (
        <EmptyState
          title="Department data unavailable"
          message={bundleError}
        />
      );
    }
    if (!selectedBundle) {
      return (
        <EmptyState
          title="No department selected"
          message="Select a department from the overview registry to load this workspace section."
        />
      );
    }
    return null;
  }

  const bundleStatus = renderBundleStatus();

  return (
    <ChurchPageFrame className="space-y-4">
      <DepartmentsWorkspaceHeader
        activeTab={state.activeTab}
        selectedBundle={selectedBundle}
        capabilities={data.capabilities}
        onDialogChange={setActiveDialog}
      />
      <DepartmentsTabBar activeTab={state.activeTab} onChange={setActiveTab} />

      <section
        id="departments-panel-overview"
        role="tabpanel"
        aria-labelledby="departments-tab-overview"
        hidden={state.activeTab !== "overview"}
        className="min-w-0"
      >
        {state.activeTab === "overview" ? (
          <OverviewTab
            data={data}
            state={state.overviewState}
            selectedDepartment={selectedDepartment}
            onStateChange={updateOverviewState}
            onSelectDepartment={selectDepartment}
            onOpenPeople={openPeople}
            onOpenBudget={openBudget}
            onDialogChange={setActiveDialog}
          />
        ) : null}
      </section>

      <section
        id="departments-panel-action-plan"
        role="tabpanel"
        aria-labelledby="departments-tab-action-plan"
        hidden={state.activeTab !== "action-plan"}
        className="min-w-0"
      >
        {state.activeTab === "action-plan" ? (
          bundleStatus ?? (
            <ActionPlanTab
              bundle={selectedBundle}
              state={state.actionPlanState}
              selectedItem={selectedActionItem}
              onStateChange={updateActionPlanState}
              onSelectItem={(itemId) =>
                setState((current) => ({ ...current, selectedActionItemId: itemId }))
              }
            />
          )
        ) : null}
      </section>

      <section
        id="departments-panel-activities"
        role="tabpanel"
        aria-labelledby="departments-tab-activities"
        hidden={state.activeTab !== "activities"}
        className="min-w-0"
      >
        {state.activeTab === "activities" ? (
          bundleStatus ?? (
            <ActivitiesTab
              churchSlug={churchSlug}
              bundle={selectedBundle}
              state={state.activitiesState}
              selectedActivity={selectedActivity}
              onStateChange={updateActivitiesState}
              onSelectActivity={(activityId) =>
                setState((current) => ({ ...current, selectedActivityId: activityId }))
              }
              onDialogChange={setActiveDialog}
            />
          )
        ) : null}
      </section>

      <section
        id="departments-panel-people"
        role="tabpanel"
        aria-labelledby="departments-tab-people"
        hidden={state.activeTab !== "people"}
        className="min-w-0"
      >
        {state.activeTab === "people" ? (
          bundleStatus ?? (
            <PeopleTab
              bundle={selectedBundle}
              state={state.peopleState}
              selectedPerson={selectedPerson}
              canManageAssignments={data.capabilities.canManageAssignments}
              onStateChange={updatePeopleState}
              onSelectPerson={(assignmentId) =>
                setState((current) => ({ ...current, selectedPersonId: assignmentId }))
              }
              onDialogChange={setActiveDialog}
            />
          )
        ) : null}
      </section>

      <section
        id="departments-panel-budget"
        role="tabpanel"
        aria-labelledby="departments-tab-budget"
        hidden={state.activeTab !== "budget"}
        className="min-w-0"
      >
        {state.activeTab === "budget" ? (
          bundleStatus ?? (
            <BudgetTab
              bundle={selectedBundle}
              state={state.budgetState}
              selectedEntry={selectedBudgetEntry}
              onStateChange={updateBudgetState}
              onSelectEntry={(entryId) =>
                setState((current) => ({ ...current, selectedBudgetEntryId: entryId }))
              }
              onDialogChange={setActiveDialog}
            />
          )
        ) : null}
      </section>

      <section
        id="departments-panel-documents"
        role="tabpanel"
        aria-labelledby="departments-tab-documents"
        hidden={state.activeTab !== "documents"}
        className="min-w-0"
      >
        {state.activeTab === "documents" ? (
          bundleStatus ?? (
            <DocumentsTab
              bundle={selectedBundle}
              state={state.documentsState}
              onStateChange={updateDocumentsState}
            />
          )
        ) : null}
      </section>

      <DepartmentsDialogHost
        churchSlug={churchSlug}
        data={data}
        bundle={selectedBundle}
        activeDialog={activeDialog}
        onDialogChange={setActiveDialog}
      />
    </ChurchPageFrame>
  );
}
