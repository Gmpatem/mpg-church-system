"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { InlineAlert } from "@/components/ui/InlineAlert";
import {
  assignChurchUserRoleAction,
  revokeChurchUserRoleAction,
  setChurchUserPermissionAction,
} from "@/features/access-control/actions";
import type {
  AccessControlPermissionDefinition,
  AccessControlPermissionsData,
  AccessControlWorkspaceUser,
} from "@/features/access-control/types";

type AccessControlPermissionsPanelProps = {
  churchSlug: string;
  data: AccessControlPermissionsData;
};

type FlashMessage = {
  variant: "success" | "error";
  message: string;
} | null;

const PERMISSION_AREA_ORDER = [
  "Dashboard",
  "Members",
  "Households",
  "Departments",
  "Events",
  "Treasury",
  "Reports",
  "Office",
  "Approvals",
  "Access Control",
  "Settings",
  "Other",
] as const;

const PERMISSION_AREA_MATCHERS: Array<{ area: string; tokens: string[] }> = [
  { area: "Access Control", tokens: ["access_control", "permission", "role", "invite", "request_access"] },
  { area: "Dashboard", tokens: ["dashboard", "home"] },
  { area: "Members", tokens: ["member"] },
  { area: "Households", tokens: ["household"] },
  { area: "Departments", tokens: ["department"] },
  { area: "Events", tokens: ["event", "calendar"] },
  { area: "Treasury", tokens: ["treasury", "finance", "fund", "inflow", "outflow", "remittance"] },
  { area: "Reports", tokens: ["report", "analytics"] },
  { area: "Office", tokens: ["office"] },
  { area: "Approvals", tokens: ["approval"] },
  { area: "Settings", tokens: ["setting", "config"] },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolvePermissionArea(code: string) {
  const normalized = code.trim().toLowerCase();

  for (const matcher of PERMISSION_AREA_MATCHERS) {
    if (matcher.tokens.some((token) => normalized.includes(token))) {
      return matcher.area;
    }
  }

  return "Other";
}

function groupPermissionsByArea(permissions: AccessControlPermissionDefinition[]) {
  const grouped = new Map<string, AccessControlPermissionDefinition[]>();

  for (const permission of permissions) {
    const area = resolvePermissionArea(permission.code);
    const existing = grouped.get(area) ?? [];
    existing.push(permission);
    grouped.set(area, existing);
  }

  return Array.from(grouped.entries())
    .map(([area, items]) => ({
      area,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => {
      const aIndex = PERMISSION_AREA_ORDER.indexOf(a.area as (typeof PERMISSION_AREA_ORDER)[number]);
      const bIndex = PERMISSION_AREA_ORDER.indexOf(b.area as (typeof PERMISSION_AREA_ORDER)[number]);
      const resolvedA = aIndex === -1 ? PERMISSION_AREA_ORDER.length : aIndex;
      const resolvedB = bIndex === -1 ? PERMISSION_AREA_ORDER.length : bIndex;
      return resolvedA - resolvedB;
    });
}

function getStatusPillClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "invited") return "border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "inactive") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function filterUsers(users: AccessControlWorkspaceUser[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return users;

  return users.filter((user) => {
    return (
      user.displayName.toLowerCase().includes(normalizedQuery) ||
      user.email?.toLowerCase().includes(normalizedQuery) ||
      user.roleSummary.toLowerCase().includes(normalizedQuery) ||
      user.status.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function AccessControlPermissionsPanel({
  churchSlug,
  data,
}: AccessControlPermissionsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>(data.users[0]?.userId ?? "");
  const [selectedRoleId, setSelectedRoleId] = useState<string>(data.roleDefinitions[0]?.id ?? "");
  const [flash, setFlash] = useState<FlashMessage>(null);

  const filteredUsers = useMemo(
    () => filterUsers(data.users, query),
    [data.users, query]
  );

  useEffect(() => {
    if (selectedUserId && data.users.some((user) => user.userId === selectedUserId)) {
      return;
    }
    setSelectedUserId(filteredUsers[0]?.userId ?? "");
  }, [data.users, filteredUsers, selectedUserId]);

  useEffect(() => {
    if (selectedRoleId && data.roleDefinitions.some((role) => role.id === selectedRoleId)) {
      return;
    }
    setSelectedRoleId(data.roleDefinitions[0]?.id ?? "");
  }, [data.roleDefinitions, selectedRoleId]);

  const selectedUser = useMemo(() => {
    return (
      data.users.find((user) => user.userId === selectedUserId) ??
      filteredUsers[0] ??
      null
    );
  }, [data.users, filteredUsers, selectedUserId]);

  const groupedPermissions = useMemo(
    () => groupPermissionsByArea(data.permissions),
    [data.permissions]
  );

  const selectedUserPermissionIds = useMemo(() => {
    return new Set(selectedUser?.permissions.map((assignment) => assignment.permissionId) ?? []);
  }, [selectedUser]);

  const canManage = data.canManage;

  function runMutation(
    execute: () => Promise<{ ok: boolean; message?: string; error?: string }>,
    successFallback: string
  ) {
    startTransition(async () => {
      setFlash(null);
      const result = await execute();
      if (!result.ok) {
        setFlash({
          variant: "error",
          message: result.error ?? "Action failed.",
        });
        return;
      }

      setFlash({
        variant: "success",
        message: result.message ?? successFallback,
      });
      router.refresh();
    });
  }

  function handleAssignRole() {
    if (!selectedUser || !selectedRoleId) return;
    runMutation(
      () => assignChurchUserRoleAction(churchSlug, selectedUser.userId, selectedRoleId),
      "Role updated."
    );
  }

  function handleRevokeRole(roleAssignmentId: string) {
    if (!selectedUser) return;
    runMutation(
      () => revokeChurchUserRoleAction(churchSlug, selectedUser.userId, roleAssignmentId),
      "Role revoked."
    );
  }

  function handleTogglePermission(permissionId: string, nextState: boolean) {
    if (!selectedUser) return;
    runMutation(
      () => setChurchUserPermissionAction(churchSlug, selectedUser.userId, permissionId, nextState),
      "Permission updated."
    );
  }

  return (
    <div className="space-y-5">
      {flash ? (
        <InlineAlert
          variant={flash.variant}
          message={flash.message}
        />
      ) : null}

      {!canManage ? (
        <InlineAlert
          variant="info"
          message="You can view access details, but role and permission changes require access-control management rights."
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Church Users</p>
            <p className="mt-1 text-xs text-slate-500">
              Search and select a user to edit role and access permissions.
            </p>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, role, or status"
              className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="max-h-[640px] overflow-y-auto p-2">
            {filteredUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                No users match this search.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUser?.userId === user.userId;
                  return (
                    <button
                      key={user.userId}
                      type="button"
                      onClick={() => setSelectedUserId(user.userId)}
                      className={
                        isSelected
                          ? "w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-left transition"
                          : "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:bg-slate-50"
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{user.displayName}</p>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getStatusPillClass(user.status)}`}
                        >
                          {formatLabel(user.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{user.email ?? "No email"}</p>
                      <p className="mt-2 text-xs text-slate-600">{user.roleSummary}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          {selectedUser ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{selectedUser.displayName}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedUser.email ?? "No email address"}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusPillClass(selectedUser.status)}`}
                  >
                    {formatLabel(selectedUser.status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Active roles</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedUser.roles.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Active permissions</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedUser.permissions.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Last access update</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(selectedUser.lastUpdatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Role Assignment</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Assign a new role or revoke active roles. Multiple active roles are supported by the current RBAC model.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedRoleId}
                      onChange={(event) => setSelectedRoleId(event.target.value)}
                      disabled={!canManage || isPending}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {data.roleDefinitions.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAssignRole}
                      disabled={!canManage || isPending || !selectedRoleId}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? (
                        <span className="inline-flex items-center gap-2">
                          <ButtonSpinner />
                          Saving
                        </span>
                      ) : (
                        "Assign Role"
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {selectedUser.roles.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-3 text-sm text-slate-500">
                      This user has no active roles.
                    </div>
                  ) : (
                    selectedUser.roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{role.roleName}</p>
                          <p className="text-xs text-slate-500">{formatLabel(role.roleCode)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeRole(role.id)}
                          disabled={!canManage || isPending}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Revoke
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Module / Area Permissions</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Grant or revoke real permission definitions persisted in church permission assignments.
                  </p>
                </div>

                {groupedPermissions.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed p-3 text-sm text-slate-500">
                    No permission definitions are available in this environment yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {groupedPermissions.map((group) => (
                      <div key={group.area} className="rounded-xl border border-slate-200">
                        <div className="border-b border-slate-200 px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {group.area}
                          </p>
                        </div>

                        <div className="divide-y divide-slate-200">
                          {group.items.map((permission) => {
                            const isGranted = selectedUserPermissionIds.has(permission.id);
                            return (
                              <div
                                key={permission.id}
                                className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-900">{permission.name}</p>
                                  <p className="text-xs text-slate-500">{permission.code}</p>
                                  {permission.description?.trim() ? (
                                    <p className="mt-1 text-xs text-slate-500">{permission.description}</p>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePermission(permission.id, !isGranted)}
                                  disabled={!canManage || isPending}
                                  className={
                                    isGranted
                                      ? "inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      : "inline-flex h-8 items-center justify-center rounded-lg border border-emerald-200 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  }
                                >
                                  {isGranted ? "Revoke" : "Grant"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-4 text-xs text-slate-500">
                  Changes are church-scoped and written through server-side RBAC actions with access-control audit logging.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
              Select a user from the left panel to edit role and permission access.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
