"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Crown, Settings2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type {
  DepartmentDialog,
  DepartmentWorkspaceBundle,
  DepartmentsWorkspaceData,
  ManageDepartmentSection,
} from "../types";
import { DepartmentDetailsSection } from "./DepartmentDetailsSection";
import { DepartmentLeadershipSection } from "./DepartmentLeadershipSection";
import { DepartmentMembersSection } from "./DepartmentMembersSection";

const sections: Array<{
  key: ManageDepartmentSection;
  label: string;
  icon: typeof Settings2;
}> = [
  { key: "details", label: "Details", icon: Settings2 },
  { key: "leadership", label: "Leadership", icon: Crown },
  { key: "members", label: "Members", icon: Users },
];

type PendingChange =
  | { kind: "close" }
  | { kind: "section"; section: ManageDepartmentSection }
  | { kind: "department"; departmentId: string }
  | null;

function DepartmentPicker({
  data,
  value,
  onChange,
}: {
  data: DepartmentsWorkspaceData;
  value: string;
  onChange: (departmentId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = data.departments.find((department) => department.id === value) ?? null;
  const filteredDepartments = data.departments.filter((department) =>
    [department.name, department.code]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(query.trim().toLowerCase()))
  );
  return (
    <div className="relative w-full sm:w-[360px]">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label="Select a department to manage"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="h-11 w-full justify-between rounded-xl border-white/20 bg-white/10 px-3 text-left text-white hover:bg-white/15 hover:text-white"
        >
          <span className="min-w-0 truncate">{selected?.name ?? "Select a department"}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-white/70" aria-hidden="true" />
        </Button>
      {open ? (
      <div className="absolute left-0 top-[calc(100%+0.35rem)] z-50 w-[min(420px,calc(100vw-3rem))] rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search departments..."
          className="h-10"
        />
        <div className="mt-2 max-h-[300px] overflow-y-auto">
          {filteredDepartments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No department found.</p>
          ) : (
            filteredDepartments.map((department) => (
                <button
                  type="button"
                  key={department.id}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    onChange(department.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  onClick={() => {
                    onChange(department.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Check className={cn("size-4", value === department.id ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{department.name}</span>
                  <Badge variant={department.isActive ? "default" : "secondary"}>{department.isActive ? "Active" : "Inactive"}</Badge>
                </button>
              ))
          )}
        </div>
      </div>
      ) : null}
    </div>
  );
}

function LoadingSection() {
  return (
    <div className="grid gap-4" aria-label="Loading department management data">
      <Skeleton className="h-36 rounded-[22px]" />
      <Skeleton className="h-64 rounded-[22px]" />
    </div>
  );
}

export function ManageDepartmentDialog({
  churchSlug,
  data,
  bundle,
  dialog,
  onDialogChange,
  onDepartmentSelect,
  onMutationSuccess,
}: {
  churchSlug: string;
  data: DepartmentsWorkspaceData;
  bundle: DepartmentWorkspaceBundle | null;
  dialog: Extract<NonNullable<DepartmentDialog>, { type: "manage-department" }>;
  onDialogChange: (dialog: DepartmentDialog) => void;
  onDepartmentSelect: (departmentId: string) => void;
  onMutationSuccess: () => void;
}) {
  const [activeSection, setActiveSection] = useState<ManageDepartmentSection>(dialog.section ?? "details");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingChange>(null);
  const selectedDepartmentId = dialog.departmentId ?? bundle?.department.id ?? data.selectedDepartmentId ?? "";
  const selectedDepartment = data.departments.find((department) => department.id === selectedDepartmentId) ?? null;
  const selectedBundle = bundle?.department.id === selectedDepartmentId ? bundle : null;

  function closeDialog() {
    onDialogChange(null);
  }

  function applyChange(change: Exclude<PendingChange, null>) {
    setDirty(false);
    if (change.kind === "close") {
      closeDialog();
      return;
    }
    if (change.kind === "section") {
      setActiveSection(change.section);
      onDialogChange({ ...dialog, section: change.section });
      return;
    }
    onDepartmentSelect(change.departmentId);
    onDialogChange({
      type: "manage-department",
      departmentId: change.departmentId,
      section: activeSection,
    });
  }

  function requestChange(change: Exclude<PendingChange, null>) {
    if (dirty) {
      setPendingChange(change);
      return;
    }
    applyChange(change);
  }

  const canSubmit =
    activeSection === "members"
      ? data.capabilities.canManageAssignments
      : data.capabilities.canManageDepartments;
  const primaryLabel =
    activeSection === "details"
      ? "Save changes"
      : activeSection === "leadership"
        ? "Assign leader"
        : "Add selected members";
  const primaryForm =
    activeSection === "details"
      ? "department-details-form"
      : activeSection === "leadership"
        ? "department-leader-form"
        : "department-member-form";

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) requestChange({ kind: "close" });
        }}
      >
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-y-[-50%] flex-col gap-0 overflow-hidden rounded-none border-primary/10 bg-[#fbf7ef] p-0 shadow-2xl sm:h-auto sm:max-h-[92vh] sm:w-[calc(100vw-1.5rem)] sm:max-w-6xl sm:rounded-[28px] [&>button]:right-5 [&>button]:top-5 [&>button]:text-white">
          <header className="shrink-0 bg-[#123d2e] px-4 pb-4 pt-5 text-white sm:px-6">
            <div className="pr-10">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">Department workspace</Badge>
                {selectedDepartment ? (
                  <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                    {selectedDepartment.isActive ? "Active" : "Inactive"}
                  </Badge>
                ) : null}
              </div>
              <DialogTitle className="mt-3 text-2xl font-semibold tracking-tight text-white">Manage Department</DialogTitle>
              <DialogDescription className="mt-1 max-w-3xl text-sm leading-6 text-white/75">
                Update department details, verified leadership, and member assignments without leaving this workspace.
              </DialogDescription>
            </div>
            <div className="mt-4">
              <DepartmentPicker data={data} value={selectedDepartmentId} onChange={(departmentId) => requestChange({ kind: "department", departmentId })} />
            </div>
          </header>

          <nav className="shrink-0 border-b border-primary/10 bg-[#f5efe3] px-3 py-2 sm:px-5" aria-label="Department management sections">
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Manage department sections">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = section.key === activeSection;
                return (
                  <button
                    key={section.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`manage-department-panel-${section.key}`}
                    onClick={() => requestChange({ kind: "section", section: section.key })}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      selected ? "bg-[#123d2e] text-white shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
            {!selectedBundle ? (
              <LoadingSection />
            ) : activeSection === "details" ? (
              <div id="manage-department-panel-details" role="tabpanel">
                <DepartmentDetailsSection
                  key={selectedBundle.department.id}
                  churchSlug={churchSlug}
                  department={selectedBundle.department}
                  canManage={data.capabilities.canManageDepartments}
                  onDirtyChange={setDirty}
                  onMutationSuccess={onMutationSuccess}
                  onPendingChange={setPending}
                />
              </div>
            ) : activeSection === "leadership" ? (
              <div id="manage-department-panel-leadership" role="tabpanel">
                <DepartmentLeadershipSection
                  key={selectedBundle.department.id}
                  churchSlug={churchSlug}
                  data={data}
                  bundle={selectedBundle}
                  initialLeadershipAssignmentId={dialog.leadershipAssignmentId}
                  canManage={data.capabilities.canManageDepartments}
                  onDirtyChange={setDirty}
                  onMutationSuccess={onMutationSuccess}
                  onPendingChange={setPending}
                />
              </div>
            ) : (
              <div id="manage-department-panel-members" role="tabpanel">
                <DepartmentMembersSection
                  key={selectedBundle.department.id}
                  churchSlug={churchSlug}
                  data={data}
                  bundle={selectedBundle}
                  initialAssignmentId={dialog.assignmentId}
                  canManage={data.capabilities.canManageAssignments}
                  onDirtyChange={setDirty}
                  onMutationSuccess={onMutationSuccess}
                  onPendingChange={setPending}
                />
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-primary/10 bg-[#f5efe3] px-4 py-3 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="outline" className="h-11 rounded-xl bg-background" onClick={() => requestChange({ kind: "close" })}>
                Close
              </Button>
              <Button type="submit" form={primaryForm} disabled={!selectedBundle || !canSubmit || pending} className="h-11 rounded-xl px-6 font-semibold">
                {pending ? "Saving..." : primaryLabel}
              </Button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingChange)} onOpenChange={(open) => { if (!open) setPendingChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have changes in this section that have not been saved. Discard them and continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep editing</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const next = pendingChange;
                setPendingChange(null);
                if (next) applyChange(next);
              }}
            >
              Discard changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
