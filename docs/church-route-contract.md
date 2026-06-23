# Church Route Contract

Status: Phase 0 route manifest and behavior map. Route URLs, params, redirects, and search-parameter contracts are preserved in Phase 1.

## Route Manifest

| Route | Source | Contract |
| --- | --- | --- |
| `/c/[churchSlug]` | `page.tsx` | Primary church dashboard entry. Redirects inactive/missing churches to `/create-church`. |
| `/c/[churchSlug]/dashboard` | `dashboard/page.tsx` | Dashboard alias/duplicate route. Redirect behavior matches root dashboard. |
| `/c/[churchSlug]/members` | `members/page.tsx` | Accepts `q`, `status`, `departmentId`, `departmentAssignmentStatus`; persists those keys through `WorkspaceRouteStateBridge`. |
| `/c/[churchSlug]/members/new` | `members/new/page.tsx` | Role-gated member creation; preserves create-member and invite form bindings. |
| `/c/[churchSlug]/members/[memberId]` | `members/[memberId]/page.tsx` | Member detail with finance and department assignment panels. |
| `/c/[churchSlug]/members/[memberId]/edit` | `members/[memberId]/edit/page.tsx` | Role-gated edit form. |
| `/c/[churchSlug]/households` | `households/page.tsx` | Household registry and assignment data. |
| `/c/[churchSlug]/households/new` | `households/new/page.tsx` | Household creation form. |
| `/c/[churchSlug]/households/[householdId]` | `households/[householdId]/page.tsx` | Household detail and member assignment behavior. |
| `/c/[churchSlug]/departments` | `departments/page.tsx` | Accepts filter/search params passed through to existing loader. |
| `/c/[churchSlug]/departments/new` | `departments/new/page.tsx` | Department creation form. |
| `/c/[churchSlug]/departments/[departmentId]` | `departments/[departmentId]/page.tsx` | Accepts `q`, `status`, `tab`, `requestId`; tab values include overview/members/finance workflows. |
| `/c/[churchSlug]/departments/[departmentId]/announcements` | nested page | Department-scoped announcement workflow. |
| `/c/[churchSlug]/departments/[departmentId]/events` | nested page | Department-scoped event workflow. |
| `/c/[churchSlug]/leadership` | `leadership/page.tsx` | Accepts `tab`; preserves leadership workflow data. |
| `/c/[churchSlug]/events` | `events/page.tsx` | Accepts filter params plus UI links using `tab=create_event`, `tab=detail`, `tab=edit`, and `eventId`. |
| `/c/[churchSlug]/calendar` | `calendar/page.tsx` | Calendar view using existing calendar query. |
| `/c/[churchSlug]/attendance` | `attendance/page.tsx` | Existing route preserved; not added as a new primary shell workflow in Phase 1. |
| `/c/[churchSlug]/treasury` | `treasury/page.tsx` | Treasury overview and fund/remittance workflows. |
| `/c/[churchSlug]/treasury/in` | `treasury/in/page.tsx` | Accepts filter params including `departmentId`; links to audit by `entityId`. |
| `/c/[churchSlug]/treasury/in/new` | nested page | Money-in creation form; supports prefilled department context. |
| `/c/[churchSlug]/treasury/in/[entryId]/edit` | nested page | Money-in edit form. |
| `/c/[churchSlug]/treasury/out` | `treasury/out/page.tsx` | Accepts filter params including `departmentId`; links to audit by `entityId`. |
| `/c/[churchSlug]/treasury/out/new` | nested page | Money-out creation form; supports `requestId` prefill from fund requests. |
| `/c/[churchSlug]/treasury/out/[entryId]/edit` | nested page | Money-out edit form. |
| `/c/[churchSlug]/treasury/approvals` | nested page | Accepts approval filter params and department finance request links. |
| `/c/[churchSlug]/treasury/audit` | nested page | Accepts audit filter params including `entityId`. |
| `/c/[churchSlug]/treasury/funds/new` | nested page | Fund creation form. |
| `/c/[churchSlug]/office` | `office/page.tsx` | Office workspace; old nav visibility depends on role label in `OFFICE_ALLOWED_ROLES`. |
| `/c/[churchSlug]/announcements` | `announcements/page.tsx` | Announcement create/publish/archive forms; management controls are role-sensitive in-page. |
| `/c/[churchSlug]/approvals` | `approvals/page.tsx` | Accepts `module`, `status`, `stage`; persisted through route state bridge. |
| `/c/[churchSlug]/reports` | `reports/page.tsx` | Accepts report filters and tab params; export actions preserved. |
| `/c/[churchSlug]/access-control` | `access-control/page.tsx` | Accepts `tab`; role/permission/invite/request workflows preserved. Unauthorized users redirect to dashboard. |
| `/c/[churchSlug]/settings` | `settings/page.tsx` | Church settings and tab forms. |

## Requested But Not Present As Routes

The reset brief mentions `/people`, `/small-groups`, `/ministries`, and `/administration`. These routes are not present in the current Next.js manifest and were not invented in Phase 1. The new sidebar uses those concepts only as navigation group labels around existing real routes.

## Shell Navigation Contract

- Dashboard links to `/c/[churchSlug]` and treats `/dashboard` as dashboard-active.
- Access Control remains hidden unless `showAccessControl` is true.
- Approvals follows the same authority visibility as the legacy sidebar.
- Church Office follows the existing `OFFICE_ALLOWED_ROLES` display-name check.
- Pending approval badge is shown on approvals links when the existing count is greater than zero.
- All links use existing route paths only.

## Redirect/Auth Contract

- `layout.tsx` continues to call `requireChurchWorkspaceAccess(churchSlug)` before rendering shell chrome.
- Auth/member portal redirects remain inside `features/access/queries.ts`.
- Phase 1 does not change public, platform, member portal, auth, API, or middleware/proxy routes.
