# Ministry Workspace Audit

Date: 2026-08-14

Repository: `E:\mpg-church-system`

Connected Supabase project: `wnitkyyodymmjedlttex`

## Scope and tenant correction

The ministry catalog is application-wide default configuration, not Grace-specific behavior. Every newly created church now receives the same reusable twelve-ministry catalog and linked department funds through the existing church-creation flow. Existing churches are not bulk-modified.

The connected sample church was used only for P0 validation and test data:

- Database name: `ghrace comunity church` (the spelling currently stored in Supabase)
- Slug: `grace-community-church`
- UUID: `10ea9137-7a1d-4297-851a-81ff665b8d79`

No route, authorization rule, registration heading, or default-ministry setup is hardcoded to that slug or name.

## Implementation matrix

| Area | Status | Evidence and action |
| --- | --- | --- |
| Department registry | Complete | Existing unified overview and registry sheet preserved; real totals, search/filter/edit/open flows retained. |
| Department creation | Complete | Name/code conflicts are normalized and checked per church; exact matches are idempotent; linked fund setup is reused. |
| Department workspace | Complete | One data-driven `/c/[churchSlug]/departments?department=<id>&tab=<tab>` implementation serves current and future ministries. |
| Overview | Complete | Real department, membership, activity, finance, and status queries; no invented statistics. |
| Action Plan | Complete | Existing `church_assignments` storage now supports create/update, assignee, area, due date, priority, status, progress, event, and notes. |
| Activities | Partial | Existing event and announcement data/actions are unified. Active leaders can reach the app actions, but the current remote announcement RLS does not yet permit the leader mutation. |
| People | Partial | Membership and leadership are kept separate and the UI/actions are present. Some connected RLS policies are narrower than the application capability matrix, especially non-admin membership mutations. |
| Leadership | Partial | Canonical active, date-bounded `department_leadership_assignments` now drives scoped access. Full leader-assignment administration remains governed by existing church-wide tools and policies. |
| Budget | Complete with policy limits | Existing funds, balances, expenses, requests, and treasury approval separation were preserved. Leaders cannot approve their own requests through this module. |
| Documents | Safely unavailable | No `department_documents` table and no reusable private Storage bucket exist. The tab states this honestly and the upload control is disabled. No unsafe public bucket or inert upload flow was added. |
| Events | Complete with RLS limits | Existing event creation/update/approval flows are reused and exact church/department checks are enforced. |
| Announcements | Partial | Read and unified activity display are present; leader writes require a future RLS migration. |
| Onboarding interests | Complete in code/data | Active departments are returned only for the validated church; submitted IDs are filtered to active IDs from the same church; interests grant no role. A live valid-key browser submission was not run because the current plaintext registration key is intentionally not recoverable. |
| Member Portal visibility | Partial | Existing membership assignments and duties use the shared department model. Complete aggregation of all published ministry events/announcements is not yet implemented. |
| Department permissions | Complete at application boundary | A centralized capability helper validates church, department, role, active canonical leadership assignment, and assignment dates. |
| RLS and tenant isolation | Partial / security blocker | Target ministry tables have RLS and the authenticated leader isolation journey passed. Twelve other public-schema tables in the connected project still have RLS disabled and require a reviewed migration. |

## Existing architecture preserved

- Unified Departments route and tab model.
- Legacy detail routes and existing server/query contracts.
- `church_departments`, `member_departments`, `department_leadership_assignments`, `church_events`, `department_announcements`, `church_assignments`, `department_fund_requests`, and `treasury_funds` data models.
- Existing treasury approval and department-fund provision behavior.
- Existing public registration-key validation and admin-review onboarding flow.
- Existing member portal membership/duty model.
- Existing forest-green, warm-cream, shadcn/Radix, Lucide, and application-shell design language.

## Connected schema findings

### Available and used

- `church_departments`
- `member_departments`
- `department_leadership_assignments`
- `department_leadership_requests`
- `department_announcements`
- `church_events`
- `church_event_departments`
- `church_assignments`
- `department_fund_requests`
- `treasury_funds`
- `church_member_registration_settings`
- `church_member_registrations.department_interest_ids`

### Not available

- No `department_documents` metadata relation.
- No existing Supabase Storage bucket that can safely be reused for private department documents.
- No Supabase development branch was available for safely applying a larger documents/RLS migration.

## Data audit and sample seed

Before setup, the sample church had zero department records and no duplicate/conflicting department dependencies. The twelve required records were inserted in one exact-church, idempotent operation and verified afterward. A database normalization trigger stores the codes in lowercase, while the reusable application catalog retains the requested canonical uppercase codes.

| Ministry | Canonical code |
| --- | --- |
| Sabbath School | `SABBATH_SCHOOL` |
| Children’s Ministries | `CHILDRENS_MINISTRIES` |
| Adventist Youth Ministries | `ADVENTIST_YOUTH` |
| Personal Ministries and Evangelism | `PERSONAL_MINISTRIES` |
| Deacon and Deaconess Ministry | `DEACON_DEACONESS` |
| Media and Communications | `MEDIA_COMMUNICATIONS` |
| Music Ministry | `MUSIC_MINISTRY` |
| Health Ministries | `HEALTH_MINISTRIES` |
| Family Ministries | `FAMILY_MINISTRIES` |
| Community Services | `COMMUNITY_SERVICES` |
| Women’s Ministries | `WOMENS_MINISTRIES` |
| Education Ministry | `EDUCATION_MINISTRY` |

Final live counts for the sample church:

- 12 active departments.
- 12 active linked department funds.
- Registration enabled.
- Ministry-interest collection enabled.
- Admin review required.
- Zero temporary Codex authentication users and zero temporary Codex members after verification cleanup.

## Authorization audit

The application authorization boundary now uses `requireDepartmentAccess(churchSlug, departmentId, capability)` and checks:

1. Authenticated church membership.
2. The department belongs to the resolved church.
3. Church-wide role capability, platform role, or canonical leadership assignment.
4. Canonical leadership assignment is active and within its start/end date window.
5. The requested operation is scoped to the exact department.

Editable role-title strings are no longer treated as authorization evidence.

Automated capability tests cover ordinary member, active scoped leader, church-wide role matrix, and platform administrator. The browser journey additionally confirmed an active leader receives HTTP 200 for their own department workspace API and HTTP 403 for another department.

## RLS and security findings

The connected Supabase security advisor currently reports 134 notices, including these high-priority existing issues:

- 12 public-schema tables with RLS disabled: `church_permission_assignments`, `permission_definitions`, `access_control_audit_logs`, `treasury_finance_settings`, `member_onboarding_invites`, `treasury_allocation_rules`, `treasury_inflow_allocations`, `treasury_entry_categories`, `approval_requests`, `approval_steps`, `approval_policies`, and `approval_audit_logs`. See [Supabase RLS-disabled remediation](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public).
- Two security-definer views: `v_church_role_assignments_expanded` and `v_treasury_allocation_summary`. See [Supabase security-definer view remediation](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view).
- 39 functions with mutable `search_path`, including `create_church_with_owner`. See [Supabase function search-path remediation](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).
- Leaked-password protection is not enabled. See [Supabase password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

The two public registration RPCs inspected for this work use a constrained `search_path`, validate the registration key/church, and filter submitted ministry IDs to active departments belonging to that church. No RLS policy was weakened and no service-role credential was placed in client code.

The disabled-RLS findings were not changed automatically because enabling RLS without complete policies can break production workflows, and there was no confirmed backup/development branch for testing the required migration.

## Browser and responsive audit

Authenticated browser verification used normal login sessions; the service role was used only to create and remove synthetic fixtures.

- Administrator opened the shared Departments route.
- All twelve selected ministry workspaces opened independently.
- Overview, Action Plan, Activities, People, Budget, and Documents tabs activated.
- Active leader: own department API `200`; other department API `403`; other department route redirected.
- Ordinary member: administration route redirected to the Member Portal.
- Public no-key registration page rendered the live tenant name dynamically.
- Viewports `1440`, `1366`, `1024`, `768`, and `390` had no page-level horizontal overflow.
- Temporary users/members were removed in `finally` cleanup and verified absent from the database.

Artifacts are in `artifacts/ministry-workspace/`, including `verification.json` and responsive screenshots.

## Remaining work and release risk

1. Treat the twelve disabled-RLS public tables as a security blocker for a broader production launch. Write and test policies on a branch/backup before enabling RLS.
2. Align remote RLS policies with the application matrix for active leader announcements and any intended clerk/member-assignment mutations.
3. Run the full public onboarding wizard with a newly issued valid registration link; the existing key hash cannot reveal the plaintext key and was not rotated during this task.
4. Complete published department event/announcement aggregation in the Member Portal.
5. Implement private department documents only with a reviewed metadata/storage migration.
6. Consolidate duplicate indexes and permissive policies reported by the performance advisor in a separate, tested database-maintenance change.
