# MPG Church System — Church Presentation Demo Runbook

**Status:** **BLOCKED — rehearsal-only until the readiness report's security gates pass**  
**Date prepared:** 14 August 2026

## Purpose

This runbook defines the intended presentation flow without encouraging a live pilot against an unsafe data boundary. Do not invite church staff or members to use the connected environment yet. Do not demonstrate real personal data.

## Hard stop before presentation

The connected Supabase project currently exposes sensitive permission, approval, invitation, and audit rows to anonymous API access. RLS and grant remediation, the unsafe owner-creation function fix, migration/type reconciliation, and a clean retest are mandatory before this becomes an executable live-demo runbook.

Until then, the only acceptable rehearsal is a local, non-public walkthrough using synthetic data, with no mutations against the connected project. Do not use the omitted PowerPoint as a substitute for disclosing this blocker.

## Required go-live evidence

The presenter must have a signed-off test record showing:

- Anonymous requests receive denial/empty results for every tenant-sensitive table and RPC.
- Two-church test identities cannot read or change each other's members, invitations, registrations, roles, permissions, approvals, or audit logs.
- An ordinary Member cannot grant a role/permission or invoke a privileged database function.
- Registration approval is idempotent and cannot create duplicate members.
- Account linking and the documented deletion/retention workflow both pass.
- Desktop widths 1440, 1366, and 1024 and responsive widths 768 and 390 pass without page-level overflow.
- Lint, typecheck, automated tests, and production build pass from a clean checkout.

## Safe demo data and identities

Create these only in an isolated demo project after the security fixes:

- `Demo Church Alpha` and `Demo Church Beta` to prove tenant isolation.
- One Church Admin for Alpha.
- One ordinary Member for Alpha.
- One Church Admin for Beta for cross-tenant negative checks.
- One unclaimed synthetic individual registration.
- One unclaimed synthetic household registration with two fictional household members.
- One already-approved synthetic registration for duplicate/idempotency checks.

Use clearly fictional names and non-deliverable example addresses. Never reuse production email addresses, phone numbers, registration keys, or browser sessions.

## Preflight — 30 minutes before

1. Confirm the environment banner identifies the isolated demo project.
2. Confirm no production/project secrets appear in browser history, terminal panes, slides, or bookmarks.
3. Run the approved smoke-test suite and save its timestamped result.
4. Open separate browser profiles for Church Admin and ordinary Member.
5. Verify both church slugs and the demo registration link.
6. Verify the registration key is embedded only in the private demo link and is never displayed separately.
7. Clear prior demo records or restore the approved demo snapshot using the documented recoverable procedure.
8. Confirm the fallback static screenshots contain synthetic data only.

If any preflight item fails, switch to the source/design walkthrough and state that the live workflow is unavailable; do not improvise against the connected project.

## Intended presentation sequence after sign-off

### 1. Set context — 2 minutes

Explain that the system is multi-tenant: each church has its own workspace, membership, roles, and member portal. State that authorization is enforced both by the application and database RLS.

Evidence to show: the post-fix security test summary, not raw database credentials or policies.

### 2. Public registration — 5 minutes

1. Open Alpha's valid private registration link at desktop width.
2. Point out the single in-form branding/Welcome area.
3. Point out the segmented green/grey progress indicator and “Step 1 of 7” counter; confirm no duplicate orange progress line appears.
4. Complete a synthetic individual registration.
5. Repeat briefly at 390px to show responsive behavior.
6. Open the invalid church URL and missing-key URL to demonstrate safe failure states.

Expected result: one pending registration associated only with Demo Church Alpha; validation and consent errors are clear; no duplicate components or horizontal overflow appear.

### 3. Household registration — 4 minutes

1. Open a fresh Alpha registration link/session.
2. Select the household path.
3. Add two fictional household members.
4. Complete all required consent and identity fields.
5. Submit once, then demonstrate the approved duplicate/idempotency behavior using the prepared case rather than repeatedly clicking Submit.

Expected result: one pending household registration with correct Alpha departments and no duplicate members.

### 4. Admin review and approval — 5 minutes

1. Switch to the Alpha Church Admin browser profile.
2. Open Members → Onboarding.
3. Review the synthetic individual registration.
4. Approve it once.
5. Confirm the member appears in Alpha's member registry and does not appear in Beta.
6. Show the synthetic household registration and explain its review state; avoid consuming it if the remainder of the presentation depends on it.

Expected result: approval is atomic and idempotent; correct member/profile linkage and audit entry are created.

### 5. Roles and access control — 5 minutes

1. Open Access Control → Permissions.
2. Show the available church roles.
3. Assign a low-risk prepared demo role to the synthetic Alpha member.
4. Show the audit entry.
5. Remove the role and show the corresponding audit entry.
6. In the Member profile, attempt to open Access Control and show denial.
7. In the Beta profile, verify the Alpha user/member cannot be found or modified.

Expected result: only authorized Alpha administrators can change Alpha access; member self-promotion and cross-church access are denied at both UI and API layers.

### 6. Member portal — 5 minutes

1. Switch to the ordinary Alpha Member profile.
2. Open the member portal overview.
3. Show profile, ministries/departments, events, and giving areas using synthetic records.
4. Make one approved, reversible profile edit and save.
5. Refresh and confirm persistence.
6. Show that the member cannot access the church operations dashboard or access-control workspace.

Expected result: only the linked member's Alpha data appears; admin-only actions are unavailable and direct-route attempts are rejected.

### 7. Close — 2 minutes

Summarize registration, approval, role governance, member self-service, and tenant isolation. Distinguish demonstrated behavior from planned work. Do not claim security certification; describe the exact test scope and date.

## Presenter hold points

Stop the demo immediately if any of these occurs:

- A real person's data appears.
- A church/user from the wrong tenant appears.
- A Member can see or invoke an admin action.
- Approval creates a duplicate or partial record.
- A direct API check succeeds anonymously on a protected object.
- The registration link exposes a key outside its URL or logs.
- The UI shows a runtime error or repeated fetch failure.

Capture the timestamp, route, role, and sanitized screenshot. Do not retry mutations blindly.

## Recovery and fallback

- Registration unavailable: show sanitized post-fix screenshots and validation test results.
- Approval unavailable: show the prepared pending/approved synthetic states; do not edit the database manually during the meeting.
- Member account unavailable: use the dedicated demo Member profile, never the admin profile as a substitute.
- Network failure: use local static artifacts that contain no real data and clearly label them as a recorded rehearsal.
- Any security anomaly: end the live product segment and present the remediation/test plan.

## Current audit limitations to disclose

As of 14 August 2026, valid keyed registration, live submission, approval/rejection, role mutation, normal-member portal use, account lifecycle, and mobile keyed-form rendering were not executed because this audit was read-only and no dedicated test identities/link were supplied. The current connected project's RLS failure prevents those gaps from being safely closed until remediation.

## Deck status

The tutorial PowerPoint is intentionally absent. Create it only after the readiness report is updated to READY following remediation and full retesting.
