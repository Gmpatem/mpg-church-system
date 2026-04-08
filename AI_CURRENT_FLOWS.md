# AI_CURRENT_FLOWS.md
> Auth, invite, onboarding, and member flows with precise file paths.

---

## 1. Authentication Flow

### Login

1. User visits `/login` → `src/app/(public)/login/page.tsx`
2. Renders `LoginForm.tsx` (client component) — email + password fields
3. On submit: calls `loginAction` in `src/features/auth/actions.ts`
4. `loginAction` calls `supabase.auth.signInWithPassword()`
5. On success: calls `getPostLoginDestination(userId)` → `resolvePostAuthDestination()` in `src/features/access/queries.ts`
6. Redirect logic (in priority order):
   - Has platform role → `/platform`
   - Has operational access to a church → `/c/[churchSlug]`
   - Has member link (profile_id on members row) → `/my/[churchSlug]?tab=overview`
   - Has church membership but no member link → `/join/[churchSlug]`
   - No church at all → `/create-church`
7. Optional `?redirect=` query param is honored if it starts with `/` (SSRF-safe check)

### Register

1. User visits `/register` → `src/app/(public)/register/page.tsx`
2. `RegisterForm.tsx` — full_name + email + password
3. Calls `registerAction` in `src/features/auth/actions.ts`
4. Calls `supabase.auth.signUp()` with `full_name` in user_metadata
5. If session returned → redirect to post-login destination
6. If email confirmation required → redirect to `/login?registered=1&check_email=1`

### Logout

- `logoutAction` in `src/features/auth/actions.ts` → `supabase.auth.signOut()` → redirect `/login`
- Member portal has `signOutMemberPortalAction` in `src/features/member-portal/actions.ts` (same behavior)

---

## 2. Access Guard System

All server-side route access is controlled by functions in `src/features/access/queries.ts`.

### Key guards (all server-only, `import "server-only"`)

| Function | What it does | On failure |
|---|---|---|
| `requireUser()` | Checks Supabase auth session | Redirects `/login` |
| `requireChurchAccess(slug)` | Verifies church exists + user has membership (or is platform admin) | Redirects `/create-church` |
| `requireChurchWorkspaceAccess(slug)` | Requires operational access or platform admin | Redirects `/my/[slug]` or `/join/[slug]` |
| `requireMemberPortalAccess(slug)` | Requires `hasMemberLink` (members row with profile_id) | Redirects to workspace or `/join/[slug]` |
| `requireChurchRole(slug, roles[])` | Requires specific role codes within workspace | Redirects to dashboard |
| `requirePlatformAdmin()` | Platform role check | Redirects `/` |

### `getUserAccessState(userId)` — the central aggregator

Cached with React `cache()` per request. Parallel-fetches:
- `profiles` row
- `platform_role_assignments` rows
- `church_users` rows (active memberships, with church join)
- `church_role_assignments` rows (active roles, with role_definitions join)
- `members` rows (linked member records via `profile_id`)

Returns `UserAccessState` with per-church `hasOperationalAccess` and `hasMemberLink` flags.

### `ChurchAccessContext` (returned by all `require*` guards)

```ts
{
  userId, churchId, churchSlug, churchName,
  profile: { full_name, email, preferred_language, must_change_password },
  roles: string[],           // merged platform + church role codes
  isPlatformAdmin: boolean,
  hasOperationalAccess: boolean,
  hasMemberLink: boolean,
}
```

---

## 3. Invite Flow (Staff → Member)

Used when a staff member invites an existing member or creates an open onboarding invite.

### 3a. Invite for existing member

1. Staff visits `/c/[slug]/access-control`
2. Selects a member → triggers `createMemberInviteAction(churchSlug, memberId)` in `src/features/member-invite/actions.ts`
3. Permission check: `canCurrentUserManageMemberInvites(churchSlug)` — requires `access_control` permission
4. Checks `getMemberInviteContext()` for existing pending invite (reuses it if found)
5. If no existing invite:
   - Generates 48-char hex token via `crypto.randomBytes(24)`
   - Inserts into `member_onboarding_invites` with `invite_type: "member"`, `status: "pending"`, 14-day expiry
   - Sets `members.portal_invited_at = now()`
6. Returns invite URL: `/invite/[token]`

### 3b. Open onboarding invite (no pre-existing member)

- `createOpenOnboardingInviteAction(churchSlug, email?, note?)` in `src/features/member-invite/actions.ts`
- Checks for existing pending `church_open` invite for same email (reuses if found)
- Inserts with `invite_type: "church_open"`, `member_id: null`
- Does NOT set `portal_invited_at` (no member row yet)

### 3c. Revoke invite

- `revokeMemberInviteAction(churchSlug, inviteId)` 
- Only `pending` invites can be revoked
- Sets `status: "revoked"`, `revoked_at: now()`

---

## 4. Invite Claim / Rich Onboarding Flow

When the invited person opens `/invite/[token]`:

1. Page: `src/app/(public)/invite/[token]/page.tsx`
2. Loads `getRichSecureInvitePageData(token)` → resolves church name, member prefill, invite status, departments, role options
3. Renders `RichInviteOnboardingForm` (`src/features/member-invite/components/RichInviteOnboardingForm.tsx`) — client form with:
   - Personal info fields (firstName, lastName, email, phone)
   - Extended fields (DOB, gender, address, marital status, baptism date, membership type)
   - Department selections (checkboxes — each can optionally mark as leader + title)
   - Role/access request selector
   - Password + confirm password
   - Access acknowledgement checkbox (required)

4. On submit: `completeRichInviteOnboardingAction` in `src/features/member-invite/actions.ts`
   - Validates token, checks status (not claimed, not revoked, not expired)
   - Calls `supabase.auth.signUp()` to create auth account
   - **Branch A — existing member invite** (`memberId` present):
     - Calls RPC `complete_member_onboarding_from_invite(p_user_id, p_token, p_first_name, p_last_name, p_email, p_phone)`
     - RPC marks invite as `claimed`, sets `claimed_at` + `claimed_by_user_id`, links `church_users`
     - Calls `enrichMemberRecord()` — updates extended member fields (NOT `portal_joined_at`)
   - **Branch B — open onboarding** (`memberId` null):
     - Calls RPC `complete_open_member_onboarding_from_invite(...)` — creates new `members` row
     - Returns `{ church_id, member_id, church_slug }`
   - After RPC: calls `ensureChurchUserLinked()` — upserts `church_users` row
   - Calls `syncMemberDepartments()` + `fillDepartmentNames()` for selected departments
   - Calls `maybeCreateChurchAccessRequest()` — inserts into `church_access_requests` if role requested
   - Calls `maybeCreateDepartmentLeadershipRequests()` — inserts into `department_leadership_requests` for leader selections
   - Verifies invite has `status: "claimed"`, `claimed_at`, `claimed_by_user_id` (fails if RPC didn't set these)
   - If session available → redirect `/my/[slug]?tab=overview&onboarding=1`
   - If email confirmation pending → redirect `/login?registered=1&church=[slug]`

---

## 5. Public Self-Join Flow (no invite)

1. User visits `/join/[churchSlug]` → `src/app/(public)/join/[churchSlug]/page.tsx`
2. Renders `MemberJoinForm.tsx` (client component) — firstName, lastName, email, phone, memberCode, password
3. On submit: `completeMemberOnboardingAction` in `src/features/member-onboarding/actions.ts`
4. Calls `supabase.auth.signUp()`
5. Calls RPC `complete_member_onboarding(p_user_id, p_church_slug, p_first_name, p_last_name, p_email, p_phone, p_member_code)`
   - RPC creates/links member record, creates `church_users` row
   - Does NOT set `portal_joined_at`
6. Redirect to `/my/[slug]?tab=overview` (if session) or `/login?registered=1&church=[slug]`

---

## 6. First-Login Password Gate

After any onboarding flow, the member portal checks `must_change_password` flag.

1. Member lands on `/my/[churchSlug]`
2. `requireMemberPortalAccess(slug)` guards the page
3. Page checks `ctx.profile.must_change_password`
4. If `true` → renders `FirstLoginPasswordGate` component (`src/features/member-portal/components/FirstLoginPasswordGate.tsx`) instead of normal portal content
5. User enters new password → calls `completeFirstLoginPasswordChangeAction({ churchSlug, password })` in `src/features/member-portal/actions.ts`
   - `supabase.auth.updateUser({ password })` — sets new password in auth
   - RPC `complete_first_login_security(p_user_id)` — clears `must_change_password` in `profiles`
   - Updates `members.portal_joined_at = now()` WHERE `profile_id = user.id AND portal_joined_at IS NULL`
   - Returns `{ ok: true }`
6. Portal refreshes — `must_change_password` is now false, password gate is gone

**Critical lifecycle rule:** `portal_joined_at` is ONLY set here, never in the onboarding RPCs. The RPCs explicitly must NOT set it.

---

## 7. Church Creation Flow

1. User visits `/create-church` → `src/app/(public)/create-church/page.tsx`
2. Form: church name, slug, timezone, language, country, city, address, phone, email
3. Calls `createChurchAction` in `src/features/churches/actions.ts`
4. Calls RPC `create_church_with_owner(...)` — creates `churches` row + assigns creator as `church_admin` in `church_role_assignments` + creates `church_users` row
5. Redirects to `/c/[slug]/dashboard`

---

## 8. Member Lifecycle (Staff-side)

All in `src/features/members/actions.ts`:

- `createMemberAction` — inserts into `members`, optionally assigns departments
- `updateMemberAction` — updates member fields
- `changeMemberStatusAction` — changes `membership_status`, inserts into `member_status_history`
- `transferMemberAction` — handles inter-church transfers (sets `transfer_out_date` / `transfer_in_date`)
