# AI_PROJECT_CONTEXT.md
> What this is, the stack, architecture, and multi-tenant model.

---

## What This Is

**MPG Church System** is a multi-tenant church management platform. Each church is an isolated tenant. Staff with operational roles use a church workspace (`/c/[churchSlug]/...`). Regular members use a lighter member portal (`/my/[churchSlug]`). A platform-admin layer (`/platform/...`) manages all churches across the system.

The system handles: member records, households, departments, events, attendance, treasury (funds/inflows/outflows), announcements, leadership roles, approval workflows, and a full invite/onboarding pipeline.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router, Server Components, Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix primitives) |
| Backend | Supabase (Postgres, Auth, RLS, RPC functions) |
| ORM | None — raw Supabase JS client (`@supabase/supabase-js` + `@supabase/ssr`) |
| Charts | Recharts |
| Calendar | FullCalendar |
| Date utils | date-fns |
| Validation | Zod |
| i18n | Custom context provider (EN / FR) |

---

## Architecture

### Next.js App Router

All routes live under `src/app/`. Pages are React Server Components by default. Data mutations use Next.js Server Actions (`"use server"`). Client interactivity uses `"use client"` components sparingly.

### Feature Module Pattern

Business logic is organized by domain under `src/features/[domain]/`:
- `actions.ts` — Server Actions (mutations, form submissions)
- `queries.ts` — Server-only data fetching (imported in RSC pages/layouts)
- `types.ts` — TypeScript types for that feature
- `validation.ts` / `validators.ts` — Input sanitization and shape validation
- `components/` — Feature-specific React components (client or server)

There are no API routes except two thin endpoints for FullCalendar department filtering and treasury member lookups.

### Supabase Clients

Two clients:
- `src/lib/supabase/client.ts` — Browser client (`createBrowserClient`), used in `"use client"` components
- `src/lib/supabase/server.ts` — Server client (`createServerClient` with cookie store), used in Server Actions and RSC queries

### Database — No migrations in this repo

SQL schema, RLS policies, and RPC functions live in the external Supabase project (`wnitkyyodymmjedlttex.supabase.co`). There are no migration files here. The database shape is inferred from `src/types/database.ts`.

---

## Multi-Tenant Model

Every significant database table is scoped by `church_id`. Tenants (churches) are isolated at the data layer via Supabase RLS policies — a user can only read/write rows belonging to churches they are a member of.

### User ↔ Church relationship

A user can belong to multiple churches. The `church_users` table is the join table (status: `active` | inactive). A user's primary church is resolved at login by `resolvePostAuthDestination`.

### Access tiers within a church

| Tier | Who | Entry point |
|---|---|---|
| Platform admin | `platform_owner`, `platform_admin`, `platform_support` | `/platform` |
| Operational staff | `church_admin`, `pastor`, `elder`, `clerk`, `church_secretary`, `treasurer` | `/c/[slug]` workspace |
| Regular member | Has a `members` row linked via `profile_id` | `/my/[slug]` portal |
| Unlinked member | Has `church_users` row but no `members` row with `profile_id` | `/join/[slug]` |

Platform admins bypass all church-level access checks.

### Slug-based routing

Churches are identified in URLs by `slug` (unique, human-readable). All workspace and portal routes use `[churchSlug]` as a dynamic segment.
