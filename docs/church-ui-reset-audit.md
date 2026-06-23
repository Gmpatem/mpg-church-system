# Church Workspace UI Reset Audit

Status: Phase 0 and Phase 1 audit for the controlled church workspace reset.

## Baseline

- Branch: `ui/church-workspace-total-reset`
- Checkpoint commit: `f2b3a09 chore: checkpoint stable version before church workspace UI reset`
- Initial lint: passed
- Initial build: passed
- shadcn state: `npx shadcn@latest info` reports no root `components.json`; local shadcn-style primitives exist under `src/components/ui`.

## Classification Rules

- `PRESERVE_LOGIC`: Server routes, loaders, actions, query orchestration, access checks, route params, redirects, and real data contracts.
- `REPLACE_PRESENTATION`: Pure shell, layout, visual primitives, loading, empty, and error UI with no workflow side effects.
- `MIXED_REQUIRES_EXTRACTION`: Components containing server actions, query/search-param behavior, `useActionState`, routing mutations, local/session storage, notification read state, form bindings, permissions, or audit/treasury side effects.
- `LEGACY_DELETE_AFTER_MIGRATION`: Old visual shell/workspace components that must remain until no imports reference them and the migrated module passes lint/build/browser verification.

## Route Tree Classification

| Area | Files | Classification | Notes |
| --- | --- | --- | --- |
| Church root layout | `src/app/(church)/c/[churchSlug]/layout.tsx` | `MIXED_REQUIRES_EXTRACTION` | Preserves `requireChurchWorkspaceAccess`, notifications query, pending approval count, role label mapping. Shell presentation replaced only after preserving these inputs. |
| Church root page/dashboard | `page.tsx`, `dashboard/page.tsx`, `Dashboard*.tsx` | `MIXED_REQUIRES_EXTRACTION` | Contains redirects, Supabase reads, Suspense loaders, real dashboard data. Not redesigned in Phase 1. |
| Route loading/error files | `loading.tsx`, `error.tsx`, nested `loading.tsx`, nested `error.tsx` | `REPLACE_PRESENTATION` | Can move to new feedback visuals if no behavior is changed. Nested files left legacy in Phase 1 unless imported by root shell. |
| Members | `members/**` | `MIXED_REQUIRES_EXTRACTION` | Search params, selected-member local storage, invites, member actions, form bindings, detail/edit routes. Preserve until Phase 3. |
| Households | `households/**` | `MIXED_REQUIRES_EXTRACTION` | Real household/member data, forms, assignment flows. Preserve until Phase 3. |
| Departments | `departments/**` | `MIXED_REQUIRES_EXTRACTION` | Department creation, assignment actions, finance tab links, query params, nested announcements/events. Preserve until Phase 4. |
| Leadership | `leadership/**` | `MIXED_REQUIRES_EXTRACTION` | Tab/search-param workflow and role-sensitive data. Preserve until Phase 4. |
| Events/calendar | `events/**`, `calendar/page.tsx` | `MIXED_REQUIRES_EXTRACTION` | Event query params, edit/create tabs, event actions, calendar data. Preserve until Phase 4. |
| Treasury | `treasury/**` | `MIXED_REQUIRES_EXTRACTION` | High-risk finance actions, remittance, transfers, allocation, audit links, form bindings. Preserve until Phase 5. |
| Office/approvals | `office/**`, `approvals/**` | `MIXED_REQUIRES_EXTRACTION` | Approval queues, persisted filters, permission-aware links, side effects. Preserve until Phase 6. |
| Announcements | `announcements/**` | `MIXED_REQUIRES_EXTRACTION` | Create/publish/archive forms and approval workflow. Preserve until Phase 6. |
| Reports | `reports/**` | `MIXED_REQUIRES_EXTRACTION` | Search params, exports, tab-specific real report loaders. Preserve until Phase 6. |
| Access control | `access-control/**` | `MIXED_REQUIRES_EXTRACTION` | Roles, permissions, invites, access requests, audit-producing server actions. Preserve until Phase 6. |
| Settings | `settings/**` | `MIXED_REQUIRES_EXTRACTION` | Real church settings data and tab forms. Preserve until Phase 6. |

## Shared Component Classification

| Area | Files | Classification | Notes |
| --- | --- | --- | --- |
| Old shell | `src/components/navigation/ChurchShell.tsx`, `ChurchSidebar.tsx`, `ChurchHeader.tsx`, `ChurchMobile*.tsx` | `LEGACY_DELETE_AFTER_MIGRATION` | Replaced by `src/components/church-workspace/shell/*` in Phase 1, but retained for compatibility and rollback. |
| Breadcrumb | `src/components/navigation/Breadcrumb.tsx` | `PRESERVE_LOGIC` | Presentation-only but still imported by unmigrated pages. Keep until page migration. |
| Old workspace hero/cards/tabs | `src/components/workspace/WorkspaceHero.tsx`, `WorkspaceStatCard.tsx`, `WorkspaceSectionCard.tsx`, `WorkspaceTabs.tsx`, `WorkspaceControlRail.tsx`, `WorkspaceEmptyState.tsx`, `WorkspaceLoadingShell.tsx`, `index.ts` | `LEGACY_DELETE_AFTER_MIGRATION` | Old presentation system; still used by unmigrated modules. |
| Route state bridge | `src/components/workspace/WorkspaceRouteStateBridge.tsx` | `MIXED_REQUIRES_EXTRACTION` | Uses `useSearchParams`, `router.replace`, `router.prefetch`, and `localStorage`. Must preserve until module migrations replace it safely. |
| Mobile components | `src/components/mobile/**` | `LEGACY_DELETE_AFTER_MIGRATION` or `MIXED_REQUIRES_EXTRACTION` | Presentation components, but only delete after route imports are gone. |
| UI primitives | `src/components/ui/**` | `PRESERVE_LOGIC` | Local shadcn-style primitives reused by new shell wrappers. No broad rewrites. |
| Offline provider/status | `src/components/offline/**` | `PRESERVE_LOGIC` | Sync behavior and offline state must not change. New shell reuses `OfflineProvider` and `OfflineStatusBar`. |

## Mixed Files Requiring Careful Extraction

These files matched logic-sensitive terms and are not safe for blind deletion:

- `src/components/navigation/ChurchHeader.tsx`: notification read actions, localStorage office signal read state, logout routing.
- `src/components/navigation/ChurchSidebar.tsx`: logout routing and role-aware office/access visibility.
- `src/components/workspace/WorkspaceRouteStateBridge.tsx`: persisted query state and router prefetch/replace.
- `src/app/(church)/c/[churchSlug]/members/components/MembersWorkspaceRedesigned.tsx`: localStorage selected member, invites, filters, links.
- `src/app/(church)/c/[churchSlug]/events/components/EventsWorkspaceUnified.tsx`: search params, create/edit/detail tabs.
- `src/app/(church)/c/[churchSlug]/treasury/components/TreasuryWorkspace.tsx`: treasury actions and remittance workflows.
- `src/app/(church)/c/[churchSlug]/access-control/components/*`: roles, permissions, invites, access requests.
- `src/app/(church)/c/[churchSlug]/reports/tabs/ReportsExportActions.tsx`: report export action.
- Any `*Form.tsx` under the church workspace: server action bindings and hidden inputs.

## Phase 1 Files Introduced

- `src/components/church-workspace/**`
- Scoped `.church-workspace` tokens in `src/app/globals.css`

## Legacy Deletion Policy

No legacy presentation file is deleted in Phase 1. Deletion may start only in Phase 8 after import checks, route verification, lint, and build pass for each batch.
