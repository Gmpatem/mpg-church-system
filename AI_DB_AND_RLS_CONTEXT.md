# AI_DB_AND_RLS_CONTEXT.md
> Tables, relationships, RLS model, lifecycle columns, and RPC functions.

---

## Overview

The database lives in a hosted Supabase project (`wnitkyyodymmjedlttex.supabase.co`). **No migration files exist in this repo.** The TypeScript schema in `src/types/database.ts` is the authoritative source for column shapes. Additional tables and columns that appear in query code but are not in `database.ts` are noted where known.

---

## Core Tables

### `churches`
The tenant root. One row per church.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `slug` | text UNIQUE | Used in all URLs |
| `default_language` | text | `"en"` or `"fr"` |
| `timezone` | text | |
| `country`, `city`, `address` | text? | |
| `phone`, `email` | text? | |
| `logo_url` | text? | Supabase storage URL |
| `is_active` | boolean | Soft-disable a church |
| `created_by_user_id` | uuid FK→auth.users | |
| `created_at`, `updated_at` | timestamptz | |

---

### `profiles`
Mirrors `auth.users`. One row per authenticated user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK FK→auth.users | |
| `full_name` | text? | |
| `email` | text? | |
| `phone` | text? | |
| `preferred_language` | text | `"en"` or `"fr"` |
| `avatar_url` | text? | |
| `must_change_password` | boolean | Set `true` on invite-created accounts. Cleared by `complete_first_login_security` RPC. |
| `created_at`, `updated_at` | timestamptz | |

---

### `church_users`
Join table: user ↔ church membership.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `church_id` | uuid FK→churches | |
| `user_id` | uuid FK→auth.users | |
| `status` | text | `"active"` \| inactive |
| `is_primary` | boolean | Primary church for this user |
| `joined_at` | timestamptz | |
| `created_at`, `updated_at` | timestamptz | |

RLS: users can only see rows where `user_id = auth.uid()`.

---

### `members`
The full member record. **Separate from auth.** A member row can exist before any auth account.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `church_id` | uuid FK→churches | Tenant scope |
| `first_name`, `last_name` | text | |
| `display_name` | text? | Computed: `first_name + last_name` |
| `email`, `phone` | text? | |
| `date_of_birth` | date? | |
| `gender` | text? | |
| `address`, `city`, `country` | text? | |
| `marital_status` | text? | |
| `baptism_date` | date? | |
| `membership_status` | text | `"active"`, `"inactive"`, `"transferred"`, `"deceased"`, etc. |
| `membership_type` | text | `"regular"`, etc. |
| `member_code` | text? | Church-assigned code |
| `date_joined` | date? | When they joined the church |
| `transfer_in_date`, `transfer_out_date` | date? | Transfer tracking |
| `deceased_date` | date? | |
| `household_id` | uuid FK→households? | |
| `previous_church` | text? | |
| `profession` | text? | |
| `emergency_contact_name`, `emergency_contact_phone` | text? | |
| `notes` | text? | |
| `department` | text? | Legacy single-department field |
| `profile_id` | uuid FK→auth.users? | Set when member has claimed their portal account |
| `portal_invited_at` | timestamptz? | Set when invite is created (`createMemberInviteAction`) |
| `portal_joined_at` | timestamptz? | Set ONLY after first-login password change completes |
| `created_by_user_id` | uuid? | |
| `created_at`, `updated_at` | timestamptz | |

**Lifecycle rule for portal columns:**
- `portal_invited_at`: set in `createMemberInviteAction` (invite creation step)
- `portal_joined_at`: set ONLY in `completeFirstLoginPasswordChangeAction` (post-password-change step)
- RPCs must NOT set `portal_joined_at` — this is enforced in code comments

---

### `households`
Family/household groupings within a church.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `church_id` | uuid FK→churches | |
| `household_name` | text | |
| `address`, `city`, `country` | text? | |
| `phone`, `email` | text? | |
| `head_of_household_id` | uuid FK→members? | |
| `notes` | text? | |
| `created_by_user_id` | uuid? | |
| `created_at`, `updated_at` | timestamptz | |

---

### `church_departments`
Departments within a church (choir, youth, etc.)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `church_id` | uuid FK→churches | |
| `department_name` | text | |
| `description` | text? | |
| `is_active` | boolean | |
| `created_at` | timestamptz | |

---

### `member_departments`
Member ↔ department assignments. Denormalized `department_name` is written at insert time.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `member_id` | uuid FK→members | |
| `church_id` | uuid FK→churches | |
| `department_id` | uuid FK→church_departments | |
| `department_name` | text | Denormalized copy |
| `role_in_department` | text? | |
| `is_active` | boolean | |
| `start_date` | date? | |
| `joined_date` | date? | |
| `created_at` | timestamptz | |

**Note:** The `database.ts` type for this table is outdated (missing `church_id`, `department_id`, `is_active`, `start_date`). The actual table has more columns as used in `syncMemberDepartments`.

---

### `member_status_history`
Audit trail of `membership_status` changes.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `church_id` | uuid FK→churches | |
| `member_id` | uuid FK→members | |
| `old_status` | text? | |
| `new_status` | text | |
| `reason` | text? | |
| `changed_by_user_id` | uuid FK→auth.users | |
| `created_at` | timestamptz | |

---

### `role_definitions`
Lookup table for all role codes in the system.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE | e.g. `"church_admin"`, `"pastor"` |
| `name` | text | Display name |
| `description` | text? | |
| `is_system` | boolean | |
| `created_at` | timestamptz | |

---

### `church_role_assignments`
User ↔ church role assignments.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `church_id` | uuid FK→churches | |
| `user_id` | uuid FK→auth.users | |
| `role_id` | uuid FK→role_definitions | |
| `start_date`, `end_date` | date? | |
| `is_active` | boolean | Filter active roles |
| `assigned_by_user_id` | uuid? | |
| `notes` | text? | |
| `created_at`, `updated_at` | timestamptz | |

---

### `platform_role_assignments`
Platform-level role assignments (not scoped to a church).

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid FK→auth.users | |
| `role_code` | text | `"platform_owner"`, `"platform_admin"`, `"platform_support"` |

---

### `member_onboarding_invites`
Secure invite tokens.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `church_id` | uuid FK→churches | |
| `member_id` | uuid FK→members? | NULL for open invites |
| `email` | text? | Pre-filled email hint |
| `token` | text UNIQUE | 48-char hex, URL-safe |
| `invite_type` | text | `"member"` or `"church_open"` |
| `status` | text | `"pending"` \| `"claimed"` \| `"revoked"` |
| `expires_at` | timestamptz | 14 days from creation |
| `claimed_at` | timestamptz? | Set by RPC on claim |
| `claimed_by_user_id` | uuid? | Set by RPC on claim |
| `revoked_at` | timestamptz? | Set on revoke |
| `created_by_user_id` | uuid | Staff who created the invite |
| `note` | text? | Optional note for open invites |
| `metadata` | jsonb? | e.g. `{ mode, created_from }` |
| `created_at`, `updated_at` | timestamptz | |

**Lifecycle states:**
- `pending` → invite is valid and can be claimed
- `claimed` → claimed; `claimed_at` + `claimed_by_user_id` must both be set (enforced in code)
- `revoked` → staff cancelled; `revoked_at` set

---

### `church_access_requests`
Leadership access requests created during onboarding.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `church_id` | uuid FK→churches | |
| `invite_id` | uuid FK→member_onboarding_invites | |
| `user_id` | uuid FK→auth.users | |
| `member_id` | uuid FK→members | |
| `requested_role_code` | text? | Null if "other" or "regular_member" |
| `requested_role_name` | text | Human-readable role name |
| `status` | text | `"pending"` \| `"approved"` \| `"rejected"` |
| `source` | text | `"invite_onboarding"` |
| `created_at` | timestamptz | |

---

### `department_leadership_requests`
Department leader requests created during onboarding.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `church_id` | uuid FK→churches | |
| `invite_id` | uuid FK→member_onboarding_invites | |
| `user_id` | uuid FK→auth.users | |
| `member_id` | uuid FK→members | |
| `department_id` | uuid FK→church_departments | |
| `requested_role_name` | text | User-provided title or `"Department Leader"` |
| `requested_role_code` | text | Always `"department_leader"` |
| `status` | text | `"pending"` \| `"approved"` \| `"rejected"` |
| `source` | text | `"invite_onboarding"` |
| `created_at` | timestamptz | |

---

### Treasury tables

**`treasury_funds`** — Named funds (e.g. "Building Fund", "Tithe")
- `id`, `church_id`, `name`, `description`, `is_active`, `created_at`

**`treasury_inflows`** — Money received
- `id`, `church_id`, `fund_id`, `amount`, `currency`, `date`, `description`, `recorded_by_user_id`, `member_id?`, `created_at`, `updated_at`

**`treasury_outflows`** — Money spent
- `id`, `church_id`, `fund_id?`, `amount`, `currency`, `date`, `description`, `recorded_by_user_id`, `created_at`, `updated_at`

---

### Other tables (referenced in code, not in `database.ts`)

- `church_permission_assignments` — `{ church_id, user_id, permission_code }` — used for `access_control` permission check
- `permission_definitions` — lookup table for permission codes
- `church_notifications` — notification system
- `events` — church/department events
- `announcements` — church announcements
- `department_announcements` — department-specific announcements

---

## RLS Model

RLS is enforced on all tables. The pattern is:
- Users can only access rows where `church_id` matches a church they have an active row in `church_users`
- `profiles` is scoped to `id = auth.uid()`
- `platform_role_assignments` is readable only by the user themselves

Privileged cross-table writes that cannot be done with user RLS are done via **RPC functions** (security definer functions), which bypass RLS.

---

## RPC Functions

These Postgres functions are called from server actions. They run as `SECURITY DEFINER` to bypass RLS for multi-table writes.

| RPC | Called from | What it does |
|---|---|---|
| `create_church_with_owner(...)` | `src/features/churches/actions.ts` | Creates church row + church_admin role assignment + church_users row for creator |
| `complete_member_onboarding(p_user_id, p_church_slug, p_first_name, p_last_name, p_email, p_phone, p_member_code)` | `src/features/member-onboarding/actions.ts` | Public join: links/creates member row, creates church_users row. Must NOT set `portal_joined_at`. |
| `complete_member_onboarding_from_invite(p_user_id, p_token, p_first_name, p_last_name, p_email, p_phone)` | `src/features/member-invite/actions.ts` | Existing-member invite claim: marks invite as claimed (status, claimed_at, claimed_by_user_id), links user to church. Must NOT set `portal_joined_at`. |
| `complete_open_member_onboarding_from_invite(p_user_id, p_token, p_first_name, p_last_name, p_email, p_phone, p_date_of_birth, p_gender, p_address, p_city, p_country, p_marital_status, p_baptism_date, p_membership_type)` | `src/features/member-invite/actions.ts` | Open invite claim: creates new members row, marks invite as claimed. Returns `{ church_id, member_id, church_slug }`. Must NOT set `portal_joined_at`. |
| `complete_first_login_security(p_user_id)` | `src/features/member-portal/actions.ts` | Clears `profiles.must_change_password`. Called after `supabase.auth.updateUser({ password })`. |
| `get_member_invite_context(...)` | `src/features/member-invite/queries.ts` | Fetches invite context data with privileged reads |

**Critical invariant:** None of the onboarding/claim RPCs set `portal_joined_at`. That column is set exclusively by `completeFirstLoginPasswordChangeAction` after the password change completes.
