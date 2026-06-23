"use client";

import { ClipboardList } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Separator } from "@/components/ui/separator";
import type { DepartmentsOverviewData } from "../types";
import { formatOverviewNumber } from "./overview-utils";

const statusColors = {
  active: "#166534",
  inactive: "#d4d4d4",
};

export function DepartmentStatusPanel({
  overview,
}: {
  overview: DepartmentsOverviewData;
}) {
  const statusData = [
    { name: "Active", value: overview.activeDepartments, color: statusColors.active },
    { name: "Inactive", value: overview.inactiveDepartments, color: statusColors.inactive },
  ];
  const hasDepartments = overview.totalDepartments > 0;
  const chartData = hasDepartments
    ? statusData.filter((item) => item.value > 0)
    : [{ name: "No departments", value: 1, color: statusColors.inactive }];

  const footerMessage =
    overview.inactiveDepartments > 0
      ? `${formatOverviewNumber(overview.inactiveDepartments)} ${
          overview.inactiveDepartments === 1 ? "Department is" : "Departments are"
        } currently inactive`
      : hasDepartments
        ? "All Departments are active"
        : "No Departments have been created";

  return (
    <section className="flex min-h-[318px] min-w-0 flex-col rounded-xl border border-border bg-background shadow-sm">
      <div className="px-5 pt-5">
        <h2 className="text-base font-semibold text-foreground">Department Status</h2>
      </div>

      <div className="grid flex-1 items-center gap-5 px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative mx-auto h-[190px] w-[260px] max-w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                startAngle={180}
                endAngle={0}
                innerRadius={66}
                outerRadius={92}
                cx="50%"
                cy="78%"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center text-center">
            <p className="text-4xl font-semibold leading-none text-foreground">
              {formatOverviewNumber(overview.activeDepartments)}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">Active</p>
            <p className="text-sm text-muted-foreground">
              of {formatOverviewNumber(overview.totalDepartments)} total
            </p>
          </div>
        </div>

        <div className="grid gap-4 text-sm">
          {statusData.map((status) => (
            <div
              key={status.name}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                  aria-hidden="true"
                />
                <span className="text-foreground">{status.name}</span>
              </span>
              <span className="font-semibold text-foreground">{status.value}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />
      <div className="flex min-h-11 items-center gap-2 px-5 py-3 text-sm text-foreground">
        <ClipboardList className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>{footerMessage}</span>
      </div>
    </section>
  );
}
