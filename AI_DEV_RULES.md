# AI_DEV_RULES.md
> Coding rules and conventions inferred from this codebase.

---

## File Organization

- **One module per domain.** Each feature in `src/features/[domain]/` has `actions.ts`, `queries.ts`, `types.ts`, and optionally `validation.ts` / `components/`.
- **No cross-feature imports except access.** Feature files import from `src/features/access/queries` (for guards) and `src/lib/supabase/*`. They do not import from other feature modules (with rare exceptions where explicitly needed).
- **Feature-specific components live in the feature folder.** Only truly shared UI goes in `src/components/`.

---

## Server vs Client Split

- **Pages and layouts are Server Components by default.** Only add `"use client"` when you need interactivity (forms, state, event handlers).
- **All mutations are Server Actions** (`"use server"` at top of file). Never call Supabase directly from client code for writes.
- **All query functions that run on the server must use the server Supabase client** (`src/lib/supabase/server.ts`). Client components use `src/lib/supabase/client.ts`.
- **`import "server-only"`** is used on `src/features/access/queries.ts` to prevent accidental import in client bundles.
- **`cache()` from React** wraps expensive server queries that may be called multiple times per request (`getUserAccessState`, `getCurrentProfile`, `getPlatformRoles`, `requireChurchAccess`). Do not re-implement caching — use the existing cached functions.

---

## Action Patterns

- **All Server Actions return typed result objects**, never throw to the client. Pattern: `{ ok: true, ... } | { ok: false, error: string }`.
- **Form actions follow the `useActionState` pattern**: signature is `(prevState: T | null, formData: FormData) => Promise<T | null>`.
- **Extract form values with `getString()` / `getNullableString()`** helpers at the top of action files — never access `formData.get()` inline throughout the action.
- **Always `revalidatePath()`** after mutations that affect displayed data.

---

## Supabase Query Patterns

- **No ORM — raw Supabase JS client only.**
- **Always type your `.from()` calls** via the `Database` type (passed to `createBrowserClient<Database>` / `createServerClient`).
- **Use `.maybeSingle()` when a row may not exist** (not `.single()`, which throws on no rows).
- **Normalize Supabase joins** — joined relations can come back as an object or a single-element array due to PostgREST behavior. Use a `normalizeJoinedRow()` helper pattern (see `src/features/access/queries.ts:98`).
- **Handle errors explicitly**: check `error` before using `data`. Never silently ignore Supabase errors.

---

## Database Access Rules

- **Privileged multi-table writes go through RPCs**, not client-side chained inserts. This ensures RLS safety and atomicity.
- **Never set `portal_joined_at` in onboarding RPCs or invite claim actions.** It is exclusively set in `completeFirstLoginPasswordChangeAction` after the password change.
- **Denormalize `department_name` into `member_departments` rows** at insert time — do not rely on joins for display.
- **Reuse existing pending invites** before creating new ones (`createMemberInviteAction` and `createOpenOnboardingInviteAction` both check for existing pending invites first).

---

## Access Control Rules

- **Every page in the church workspace calls `requireChurchWorkspaceAccess(slug)`** (or a more specific guard) at the top. Never skip this.
- **Every page in the member portal calls `requireMemberPortalAccess(slug)`** at the top.
- **Platform admin pages call `requirePlatformAdmin()`.**
- **`isPlatformAdmin` bypasses all church-level role checks** — platform admins can access any church workspace.
- **Don't check roles in the client** — all authorization happens server-side in Server Components or Server Actions.

---

## TypeScript Rules

- **Strict TypeScript is enabled** — no implicit any, no loose nulls.
- **Path alias `@/*` maps to `src/*`** — always use `@/` for imports, never relative `../../`.
- **Type discriminated unions for action results**: `{ ok: true; data: ... } | { ok: false; error: string }` — always check `ok` before accessing typed fields.
- **Cast unknown Supabase join shapes with `as any`** only when the type system can't express PostgREST's join behavior — document why with a comment.

---

## Routing Rules

- **Church routes use `[churchSlug]` (not `[churchId]`)** in the URL. Always look up church by slug, not ID.
- **Post-login destination is determined by `resolvePostAuthDestination(userId)`** in `src/features/access/queries.ts` — don't hardcode redirect destinations after login.
- **After invite claim**: redirect to `/my/[slug]?tab=overview&onboarding=1` if session, or `/login?registered=1&church=[slug]` if email confirmation needed.
- **After public join**: redirect to `/my/[slug]?tab=overview` if session, or `/login?registered=1&church=[slug]`.

---

## Component Rules

- **Use `WorkspaceEmptyState`, `WorkspaceLoadingShell`, `WorkspaceSectionCard`, `WorkspaceStatCard`** for consistent workspace page layout — don't create new layout wrappers.
- **Use `useToast()` from `src/hooks/use-toast.ts`** for notifications — never use `alert()`.
- **shadcn/ui components live in `src/components/ui/`** — don't duplicate them or install alternative component libraries.
- **i18n strings come from the `I18nProvider` context** — don't hardcode user-visible English strings without checking if a translation key exists.

---

## Security Rules

- **Validate `?redirect=` params**: only accept paths starting with `/` and not `//` (open redirect prevention — see `loginAction`).
- **Token generation uses `crypto.randomBytes(24).toString("hex")`** — 48 hex chars. Never use `Math.random()` for security-sensitive tokens.
- **Verify invite claim was complete** after RPC: check `status === "claimed"`, `claimed_at` is set, `claimed_by_user_id` is set. Fail explicitly if any is missing.
- **Permission check before every invite action** — `canCurrentUserManageMemberInvites()` must be called at the start of every invite mutation.
