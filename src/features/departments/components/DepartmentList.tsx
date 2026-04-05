"use client";

import Link from "next/link";
import type { DepartmentListItem } from "../types";

interface DepartmentListProps {
  churchSlug: string;
  departments: DepartmentListItem[];
  selectedDepartmentId?: string | null;
}

export function DepartmentList({
  churchSlug,
  departments,
  selectedDepartmentId,
}: DepartmentListProps) {
  if (departments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-sm text-gray-600">
        No departments found yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Department</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Code</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Members</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {departments.map((item) => {
            const isSelected = item.id === selectedDepartmentId;

            return (
              <tr key={item.id} className={isSelected ? "bg-blue-50" : ""}>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-gray-900">{item.department_name}</div>
                  {item.description ? <div className="mt-1 text-sm text-gray-600">{item.description}</div> : null}
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-600">{item.code ?? "—"}</td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-600">
                  <div>Total: {item.member_count}</div>
                  <div>Active: {item.active_member_count}</div>
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <Link
                    href={`/c/${churchSlug}/departments?departmentId=${item.id}&tab=members`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {isSelected ? "Manage" : "Open"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
