import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  departmentLeadershipRoles,
  getDepartmentLeadershipRole,
} from "../src/features/departments/leadership-roles.ts";

test("department leadership uses a unique structured role catalog", () => {
  assert.equal(departmentLeadershipRoles.length, 5);
  assert.equal(new Set(departmentLeadershipRoles.map((role) => role.code)).size, 5);
  assert.equal(new Set(departmentLeadershipRoles.map((role) => role.name)).size, 5);
  assert.deepEqual(getDepartmentLeadershipRole("department_leader"), {
    code: "department_leader",
    name: "Department Leader",
  });
  assert.equal(getDepartmentLeadershipRole("free_text_role"), null);
});

test("the review-only migration enforces one active primary per tenant department", async () => {
  const sql = await readFile(
    new URL(
      "../supabase/migrations/20260815000412_enforce_one_active_primary_department_leader.sql",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(sql, /unique index/i);
  assert.match(sql, /\(church_id, department_id\)/);
  assert.match(sql, /where is_active = true and is_primary = true/i);
  assert.match(sql, /Review-only/i);
});

test("member archival is blocked while verified leadership is active", async () => {
  const actions = await readFile(
    new URL("../src/features/departments/actions.ts", import.meta.url),
    "utf8"
  );
  assert.match(actions, /from\("department_leadership_assignments"\)/);
  assert.match(actions, /Remove this person's active department leadership assignments/);
  assert.match(actions, /\.eq\("church_id", ctx\.churchId\)/);
  assert.match(actions, /\.eq\("department_id", departmentId\)/);
});

test("leadership mutations scope every record to the authenticated church", async () => {
  const actions = await readFile(
    new URL("../src/features/departments/leadership-actions.ts", import.meta.url),
    "utf8"
  );
  assert.match(actions, /requireDepartmentManager\(churchSlug\)/);
  assert.match(actions, /church_id: ctx\.churchId/);
  assert.match(actions, /\.eq\("church_id", ctx\.churchId\)/);
  assert.match(actions, /\.eq\("department_id", parsed\.data\.department_id\)/);
  assert.match(actions, /confirm_add_to_department/);
  assert.match(actions, /replace_primary/);
});

test("batch member assignment validates tenant ownership and blocks active duplicates before writes", async () => {
  const actions = await readFile(
    new URL("../src/features/departments/actions.ts", import.meta.url),
    "utf8"
  );
  const batchAction = actions.slice(
    actions.indexOf("export async function assignMembersToDepartmentAction"),
    actions.indexOf("export async function updateAssignmentAction")
  );

  assert.match(batchAction, /formData\s*\.getAll\("member_ids"\)/);
  assert.match(batchAction, /requireDepartmentAccess\(churchSlug, departmentId, "manage_members"\)/);
  assert.match(batchAction, /from\("members"\)[\s\S]*?\.eq\("church_id", ctx\.churchId\)/);
  assert.match(batchAction, /from\("member_departments"\)[\s\S]*?\.eq\("church_id", ctx\.churchId\)/);
  assert.match(batchAction, /already active in this department\. No assignments were changed/);
  assert.ok(
    batchAction.indexOf("activeDuplicates.length > 0") < batchAction.indexOf('from("member_departments").insert'),
    "duplicate validation must happen before inserts"
  );
});
