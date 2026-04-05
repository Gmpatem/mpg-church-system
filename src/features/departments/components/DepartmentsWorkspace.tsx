"use client";

import Link from "next/link";
import type {
  DepartmentAssignmentRecord,
  DepartmentListItem,
  DepartmentRecord,
} from "../types";
import { createDepartmentAction, updateDepartmentAction } from "../actions";
import { DepartmentForm } from "./DepartmentForm";
import { DepartmentList } from "./DepartmentList";
import { DepartmentMembers } from "./DepartmentMembers";
import { AssignMemberToDepartment } from "./AssignMemberToDepartment";

type WorkspaceTab = "all_departments" | "form" | "assignments" | "members";

interface DepartmentsWorkspaceProps {
  churchSlug: string;
  departments: DepartmentListItem[];
  initialDepartment: DepartmentRecord | null;
  initialAssignments: DepartmentAssignmentRecord[];
  selectedDepartmentId?: string | null;
  activeTab?: WorkspaceTab;
  options: {
    departments: Array<{ id: string; name: string; code: string | null; is_active: boolean }>;
    members: Array<{ id: string; label: string; member_code: string | null; membership_status: string | null }>;
  };
}

function buildTabHref(churchSlug: string, tab: WorkspaceTab, departmentId?: string | null) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (departmentId) params.set("departmentId", departmentId);
  return `/c/${churchSlug}/departments?${params.toString()}`;
}

export function DepartmentsWorkspace({
  churchSlug,
  departments,
  initialDepartment,
  initialAssignments,
  selectedDepartmentId,
  activeTab = "all_departments",
  options,
}: DepartmentsWorkspaceProps) {
    const selectedDepartment =
    departments.find((item) => item.id === selectedDepartmentId) ?? initialDepartment ?? null;

  const existingActiveMemberIds = initialAssignments
    .filter((item) => item.is_active)
    .map((item) => item.member_id);const tabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: "all_departments", label: "All Church Departments" },
    { id: "form", label: selectedDepartment ? "Edit / Create Department" : "Create Department" },
    { id: "assignments", label: "Assignments" },
    { id: "members", label: "Department Members" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={buildTabHref(churchSlug, tab.id, selectedDepartment?.id ?? selectedDepartmentId)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {selectedDepartment ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Selected department:
          <span className="ml-2 font-semibold">{selectedDepartment.department_name}</span>
          {selectedDepartment.code ? <span className="ml-2 text-xs uppercase">({selectedDepartment.code})</span> : null}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No department selected yet. Choose one from All Church Departments, or create a new one.
        </div>
      )}

      {activeTab === "all_departments" ? (
        <DepartmentList
          churchSlug={churchSlug}
          departments={departments}
          selectedDepartmentId={selectedDepartmentId}
        />
      ) : null}

      {activeTab === "form" ? (
        <DepartmentForm
          churchSlug={churchSlug}
          action={selectedDepartment ? updateDepartmentAction : createDepartmentAction}
          initialValues={selectedDepartment}
          submitLabel={selectedDepartment ? "Update Department" : "Create Department"}
        />
      ) : null}

      {activeTab === "assignments" ? (
        selectedDepartment ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Department Assignments</h3>
              <p className="mt-1 text-sm text-gray-600">
                Assign members directly into the selected department.
              </p>
            </div>

                        <AssignMemberToDepartment
              churchSlug={churchSlug}
              departmentId={selectedDepartment.id}
              members={options.members}
              departments={options.departments}
              existingActiveMemberIds={existingActiveMemberIds}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-sm text-gray-600">
            Select a department from the All Church Departments tab before managing assignments.
          </div>
        )
      ) : null}

      {activeTab === "members" ? (
        selectedDepartment ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Department Members</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add or remove members inside the currently selected department.
                </p>
              </div>

                          <AssignMemberToDepartment
              churchSlug={churchSlug}
              departmentId={selectedDepartment.id}
              members={options.members}
              departments={options.departments}
              existingActiveMemberIds={existingActiveMemberIds}
            />
            </div>

            <DepartmentMembers
              churchSlug={churchSlug}
              assignments={initialAssignments}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-sm text-gray-600">
            Select a department from the All Church Departments tab to manage its members.
          </div>
        )
      ) : null}
    </div>
  );
}

