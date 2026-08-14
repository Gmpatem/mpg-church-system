import assert from "node:assert/strict";
import test from "node:test";
import { hasDepartmentCapability } from "../src/features/departments/access-policy.ts";

function can(capability, options = {}) {
  return hasDepartmentCapability({
    capability,
    roles: options.roles ?? [],
    isPlatformAdmin: options.isPlatformAdmin ?? false,
    isDepartmentLeader: options.isDepartmentLeader ?? false,
  });
}

test("ordinary members receive no department administration capability", () => {
  for (const capability of [
    "view",
    "manage_action_plan",
    "manage_activities",
    "manage_announcements",
    "manage_members",
    "submit_fund_request",
    "view_budget",
    "manage_documents",
  ]) {
    assert.equal(can(capability), false, capability);
  }
});

test("an active scoped department leader receives department capabilities", () => {
  assert.equal(can("view", { isDepartmentLeader: true }), true);
  assert.equal(can("manage_action_plan", { isDepartmentLeader: true }), true);
  assert.equal(can("manage_activities", { isDepartmentLeader: true }), true);
  assert.equal(can("manage_members", { isDepartmentLeader: true }), true);
  assert.equal(can("submit_fund_request", { isDepartmentLeader: true }), true);
});

test("church-wide roles retain only their intended capabilities", () => {
  assert.equal(can("manage_members", { roles: ["church_admin"] }), true);
  assert.equal(can("view_budget", { roles: ["treasurer"] }), true);
  assert.equal(can("manage_members", { roles: ["treasurer"] }), false);
  assert.equal(can("manage_action_plan", { roles: ["elder"] }), false);
  assert.equal(can("view", { roles: ["pastor"] }), true);
});

test("platform administrators can use every department capability", () => {
  assert.equal(can("manage_documents", { isPlatformAdmin: true }), true);
  assert.equal(can("submit_fund_request", { isPlatformAdmin: true }), true);
});
