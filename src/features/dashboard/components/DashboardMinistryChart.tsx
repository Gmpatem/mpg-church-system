"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { DashboardMinistryBreakdown } from "../types";

export function DashboardMinistryChart({
  ministries,
  total,
  label,
}: {
  ministries: DashboardMinistryBreakdown[];
  total: number;
  label: string;
}) {
  return (
    <div className="relative size-44 shrink-0" role="img" aria-label={`${total} ${label}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={ministries}
            dataKey="count"
            nameKey="name"
            innerRadius={52}
            outerRadius={76}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {ministries.map((item) => (
              <Cell key={item.id} fill={item.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold leading-none text-[#172018]">{total}</span>
        <span className="mt-1 text-xs font-medium text-[#4F5A53]">{label}</span>
      </div>
    </div>
  );
}
