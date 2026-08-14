# Ministry Workspace Implementation Report

Date: 2026-08-14

## Outcome

The Ministries and Departments module now uses one reusable, data-driven workspace for every church slug and every current/future ministry. Registration branding is tenant-derived, and the twelve requested ministries are generic defaults provisioned during new-church creation. Grace Community Church is not a product default; its connected record was used only as sample P0 verification data.

The sample database church is currently named `ghrace comunity church`, with slug `grace-community-church` and UUID `10ea9137-7a1d-4297-851a-81ff665b8d79`.

## Generic default behavior

- The twelve definitions live in one catalog with canonical names, codes, descriptions, and legacy aliases.
- New church creation resolves the created church UUID correctly, then idempotently provisions the twelve ministries and their linked treasury funds.
- Matching is church-scoped, trimmed, and case-insensitive by name/code.
- Known legacy names such as Children’s Department, Media Department, and Deacons Department are recognized to avoid duplicates.
- Existing churches are not bulk-seeded or rewritten.
- The registration welcome screen renders `church.name`; no Grace title remains in the form implementation.

## Sample data result

All twelve requested ministries were created for the sample church because it previously had no departments. None already existed, and no conflicting or dependent duplicate records were found. The combined Deacon and Deaconess ministry is one record.

Final verification returned 12 active departments and 12 active department-linked funds. Supabase normalizes the stored codes to lowercase through an existing trigger; the application catalog retains the canonical uppercase values specified in the request.

## Functionality completed

### Shared workspace

- Preserved the unified `/c/[churchSlug]/departments` route.
- Preserved query-driven selection and tabs.
- Verified every ministry uses the same Overview, Action Plan, Activities, People, Budget, and Documents components.
- Kept internal table scrolling and responsive tab scrolling without browser-level horizontal overflow.

### Action Plan

- Reused `church_assignments`; no duplicate table was introduced.
- Added create/update server actions with exact department access checks.
- Added responsible member, department area, due date, priority, status, progress, related event, and notes support.
- Added create/edit dialogs and enabled the header action only for an authorized selected department.

### Department access

- Added a centralized pure capability matrix and server authorization helper.
- Canonical `department_leadership_assignments` is now the only department-leader authorization source.
- Enforced active status and start/end dates.
- Removed role-title keyword inference from authorization.
- Added a minimal scoped leader shell: leaders can open only their assigned department; they do not receive the church Administration Workspace.
- Applied the same guard to the workspace API, event/actions, announcement/actions, action plans, member assignments, and fund requests.

### Creation and finance

- Extracted linked-fund setup into one reusable helper.
- Added name/code conflict handling and exact-match idempotency to department creation/update.
- Corrected `create_church_with_owner` result handling: the RPC returns a church UUID, not a slug.
- Provisioned default ministries/funds only for the newly created church.

### Registration

- Replaced hardcoded Grace branding with the runtime church name.
- Preserved the heading `Ministry Interests`.
- Preserved the copy: `Select the ministries you are interested in. This is for interest only.`
- Existing RPC validation returns only active departments for the validated church.
- Submitted IDs are filtered server-side to active departments in that same church.
- Ministry interest never grants a leadership assignment, church role, or admin access.

## Tools status

| Tool | Result |
| --- | --- |
| Overview | Functional with real registry, membership, activity, status, and finance data. |
| Action Plan | Functional create/update implementation on existing assignment storage. |
| Activities | Functional read/unified view and existing event/announcement actions; active-leader announcement writes still need matching remote RLS. |
| People | Functional read and existing assignment actions; connected RLS may restrict some non-admin mutations more than the app matrix. |
| Budget | Functional existing fund/balance/request view and request path; treasury approval remains separate. |
| Documents | Intentionally unavailable because safe private storage/metadata infrastructure does not exist. |

## Onboarding and Member Portal

The sample church has registration enabled, ministry-interest collection enabled, and admin review required. The live database has all twelve active records, and the inspected public registration RPC returns only active records for the church resolved by the secure registration key. The valid-key wizard was not submitted in the browser because only the hash is stored and rotating the live key was outside the safe scope. The public missing-key page was browser-tested and displayed the live tenant name rather than a hardcoded Grace title.

The Member Portal continues to use the same `member_departments` and duty data. It shows a member’s assigned ministries/duties without exposing action plans, private documents, or treasury administration. Full aggregation of all published ministry events and announcements remains a limitation.

## Test results

### Automated tests

`npm test` passed 7/7 tests:

- Twelve unique defaults and the combined Deacon/Deaconess record.
- Legacy-name duplicate prevention.
- Tenant-derived registration branding and exact interest copy.
- Ordinary-member denial.
- Active scoped-leader capabilities.
- Church-wide role capability matrix.
- Platform-administrator capabilities.

Node emitted a non-failing `MODULE_TYPELESS_PACKAGE_JSON` warning for direct TypeScript imports in the test runner.

### Browser verification

Machine-readable result: `artifacts/ministry-workspace/verification.json`.

- All 12 ministry workspaces opened independently.
- All 6 shared tabs activated.
- Admin workspace access passed.
- Active leader own-department API returned `200`.
- Active leader other-department API returned `403` and the route redirected.
- Ordinary member administration route redirected.
- Public registration copy used the tenant’s database name.
- No unexpected page/console errors; the one recorded `403` console entry was the intentional denied cross-department request.
- Synthetic fixtures were fully removed (`0` synthetic auth users and `0` synthetic members afterward).

Responsive page-level overflow results:

| Viewport | Document width | Horizontal overflow |
| ---: | ---: | --- |
| 1440 | 1440 | No |
| 1366 | 1366 | No |
| 1024 | 1024 | No |
| 768 | 768 | No |
| 390 | 390 | No |

### Repository checks

- `npx shadcn@latest info`: passed; Next.js 16.2.2, React 19.2.4, Tailwind 3, no root `components.json`.
- `npm run lint`: passed.
- `npm test`: passed, 7/7.
- `npm run build`: passed, including TypeScript validation and static page generation.
- `npm install` reported 14 dependency audit findings (1 moderate, 13 high); no dependency upgrade was attempted as part of this feature task.

## RLS and security result

Application-level exact-department access passed the authenticated admin/member/leader browser journeys. No RLS policy was disabled or broadened.

The connected Supabase project still has 12 pre-existing public-schema tables with RLS disabled, plus security-definer views, mutable function search paths, and leaked-password protection disabled. Details and remediation links are recorded in `MINISTRY_WORKSPACE_AUDIT.md`. These findings require a tested database-security migration and should not be silently changed on the live project without a backup or branch.

Connected RLS is also narrower than the new application capability matrix for active-leader announcement writes and some intended membership-management roles. Those actions will remain safely denied until policies are aligned.

## Migrations and deployment

- No schema migration was applied.
- No RLS policy was weakened.
- No Storage bucket was created.
- No deployment, Git commit, push, or pull request was performed.
- Existing unrelated dirty-worktree changes were preserved.

## Files changed for this implementation

Primary additions:

- `src/features/departments/catalog.ts`
- `src/features/departments/access-policy.ts`
- `src/features/departments/access.ts`
- `src/features/departments/action-plan-actions.ts`
- `src/features/departments/finance-setup.ts`
- `tests/ministry-defaults.test.mjs`
- `tests/department-access-policy.test.mjs`
- `scripts/verify-ministry-ui.mjs`
- `MINISTRY_WORKSPACE_AUDIT.md`
- `MINISTRY_WORKSPACE_IMPLEMENTATION_REPORT.md`

Primary updates:

- `src/features/churches/actions.ts`
- `src/features/departments/actions.ts`
- `src/features/departments/core.ts`
- `src/features/department-finance/helpers.ts`
- `src/features/department-finance/actions.ts`
- `src/features/department-events/actions.ts`
- `src/features/department-announcements/actions.ts`
- `src/app/(church)/c/[churchSlug]/layout.tsx`
- `src/app/(church)/c/[churchSlug]/departments/components/adapters.ts`
- `src/app/(church)/c/[churchSlug]/departments/components/DepartmentsWorkspace.tsx`
- `src/app/(church)/c/[churchSlug]/departments/components/DepartmentsWorkspaceHeader.tsx`
- `src/app/(church)/c/[churchSlug]/departments/components/action-plan/ActionPlanTab.tsx`
- `src/app/(church)/c/[churchSlug]/departments/components/dialogs/DepartmentsDialogHost.tsx`
- `src/app/(church)/c/[churchSlug]/departments/components/types.ts`
- `src/app/api/churches/[churchSlug]/departments/[departmentId]/workspace/route.ts`
- `src/app/api/churches/[churchSlug]/departments/[departmentId]/fund-requests/route.ts`
- `src/app/(public)/join/[churchSlug]/components/WelcomeStep.tsx`
- `src/app/(public)/join/[churchSlug]/components/RegistrationWizard.tsx`
- `src/app/(public)/join/[churchSlug]/components/MinistryInterestsStep.tsx`
- `src/proxy.ts`
- `package.json`

`package-lock.json` was normalized by the repository’s installed npm version while repairing dependencies for the required checks.

## Remaining limitations and next actions

1. Prepare a backup/branch and implement the disabled-RLS remediation before treating the connected project as production-secure.
2. Align announcement/member-assignment RLS with the approved role matrix.
3. Issue a fresh registration link and run the complete valid-key mobile onboarding submission before tomorrow’s live session.
4. Finish published ministry activity aggregation in the Member Portal.
5. Implement Documents only after approving a private-bucket and metadata migration.
6. Add mutation browser journeys for action-plan creation, draft announcement/event, synthetic member add/remove, leader assignment, and fund request after the RLS policy alignment.
