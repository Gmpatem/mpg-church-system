# Church Workflow Contract

Status: Phase 0 workflow preservation map for the controlled UI reset.

## Phase 1 Boundary

Phase 1 replaces the authenticated church shell chrome only:

- App shell layout.
- Desktop sidebar.
- Topbar.
- Notification presentation.
- Offline/sync status placement.
- User menu/logout presentation.
- Neutral page frame for unmigrated routes.
- Root loading/error presentation.

Unmigrated module pages render inside the new shell without redesigning their business workflows.

## Preserved Behaviors

- Server components stay server components unless a route already uses a client component.
- `requireChurchWorkspaceAccess`, `requireChurchAccess`, and `requireChurchRole` remain unchanged.
- Supabase queries and mutations remain in `features/**`.
- Server action names, signatures, hidden inputs, and form `action` bindings remain unchanged.
- Search params and persisted query-state keys remain unchanged.
- Approval side effects, notification read behavior, audit writes, and treasury calculations remain unchanged.
- Offline provider and sync state remain wired through the church shell.
- English/French language switching remains wired through the existing i18n provider and language switcher.

## Critical Workflow Inventory

| Workflow | Current Owner | Phase 1 Treatment |
| --- | --- | --- |
| Authentication and workspace access | `features/access/queries.ts`, church layout | Preserve exactly; shell receives already-resolved context. |
| Logout | Legacy header/sidebar; new topbar/sidebar | Preserve `supabase.auth.signOut()`, `router.push("/login")`, `router.refresh()`. |
| Notifications | `features/church-notifications/actions`, church layout query | Preserve mark-one/mark-all read actions and office-signal localStorage read-state key. |
| Offline sync | `components/offline/OfflineProvider`, `OfflineStatusBar` | Reuse directly in new shell. |
| Pending approvals badge | `getMyPendingApprovalCount` in layout | Preserve existing count and pass to sidebar/topbar. |
| Members filters and selection | `members/page.tsx`, `MembersWorkspaceRedesigned.tsx`, `WorkspaceRouteStateBridge` | Preserve. No Phase 1 migration. |
| Member create/edit/invite | `members/new/**`, `members/[memberId]/**`, `features/members/actions`, `features/member-invite/actions` | Preserve. No Phase 1 migration. |
| Household forms/assignments | `households/**`, `features/households/**` | Preserve. No Phase 1 migration. |
| Department details/finance | `departments/**`, department finance features | Preserve. No Phase 1 migration. |
| Leadership | `leadership/page.tsx`, leadership features | Preserve. No Phase 1 migration. |
| Events/calendar | `events/**`, `calendar/page.tsx` | Preserve query params and event create/edit/detail URL contract. |
| Treasury | `treasury/**`, `features/treasury/**` | Preserve all calculations, remittance, allocation, correction, audit, and forms. |
| Announcements | `announcements/page.tsx`, announcement actions | Preserve create/publish/archive forms. |
| Access control | `access-control/**`, access-control actions | Preserve role, permission, invite, request, and audit side effects. |
| Reports/export | `reports/**`, report actions/queries | Preserve tab/filter/export behavior. |
| Settings | `settings/**` | Preserve church settings data and forms. |

## Browser Verification Plan

The browser context currently redirects unauthenticated `/c/[churchSlug]` requests to `/login`, so shell visual verification requires an authenticated session. Phase 1 verification still checks:

- Auth gate remains intact before and after.
- Production build route manifest still includes all church routes.
- Lint and build pass.
- If authenticated browser state becomes available, verify sidebar/topbar/offline/notifications at 1440, 1366, 1024, 768, and 390 widths.

## Next Module Recommendation

After Phase 1, migrate the Dashboard first. It has broad visual impact but lower mutation risk than People or Treasury, and it can establish the new module anatomy before forms and finance workflows are touched.
