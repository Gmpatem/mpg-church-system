# MPG Church System — Member Registration Readiness Report

**Audit date:** 14 August 2026  
**Scope:** Member registration, approval, roles, authentication/account linking, admin and member portals, tenant isolation, and Supabase security  
**Method:** Read-only source review, local build/static checks, browser smoke tests, and read-only inspection of the configured Supabase project  
**Overall verdict:** **FAIL — NOT READY FOR A CHURCH PRESENTATION OR PILOT**

## Executive summary

The application builds successfully and the inspected admin, registration-error, and role-routing screens render. Source code contains several good controls: church-scoped server queries, management-role guards, registration validation, secure key hashing, and account identity checks.

However, the connected Supabase project has a release-blocking authorization failure. Row Level Security (RLS) is disabled on sensitive authorization, approval, audit, and invitation tables, while `anon` and `authenticated` retain broad table privileges. A read-only REST check using the anonymous application role returned records from three sensitive tables. This means application-layer checks can be bypassed by direct API access.

No presentation deck was created because the requested rule permits it only after a READY verdict.

## Critical release blockers

### CRITICAL-1 — Anonymous disclosure and direct API access to sensitive tables

**Status:** Confirmed FAIL  
**Impact:** Cross-tenant information disclosure and possible unauthorized changes to role/permission, approval, invitation, and audit data. This defeats server-action and UI authorization checks.

RLS was disabled and no policies were present on these pilot-relevant tables:

- `church_permission_assignments`
- `approval_requests`
- `approval_steps`
- `approval_policies`
- `approval_audit_logs`
- `member_onboarding_invites`
- `access_control_audit_logs`

Both `anon` and `authenticated` had broad grants including read and write privileges. Without performing any write, anonymous REST requests returned at least one record from each of:

- `church_permission_assignments`
- `approval_requests`
- `member_onboarding_invites`

**Required fix:**

1. Revoke all unnecessary table privileges from `anon` and `PUBLIC`; grant only the minimum operations required.
2. Enable RLS on every tenant or identity-related table before granting API access.
3. Add explicit church-scoped policies for authenticated users, using trusted membership/role predicates and immutable tenant identifiers.
4. Restrict permission and role mutations to authorized church administrators; ordinary members must never be able to self-elevate.
5. Make audit logs append-only through a trusted server function and restrict their reads to approved roles.
6. Do not expose onboarding-invite rows directly. Resolve/claim opaque invitation tokens through narrowly scoped functions that return only the minimum data.
7. Add automated negative tests proving anonymous access, cross-church reads/writes, and self-promotion are denied.

### CRITICAL-2 — Unsafe church-owner creation function boundary

**Status:** Confirmed FAIL  
**Impact:** The database function can create a church and assign the church-admin role for a caller-supplied user ID. Its execution permissions and identity validation are not safe enough for that authority.

`public.create_church_with_owner(...)` is `SECURITY DEFINER`, accepts a caller-provided `p_user_id`, does not enforce `auth.uid() = p_user_id`, has no fixed safe `search_path`, and was executable by `PUBLIC`/`anon` as well as authenticated roles.

**Required fix:**

1. Revoke execute from `PUBLIC` and `anon`.
2. Prefer removing `p_user_id` and deriving the owner from `auth.uid()`.
3. If the parameter remains, require an authenticated caller and reject unless it equals `auth.uid()` (or a tightly controlled service workflow is used).
4. Set an explicit safe `search_path`, schema-qualify referenced objects, and make grants intentional.
5. Add tests proving anonymous invocation, arbitrary-user assignment, and role escalation fail.

### HIGH-1 — Security-definer views

Supabase security advisors reported `security_definer_view` errors for:

- `public.v_church_role_assignments_expanded`
- `public.v_treasury_allocation_summary`

Change these to security-invoker behavior or replace them with a narrowly authorized interface. See [Supabase lint 0010 guidance](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view).

### HIGH-2 — Database migration and generated-type drift

The local migration directory contains only recent attendance/ministry migrations and does not represent the connected project's registration, approval, invitation, or access-control schema. Generated TypeScript types also do not cover all observed live objects/RPCs, including onboarding and registration functions.

**Required fix:** Establish an authoritative, reviewable migration baseline; capture all RLS policies, grants, functions, and triggers; regenerate database types from the target project; then verify a clean environment can be built from migrations alone.

## Technical checks

| Check | Result | Evidence / limitation |
|---|---|---|
| Working tree safety | PASS | Existing modified and backup files were identified and left unchanged. |
| Dependency installation state | PARTIAL | `npm ls --all --depth=0` completed, but reported an extraneous `@emnapi/runtime` package. |
| Lint | PASS | `npm run lint` completed successfully. |
| TypeScript | PASS | `npx tsc --noEmit --incremental false` completed successfully. |
| Production build | PASS | `npm run build` completed successfully on Next.js 16.2.2. |
| Automated tests | NOT TESTED | No project test script is defined. This is a readiness gap. |
| Local server | PASS | Existing development server returned HTTP 200 for `/login`. |
| Service-role exposure | PASS (source review) | Admin client is server-only; browser client uses the public anonymous key. No browser service-role use was found. |
| Live schema reproducibility | FAIL | Critical connected-project objects and policies are not represented locally. |

## Functional readiness matrix

### A. Public member registration

| Scenario | Result | Evidence / limitation |
|---|---|---|
| Missing registration key | PASS | Safe “registration link incomplete” state rendered; no secret was disclosed. |
| Invalid church slug | PASS | Safe 404 rendered without a runtime error. |
| Valid keyed form, desktop/mobile | NOT TESTED | A valid secure registration link was not available and secrets were intentionally not retrieved. |
| Individual submission | NOT TESTED | Audit was read-only; no records were created. |
| Household submission | NOT TESTED | Audit was read-only; no records were created. |
| Required fields, consent, key verification | PARTIAL | Verified in server/RPC source, not by live submission. |
| Duplicate handling | PARTIAL | Church-scoped duplicate checks exist in source/RPC; no mutation test was performed. |
| Correct church/department association | PARTIAL | Source validates church and scopes department interests; not confirmed by live write. |
| Duplicate header/progress-bar removal | PARTIAL | Code inspection shows the wizard does not render the duplicate header and the progress component retains segmented progress plus step count; valid keyed rendering was unavailable. |

### B. Admin review and approval

| Scenario | Result | Evidence / limitation |
|---|---|---|
| Church Admin opens onboarding workspace | PASS | Authenticated admin session loaded `/members?view=onboarding`; registration content rendered without a runtime error. |
| Registration conversion is church-scoped | PASS (source review) | Management role is required; member/profile lookups and writes use the current church context. |
| Approve/reject mutations | NOT TESTED | Read-only audit; no member or approval state was changed. |
| Idempotency/duplicate prevention | PARTIAL | Source checks existing church/profile linkage; concurrency behavior lacks an executed test. |

### C. Authentication and account linking

| Scenario | Result | Evidence / limitation |
|---|---|---|
| Existing authenticated admin session | PASS | Protected church workspace loaded successfully. |
| Registration with account | PASS (source review) | Function is authenticated-only, validates `auth.uid()`, matches account identity, and blocks cross-church duplicate account registration. |
| Sign-up, sign-in, callback, reset, sign-out | NOT TESTED | No supplied test identities; the audit did not create or alter auth users. |
| Existing profile/member linking | PARTIAL | `members.profile_id` uses `ON DELETE SET NULL`; linkage logic exists, but a live lifecycle was not executed. |
| Account deletion | FAIL / NOT SAFE TO CLAIM | Multiple actor/reviewer foreign keys use `NO ACTION`, so deletion may fail or require an explicit retention/anonymization workflow. |

### D. Roles, access control, and tenant isolation

| Scenario | Result | Evidence / limitation |
|---|---|---|
| Access Control page for Church Admin | PASS | Page loaded with Permissions, Invites, and Requests areas. |
| Role catalogue in UI | PASS | UI matched live role definitions: Church Admin, Church Clerk, Deacon, Deaconess, Elder, Member, Pastor, Small Group Leader, and Treasurer. |
| Assign/revoke role or permission | NOT TESTED | Read-only audit; source actions require management access and current-church membership. |
| Direct database protection | **FAIL** | Sensitive permission/approval/invite tables are accessible anonymously with RLS disabled. |
| Cross-church isolation | **FAIL** | Cannot be certified while anonymous table access bypasses tenant checks. |
| Auditability | **FAIL** | Audit tables themselves lack RLS protection; trustworthy audit history cannot be claimed. |

### E. Member portal

| Scenario | Result | Evidence / limitation |
|---|---|---|
| Admin attempts member route | PASS | Church Admin was redirected to the church dashboard, as intended for operational admins. |
| Linked member overview/profile | NOT TESTED | No supplied normal-member session. |
| Member ministries/departments/events/giving | PARTIAL | Source queries are church/member scoped, but the user journey was not exercised. |
| Edit profile/account linkage | NOT TESTED | Read-only audit. |

## Database and security observations

- Registration RPCs use a fixed `public, pg_temp` search path and include church/key/consent validation; the account variant verifies the authenticated user. These are positive controls.
- Tenant-validation and lifecycle triggers exist for members and invitations, but triggers do not replace RLS.
- `church_role_assignments` has RLS and policies; the separate permission-assignment and approval surfaces do not, creating an inconsistent security model.
- Supabase advisors also reported many functions with mutable `search_path`. Review and fix all exposed definer functions; see [Supabase lint 0011 guidance](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).
- Aggregate inspection found live pilot data in churches, registrations, members, users, role assignments, and invitations. No personally identifying values were copied into this report.

## Go/no-go decision

**NO-GO.** Do not connect church staff, prospective members, or a public presentation audience to this Supabase project until CRITICAL-1 and CRITICAL-2 are remediated and independently retested.

Minimum exit criteria:

1. Critical RLS/grant/function issues fixed through reviewed migrations.
2. Anonymous and cross-tenant negative tests pass for every pilot table/RPC.
3. Fresh generated database types and reproducible migrations are committed.
4. Automated tests cover registration, approval idempotency, role escalation denial, member linking, and deletion/retention behavior.
5. Full browser journeys pass with isolated demo identities for Church Admin and ordinary Member at desktop and mobile widths.
6. A clean `lint`, typecheck, test, and production build passes after the fixes.

## Artifacts deliberately not produced

`MPG_Church_System_Admin_and_Member_Portal_Tutorial.pptx` was **not created** because the system is not READY, as required by the audit brief.
