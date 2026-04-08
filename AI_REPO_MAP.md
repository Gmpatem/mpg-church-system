# AI_REPO_MAP.md
> Every important folder, file, and route in the repo.

---

## Root

```
E:\mpg-church-system\
├── src/                    Main source
├── .env.local              Supabase URL + anon key (not committed)
├── next.config.mjs         Image domains: *.supabase.co
├── tailwind.config.ts      Dark mode class, CSS vars, animate plugin
├── tsconfig.json           Strict TS, path alias @/* → ./src/*
├── package.json            Dependencies (see AI_PROJECT_CONTEXT.md)
└── task.md                 Original project audit task
```

---

## src/app/ — Route Tree

### Public / Auth routes  `(public)` group

| Route | File | Purpose |
|---|---|---|
| `/` | `(public)/page.tsx` | Landing page |
| `/login` | `(public)/login/page.tsx` | Login page + `LoginForm.tsx` |
| `/register` | `(public)/register/page.tsx` | Registration + `RegisterForm.tsx` |
| `/create-church` | `(public)/create-church/page.tsx` | New church creation form |
| `/invite/[token]` | `(public)/invite/[token]/page.tsx` | Secure invite claim (rich onboarding form) |
| `/join/[churchSlug]` | `(public)/join/[churchSlug]/page.tsx` | Public member self-join form |

### Church Workspace routes  `(church)` group — require operational access

Base: `/c/[churchSlug]/`

| Segment | Purpose |
|---|---|
| `dashboard/` | Main church dashboard |
| `access-control/` | Invite management — generate, view, revoke invites |
| `members/` | Member directory |
| `members/new/` | Create new member |
| `members/[memberId]/` | Member detail |
| `members/[memberId]/edit/` | Edit member |
| `departments/` | Department list |
| `departments/new/` | Create department |
| `departments/[departmentId]/` | Department detail |
| `departments/[departmentId]/announcements/` | Department announcements |
| `departments/[departmentId]/events/` | Department events |
| `households/` | Household list |
| `households/new/` | Create household |
| `households/[householdId]/` | Household detail |
| `events/` | Church events |
| `announcements/` | Church announcements |
| `calendar/` | FullCalendar view |
| `attendance/` | Event attendance |
| `leadership/` | Leadership roles & requests |
| `approvals/` | Leadership/dept approval inbox |
| `treasury/` | Finance dashboard |
| `treasury/in/` | Inflow list |
| `treasury/in/new/` | New inflow |
| `treasury/in/[entryId]/edit/` | Edit inflow |
| `treasury/out/` | Outflow list |
| `treasury/out/new/` | New outflow |
| `treasury/out/[entryId]/edit/` | Edit outflow |
| `treasury/funds/new/` | Create fund |
| `treasury/audit/` | Audit trail |
| `reports/` | Analytics & reporting |
| `office/` | Admin office dashboard |
| `settings/` | Church settings |

Church workspace layout: `src/app/(church)/c/[churchSlug]/layout.tsx`

### Member Portal routes  `(member)` group

| Route | File | Purpose |
|---|---|---|
| `/my/[churchSlug]` | `(member)/my/[churchSlug]/page.tsx` | Member dashboard |

Key components: `MemberPortalShell.tsx`, `MemberPortalWorkspace.tsx`, `FirstLoginPasswordGate.tsx`

### Platform Admin routes  `(platform)` group

| Route | Purpose |
|---|---|
| `/platform` | Admin dashboard |
| `/platform/churches` | List / manage all churches |
| `/platform/churches/[churchId]` | Church detail |
| `/platform/settings` | Platform settings |
| `/platform/support` | Support tools |

### API routes

| Route | File | Purpose |
|---|---|---|
| `GET /api/churches/[churchSlug]/events/departments` | `api/churches/[churchSlug]/events/departments/route.ts` | FullCalendar dept filter |
| `GET /api/churches/[churchSlug]/treasury/members` | `api/churches/[churchSlug]/treasury/members/route.ts` | Treasury member lookup |

---

## src/features/ — Business Logic Modules

| Module | Key files | Domain |
|---|---|---|
| `access/` | `queries.ts`, `types.ts` | Auth guards, ChurchAccessContext, post-login routing |
| `access-control/` | `actions.ts`, `queries.ts`, `types.ts` | Access control page data |
| `announcements/` | `actions.ts`, `queries.ts` | Church announcements CRUD |
| `approvals/` | `actions.ts`, `queries.ts` | Approve/reject leadership requests |
| `auth/` | `actions.ts`, `queries.ts`, `types.ts` | Login, register, logout |
| `calendar/` | `queries.ts` | Calendar event queries |
| `church-notifications/` | `actions.ts`, `queries.ts` | Notification system |
| `churches/` | `actions.ts`, `queries.ts` | Church creation |
| `department-announcements/` | `actions.ts`, `queries.ts` | Dept announcements |
| `department-events/` | `actions.ts`, `queries.ts` | Dept events |
| `departments/` | `actions.ts`, `queries.ts`, `types.ts` | Dept CRUD, member assignments |
| `events/` | `actions.ts`, `queries.ts`, `types.ts` | Event CRUD, attendance |
| `households/` | `actions.ts`, `queries.ts`, `types.ts` | Household CRUD |
| `i18n/` | `I18nProvider.tsx`, `en.ts`, `fr.ts` | EN/FR i18n context |
| `leadership/` | `actions.ts`, `queries.ts`, `types.ts` | Leadership roles & requests |
| `member-invite/` | `actions.ts`, `queries.ts`, `types.ts`, `validation.ts`, `components/RichInviteOnboardingForm.tsx` | Secure invite token flow |
| `member-onboarding/` | `actions.ts`, `queries.ts`, `types.ts` | Public self-join flow |
| `member-portal/` | `actions.ts`, `queries.ts`, `types.ts`, `components/FirstLoginPasswordGate.tsx` | Member portal, password gate |
| `members/` | `actions.ts`, `queries.ts`, `types.ts` | Member CRUD, status changes, transfers |
| `office/` | `queries.ts` | Admin office dashboard |
| `platform/` | `actions.ts`, `queries.ts` | Platform admin ops |
| `reports/` | `queries.ts` | Analytics queries |
| `treasury/` | `actions.ts`, `queries.ts`, `types.ts` | Fund/inflow/outflow CRUD |

---

## src/components/ — Shared Components

| Folder | Contents |
|---|---|
| `ui/` | 18 shadcn/ui base components (button, card, dialog, input, table, tabs, toast, tooltip, etc.) |
| `navigation/` | `ChurchHeader`, `ChurchShell`, `ChurchSidebar`, `MemberPortalShell`, `PlatformHeader`, `PlatformSidebar` |
| `workspace/` | `WorkspaceControlRail`, `WorkspaceEmptyState`, `WorkspaceHero`, `WorkspaceLoadingShell`, `WorkspaceSectionCard`, `WorkspaceStatCard`, `WorkspaceTabs` |
| `feedback/` | `toaster.tsx` |

---

## src/lib/

| File | Purpose |
|---|---|
| `supabase/client.ts` | `createClient()` — browser Supabase client |
| `supabase/server.ts` | `createClient()` — server Supabase client (cookie-based) |
| `utils/cn.ts` | `cn()` — Tailwind class merge utility |

---

## src/types/

| File | Contents |
|---|---|
| `database.ts` | `Database` interface with `Tables<>`, `Inserts<>`, `Updates<>` helpers. Typed exports: `Church`, `Profile`, `ChurchUser`, `Member`, `Household`, etc. |

---

## src/hooks/

| File | Purpose |
|---|---|
| `use-toast.ts` | Toast hook (state + dispatch) |
