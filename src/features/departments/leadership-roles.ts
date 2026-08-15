export const departmentLeadershipRoles = [
  { code: "department_leader", name: "Department Leader" },
  { code: "assistant_leader", name: "Assistant Leader" },
  { code: "secretary", name: "Secretary" },
  { code: "treasurer", name: "Treasurer" },
  { code: "coordinator", name: "Coordinator" },
] as const;

export type DepartmentLeadershipRoleCode =
  (typeof departmentLeadershipRoles)[number]["code"];

export function getDepartmentLeadershipRole(code: string) {
  return departmentLeadershipRoles.find((role) => role.code === code) ?? null;
}
