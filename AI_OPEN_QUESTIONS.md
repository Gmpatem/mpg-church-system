# AI_OPEN_QUESTIONS.md
> Fragile areas, known gaps, and open questions about the codebase.

---

## 1. RPC Implementations Are External and Opaque

**Problem:** All 5 RPC functions (`create_church_with_owner`, `complete_member_onboarding`, `complete_member_onboarding_from_invite`, `complete_open_member_onboarding_from_invite`, `complete_first_login_security`) live in the Supabase project with no SQL in this repo.

**Risk:** Any schema or behavior change in the RPC breaks the app silently. The code has strict post-claim verification (checking `status`, `claimed_at`, `claimed_by_user_id`) precisely because RPC failure modes are invisible.

**Open question:** Does `complete_member_onboarding_from_invite` correctly NOT set `portal_joined_at`? The code comments say it must not — but the implementation is unverifiable from this repo.

---

## 2. `database.ts` Type File Is Incomplete and Partially Stale

**Problem:** `src/types/database.ts` only types 8 tables: `churches`, `profiles`, `church_users`, `role_definitions`, `church_role_assignments`, `church_departments`, `members`, `member_departments`, `member_status_history`, `households`. 

Tables queried in code but NOT typed here:
- `member_onboarding_invites`
- `church_access_requests`
- `department_leadership_requests`
- `platform_role_assignments`
- `church_permission_assignments`
- `permission_definitions`
- `church_notifications`
- `treasury_funds`, `treasury_inflows`, `treasury_outflows`
- `events`, `announcements`, `department_announcements`

**Also stale:** The typed `member_departments` row is missing `church_id`, `department_id`, `is_active`, `start_date` — columns that are actively written in `syncMemberDepartments`. Any code relying on the typed shape of this table will have type mismatches.

**Risk:** TypeScript can't catch errors on untyped tables — all queries on untyped tables use implicit `any`.

---

## 3. Open Invite Email Deduplication Edge Case

**Problem:** In `createOpenOnboardingInviteAction`, the deduplication query filters by `email = cleanedEmail`. If `cleanedEmail` is null (invite created without an email), the `eq("email", null)` clause doesn't match NULL rows in SQL — Postgres uses `IS NULL` for null equality.

**Risk:** Multiple null-email open invites could be created for the same church without triggering deduplication. The code notes `if (existingError && cleanedEmail)` — it silently skips the error when email is null, masking potential issues.

---

## 4. `must_change_password` Is on `profiles`, Not `database.ts`

**Problem:** The `profiles` table type in `database.ts` does not include the `must_change_password` column. It is queried explicitly in `src/features/access/queries.ts` (line 12: `must_change_password: boolean | null`) via a typed `ProfileRow` local type.

**Risk:** If someone regenerates `database.ts` from the Supabase type generator, they may overwrite the profiles type and lose visibility of this column. It's also easy to miss that `profiles.must_change_password` is the gate for the entire password-change flow.

---

## 5. `member_departments` Denormalization Must Stay in Sync

**Problem:** `member_departments.department_name` is a denormalized copy written at insert time. If a department is renamed in `church_departments`, existing `member_departments` rows will have stale names.

**Open question:** Is there a DB trigger or any code path that updates denormalized department names on rename? There is no evidence of this in the frontend code.

---

## 6. Invite Claim Race Condition

**Problem:** The invite claim flow does:
1. `supabase.auth.signUp()` — creates auth account
2. RPC `complete_member_onboarding_from_invite(...)` — marks invite claimed

If step 1 succeeds but step 2 fails (RPC error), a Supabase auth account now exists with no corresponding `church_users` or `members` linkage. The user will have an auth account but no valid portal access.

**There is no rollback or cleanup for orphaned auth accounts.** The user would need to contact support or re-register.

---

## 7. Post-Claim Redirect Path for Email-Confirmation Flow

**Problem:** When Supabase requires email confirmation (i.e., `signUpData.session` is null), the invite claim redirects to `/login?registered=1&church=[slug]`. After the user confirms their email and logs in, `resolvePostAuthDestination` will route them — but at that point `must_change_password` is still `true` on their profile (set by the RPC?), so they'll hit the password gate.

**Open question:** Does `complete_member_onboarding_from_invite` set `must_change_password = true` on the profiles row? If Supabase email confirmation is enabled in this project, the email-confirmation path needs to be tested end-to-end.

---

## 8. `church_permission_assignments` vs Role-Based Access

**Problem:** Two overlapping systems exist:
- `church_role_assignments` — role-based access (pastor, elder, etc.)
- `church_permission_assignments` — explicit permission grants (`access_control`, etc.)

It's unclear when permissions are granted vs roles, and whether all roles automatically get all permissions or if permissions must be explicitly assigned. The only permission checked in code is `access_control` (for invite management).

---

## 9. Member Portal is Single-Church Only

**Problem:** The member portal route is `/my/[churchSlug]` — a member can belong to multiple churches (multiple `church_users` rows), but the portal only shows one church at a time. There is no UI to switch between churches in the member portal.

**Open question:** Is multi-church member portal support planned? Currently, `resolvePostAuthDestination` picks one "primary" church using `pickPrimaryChurch()` logic.

---

## 10. Treasury `database.ts` Gap

**Problem:** `treasury_funds`, `treasury_inflows`, and `treasury_outflows` tables are not in `database.ts`. The entire treasury feature operates on untyped tables (implicit `any`). Any refactor or schema change will not be caught at compile time.

---

## 11. No Error Boundaries or Loading Fallbacks at Feature Level

**Problem:** While `WorkspaceLoadingShell` exists as a UI skeleton, there are no React error boundaries in the route tree. Server Component errors will bubble to the nearest `error.tsx`. Only the invite page has a dedicated `loading.tsx`. Most workspace routes have no `loading.tsx` or `error.tsx`.

---

## 12. `department` Column on `members` Is Legacy

**Problem:** `members.department` (text?) is a legacy single-value field. The actual department relationship lives in `member_departments` (the many-to-many join table). Code in `syncMemberDepartments` writes to `member_departments`. It's unclear whether `members.department` is still populated anywhere or is purely legacy dead data.
