"use client";

import { ChevronRight, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DepartmentsOverviewData } from "../types";
import { formatOverviewNumber, safeRelativeWidth } from "./overview-utils";

export function TopDepartmentsByMembersPanel({
  overview,
  onOpenPeople,
  onOpenRegistry,
}: {
  overview: DepartmentsOverviewData;
  onOpenPeople: (departmentId: string) => void;
  onOpenRegistry: () => void;
}) {
  const rows = overview.topDepartments.slice(0, 5);
  const highest = rows[0]?.activeMemberCount ?? 0;

  return (
    <section className="flex min-h-[286px] min-w-0 flex-col rounded-xl border border-border bg-background shadow-sm">
      <div className="px-5 pt-5">
        <h2 className="text-base font-semibold text-foreground">Top Department by Members</h2>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        {rows.length > 0 ? (
          rows.map((department) => (
            <button
              key={department.departmentId}
              type="button"
              className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)_68px] items-center gap-3 text-left"
              onClick={() => onOpenPeople(department.departmentId)}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UsersRound className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {department.departmentName}
                </span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{
                      width: `${safeRelativeWidth(department.activeMemberCount, highest)}%`,
                    }}
                  />
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-semibold text-foreground">
                  {formatOverviewNumber(department.activeMemberCount)}
                </span>
                <span className="text-xs text-muted-foreground">members</span>
              </span>
            </button>
          ))
        ) : (
          <div className="flex flex-1 flex-col justify-center text-center">
            <h3 className="text-sm font-semibold text-foreground">No Department members yet</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Member assignments will appear here after people are added to Departments.
            </p>
          </div>
        )}
      </div>

      <Separator />
      <div className="px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full justify-between rounded-lg px-2 text-primary"
          onClick={onOpenRegistry}
        >
          View all departments
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
