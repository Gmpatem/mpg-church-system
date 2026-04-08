# MPG Church System — Phase 2: UI Refactor Plan
> Code-aware, architecture-safe, incremental front-end refactor.
> For implementation via Claude Code. Built on Phase 1 audit findings.

---

## 1. Approved UX Direction Recap

The approved design direction is **"Operational Clarity"**:

- **White workspace** with slate borders. Cards have clean edges (`rounded-2xl`). Remove dark-gradient elements from every secondary surface — restrict them to true page heroes only.
- **Three typography levels only:** Page title (bold/large), Section header (semibold/medium), Body/data (regular/small).
- **Unified status colors globally:** active = emerald, inactive = slate, pending = blue/amber by context, revoked = red, visitor = amber.
- **shadcn `<Input>`/`<Label>`/`<Select>` everywhere.** Raw native `<input>` elements banned from new code.
- **Multi-step forms** for any form with 6+ fields.
- **Sidebar = primary nav.** No duplicate tab + sidebar navigation.
- **Mobile-first tables** collapse to card-stacks below `md`.
- **`WorkspaceHero` is the single canonical page head.** No bespoke hero copies.
- **No placeholder copy visible to real users.** Implement or hide.

---

## 1B. User-Facing Language Standard

### The Rule: Zero Developer Language in the UI

Any text a user can read — labels, field names, placeholders, helper text, page titles, sidebar items, table headers, breadcrumbs, toast messages, error messages, empty states, confirmation dialogs — must be written in plain language that a non-technical church administrator or regular church member understands immediately.

**This applies everywhere: staff workspace, member portal, auth pages, onboarding forms, platform admin.**

Developer or database terms must never appear in the UI. They exist in code only.

---

### Known Violations to Fix (full audit)

| Location | Current (Dev Language) | Correct (Plain Language) |
|---|---|---|
| Create Church form | "Church Slug" (field label) | "Church Web Address" or "Short Name for URL" |
| Create Church form | Slug input placeholder `e.g. grace-church` | "e.g. grace-church — this will appear in your church link" |
| Create Church form | Slug helper (if any) | "This is the short name used in your church's link: mpgchurch.app/c/grace-church" |
| Sidebar / Header | `/c/grace-church` slug display | Remove entirely (Phase C) or show church name only |
| Access Control page | "Invite Type: member" | "Direct Member Invite" |
| Access Control page | "Invite Type: church_open" | "Open Registration Link" |
| Access Control page | "Status: pending" | "Waiting to be used" |
| Access Control page | "Status: claimed" | "Completed" |
| Access Control page | "Status: revoked" | "Cancelled" |
| Member directory | "profile_id" in any visible column | Never show this |
| Member directory | "membership_status" column header | "Status" |
| Member directory | "membership_type" column header | "Member Type" |
| Member form | "member_code" field label | "Member Code" (already okay) — but helper text needed: "Assigned by your church. Leave blank if not yet assigned." |
| Member form | "portal_invited_at" | Never show raw — display as "Invite sent [date]" |
| Member form | "portal_joined_at" | Never show raw — display as "Joined portal [date]" |
| Member form | "must_change_password" | Never expose to any user-facing surface |
| Member form | "profile_id" | Never expose |
| Member status values | `active`, `inactive`, `transferred`, `deceased` | "Active", "Inactive", "Transferred", "Deceased" — always capitalized, never raw DB enum values |
| Membership type values | `regular`, `adherent`, `child`, `youth`, `senior` | "Regular Member", "Adherent", "Child", "Youth", "Senior" |
| Gender values | `male`, `female`, `other` | "Male", "Female", "Other" |
| Marital status values | `single`, `married`, `widowed`, `divorced`, `separated` | "Single", "Married", "Widowed", "Divorced", "Separated" |
| Department form | "is_active" toggle label | "Active" (already okay — just ensure it's not shown as a raw boolean) |
| Events | `workflow_state: draft` | "Draft" |
| Events | `workflow_state: pending_approval` | "Awaiting Approval" |
| Events | `workflow_state: approved` | "Approved" |
| Events | `workflow_state: published` | "Published" |
| Events | `workflow_state: rejected` | "Not Approved" |
| Events | `status: scheduled` | "Scheduled" |
| Events | `status: completed` | "Completed" |
| Events | `status: cancelled` | "Cancelled" |
| Treasury | `inflow_type: tithe` | "Tithe" |
| Treasury | `inflow_type: offering` | "Offering" |
| Treasury | `inflow_type: special_contribution` | "Special Contribution" |
| Treasury | `outflow_type: mission_remittance` | "Mission Remittance" |
| Treasury | `outflow_type: department_expense` | "Department Expense" |
| Treasury | `outflow_type: evangelism` | "Evangelism" |
| Treasury | `fund_type: tithe` | "Tithe Fund" |
| Approvals | `current_stage: office_review` | "Office Review" |
| Approvals | `current_stage: leadership_review` | "Leadership Review" |
| Approvals | `current_stage: pending_approval` | "Awaiting Approval" |
| Approvals | `source: invite_onboarding` | "From Invite" |
| Approvals | `source: manual_request` | "Manual Request" |
| Invite onboarding | "Access acknowledgement" checkbox label | "I understand and agree to the terms of membership" (or church-specific language) |
| Invite onboarding | "Role/access request selector" | "Would you like to request a leadership role?" |
| Member portal | "Overview" tab | Fine as-is |
| Member portal | Tab labeled "Roles & Departments" | "My Roles" or "Involvement" |
| Error messages | "Error: foreign key violation" | "Something went wrong. Please try again." |
| Error messages | "Error: duplicate key value" | "This record already exists." |
| Error messages | "RPC error" | "We couldn't complete this action. Please try again." |
| Toast success messages | "Revalidated." (silent) | "Changes saved." or context-specific e.g. "Member updated." |
| Loading states | "Loading..." (generic) | Context-specific: "Loading members...", "Loading treasury..." |
| Empty states | "No data" | Context-specific: "No members yet.", "No transactions recorded." |
| Platform admin | "church_id", "user_id" as visible table columns | Show as "Church" (name), "User" (name/email) |
| Create Church form | "Default Language" | "Primary Language" |
| Sidebar navigation item | "Access Control" | "Invites & Access" — more intuitive for non-technical admins |
| Sidebar navigation item | "Office" | "Church Office" or just "Office" (fine) |
| Member list | "Directory Health" tab | "Profile Completeness" |

---

### How This Gets Enforced in Code

**DB enum values must never be rendered directly.** Always pass through a display map. Create a shared file:

```ts
// src/lib/display-maps.ts

export const memberStatusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  visitor: "Visitor",
  transferred: "Transferred",
  deceased: "Deceased",
};

export const memberTypeLabels: Record<string, string> = {
  regular: "Regular Member",
  adherent: "Adherent",
  child: "Child",
  youth: "Youth",
  senior: "Senior",
};

export const inviteStatusLabels: Record<string, string> = {
  pending: "Waiting to be used",
  claimed: "Completed",
  revoked: "Cancelled",
  expired: "Expired",
};

export const inviteTypeLabels: Record<string, string> = {
  member: "Direct Member Invite",
  church_open: "Open Registration Link",
};

export const workflowStateLabels: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Awaiting Approval",
  approved: "Approved",
  published: "Published",
  rejected: "Not Approved",
};

export const eventStatusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const approvalStageLabels: Record<string, string> = {
  submitted: "Submitted",
  office_review: "Office Review",
  leadership_review: "Leadership Review",
  treasury_review: "Finance Review",
  approved: "Approved",
  rejected: "Not Approved",
  cancelled: "Cancelled",
};

export const inflowTypeLabels: Record<string, string> = {
  tithe: "Tithe",
  offering: "Offering",
  donation: "Donation",
  special_contribution: "Special Contribution",
};

export const outflowTypeLabels: Record<string, string> = {
  project: "Project",
  evangelism: "Evangelism",
  mission_remittance: "Mission Remittance",
  department_expense: "Department Expense",
  operations: "Operations",
  welfare: "Welfare",
  equipment: "Equipment",
  other: "Other",
};

export const genderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const maritalStatusLabels: Record<string, string> = {
  single: "Single",
  married: "Married",
  widowed: "Widowed",
  divorced: "Divorced",
  separated: "Separated",
};

// Helper: returns the label or falls back to a capitalized version of the raw value
export function getLabel(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "—";
  return map[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
```

**Usage everywhere in the UI:**
```tsx
import { getLabel, memberStatusLabels } from "@/lib/display-maps";

// In a table cell:
<span>{getLabel(memberStatusLabels, member.membership_status)}</span>
```

**The `getLabel` fallback** (capitalizing raw values) is a safety net — it means an unknown DB value like `new_status_code` will display as "New Status Code" rather than `new_status_code` even if we haven't added it to the map yet.

---

### Church Slug — Special Case

The `slug` field in the Create Church form is the single most confusing piece of technical language in the product. Church administrators are not developers. "Slug" means nothing to them.

**Rename and explain it:**

```
Field label:    "Church Link Name"
Helper text:    "This creates your church's web address. Use lowercase letters and hyphens only."
Live preview:   "Your church link will be: mpgchurch.app/c/grace-church"
Placeholder:    "grace-church"
Validation msg: "Only lowercase letters, numbers, and hyphens. No spaces."
```

The underlying field name in the form action stays `slug` — this is a display-only rename.

---

### Claude Code Rule for Language

Add this to every Claude Code session brief:

> "Any user-visible string that is a raw database value (e.g. `pending`, `church_open`, `mission_remittance`, `portal_invited_at`) must be passed through the display map in `src/lib/display-maps.ts` before rendering. Never render raw DB enum values or column names directly in JSX."

---

## 2. Codebase UI Refactor Strategy

### Philosophy

This is a **stabilization-phase refactor**, not a rewrite. The strategy is:

1. **Extract before replacing.** Before touching module pages, extract shared primitives first. Pages then adopt primitives one by one.
2. **Shell → Components → Pages → Flows.** Work outward from shared infrastructure inward to module logic.
3. **Never break a working guard.** `requireChurchWorkspaceAccess`, `requireMemberPortalAccess`, and `requirePlatformAdmin` must stay at the top of every page. They are RSC calls — do not move them into client components during layout refactors.
4. **One module at a time.** Each patch pack touches one module, leaves others untouched.
5. **Visual-only changes first.** Replace raw inputs with shadcn, unify colors — these carry zero logic risk. Do them in bulk early.
6. **Structural changes (multi-step forms, tab consolidation) come later** after the visual layer is stable.

### Claude Code Usage Pattern

When using Claude Code for each patch pack:
- Give it the affected file(s) by name
- Reference this document for the rule being applied
- Always ask it to preserve all `revalidatePath()`, `requireXxx()` guard calls, and `{ ok: true } | { ok: false, error }` return shapes
- Never ask Claude Code to rewrite an entire file — patch specific sections

---

## 3. Shared Standardization Plan

These are the shared components/patterns that must exist before module refactors begin. Create them in order.

### 3A. Components to Create

| Component | Location | Description |
|---|---|---|
| `StatusBadge` | `src/components/ui/StatusBadge.tsx` | Single source of truth for all status pills. Props: `status: string`, `context?: "member" \| "invite" \| "approval" \| "event"`. Color map inside. |
| `ConfirmDialog` | `src/components/ui/ConfirmDialog.tsx` | Wraps shadcn `<Dialog>`. Props: `title`, `description`, `confirmLabel`, `onConfirm`, `variant?: "danger"`. Used for all destructive actions. |
| `StepIndicator` | `src/components/ui/StepIndicator.tsx` | Multi-step form progress. Props: `steps: string[]`, `currentStep: number`. Used in invite onboarding, potentially treasury entry. |
| `FormSection` | `src/components/ui/FormSection.tsx` | Fieldset group with `title` + optional `description` + `children`. Wraps a visual section within a long form. |
| `Breadcrumb` | `src/components/navigation/Breadcrumb.tsx` | Client component using `usePathname()`. Renders crumb trail. Props: `items: { label: string; href?: string }[]`. |
| `InlineAlert` | `src/components/ui/InlineAlert.tsx` | Standardizes error/success/warning/info banners. Replaces ad-hoc `<div className="text-red-500">` patterns. |
| `MobileTableCard` | `src/components/ui/MobileTableCard.tsx` | Renders a `<dl>` card from a `fields: { label, value }[]` array. Used below `md` instead of `<tr>`. |
| `CopyableLink` | `src/components/ui/CopyableLink.tsx` | Input + "Copy" button + optional WhatsApp share CTA. Used in invite link display. |

### 3B. Components to Standardize (already exist, need cleanup)

| Current State | Action |
|---|---|
| `WorkspaceHero` — already good | Enforce as the ONLY page hero. Delete all bespoke copies. |
| `WorkspaceStatCard` — good | Enforce `grid-cols-2 md:grid-cols-4` wrapper everywhere it's used. |
| `WorkspaceSectionCard` — good | Standardize inner padding to `px-5 py-4` on header, `p-5` on body. |
| `WorkspaceEmptyState` — good | Always include an action button when applicable. |
| `WorkspaceControlRail` — good | Enforce usage for all filter UIs. No inline filter rows outside this component. |
| `DashboardShell` — REDUNDANT | Delete after Dashboard adopts `WorkspaceHero` directly. |

### 3C. CSS Conventions to Lock In

Add to `tailwind.config.ts` as comments/documentation (no custom plugin needed):

```
Gradient: bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 — heroes only
Stat bar: h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500
Border radius: rounded-2xl (section cards), rounded-xl (inline elements)
Status: emerald (active), slate (inactive/revoked-light), red (revoked/danger), amber (pending/visitor), blue (info/role-pending)
Page x-padding: px-4 md:px-6 xl:px-8 (handled by ChurchShell — don't add to individual pages)
```

---

## 4. Route / Module Refactor Map

### Auth Layer (`/login`, `/register`, `/create-church`, `/join/[slug]`, `/invite/[token]`)

| Problem | Type | Risk |
|---|---|---|
| Raw `<input>` elements | Visual / Form | Low — pure component swap |
| No `WorkspaceHero` equivalent on auth pages | Layout | Low |
| No field-level validation on blur | Form | Low — client only |
| `/invite/[token]` is 15-field single scroll | Workflow / Form | Medium — needs step state |
| `memberCode` on join form has no helper text | Copy | Trivial |
| `FirstLoginPasswordGate` uses `window.location.href` | Functional | Low — router.push swap |

### Church Workspace Shell (`ChurchHeader`, `ChurchSidebar`, `ChurchShell`)

| Problem | Type | Risk |
|---|---|---|
| No breadcrumbs on sub-pages | Navigation | Low — additive only |
| Notifications dropdown unbounded height | Layout | Low |
| Sidebar has slug label clutter | Copy/Layout | Low |
| No approval count badge on sidebar | Navigation | Low — additive |
| Header has no quick-action CTA | Navigation | Low — additive |

### Dashboard (`/c/[slug]`)

| Problem | Type | Risk |
|---|---|---|
| `DashboardShell` is a bespoke WorkspaceHero copy | Layout | Low — delete + replace |
| No "Needs Attention" strip | Feature | Low — additive |
| Hero action buttons overflow mobile | Layout | Trivial |

### Members (`/c/[slug]/members`)

| Problem | Type | Risk |
|---|---|---|
| No `WorkspaceHero` actions for "New Member" | Layout | Low |
| `MemberInviteButton` bypasses `createMemberInviteAction` | **Functional bug** | High — do last |
| Directory cards have inconsistent height | Layout | Low |
| "Directory Health" tab naming | Copy | Trivial |
| No breadcrumb on member detail | Navigation | Low |
| No mobile table fallback | Responsive | Medium |

### Households (`/c/[slug]/households`)

| Problem | Type | Risk |
|---|---|---|
| Head-of-household needs member picker | Form/UX | Medium |
| Sidebar grouping with Members ("People") | Navigation | Low |

### Departments (`/c/[slug]/departments`)

| Problem | Type | Risk |
|---|---|---|
| Department detail spread across 3 sub-routes | Navigation / Structure | Medium |
| No consolidated tabs on detail page | Layout | Medium |

### Events (`/c/[slug]/events`)

| Problem | Type | Risk |
|---|---|---|
| Dual `workflow_state` + `status` not clearly differentiated in list | Display | Low |
| FullCalendar has no mobile list fallback | Responsive | Medium |

### Treasury (`/c/[slug]/treasury`)

| Problem | Type | Risk |
|---|---|---|
| Nested two-level tab hierarchy | Navigation | Medium |
| Two entry paths for same form | Navigation | Low — redirect one |
| `recentInflows`/`recentOutflows` typed as `any[]` | Type | Low |
| Amount field missing `inputMode="numeric"` | Mobile | Trivial |
| Net balance has no color indicator | Display | Trivial |

### Approvals (`/c/[slug]/approvals`)

| Problem | Type | Risk |
|---|---|---|
| No "Needs Your Action" vs "All Pending" split | Layout | Low |
| No inline workflow step indicator | Display | Low |

### Member Portal (`/my/[slug]`)

| Problem | Type | Risk |
|---|---|---|
| `renderPlaceholderTab` visible to real users | **Critical** | Low — hide tabs |
| Dual nav (sidebar + tabs) | Layout | Medium |
| No logout in sidebar | UX | Low |
| `Bell` icon not wired | Incomplete | Low — remove or wire |
| Same heavy staff hero visual | Design | Low |

### Platform Admin (`/platform`)

No critical issues. Lower priority.

---

## 5. Phased Refactor Roadmap

### Phase A — Shared Infrastructure (do this first, before touching any module)
*Goal: Create all shared components so modules can consume them.*

1. Create `StatusBadge.tsx`
2. Create `ConfirmDialog.tsx`
3. Create `StepIndicator.tsx`
4. Create `FormSection.tsx`
5. Create `Breadcrumb.tsx`
6. Create `InlineAlert.tsx`
7. Create `CopyableLink.tsx`
8. Create `MobileTableCard.tsx` (pattern)

**Risk:** Zero — all additive. Nothing consumes them yet.

---

### Phase B — Visual Consistency Pass (raw inputs → shadcn everywhere)
*Goal: Eliminate visual inconsistency at every entry point.*

Files to patch:
- `src/app/(public)/login/page.tsx` + `LoginForm.tsx`
- `src/app/(public)/register/page.tsx` + `RegisterForm.tsx`
- `src/app/(public)/join/[churchSlug]/page.tsx` + `MemberJoinForm.tsx`
- `src/features/member-portal/components/FirstLoginPasswordGate.tsx`

Changes per file:
- Replace native `<input>` with `<Input>` from `@/components/ui/input`
- Replace native `<label>` with `<Label>` from `@/components/ui/label`
- Replace `window.location.href` with `router.push()` in `FirstLoginPasswordGate`
- Add password visibility toggle (eye icon) to all password fields

**Risk:** Low. Pure component swaps with identical form behavior.
**Test after:** Login, register, join, first-login password change — all still submit correctly.

---

### Phase C — Shell Fixes
*Goal: Fix navigation, notifications, header.*

1. **Notifications dropdown** — add `max-h-[400px] overflow-y-auto` to the dropdown content div in `ChurchHeader`
2. **Sidebar** — remove the slug display label. Remove "Navigation" section label.
3. **Breadcrumb** — add `Breadcrumb` component to layouts for: member detail, member edit, household detail, treasury entry edit, department detail
4. **Sidebar approval badge** — add a numeric badge to the "Approvals" nav item that reads from a count query. Create `getMyPendingApprovalCount(churchId, userId)` in `src/features/approvals/queries.ts`

**Risk:** Low. Shell changes affect all workspace pages but are purely additive/visual.
**Test after:** Navigation still works across all routes, dropdown scrolls, breadcrumbs show correctly.

---

### Phase D — Dashboard Cleanup
*Goal: Kill `DashboardShell`, wire in `WorkspaceHero`, add attention strip.*

1. Replace `DashboardShell` usage in the dashboard page with `WorkspaceHero` directly, passing `title={churchName}` and the three action buttons via `actions` prop
2. Delete `DashboardShell` component file
3. Fix hero action button wrapping — change to `flex flex-col sm:flex-row gap-2`
4. Surface `OfficeAttentionStrip` on the dashboard page (import from office feature, it already exists)
5. Stat cards — enforce `grid-cols-2 md:grid-cols-4` wrapper

**Risk:** Low. Dashboard page is read-only, no mutations involved.
**Test after:** Dashboard renders correctly, attention strip appears when signals exist, mobile layout wraps properly.

---

### Phase E — Member Portal Critical Fixes
*Goal: Hide placeholder tabs, fix navigation, fix logout.*

1. **Hide unimplemented tabs** — find all `renderPlaceholderTab` calls, replace with `null` or remove the tab from the tab list entirely. Do not show tabs that have no content.
2. **Remove Bell icon** from `MemberPortalShell` header OR wire it to the notification system (if notifications exist for members). Do not leave a dead UI element.
3. **Add Sign Out** to the member portal sidebar — a button at the bottom of the sidebar that calls `signOutMemberPortalAction`
4. **Fix navigation duplication** — if the portal has both a sidebar and an inline `WorkspaceTabs` row, remove the inline tabs. The sidebar IS the navigation.

**Risk:** Low for tab hiding (purely subtractive). Medium for navigation restructure — test all portal tab content still renders.
**Test after:** Member portal loads, all visible tabs have real content, sidebar navigation works, sign out works.

---

### Phase F — Invite Onboarding Multi-Step Form
*Goal: Convert `RichInviteOnboardingForm` from 15-field scroll to 3-step wizard.*

**This is pure client-side state — no server changes.**

Implementation:
1. Add `const [step, setStep] = useState(1)` to `RichInviteOnboardingForm`
2. Add `StepIndicator` at the top with `steps={["Account", "Profile", "Church"]}` and `currentStep={step}`
3. Conditionally render fields based on `step`:
   - Step 1: firstName, lastName, email, phone, password, confirmPassword
   - Step 2: DOB, gender, address, city, country, maritalStatus, baptismDate, membershipType (all optional — show "(optional)" labels)
   - Step 3: departments checkboxes, role selector, acknowledgement checkbox
4. "Next" button advances step after client validation of that step's fields
5. "Back" button decrements step
6. Submit button only appears on Step 3
7. The full `completeRichInviteOnboardingAction` call is unchanged — still fires on Step 3 submit with all collected fields

**Risk:** Medium — significant client component change. The server action and all field names stay identical. The only risk is the step-gate validation logic.
**Test after:** Full invite claim flow end-to-end. Both `member` and `church_open` invite types. Email confirmation path. Session path.

---

### Phase G — Module-Level UX Improvements
*Goal: Module-by-module cleanup. Done one module per sub-patch.*

**G1 — Members module**
- Add `WorkspaceHero` `actions` with "New Member" button
- Rename "Directory Health" tab to "Profile Health"
- Add `Breadcrumb` to member detail page
- Add `MobileTableCard` pattern to member list below `md`
- **Do NOT touch `MemberInviteButton` yet** (see Risk Watchlist)

**G2 — Treasury module**
- Flatten tab hierarchy: top-level tabs = Record | Ledger | Funds | Reports
- Under Record: show Tithe/Offering/Donation as section cards within a single view, not sub-tabs
- Add `inputMode="numeric"` to all amount fields
- Net balance stat card: add `text-emerald-600` if positive, `text-red-600` if negative
- Redirect `/treasury/in/new` and `/treasury/out/new` to the main treasury workspace if they're now inline

**G3 — Departments module**
- Department detail page: add tabs for Overview | Members | Events | Announcements
- Keep the sub-routes (`/departments/[id]/events`, `/departments/[id]/announcements`) but have them redirect to the detail page with `?tab=events` / `?tab=announcements`

**G4 — Approvals module**
- Split approvals inbox into two sections: "Needs Your Action" (filtered) and "Other Pending"
- Add inline step indicator per approval row showing current stage

**G5 — Access Control module**
- Add tabs to access-control workspace: Invite Members | Pending Requests | Invite History
- Promote the invite creation form to the primary visual position on the "Invite Members" tab
- Replace invite link copy pattern with `CopyableLink` component (includes copy + WhatsApp share)

**Risk:** Low-Medium per sub-patch. Each module is isolated.

---

### Phase H — New Member → Invite Integration (Workflow Shortcut)
*Goal: Add "Send portal invite" checkbox to new member form.*

1. In `src/app/(church)/c/[churchSlug]/members/new/page.tsx` (or the form component) — add a checkbox: "Send portal invite after creating this member"
2. In the `createMemberAction` or its calling page — if checkbox is checked, call `createMemberInviteAction(churchSlug, newMemberId)` after successful member creation
3. Show the returned invite URL in the success state of the form (using `CopyableLink`)

**Risk:** Medium — adds a conditional second action after member creation. Wrap in try/catch; invite failure should not fail the member creation. Log the error but show a warning: "Member created. Invite link could not be generated."

---

### Phase I — `MemberInviteButton` Functional Fix (Last)
*This is listed last because it is the most behaviorally sensitive fix.*

**The bug:** `MemberInviteButton` in `MembersWorkspaceUnified.tsx` copies a URL directly without calling `createMemberInviteAction`. This means:
- No `member_onboarding_invites` row is created
- `members.portal_invited_at` is never set
- The copied URL is invalid (points to nothing)

**Fix:**
1. Change `MemberInviteButton` to be an async button that calls `createMemberInviteAction(churchSlug, memberId)` server action
2. Shows a loading spinner while the action runs
3. On success: shows the returned URL in a `CopyableLink` component inside a small popover or sheet
4. On error: shows an `InlineAlert` with the error message
5. Remove any existing `ConfirmDialog` pattern that doesn't call the action

**Risk:** High behavioral sensitivity. Test:
- Invite created → `member_onboarding_invites` row exists in DB
- `members.portal_invited_at` is set
- Duplicate invite check (existing pending invite reuse) still works
- Revoke still works on the created invite

---

## 6. File-Level Targets

### Inspect First (before writing any code)

```
src/components/navigation/ChurchHeader.tsx
src/components/navigation/ChurchSidebar.tsx
src/components/navigation/MemberPortalShell.tsx
src/components/workspace/WorkspaceHero.tsx
src/app/(church)/c/[churchSlug]/layout.tsx
src/app/(church)/c/[churchSlug]/page.tsx (dashboard)
src/app/(member)/my/[churchSlug]/page.tsx
src/features/member-invite/components/RichInviteOnboardingForm.tsx
src/features/member-portal/components/FirstLoginPasswordGate.tsx
```

### Delete After Refactor

```
src/components/navigation/DashboardShell.tsx (after Phase D)
```

### Create (Phase A targets)

```
src/components/ui/StatusBadge.tsx
src/components/ui/ConfirmDialog.tsx
src/components/ui/StepIndicator.tsx
src/components/ui/FormSection.tsx
src/components/ui/InlineAlert.tsx
src/components/ui/CopyableLink.tsx
src/components/navigation/Breadcrumb.tsx
src/lib/display-maps.ts        ← ALL user-visible enum labels live here
```

### Phase B Targets (raw input replacement)

```
src/app/(public)/login/LoginForm.tsx (or wherever LoginForm renders)
src/app/(public)/register/RegisterForm.tsx
src/app/(public)/join/[churchSlug]/MemberJoinForm.tsx
src/features/member-portal/components/FirstLoginPasswordGate.tsx
```

---

## 7. Workflow Refactor Translation

### Workflow 1: Staff Inviting a Member

**Current:** 3 pages, manual URL copy, no WhatsApp share.
**Target:** Access control page → Invite Members tab → dialog or inline form → `CopyableLink` with WhatsApp CTA.

**Implementation:**
- Layout change + `CopyableLink` component (Phase G5)
- No server action changes — `createMemberInviteAction` is already correct
- WhatsApp URL: `https://wa.me/?text=${encodeURIComponent("Join our church portal: " + inviteUrl)}`
- Expiry display: format `expires_at` from the returned invite as "Expires April 21, 2026"

### Workflow 2: Recording Offerings

**Target:** One click from treasury landing → entry form → stay on form after submit (clear fields, don't redirect).

**Implementation:**
- Treasury tab restructure (Phase G2)
- After successful inflow submit, instead of `redirect()`, use `revalidatePath()` + set a local success state that clears the form. The server action already returns `{ ok: true }` — client can reset form state on that.
- This requires the inflow form to be a client component with controlled state, or use `useActionState` with a form reset effect.

### Workflow 3: New Member → Portal Active

**Target:** Check "Send invite" on the new member form → invite link shown in success state.

**Implementation:** Phase H above. Layout + conditional action chaining. No RPC changes.

### Workflow 4: Approvals Visibility

**Target:** Approvers see pending count in sidebar badge + dashboard strip.

**Implementation:**
- `getMyPendingApprovalCount()` query in `src/features/approvals/queries.ts`
- Sidebar nav item in `ChurchSidebar.tsx` reads this count and renders a `Badge` component
- `OfficeAttentionStrip` surfaced on dashboard (Phase D)

---

## 8. Patch Pack Plan

Each pack is a Claude Code session. Feed it only the files in scope.

---

### Pack 1 — Shared UI Infrastructure + Display Maps
**Goal:** Create all 7 new shared components AND the display maps file.
**Files created:** `StatusBadge`, `ConfirmDialog`, `StepIndicator`, `FormSection`, `InlineAlert`, `CopyableLink`, `Breadcrumb`, `src/lib/display-maps.ts`
**Dependencies:** None.
**Risk:** Zero — nothing consumes them yet.
**Test:** Import `getLabel` from display-maps in a component and confirm it resolves. Import each UI component in a test page, confirm they render.

---

### Pack 2 — Auth Form Visual Pass
**Goal:** Replace all raw inputs in public forms with shadcn components.
**Files:** `LoginForm.tsx`, `RegisterForm.tsx`, `MemberJoinForm.tsx`, `FirstLoginPasswordGate.tsx`
**Dependencies:** shadcn `Input`, `Label` already exist in `src/components/ui/`
**Risk:** Low. Keep all `formData.get()`, Server Action calls, and `useActionState` hooks untouched.
**Test:** Login, register, join, first-login password change — all submit and redirect correctly.

---

### Pack 3 — Notifications + Sidebar Cleanup
**Goal:** Cap notifications dropdown height, clean up sidebar labels.
**Files:** `ChurchHeader.tsx`, `ChurchSidebar.tsx`
**Dependencies:** None.
**Risk:** Low. Pure CSS + copy changes.
**Test:** Notifications dropdown scrolls when full. Sidebar renders without slug clutter.

---

### Pack 4 — Member Portal: Hide Placeholders + Fix Nav
**Goal:** Remove renderPlaceholderTab, fix duplicate nav, add Sign Out to sidebar.
**Files:** `MemberPortalShell.tsx`, `src/app/(member)/my/[churchSlug]/page.tsx`
**Dependencies:** `signOutMemberPortalAction` already exists.
**Risk:** Low. Additive/subtractive, no logic changes.
**Test:** Portal loads, visible tabs all have content, sign out works.

---

### Pack 5 — Dashboard Cleanup
**Goal:** Replace DashboardShell with WorkspaceHero, wire OfficeAttentionStrip.
**Files:** `src/app/(church)/c/[churchSlug]/page.tsx`, `DashboardShell.tsx` (delete)
**Dependencies:** `WorkspaceHero`, `OfficeAttentionStrip` (already exist).
**Risk:** Low. Read-only page.
**Test:** Dashboard renders with hero, stat cards in 2/4 grid, attention strip shows when signals exist.

---

### Pack 6 — Invite Onboarding 3-Step Wizard
**Goal:** Convert RichInviteOnboardingForm to 3-step flow.
**Files:** `src/features/member-invite/components/RichInviteOnboardingForm.tsx`
**Dependencies:** `StepIndicator`, `FormSection` from Pack 1.
**Risk:** Medium. Preserve ALL field names (server action reads them by name). Preserve acknowledgement checkbox requirement on final step. Do not change `completeRichInviteOnboardingAction` signature.
**Instructions for Claude Code:**
- Keep `useState` for form field values as-is
- Add `const [step, setStep] = useState<1|2|3>(1)` 
- Wrap each step group in `{step === N && (...)}` conditional
- "Next" validates required fields for that step before advancing
- Server action call stays on final step submit only
**Test:** Full claim flow — both `member` and `church_open` invite types. Confirm `member_onboarding_invites.status` is `"claimed"` after submit.

---

### Pack 7 — Shell: Breadcrumbs + Approval Badge
**Goal:** Add breadcrumbs to detail pages, add approval count to sidebar.
**Files:** `ChurchSidebar.tsx`, member detail page, treasury entry edit page, department detail page
**Dependencies:** `Breadcrumb` from Pack 1. New `getMyPendingApprovalCount` query.
**Risk:** Low — additive only.
**Test:** Breadcrumbs show correct trail. Sidebar badge shows correct count and disappears when zero.

---

### Pack 8 — Treasury Restructure
**Goal:** Flatten tab hierarchy, add mobile numeric inputs.
**Files:** `TreasuryWorkspace.tsx` and related tab/form components
**Dependencies:** None new.
**Risk:** Medium — visual hierarchy change. Server actions and form field names untouched.
**Test:** Can record tithe, offering, donation in the new flat layout. Submit still hits correct server action.

---

### Pack 9 — Members Module UX Pass
**Goal:** WorkspaceHero actions, rename tab, breadcrumb, mobile card layout.
**Files:** Members workspace page, member detail page
**Dependencies:** `Breadcrumb`, `MobileTableCard` from Pack 1.
**Risk:** Low.
**Test:** Members list renders on mobile as cards. Detail page shows correct breadcrumb. "New Member" button in hero routes correctly.

---

### Pack 10 — Access Control: Invite Tabs + CopyableLink
**Goal:** Restructure access-control into tabs, add CopyableLink.
**Files:** `AccessControlWorkspace.tsx`, `InviteLinkPanel.tsx` (or equivalent)
**Dependencies:** `CopyableLink` from Pack 1.
**Risk:** Low — layout restructure, no action changes.
**Test:** Invite link is copyable, WhatsApp share opens correctly, existing pending invite is reused (not duplicated).

---

### Pack 11 — New Member + Invite Integration
**Goal:** Add optional invite checkbox to new member form.
**Files:** `src/app/(church)/c/[churchSlug]/members/new/page.tsx` + `createMemberAction`
**Dependencies:** `createMemberInviteAction` already exists.
**Risk:** Medium. Invite creation must be wrapped in try/catch and not block member creation on failure.
**Test:** Create member with invite checked → member exists + invite row exists + link shown. Create member without invite checked → member exists only.

---

### Pack 12 — `MemberInviteButton` Functional Fix (Final)
**Goal:** Fix the invite button to actually call `createMemberInviteAction`.
**Files:** `MembersWorkspaceUnified.tsx`, `MemberInviteButton.tsx` (or wherever it lives)
**Dependencies:** `CopyableLink`, `ConfirmDialog` from Pack 1. `createMemberInviteAction` unchanged.
**Risk:** High behavioral sensitivity. Most critical fix.
**Instructions for Claude Code:** 
- The button should call `createMemberInviteAction` as a server action
- Show loading state during call
- On success: render invite URL in `CopyableLink` in a popover
- On error: show `InlineAlert` with error
- Must NOT generate the URL client-side or skip the action
**Test:** Invite button → DB row created → `portal_invited_at` set → URL is valid → claim flow works from that URL → revoke still works.

---

## 9. Risk Watchlist

These are areas where UI refactors can accidentally break app behavior. Flag before touching.

| Area | Risk | Safeguard |
|---|---|---|
| `requireChurchWorkspaceAccess()` call in page files | If a page is restructured into a layout-level component, this guard can get moved out of the page and bypass | Always keep it as the first line in the `default export` async function of the page |
| `RichInviteOnboardingForm` field names | Server action reads fields by name. Renaming DOM inputs breaks the action | Never rename input `name` attributes. Claude Code must be told this explicitly |
| `completeRichInviteOnboardingAction` invite verification | After RPC: code checks `status === "claimed"`, `claimed_at`, `claimed_by_user_id`. This must never be removed or weakened | Preserve the verification block entirely during form refactors |
| `portal_joined_at` lifecycle | Set ONLY in `completeFirstLoginPasswordChangeAction`. Must not be set anywhere else. | Any refactor near member creation or invite claim must not add `portal_joined_at` writes |
| Supabase join normalization | PostgREST joins return object or array. Adding new `.select()` with joins without the normalize pattern causes runtime crashes | Use the `normalizeJoinedRow()` pattern for any new join queries |
| `auth.signUp()` orphan risk | If signUp succeeds but subsequent RPC fails, orphaned auth account is created | Do not restructure the try/catch wrapping in `completeRichInviteOnboardingAction`. The orphan risk is pre-existing and is flagged in the codebase docs |
| `database.ts` incomplete types | Queries on untyped tables use implicit `any`. Adding new queries on `member_onboarding_invites`, `church_access_requests`, etc. will not get type safety | Note this and use explicit local type assertions. Do not rely on autocomplete |
| `must_change_password` gate | Portal renders `FirstLoginPasswordGate` when this is `true`. If portal page refactors move the `ctx.profile.must_change_password` check, the gate breaks | Keep this check at the top of the portal page RSC, before any layout rendering |
| Multi-step form submit state | In the invite wizard, if the user navigates back from Step 3 and re-submits, all fields must still be populated | Use `useState` for all field values, not `formData` only. Fields persist across step changes |
| `is_primary` in `church_users` | Portal routing picks primary church via `pickPrimaryChurch()`. UI changes that assume single-church membership will break multi-church users | Never hardcode church context in client components — always derive from RSC-passed context |

---

## 10. Execution Guidance

### Recommended Start Sequence for Claude Code

**Session 1 (30 min):** Pack 1 — create all 7 shared components. These are pure component files with no imports from existing features. Low risk, high leverage. This unlocks every subsequent pack.

**Session 2 (30 min):** Pack 2 — auth form visual pass. The most visible inconsistency, the lowest risk. Gives you immediate visual improvement that affects every new user.

**Session 3 (20 min):** Pack 4 — member portal placeholder fix. This is the item that should have been fixed yesterday. Real members seeing "this tab is next" placeholder text is a trust-breaker. Fix it before anything else ships.

**Session 4 (20 min):** Pack 3 — notifications cap + sidebar cleanup. Quick shell fixes.

**Session 5 (45 min):** Pack 6 — invite onboarding wizard. Most user-facing improvement. Medium risk but isolated to one component file.

**Sessions 6+:** Packs 5, 7, 8, 9, 10, 11 in any order — one per session. Each is isolated to a module.

**Final Session:** Pack 12 — `MemberInviteButton` functional fix. Always last. Most behavioral risk. Requires DB verification after.

### How to Brief Claude Code Per Session

Template to use:

```
I'm working on [Pack N] of the MPG Church System UI refactor.
Goal: [goal from pack]
Files in scope: [file list]
Rules:
- Preserve all requireXxx() guard calls at top of page files
- Do not rename any form input `name` attributes
- Preserve all revalidatePath() calls
- Keep { ok: true } | { ok: false, error } return shapes on all actions
- Use @/ path alias, never relative imports
- Do not add any new Supabase writes or RPCs
- Never render raw DB enum values or column names in JSX — use getLabel() from @/lib/display-maps
- Field labels, page titles, nav items, and helper text must use plain language (no dev/DB terms)
Changes needed: [specific description from pack]
```

### What to Verify After Each Pack

- [ ] TypeScript compiles without new errors (`tsc --noEmit`)
- [ ] The route affected by the pack still loads
- [ ] Any form in scope still submits and returns correct action result
- [ ] No `requireXxx()` call has been removed or moved
- [ ] Mobile layout is tested at 390px width

---

*Phase 2 plan authored April 2026. Based on Phase 1 audit + full codebase context.*
*Implementation target: Claude Code, incremental patch packs.*
