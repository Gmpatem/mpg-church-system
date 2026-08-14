import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "http://localhost:3000";
const CHURCH_ID = "10ea9137-7a1d-4297-851a-81ff665b8d79";
const CHURCH_SLUG = "grace-community-church";
const CHURCH_NAME = "ghrace comunity church";
const ADMIN_ROLE_ID = "66c0e305-15c3-4478-bb8a-5529f9fd95c1";
const DEPARTMENT_ID = "3ea82402-290b-4765-89ac-ac52024a4e92";
const OTHER_DEPARTMENT_ID = "c476a06e-ba2a-47c0-be78-79235cbb57b8";
const OUTPUT_DIR = new URL("../artifacts/ministry-workspace/", import.meta.url);

const REQUIRED_MINISTRIES = [
  "Sabbath School",
  "Children’s Ministries",
  "Adventist Youth Ministries",
  "Personal Ministries and Evangelism",
  "Deacon and Deaconess Ministry",
  "Media and Communications",
  "Music Ministry",
  "Health Ministries",
  "Family Ministries",
  "Community Services",
  "Women’s Ministries",
  "Education Ministry",
];

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      return [
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim().replace(/^["']|["']$/g, ""),
      ];
    })
);

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase verification credentials are unavailable.");
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const require = createRequire(
  "C:/Users/Grovy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json"
);
const { chromium } = require("playwright");

const stamp = Date.now();
const password = `Codex-${stamp}-Aa7!`;
const emails = {
  admin: `codex-admin-${stamp}@example.test`,
  leader: `codex-leader-${stamp}@example.test`,
  member: `codex-member-${stamp}@example.test`,
};
const created = {
  users: {},
  members: [],
  memberDepartment: null,
  leadership: null,
  roleAssignment: null,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function insert(table, payload, columns = "id") {
  const result = await supabase.from(table).insert(payload).select(columns);
  if (result.error) throw result.error;
  return result.data;
}

async function deleteExact(table, column, value) {
  if (!value) return;
  const result = await supabase.from(table).delete().eq(column, value);
  if (result.error) throw result.error;
}

async function createFixtures() {
  for (const kind of Object.keys(emails)) {
    const result = await supabase.auth.admin.createUser({
      email: emails[kind],
      password,
      email_confirm: true,
      user_metadata: { full_name: `Codex ${kind}` },
    });
    if (result.error) throw result.error;
    created.users[kind] = result.data.user.id;
  }

  await insert(
    "church_users",
    Object.values(created.users).map((userId) => ({
      church_id: CHURCH_ID,
      user_id: userId,
      status: "active",
      is_primary: true,
    }))
  );

  const [roleAssignment] = await insert("church_role_assignments", {
    church_id: CHURCH_ID,
    user_id: created.users.admin,
    role_id: ADMIN_ROLE_ID,
    start_date: new Date().toISOString().slice(0, 10),
    is_active: true,
    notes: "Temporary browser verification fixture",
  });
  created.roleAssignment = roleAssignment.id;

  const members = await insert(
    "members",
    [
      {
        church_id: CHURCH_ID,
        first_name: "Codex",
        last_name: "Leader",
        email: emails.leader,
        profile_id: created.users.leader,
        membership_status: "active",
      },
      {
        church_id: CHURCH_ID,
        first_name: "Codex",
        last_name: "Member",
        email: emails.member,
        profile_id: created.users.member,
        membership_status: "active",
      },
    ],
    "id, profile_id"
  );
  created.members = members.map((member) => member.id);
  const leaderMember = members.find(
    (member) => member.profile_id === created.users.leader
  );
  assert(leaderMember, "Temporary leader member was not created.");

  const today = new Date().toISOString().slice(0, 10);
  const [memberDepartment] = await insert("member_departments", {
    church_id: CHURCH_ID,
    member_id: leaderMember.id,
    department_id: DEPARTMENT_ID,
    department_name: "Sabbath School",
    role_title: "Leader",
    role_in_department: "Leader",
    start_date: today,
    joined_date: today,
    is_active: true,
  });
  created.memberDepartment = memberDepartment.id;

  const [leadership] = await insert("department_leadership_assignments", {
    church_id: CHURCH_ID,
    department_id: DEPARTMENT_ID,
    member_id: leaderMember.id,
    leadership_role_code: "leader",
    leadership_role_name: "Leader",
    is_primary: true,
    start_date: today,
    is_active: true,
    notes: "Temporary browser verification fixture",
  });
  created.leadership = leadership.id;
}

async function cleanupFixtures() {
  const cleanupErrors = [];
  const attempt = async (work) => {
    try {
      await work();
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error.message : String(error));
    }
  };

  await attempt(() =>
    deleteExact("department_leadership_assignments", "id", created.leadership)
  );
  await attempt(() =>
    deleteExact("member_departments", "id", created.memberDepartment)
  );
  for (const memberId of created.members) {
    await attempt(() => deleteExact("members", "id", memberId));
  }
  await attempt(() =>
    deleteExact("church_role_assignments", "id", created.roleAssignment)
  );
  for (const userId of Object.values(created.users)) {
    await attempt(async () => {
      const result = await supabase.auth.admin.deleteUser(userId);
      if (result.error) throw result.error;
    });
  }

  return cleanupErrors;
}

async function login(browser, kind, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel(/Email or mobile number/i).fill(emails[kind]);
  await page.getByLabel(/^Password$/i).fill(password);
  await Promise.all([
    page.waitForURL(/\/(platform|c\/|my\/)/, { timeout: 30_000 }),
    page.getByRole("button", { name: /^Sign In$/i }).click(),
  ]);

  return { context, page, errors };
}

async function inspectOverflow(page) {
  return page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > window.innerWidth + 1 ||
      document.body.scrollWidth > window.innerWidth + 1,
  }));
}

await mkdir(OUTPUT_DIR, { recursive: true });
let browser;
let outcome;

try {
  await createFixtures();
  browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    args: ["--no-sandbox"],
  });

  const admin = await login(browser, "admin");
  const workspaceUrl = `${BASE_URL}/c/${CHURCH_SLUG}/departments?department=${DEPARTMENT_ID}`;
  await admin.page.goto(workspaceUrl, { waitUntil: "networkidle" });
  await admin.page.getByRole("heading", { name: "Departments", exact: true }).waitFor();
  const departmentResult = await supabase
    .from("church_departments")
    .select("id, department_name")
    .eq("church_id", CHURCH_ID)
    .eq("is_active", true);
  if (departmentResult.error) throw departmentResult.error;
  const catalogRows = departmentResult.data ?? [];
  const catalogNames = new Set(catalogRows.map((row) => row.department_name));
  const missingMinistries = REQUIRED_MINISTRIES.filter((name) => !catalogNames.has(name));
  assert(catalogRows.length === 12, `Expected 12 active ministries, found ${catalogRows.length}.`);
  assert(missingMinistries.length === 0, `Missing ministries: ${missingMinistries.join(", ")}`);

  const workspacesOpened = [];
  for (const department of catalogRows) {
    const departmentPage = await admin.context.newPage();
    await departmentPage.goto(
      `${BASE_URL}/c/${CHURCH_SLUG}/departments?department=${department.id}&tab=action-plan`,
      { waitUntil: "networkidle" }
    );
    const bodyText = await departmentPage.locator("body").innerText();
    assert(
      bodyText.includes(department.department_name),
      `${department.department_name} did not render in its workspace (${departmentPage.url()}): ${bodyText.slice(0, 500)}`
    );
    workspacesOpened.push(department.department_name);
    await departmentPage.close();
  }
  await admin.page.goto(workspaceUrl, { waitUntil: "networkidle" });

  const tabs = ["Overview", "Action Plan", "Activities", "People", "Budget", "Documents"];
  const checkedTabs = [];
  for (const tab of tabs) {
    const trigger = admin.page.getByRole("tab", { name: tab, exact: true });
    await trigger.click();
    await trigger.waitFor({ state: "visible" });
    assert((await trigger.getAttribute("aria-selected")) === "true", `${tab} did not activate.`);
    checkedTabs.push(tab);
  }

  const viewports = [
    { width: 1440, height: 1000 },
    { width: 1366, height: 900 },
    { width: 1024, height: 900 },
    { width: 768, height: 900 },
    { width: 390, height: 844 },
  ];
  const responsive = [];
  await admin.page.getByRole("tab", { name: "Overview", exact: true }).click();
  for (const viewport of viewports) {
    await admin.page.setViewportSize(viewport);
    await admin.page.waitForTimeout(150);
    const overflow = await inspectOverflow(admin.page);
    responsive.push(overflow);
    await admin.page.screenshot({
      path: new URL(`admin-${viewport.width}.png`, OUTPUT_DIR).pathname.slice(1),
      fullPage: true,
    });
  }
  assert(
    responsive.every((item) => !item.hasHorizontalOverflow),
    "The admin workspace has page-level horizontal overflow."
  );

  const leader = await login(browser, "leader");
  await leader.page.goto(workspaceUrl, { waitUntil: "networkidle" });
  const leaderText = await leader.page.locator("body").innerText();
  assert(leader.page.url().includes(`/c/${CHURCH_SLUG}/departments`), "Leader workspace was denied.");
  assert(leaderText.includes("Department Leader Workspace"), "Scoped leader shell was not shown.");
  assert(leaderText.includes("Sabbath School"), "Leader department was not shown.");
  const allowedApiStatus = await leader.page.evaluate(async (url) => (await fetch(url)).status,
    `/api/churches/${CHURCH_SLUG}/departments/${DEPARTMENT_ID}/workspace`);
  const deniedApiStatus = await leader.page.evaluate(async (url) => (await fetch(url)).status,
    `/api/churches/${CHURCH_SLUG}/departments/${OTHER_DEPARTMENT_ID}/workspace`);
  assert(allowedApiStatus === 200, `Leader's own workspace returned ${allowedApiStatus}.`);
  assert(deniedApiStatus === 403, `Other department API returned ${deniedApiStatus}, not 403.`);
  await leader.page.goto(
    `${BASE_URL}/c/${CHURCH_SLUG}/departments?department=${OTHER_DEPARTMENT_ID}`,
    { waitUntil: "networkidle" }
  );
  assert(leader.page.url().includes(`/my/${CHURCH_SLUG}`), "Cross-department leader route was not redirected.");
  await leader.page.screenshot({
    path: new URL("leader-scope-1440.png", OUTPUT_DIR).pathname.slice(1),
    fullPage: true,
  });

  const member = await login(browser, "member", { width: 390, height: 844 });
  await member.page.goto(workspaceUrl, { waitUntil: "networkidle" });
  assert(member.page.url().includes(`/my/${CHURCH_SLUG}`), "Ordinary member reached the admin workspace.");

  const publicContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${BASE_URL}/join/${CHURCH_SLUG}`, { waitUntil: "networkidle" });
  const registrationText = await publicPage.locator("body").innerText();
  assert(registrationText.includes(CHURCH_NAME), "Public registration did not use the tenant church name.");
  await publicPage.screenshot({
    path: new URL("registration-dynamic-390.png", OUTPUT_DIR).pathname.slice(1),
    fullPage: true,
  });

  outcome = {
    passed: true,
    churchSlug: CHURCH_SLUG,
    tenantNameRendered: CHURCH_NAME,
    ministriesVerified: REQUIRED_MINISTRIES.length,
    workspacesOpened,
    tabsVerified: checkedTabs,
    responsive,
    access: {
      adminWorkspace: true,
      leaderOwnDepartmentApiStatus: allowedApiStatus,
      leaderOtherDepartmentApiStatus: deniedApiStatus,
      leaderOtherDepartmentRedirected: true,
      ordinaryMemberRedirected: true,
    },
    consoleErrors: {
      admin: admin.errors,
      leader: leader.errors,
      member: member.errors,
    },
  };

  await Promise.all([
    admin.context.close(),
    leader.context.close(),
    member.context.close(),
    publicContext.close(),
  ]);
} finally {
  if (browser) await browser.close();
  const cleanupErrors = await cleanupFixtures();
  outcome = { ...(outcome ?? { passed: false }), fixturesRemoved: cleanupErrors.length === 0, cleanupErrors };
  await writeFile(
    new URL("verification.json", OUTPUT_DIR),
    `${JSON.stringify(outcome, null, 2)}\n`,
    "utf8"
  );
}

console.log(JSON.stringify(outcome));
