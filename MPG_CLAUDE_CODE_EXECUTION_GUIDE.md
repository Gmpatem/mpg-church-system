# MPG Phase 2 — Claude Code Execution Guide (PowerShell)
> How to run each patch pack using Claude Code on Windows PowerShell.
> Read this before opening Claude Code for the first time on this project.

---

## Part 1 — One-Time Setup

### Step 1: Verify Claude Code is installed

Open PowerShell and run:

```powershell
claude --version
```

If you get an error, install it:

```powershell
npm install -g @anthropic-ai/claude-code
```

> **Requires:** Node.js 18+ and Git for Windows. If `npm` is not found, install Node.js from nodejs.org first.

Confirm Git for Windows is installed:

```powershell
git --version
```

---

### Step 2: Enable PowerShell tool (opt-in, do once)

Claude Code v2.1.84+ supports native PowerShell as an opt-in preview. Enable it:

1. Launch Claude Code from your project root (see Step 4)
2. Type `/settings` inside the session
3. Navigate to "Tools & Execution"
4. Find "PowerShell Tool (Preview)" and press Enter to enable

Or add it to your global settings file:

```powershell
# Find the settings file
notepad "$env:USERPROFILE\.claude\settings.json"
```

Add or merge:

```json
{
  "tools": {
    "powershell": true
  }
}
```

---

### Step 3: Create the CLAUDE.md file in your project root

This is the single most important setup step. `CLAUDE.md` is Claude Code's persistent memory for your project — it reads this at the start of every session. Without it, you have to re-explain the project every time.

Navigate to your project root in PowerShell:

```powershell
cd "E:\mpg-church-system"
```

Create `CLAUDE.md`:

```powershell
New-Item -Name "CLAUDE.md" -ItemType File
notepad CLAUDE.md
```

Paste this content into CLAUDE.md and save:

```markdown
# MPG Church System — Claude Code Context

## What This Is
Multi-tenant church management SaaS. Next.js 15 App Router, TypeScript strict, Tailwind CSS v3, shadcn/ui, Supabase (Auth + Postgres + RLS). No ORM — raw Supabase JS client only.

## Path Alias
Always use `@/` for imports. Never use relative `../../` imports. `@/*` maps to `src/*`.

## Non-Negotiable Rules — Never Violate These
- Never rename form input `name=""` attributes — server actions read them by name
- Never remove `requireChurchWorkspaceAccess()`, `requireMemberPortalAccess()`, or `requirePlatformAdmin()` calls from page files — they guard access control
- Never remove or weaken the post-claim invite verification block that checks `status === "claimed"`, `claimed_at`, and `claimed_by_user_id`
- Never set `portal_joined_at` anywhere except `completeFirstLoginPasswordChangeAction` in `src/features/member-portal/actions.ts`
- Always preserve `revalidatePath()` calls after mutations
- All Server Actions must return `{ ok: true } | { ok: false; error: string }` — never throw to client
- Never write to Supabase from client components — all mutations go through Server Actions (`"use server"`)
- Never add `"use client"` to page files — they are RSC by default

## DB Awareness
- `src/types/database.ts` is INCOMPLETE — tables like `member_onboarding_invites`, `church_access_requests`, `treasury_funds` have no TypeScript types. Queries on these use implicit `any`. This is known.
- `must_change_password` exists on the `profiles` table but is NOT in `database.ts`. Never remove it from the `ProfileRow` local type in `src/features/access/queries.ts`.
- Never regenerate database.ts from Supabase without manually restoring `must_change_password` and the extra `member_departments` columns.

## Display Language Rule
- Raw DB enum values (e.g. `pending`, `church_open`, `mission_remittance`) must NEVER be rendered directly in JSX
- Always pass through `getLabel()` from `@/lib/display-maps`
- No dev/technical language visible to users — no "slug", no column names, no raw status values

## Architecture
- Feature modules: `src/features/[domain]/actions.ts`, `queries.ts`, `types.ts`
- Pages are RSC by default — `"use client"` only when truly needed for interactivity
- Server Supabase client: `src/lib/supabase/server.ts`
- Browser Supabase client: `src/lib/supabase/client.ts`
- Privileged multi-table DB writes go through Supabase RPC functions, not chained inserts

## UI Standards
- Use `WorkspaceHero`, `WorkspaceStatCard`, `WorkspaceSectionCard`, `WorkspaceEmptyState`, `WorkspaceControlRail` — do not create new layout wrappers
- Use `useToast()` from `@/hooks/use-toast` — never `alert()`
- All form inputs use shadcn `<Input>`, `<Label>`, `<Select>` — raw native `<input>` is banned
- Status colors: emerald=active, slate=inactive, red=revoked/danger, amber=pending/visitor, blue=info

## Current Phase
Phase 2 UI refactor — incremental patch packs. See MPG_PHASE2_REFACTOR_PLAN.md for full details.
Each session has a specific pack goal. Do not stray outside the files listed for that pack.
```

Save and close Notepad.

---

### Step 4: Place the Phase 2 plan where Claude Code can read it

Copy `MPG_PHASE2_REFACTOR_PLAN.md` into your project root so Claude Code can reference it:

```powershell
# If the file is elsewhere, copy it in
Copy-Item "path\to\MPG_PHASE2_REFACTOR_PLAN.md" "E:\mpg-church-system\MPG_PHASE2_REFACTOR_PLAN.md"
```

---

## Part 2 — How to Run a Session

### Opening a session

Always navigate to your project root first, then launch:

```powershell
cd "E:\mpg-church-system"
claude
```

You will see:

```
╭─────────────────────────────────╮
│ ✻ Welcome to Claude Code!       │
│                                 │
│ /help for help                  │
│ cwd: E:\mpg-church-system       │
╰─────────────────────────────────╯
```

Claude Code has read your `CLAUDE.md` automatically.

---

### The session workflow for each pack

**1. Check context usage before starting:**

```
/context
```

Should be at 0% for a fresh session. If you're resuming, check it's below 40%.

**2. Paste the pack brief** (copy from the template below, fill in the pack details):

```
I'm implementing Pack [N] of the MPG Phase 2 UI refactor.

Goal: [paste goal from Phase 2 plan]

Files in scope (touch ONLY these):
- [file 1]
- [file 2]

Rules for this session:
- Preserve all requireXxx() guard calls at top of page files
- Do not rename any form input name attributes
- Preserve all revalidatePath() calls
- Keep { ok: true } | { ok: false, error } return shapes on all actions
- Use @/ path alias, never relative imports
- Do not add any new Supabase writes or RPCs
- Never render raw DB enum values in JSX — use getLabel() from @/lib/display-maps
- No developer/database language in user-visible strings

Changes needed:
[paste the specific changes from the pack description]

Read the files in scope first, then make the changes.
Do not touch any files outside the scope list.
```

**3. Review what Claude Code proposes before it writes:**

When Claude Code shows you a diff or a plan, read it. If anything looks wrong — especially if it's touching files outside your scope list or removing guard calls — type:

```
Stop. That touches [file] which is outside scope. Only change [file in scope].
```

**4. Monitor context during the session:**

```
/context
```

If you hit 60%+, run:

```
/compact
```

This summarizes the conversation history to free up context without losing progress.

**5. After Claude Code finishes changes, verify:**

```powershell
# Check TypeScript compiles with no new errors
npx tsc --noEmit

# Check the dev server still starts
npm run dev
```

If TypeScript fails, paste the error back into Claude Code:

```
tsc threw this error after your changes: [paste error]
Fix it without changing any files outside the scope list.
```

**6. Test the changed feature manually** (see test checklist per pack below).

**7. Commit:**

```powershell
git add .
git commit -m "refactor(ui): Pack N — [pack goal]"
```

---

### If Claude Code goes off-track

Claude Code is agentic — it can start reading and modifying files you didn't ask it to. When this happens:

**Option A — Stop and redirect:**
```
Stop. You're modifying [file] which is outside scope for this pack. Revert any changes to that file and only work on [correct file].
```

**Option B — Hard reset the session:**

```powershell
# In PowerShell, Ctrl+C to exit the session
# Then discard uncommitted changes
git checkout -- .

# Start a fresh session
claude
```

---

## Part 3 — Pack-by-Pack Execution Scripts

Copy the brief for your current pack, fill in the bracketed parts from the Phase 2 plan, and paste into Claude Code.

---

### Pack 1 — Shared Infrastructure + Display Maps

**Start this pack:**

```
I'm implementing Pack 1 of the MPG Phase 2 UI refactor — Shared Infrastructure.

Goal: Create the shared component files and the display maps utility that all other packs depend on.

Files to CREATE (these do not exist yet):
- src/components/ui/StatusBadge.tsx
- src/components/ui/ConfirmDialog.tsx
- src/components/ui/StepIndicator.tsx
- src/components/ui/FormSection.tsx
- src/components/ui/InlineAlert.tsx
- src/components/ui/CopyableLink.tsx
- src/components/navigation/Breadcrumb.tsx
- src/lib/display-maps.ts

Do not touch any existing files. Only create new files.

Specs:

StatusBadge — Props: { status: string; context?: "member"|"invite"|"approval"|"event" }
Color map: active/claimed/approved/published=emerald, inactive/cancelled/revoked=slate, pending=amber, rejected=red, visitor=amber, transferred=blue, deceased=slate
Use the existing Badge component from @/components/ui/badge if it exists, otherwise build with a styled <span>.

ConfirmDialog — Wraps shadcn Dialog. Props: { open: boolean; onOpenChange: (v:boolean)=>void; title: string; description: string; confirmLabel: string; onConfirm: ()=>void; variant?: "danger"|"default" }
Danger variant makes the confirm button destructive (red).

StepIndicator — Props: { steps: string[]; currentStep: number }
Shows numbered steps in a horizontal row. Current step is highlighted in blue. Completed steps show a checkmark. Future steps are gray.

FormSection — Props: { title: string; description?: string; children: React.ReactNode }
Renders a <fieldset> equivalent with a visible title, optional description, and children below. Separated by a border-bottom or spacing from the next section.

InlineAlert — Props: { variant: "error"|"success"|"warning"|"info"; message: string; className?: string }
Maps variants to colors: error=red, success=emerald, warning=amber, info=blue. Renders an icon + message in a rounded banner.

CopyableLink — Props: { url: string; label?: string; showWhatsApp?: boolean }
Displays a read-only input with the URL and a "Copy Link" button. If showWhatsApp is true, shows a "Share via WhatsApp" link that opens https://wa.me/?text=encodeURIComponent(url).
Shows a brief "Copied!" confirmation after clicking copy.

Breadcrumb — Client component ("use client"). Props: { items: { label: string; href?: string }[] }
Renders items separated by / chevrons. Last item has no link. Uses Next.js <Link> for items with href.

display-maps.ts — A plain TypeScript utility file (no React). Export:
- memberStatusLabels, memberTypeLabels, inviteStatusLabels, inviteTypeLabels, workflowStateLabels, eventStatusLabels, approvalStageLabels, inflowTypeLabels, outflowTypeLabels, genderLabels, maritalStatusLabels
- getLabel(map, value) helper that returns map[value] or falls back to capitalizing the raw value (replace underscores with spaces, capitalize each word)

All components use @/ imports and Tailwind classes only. No new dependencies.
```

**After Pack 1 — verify:**

```powershell
npx tsc --noEmit
```

Should be zero errors. The new files will have no consumers yet so TypeScript won't validate usage.

---

### Pack 2 — Auth Form Visual Pass

```
I'm implementing Pack 2 of the MPG Phase 2 UI refactor — Auth Form Visual Pass.

Goal: Replace all raw native <input> and <label> elements in public-facing forms with shadcn Input and Label components. Add password visibility toggles on all password fields.

Files in scope (read these first, then patch):
- src/app/(public)/login/LoginForm.tsx  (or wherever LoginForm is defined — find it)
- src/app/(public)/register/RegisterForm.tsx
- src/app/(public)/join/[churchSlug]/MemberJoinForm.tsx
- src/features/member-portal/components/FirstLoginPasswordGate.tsx

Rules:
- Do NOT change any form input name attributes
- Do NOT change the Server Action being called or its arguments
- Do NOT change useActionState hooks or form submission logic
- Preserve all existing error display logic
- Use Input from @/components/ui/input and Label from @/components/ui/label
- For password fields: add an eye/eye-off icon toggle using useState to switch type between "password" and "text". Use the Eye and EyeOff icons from lucide-react.
- In FirstLoginPasswordGate: replace window.location.href with router.push() using useRouter from next/navigation
- Member join form: add helper text below the memberCode field: "Your member code was given to you by your church administrator. Leave this blank if you don't have one."

Read each file before changing it. Make minimal changes — only the input/label swaps, password toggles, and the router fix.
```

---

### Pack 3 — Notifications Cap + Sidebar Cleanup

```
I'm implementing Pack 3 of the MPG Phase 2 UI refactor — Shell Fixes.

Goal: Cap the notifications dropdown height. Clean up sidebar clutter.

Files in scope:
- src/components/navigation/ChurchHeader.tsx
- src/components/navigation/ChurchSidebar.tsx

Changes:

ChurchHeader.tsx:
- Find the notifications dropdown content div (the one that renders the list of notifications)
- Add className="max-h-[400px] overflow-y-auto" to that container
- Do not change any other logic

ChurchSidebar.tsx:
- Remove the slug display if it's showing the raw URL slug (e.g. "/c/grace-church")
- Remove the "Navigation" section label if it exists — it adds no value
- Do not change any routing, role filtering logic, or nav item visibility logic
- Do not change any className on the sidebar shell itself

Read both files before making changes. Make minimal targeted edits only.
```

---

### Pack 4 — Member Portal Critical Fixes

```
I'm implementing Pack 4 of the MPG Phase 2 UI refactor — Member Portal Critical Fixes.

Goal: Remove placeholder tab content visible to real users, fix navigation duplication, add Sign Out to sidebar.

Files in scope:
- src/app/(member)/my/[churchSlug]/page.tsx
- src/components/navigation/MemberPortalShell.tsx  (or wherever the portal shell is)
- src/features/member-portal/components/  (check what's in here)

Read all files in scope first before making changes.

Changes:

1. Find any call to renderPlaceholderTab() or any tab content that contains placeholder text like "this tab will" or "coming soon" or "next phase". Remove these tabs from the tab list entirely — do not render them at all. It is better to have fewer tabs with real content than to show tabs with placeholder copy to real church members.

2. If the portal renders both a sidebar navigation AND an inline tab row (WorkspaceTabs or similar), remove the inline tab row. The sidebar is the navigation. Do not have two navigation systems on one page.

3. In the portal sidebar (or MemberPortalShell), add a Sign Out button at the bottom. It should call signOutMemberPortalAction from src/features/member-portal/actions.ts. Style it as a subtle button with a LogOut icon from lucide-react.

4. If there is a Bell icon in the portal header that has no onClick or notification functionality wired up, remove it. Do not show UI elements that do nothing.

Do NOT touch the requireMemberPortalAccess() call at the top of the portal page.
Do NOT change the must_change_password gate logic.
```

---

### Pack 5 — Dashboard Cleanup

```
I'm implementing Pack 5 of the MPG Phase 2 UI refactor — Dashboard Cleanup.

Goal: Replace bespoke DashboardShell with WorkspaceHero, wire OfficeAttentionStrip, fix mobile layout.

Files in scope:
- src/app/(church)/c/[churchSlug]/page.tsx  (the dashboard page)
- src/components/navigation/DashboardShell.tsx  (to be deleted after)

Read the dashboard page and DashboardShell first.

Changes:

1. In the dashboard page, replace the <DashboardShell> usage with <WorkspaceHero> from @/components/workspace/WorkspaceHero (or wherever it lives). Pass the church name as the title. Pass the three action buttons (Manage Members, Open Events, Open Reports) via the actions prop that WorkspaceHero already supports.

2. Find where OfficeAttentionStrip is used (likely src/features/office/ or src/app/(church)/c/[churchSlug]/office/). Import and render it on the dashboard page below the hero, only if the component already exists and is self-contained. Do not build OfficeAttentionStrip if it doesn't exist — that is a future pack.

3. Fix the hero action buttons to wrap on mobile: change the button group container to flex flex-col sm:flex-row gap-2 if it isn't already.

4. Ensure the stat cards grid uses grid-cols-2 md:grid-cols-4. If it's currently grid-cols-1 or grid-cols-3, fix it.

After the page compiles and works, delete DashboardShell.tsx.

Do NOT touch requireChurchWorkspaceAccess() at the top of the page.
```

---

### Pack 6 — Invite Onboarding 3-Step Wizard

```
I'm implementing Pack 6 of the MPG Phase 2 UI refactor — Invite Onboarding Wizard.

Goal: Convert RichInviteOnboardingForm from a single-page 15-field scroll into a 3-step form.

Files in scope:
- src/features/member-invite/components/RichInviteOnboardingForm.tsx

THIS IS A MEDIUM-RISK CHANGE. Read the full file carefully before touching anything.

Critical constraints:
- Do NOT change any form input name attributes — the server action reads them by name
- Do NOT change completeRichInviteOnboardingAction or its call signature
- Do NOT move the server action call — it must still fire on final step submit only
- The acknowledgement checkbox (access acknowledgement / agree to terms) MUST stay on Step 3
- All fields that currently exist must still be collected — just shown across different steps
- Do NOT add any new form fields or remove any existing ones

Implementation:
Add const [step, setStep] = useState<1|2|3>(1) to the component.
Add const [formValues, setFormValues] = useState({}) to collect field values across steps if the form uses uncontrolled inputs — or if it already uses controlled state, use that.

Step 1 — "Create Account": firstName, lastName, email, phone, password, confirmPassword
Step 2 — "Your Profile": DOB, gender, address, city, country, maritalStatus, baptismDate, membershipType (all optional — label them "(optional)")
Step 3 — "Church Involvement": departments checkboxes, role selector, acknowledgement checkbox

Add StepIndicator from @/components/ui/StepIndicator at the top of the form with steps={["Create Account", "Your Profile", "Church Involvement"]} and currentStep={step}.

Add a "Next" button for steps 1 and 2. Add a "Back" button for steps 2 and 3.
The existing Submit button only appears on Step 3.

The Next button on Step 1 should validate: firstName, lastName, email, and password are not empty before advancing. Show an inline error if they're missing.

Step 2 and 3 "Next"/"Back" do not need validation — all Step 2 fields are optional.

Use FormSection from @/components/ui/FormSection to group fields within each step.

The server action call and all existing hidden inputs must remain on the form and be included in the final submit.
```

---

### Pack 7 — Breadcrumbs + Approval Badge

```
I'm implementing Pack 7 of the MPG Phase 2 UI refactor — Breadcrumbs and Approval Badge.

Goal: Add breadcrumb navigation to detail pages. Add approval count badge to sidebar.

Files in scope:
- src/components/navigation/ChurchSidebar.tsx
- src/features/approvals/queries.ts
- src/app/(church)/c/[churchSlug]/members/[memberId]/page.tsx
- src/app/(church)/c/[churchSlug]/treasury/in/[entryId]/edit/page.tsx  (if it exists)
- src/app/(church)/c/[churchSlug]/departments/[departmentId]/page.tsx  (if it exists)

Read each file before changing it.

Change 1 — Approval count query:
In src/features/approvals/queries.ts, add a new exported async function:
  getMyPendingApprovalCount(churchId: string, userId: string, roles: string[]): Promise<number>
It should query the approval_requests table for rows where:
- church_id = churchId
- status = "pending"
- current_assignee_role_code is in the roles array
Return the count. If the query fails, return 0 (fail silently — this is a badge, not critical data).
Use the server Supabase client from @/lib/supabase/server.

Change 2 — Sidebar badge:
In ChurchSidebar.tsx, find the "Approvals" nav item. Import getMyPendingApprovalCount and call it with the church's context. Render a small numeric badge (use the Badge component from @/components/ui/badge) next to the "Approvals" label showing the count. Only show the badge if count > 0.

Change 3 — Breadcrumbs:
In each detail page listed in scope:
- Import Breadcrumb from @/components/navigation/Breadcrumb
- Add it at the top of the page content (below the WorkspaceHero or page head), before the main content
- Member detail: items={[{ label: "Members", href: `/c/${churchSlug}/members` }, { label: memberName }]}
- Treasury entry edit: items={[{ label: "Treasury", href: `/c/${churchSlug}/treasury` }, { label: "Inflows", href: `/c/${churchSlug}/treasury/in` }, { label: "Edit Entry" }]}
- Department detail: items={[{ label: "Departments", href: `/c/${churchSlug}/departments` }, { label: departmentName }]}

Do NOT touch requireChurchWorkspaceAccess() in any page file.
```

---

### Pack 8 — Treasury Restructure

```
I'm implementing Pack 8 of the MPG Phase 2 UI refactor — Treasury Tab Restructure.

Goal: Flatten the nested two-level tab hierarchy. Add numeric keyboard on amount fields.

Files in scope — read these first to understand the current structure:
- src/app/(church)/c/[churchSlug]/treasury/  (read the whole directory structure)
- The main TreasuryWorkspace component (find it in src/features/treasury/ or the treasury page)

This is a layout restructure only. Do NOT change:
- Any server action calls or argument shapes
- Any form input name attributes
- Any Supabase queries
- The revalidatePath calls

Changes:
1. The main treasury page should have these top-level tabs: Record | Ledger | Funds | Reports
2. Under "Record": show Tithe, Offering, and Donation as three WorkspaceSectionCard sections on a single page — not as sub-tabs. Each section has its own entry form inline.
3. Add inputMode="numeric" to all amount/currency input fields in the treasury forms.
4. On the net balance stat card: if the value is positive, apply text-emerald-600 to the number. If negative, apply text-red-600.
5. If /treasury/in/new and /treasury/out/new exist as separate pages and the forms are now inline, add a redirect from those pages to /c/[churchSlug]/treasury. Do not delete the route files, just add a redirect at the top using redirect() from next/navigation.
```

---

### Pack 9 — Members Module UX Pass

```
I'm implementing Pack 9 of the MPG Phase 2 UI refactor — Members Module UX Pass.

Goal: Add WorkspaceHero action for New Member, rename tab, add breadcrumb, mobile layout.

Files in scope:
- Find the main members workspace page or component (likely src/app/(church)/c/[churchSlug]/members/page.tsx or src/features/members/components/MembersWorkspaceUnified.tsx)
- src/app/(church)/c/[churchSlug]/members/[memberId]/page.tsx

Read before changing.

Changes:

1. The "Directory Health" tab (or "Profile Health" tab if already renamed) should be renamed to "Profile Completeness". Find the tab label string and change it. Do not change any query or logic.

2. The WorkspaceHero on the members page should have a "New Member" button in its actions prop that links to /c/[churchSlug]/members/new. If WorkspaceHero doesn't currently have this action, add it.

3. Add Breadcrumb from @/components/navigation/Breadcrumb to the member detail page. Place it between the page head and the first content section.

4. For the member directory list: below the md breakpoint, the member cards should render in a single-column layout. Check if they're already doing this. If the grid is fixed at multiple columns on mobile, change the container to grid-cols-1 md:grid-cols-2 or let it be a flex-col on small screens.

Do NOT touch requireChurchWorkspaceAccess() in any page.
Do NOT touch MemberInviteButton — that is Pack 12 and is intentionally deferred.
```

---

### Pack 10 — Access Control Tabs + CopyableLink

```
I'm implementing Pack 10 of the MPG Phase 2 UI refactor — Access Control Restructure.

Goal: Add tabs to access-control page, integrate CopyableLink for invite URLs.

Files in scope:
- src/app/(church)/c/[churchSlug]/access-control/page.tsx
- src/features/access-control/  (read all files here)

Read all files before changing.

Changes:

1. The access-control page should have three tabs: "Invite Members" | "Pending Requests" | "Invite History"
   - "Invite Members": the invite creation form / InviteLinkPanel (whatever generates invite links)
   - "Pending Requests": the list of pending church_access_requests and department_leadership_requests
   - "Invite History": the list of historical invites with their status

2. In the invite creation result — wherever the generated invite URL is currently displayed (likely as plain text or a simple input) — replace it with the CopyableLink component from @/components/ui/CopyableLink. Pass showWhatsApp={true}.

3. Display the invite expiry date next to the link: "Expires [date]" formatted as a human-readable date (e.g. "April 21, 2026"). Use the expires_at value from the invite record.

4. Display the invite type using inviteTypeLabels from @/lib/display-maps instead of the raw invite_type value.
   Display invite status using inviteStatusLabels from @/lib/display-maps instead of raw status values.

Do NOT touch requireChurchWorkspaceAccess() or the permission check canCurrentUserManageMemberInvites().
Do NOT change createMemberInviteAction or createOpenOnboardingInviteAction.
```

---

### Pack 11 — New Member + Optional Invite

```
I'm implementing Pack 11 of the MPG Phase 2 UI refactor — New Member with Optional Invite.

Goal: Add an optional "Send portal invite after creating this member" checkbox to the new member form.

Files in scope:
- Find the new member form (src/app/(church)/c/[churchSlug]/members/new/page.tsx or a form component it uses)
- src/features/members/actions.ts  (to understand createMemberAction)
- src/features/member-invite/actions.ts  (to understand createMemberInviteAction — read only, do not change)

Read all files before changing.

Changes:

1. At the bottom of the new member form, add a checkbox with label: "Send a portal invite to this member after creating their record"

2. This checkbox should be controlled state (useState). It is OFF by default.

3. On form submit, after createMemberAction returns { ok: true, memberId } (check what it actually returns), if the checkbox is checked:
   - Call createMemberInviteAction(churchSlug, memberId)
   - Wrap this in its own try/catch
   - If the invite succeeds: show the invite URL using CopyableLink from @/components/ui/CopyableLink in a success state panel
   - If the invite fails: show a warning InlineAlert saying "Member created, but the invite link could not be generated. You can send an invite from the Access Control page." — do NOT fail the member creation because of invite failure

4. If createMemberAction does not currently return the new memberId, check if it returns it — if not, note this to me but do not change the action signature without my approval.

5. The success state should show: member name, "Member created successfully", and either the invite link (CopyableLink) or a plain success message.

Do NOT change createMemberAction or createMemberInviteAction.
Do NOT change requireChurchWorkspaceAccess() in the page.
```

---

### Pack 12 — MemberInviteButton Functional Fix (LAST — read carefully)

```
I'm implementing Pack 12 of the MPG Phase 2 UI refactor — MemberInviteButton Fix.

⚠️ This is the highest-risk pack. Read EVERYTHING carefully before changing anything.

Goal: Fix MemberInviteButton so it actually calls createMemberInviteAction and creates a real invite record. Currently it does not call the action, meaning no database row is created and no portal_invited_at is set.

Files in scope — read ALL of these first:
- src/features/members/components/MembersWorkspaceUnified.tsx  (find where MemberInviteButton is used)
- Find the MemberInviteButton component file (search for it)
- src/features/member-invite/actions.ts  (read the createMemberInviteAction — do NOT change it)

Read and describe back to me what MemberInviteButton is currently doing before making any changes.
Wait for my confirmation before proceeding.

When I confirm, implement:

1. MemberInviteButton should be an async-capable button that:
   - Shows a loading spinner while the action is pending (use useState for isPending)
   - Calls createMemberInviteAction(churchSlug, memberId) as a server action call
   - On success: shows the returned invite URL in a CopyableLink from @/components/ui/CopyableLink inside a Popover or Sheet. Include showWhatsApp={true}.
   - On error: shows an InlineAlert from @/components/ui/InlineAlert with the error message
   - Does NOT generate or construct a URL itself — the URL comes only from the action response

2. The button label should read "Invite to Portal" — not "Copy Invite Link" or similar (those imply the link already exists).

3. If a pending invite already exists for this member (the action returns the existing pending invite URL rather than creating a new one — this is the deduplication logic), the displayed invite URL should still work the same way.

Do NOT change createMemberInviteAction.
Do NOT change any other component in the file.
After implementing, tell me what fields to verify in the database after testing.
```

---

## Part 4 — Verification Checklist Per Pack

After every pack, run this in PowerShell before committing:

```powershell
# 1. TypeScript check
npx tsc --noEmit

# 2. Dev server starts
npm run dev

# 3. Check git diff to confirm only expected files changed
git diff --name-only
```

**Pack-specific things to verify manually:**

| Pack | Manual verification |
|---|---|
| 1 | Import StatusBadge and getLabel in a scratch file, confirm no TS errors |
| 2 | Log in, register, join page — forms submit and redirect correctly |
| 3 | Open notifications, scroll works. Sidebar has no slug label. |
| 4 | Portal loads, all visible tabs have real content, sign out works |
| 5 | Dashboard renders with WorkspaceHero, DashboardShell file is deleted |
| 6 | Claim a full invite: both member and church_open types. Check DB: `member_onboarding_invites.status = 'claimed'` |
| 7 | Navigate to member detail — breadcrumb shows. Approvals sidebar badge shows count |
| 8 | Record a tithe entry in the new flat layout. Entry appears in ledger. |
| 9 | Members page loads. "Profile Completeness" tab visible. Mobile view is single column. |
| 10 | Generate invite — CopyableLink shows, copy works, WhatsApp link opens correctly |
| 11 | Create member with invite checked → member row in DB + invite row in `member_onboarding_invites` + `members.portal_invited_at` set |
| 12 | Same as Pack 11 items + claim the invite end-to-end → `status = 'claimed'`, `claimed_at` set, `claimed_by_user_id` set |

---

## Part 5 — Common Claude Code Commands

| Command | What it does |
|---|---|
| `/context` | Shows how much context (token %) has been used |
| `/compact` | Summarizes conversation to free up context. Run at 60%+ |
| `/clear` | Clears conversation history entirely (use if starting a fresh pack) |
| `/undo` | Reverts the last file change Claude Code made |
| `Ctrl+C` | Exits Claude Code session |
| `/help` | Full command list |

---

## Part 6 — Git Branching Strategy

Run each pack on its own branch so you can revert cleanly:

```powershell
# Before starting each pack
git checkout -b refactor/pack-1-shared-infrastructure
# ... do the work, verify ...
git add .
git commit -m "refactor(ui): Pack 1 — shared components and display maps"
git checkout main
git merge refactor/pack-1-shared-infrastructure

# Next pack
git checkout -b refactor/pack-2-auth-forms
```

This way if Pack 6 breaks something, you can `git revert` without touching Packs 1–5.

---

## Part 7 — Quick Reference: The Non-Negotiables

Include in EVERY Claude Code session. Print this and keep it visible.

```
NEVER:
- Rename form input name="" attributes
- Remove requireChurchWorkspaceAccess(), requireMemberPortalAccess(), requirePlatformAdmin()
- Remove the post-claim invite verification (status, claimed_at, claimed_by_user_id checks)
- Set portal_joined_at anywhere except completeFirstLoginPasswordChangeAction
- Write to Supabase from client components
- Add "use client" to page files
- Render raw DB enum values in JSX (use getLabel() from display-maps)
- Show technical/developer language to users

ALWAYS:
- Use @/ path alias
- Keep revalidatePath() calls
- Keep { ok: true } | { ok: false, error } action shapes
- Use shadcn Input/Label/Select for all form fields
- Read the file before changing it
- Stay within the scope list for the pack
```
