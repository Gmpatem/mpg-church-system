"use client";

import Link from "next/link";
import { Eye, Filter, MoreHorizontal, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChurchStatusToggle } from "@/app/(platform)/platform/churches/ChurchStatusToggle";

type ChurchRow = {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  city?: string | null;
  country?: string | null;
  is_active: boolean;
  member_count?: number | null;
  default_language?: string | null;
  timezone?: string | null;
};

function getChurchInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getPlanBadge(index: number) {
  if (index % 3 === 0) return { label: "Enterprise", variant: "default" as const };
  if (index % 2 === 0) return { label: "Premium", variant: "secondary" as const };
  return { label: "Starter", variant: "outline" as const };
}

export default function PlatformChurchesClient({
  churches,
}: {
  churches: ChurchRow[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Churches</h1>
          <p className="mt-1 text-gray-500">
            Manage all church tenants, inspect their workspaces, and control platform access.
          </p>
        </div>

        <Link href="/platform">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Church Directory</CardTitle>
              <CardDescription>All churches currently registered on the platform</CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search churches..."
                  className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {churches.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-900">No churches found</p>
              <p className="mt-1 text-sm text-gray-500">
                Once churches are created, they will appear here for platform management.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Church</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead className="w-[220px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {churches.map((church, index) => {
                  const plan = getPlanBadge(index);
                  const memberCount = church.member_count ?? 0;
                  const location = [church.city, church.country].filter(Boolean).join(", ") || "Unknown location";

                  return (
                    <TableRow key={church.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-sm font-medium text-blue-700">
                              {getChurchInitials(church.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{church.name}</p>
                            <p className="truncate text-xs text-gray-500">
                              {church.email ?? church.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={plan.variant}>{plan.label}</Badge>
                      </TableCell>

                      <TableCell className="text-sm text-gray-600">{location}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={"h-2 w-2 rounded-full " + (church.is_active ? "bg-green-500" : "bg-gray-400")} />
                          <span className="text-sm text-gray-600">
                            {church.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm font-medium text-gray-900">
                        {memberCount}
                      </TableCell>

                      <TableCell className="text-sm text-gray-600">
                        {church.default_language?.toUpperCase() ?? "EN"}
                      </TableCell>

                      <TableCell className="text-sm text-gray-600">
                        {church.timezone ?? "—"}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={"/platform/churches/" + church.id}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              Inspect
                            </Button>
                          </Link>

                          <Link href={"/c/" + church.slug + "/dashboard"}>
                            <Button variant="outline" size="sm">
                              Open
                            </Button>
                          </Link>

                          <ChurchStatusToggle churchId={church.id} isActive={church.is_active} />

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" type="button">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={"/platform/churches/" + church.id}>Inspect church</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={"/c/" + church.slug + "/dashboard"}>Open workspace</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
