import { offlineDb } from "./db";

export async function cacheDepartmentMembers(
  churchId: string,
  departmentId: string,
  members: Array<{
    id: string;
    member_id: string;
    role_title?: string | null;
    is_active?: boolean | null;
    start_date?: string | null;
    member?: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      display_name?: string | null;
      member_code?: string | null;
      email?: string | null;
      phone?: string | null;
      membership_status?: string | null;
    } | null;
  }>
) {
  const now = new Date();
  const cachedMembers = members.map((m) => ({
    id: m.member?.id ?? m.member_id ?? m.id,
    churchId,
    firstName: m.member?.first_name ?? null,
    lastName: m.member?.last_name ?? null,
    displayName: m.member?.display_name ?? null,
    email: m.member?.email ?? null,
    phone: m.member?.phone ?? null,
    memberCode: m.member?.member_code ?? null,
    membershipStatus: m.member?.membership_status ?? null,
    departmentIds: [departmentId],
    cachedAt: now,
  }));

  await offlineDb.cachedMembers.bulkPut(cachedMembers);
}

export async function cacheDepartment(
  churchId: string,
  department: {
    id: string;
    department_name: string;
    code?: string | null;
    description?: string | null;
    is_active?: boolean | null;
  },
  activeMemberCount: number
) {
  await offlineDb.cachedDepartments.put({
    id: department.id,
    churchId,
    name: department.department_name,
    code: department.code ?? null,
    description: department.description ?? null,
    isActive: department.is_active ?? true,
    activeMemberCount,
    cachedAt: new Date(),
  });
}

export async function getCachedDepartmentMembers(churchId: string, departmentId: string) {
  const members = await offlineDb.cachedMembers
    .where("churchId")
    .equals(churchId)
    .and((m) => m.departmentIds?.includes(departmentId) ?? false)
    .toArray();
  return members;
}

export async function getCachedDepartment(churchId: string, departmentId: string) {
  return offlineDb.cachedDepartments.get(departmentId);
}
