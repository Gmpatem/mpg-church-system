"use client";

import {
  Building2,
  Church,
  FolderTree,
  Home,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChurchRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at?: string | null;
  default_language?: string | null;
  city?: string | null;
  country?: string | null;
};

type StatTotals = {
  churches: number;
  activeChurches: number;
  inactiveChurches: number;
  members: number;
  households: number;
  departments: number;
  churchUsers: number;
};

type BreakdownPoint = {
  name: string;
  value: number;
  color: string;
};

type MonthlyPoint = {
  month: string;
  churches: number;
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDateStable(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function getChurchInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PlatformDashboardClient({
  totals,
  churches,
  monthlyChurchCreation,
  activeInactiveBreakdown,
  languageDistribution,
}: {
  totals: StatTotals;
  churches: ChurchRow[];
  monthlyChurchCreation: MonthlyPoint[];
  activeInactiveBreakdown: BreakdownPoint[];
  languageDistribution: BreakdownPoint[];
}) {
  const recentChurches = churches.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Real-time platform overview based on your current church system data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Churches"
          value={totals.churches}
          description="All church workspaces on the platform"
          icon={Church}
        />
        <StatCard
          title="Active Churches"
          value={totals.activeChurches}
          description="Churches currently enabled"
          icon={Building2}
        />
        <StatCard
          title="Inactive Churches"
          value={totals.inactiveChurches}
          description="Churches currently disabled"
          icon={Home}
        />
        <StatCard
          title="Total Members"
          value={totals.members}
          description="All member records across churches"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Church Creation Trend</CardTitle>
            <CardDescription>Number of churches created by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChurchCreation} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="churches" name="Churches Created" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Church Status</CardTitle>
            <CardDescription>Active vs inactive church workspaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeInactiveBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {activeInactiveBreakdown.map((entry, index) => (
                      <Cell key={"status-cell-" + index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
              {activeInactiveBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Churches</CardTitle>
            <CardDescription>Latest church workspaces added to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Church</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentChurches.map((church) => (
                  <TableRow key={church.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-xs text-blue-600">
                            {getChurchInitials(church.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{church.name}</p>
                          <p className="text-xs text-gray-500">
                            {[church.city, church.country].filter(Boolean).join(", ") || church.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {church.default_language?.toUpperCase() ?? "EN"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={"h-2 w-2 rounded-full " + (church.is_active ? "bg-green-500" : "bg-gray-400")} />
                        <span className="text-sm text-gray-600">{church.is_active ? "Active" : "Inactive"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {church.created_at ? formatDateStable(church.created_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {recentChurches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-gray-500">
                      No churches found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Summary</CardTitle>
            <CardDescription>Operational totals from the live system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Households</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{totals.households}</p>
                <p className="mt-1 text-sm text-gray-500">Household records across all churches</p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Departments</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{totals.departments}</p>
                <p className="mt-1 text-sm text-gray-500">Configured church departments in total</p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Church Users</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{totals.churchUsers}</p>
                <p className="mt-1 text-sm text-gray-500">Authenticated users linked to churches</p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">Language Distribution</p>
                <div className="mt-3 space-y-2">
                  {languageDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                  {languageDistribution.length === 0 ? (
                    <p className="text-sm text-gray-500">No language data yet.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


