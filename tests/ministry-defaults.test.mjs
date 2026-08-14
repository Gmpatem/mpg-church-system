import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CORE_CHURCH_DEPARTMENTS,
  departmentMatchesCoreTemplate,
} from "../src/features/departments/catalog.ts";

test("the default ministry catalog contains the required 12 unique active templates", () => {
  assert.equal(CORE_CHURCH_DEPARTMENTS.length, 12);
  assert.equal(new Set(CORE_CHURCH_DEPARTMENTS.map((item) => item.code)).size, 12);
  assert.equal(new Set(CORE_CHURCH_DEPARTMENTS.map((item) => item.name)).size, 12);
  assert.ok(CORE_CHURCH_DEPARTMENTS.every((item) => item.name && item.code && item.description));
  assert.ok(
    CORE_CHURCH_DEPARTMENTS.some(
      (item) => item.name === "Deacon and Deaconess Ministry" && item.code === "DEACON_DEACONESS"
    )
  );
});

test("legacy ministry names are recognized without changing the new defaults", () => {
  const children = CORE_CHURCH_DEPARTMENTS.find((item) => item.key === "children");
  const media = CORE_CHURCH_DEPARTMENTS.find((item) => item.key === "media");
  const deacons = CORE_CHURCH_DEPARTMENTS.find((item) => item.key === "deacons");
  assert.ok(children && media && deacons);
  assert.equal(
    departmentMatchesCoreTemplate({ department_name: "Children's Department" }, children),
    true
  );
  assert.equal(departmentMatchesCoreTemplate({ department_name: "Media Department" }, media), true);
  assert.equal(departmentMatchesCoreTemplate({ department_name: "Deacons Department" }, deacons), true);
});

test("public registration branding and ministry copy are tenant-derived", async () => {
  const welcome = await readFile(
    new URL("../src/app/(public)/join/[churchSlug]/components/WelcomeStep.tsx", import.meta.url),
    "utf8"
  );
  const interests = await readFile(
    new URL("../src/app/(public)/join/[churchSlug]/components/MinistryInterestsStep.tsx", import.meta.url),
    "utf8"
  );
  assert.match(welcome, /\{church\.name\}/);
  assert.doesNotMatch(welcome, />GRACE</);
  assert.doesNotMatch(welcome, /Community Church/);
  assert.match(
    interests,
    /Select the ministries you are interested in\. This is for interest only\./
  );
});
