# i18n Module Pages Audit Report

**Date:** April 2025
**Scope:** Comprehensive audit of all page content for EN/FR translation

---

## Executive Summary

| Module | Files Scanned | Fully Translated | Partially Translated | Not Translated | Status |
|--------|---------------|------------------|---------------------|----------------|--------|
| Dashboard | 5 | 1 | 2 | 2 | ⚠️ Partial |
| Members | 11 | 1 | 3 | 7 | ⚠️ Partial |
| Departments | 7 | 0 | 2 | 5 | ⚠️ Partial |
| Households | 6 | 0 | 2 | 4 | ⚠️ Partial |
| Events | 5 | 0 | 2 | 3 | ⚠️ Partial |
| Treasury | 12 | 1 | 3 | 8 | ⚠️ Partial |
| Reports | 11 | 0 | 2 | 9 | ⚠️ Partial |
| Settings | 4 | 1 | 2 | 1 | ⚠️ Partial |
| Leadership | 3 | 0 | 1 | 2 | ⚠️ Partial |
| Approvals | 3 | 0 | 1 | 2 | ⚠️ Partial |
| Office | 3 | 0 | 1 | 2 | ⚠️ Partial |
| Attendance | 1 | 0 | 1 | 0 | ⚠️ Partial |
| Calendar | 1 | 0 | 0 | 1 | ❌ None |
| Announcements | 3 | 0 | 0 | 3 | ❌ None |
| Access Control | 5 | 0 | 0 | 5 | ❌ None |
| Member Portal | 3 | 1 | 1 | 1 | ⚠️ Partial |
| Platform | 5 | 0 | 1 | 4 | ⚠️ Partial |
| Public | 6 | 2 | 2 | 2 | ⚠️ Partial |
| **TOTAL** | **103** | **7** | **26** | **70** | **⚠️ In Progress** |

---

## Module-by-Module Detailed Audit

### 1. Dashboard Module (`/c/[churchSlug]/dashboard/*`)

#### Files Scanned:
- `page.tsx` - ✅ Hero translated, Quick Links translated, System Status translated
- `DashboardActivityFeed.tsx` - ❌ NOT TRANSLATED (hardcoded strings)
- `DashboardQuickActions.tsx` - ❌ NOT TRANSLATED (hardcoded strings)
- `DashboardRecentSection.tsx` - ❌ NOT TRANSLATED (hardcoded strings)
- `DashboardSectionLoading.tsx` - ⚠️ PARTIAL (loading text)

#### Hardcoded Strings Found:
```
DashboardActivityFeed.tsx: "Activity Feed", "Recent activity will appear here"
DashboardQuickActions.tsx: "Quick Actions", action button labels
DashboardRecentSection.tsx: "Recent Members", "View All", table headers
```

---

### 2. Members Module (`/c/[churchSlug]/members/*`)

#### Files Scanned:
- `page.tsx` - ✅ TRANSLATED
- `[memberId]/page.tsx` - ✅ TRANSLATED
- `[memberId]/edit/page.tsx` - ❌ NOT TRANSLATED
- `[memberId]/components/*.tsx` - ❌ NOT TRANSLATED
- `components/MembersWorkspaceUnified.tsx` - ❌ NOT TRANSLATED
- `new/page.tsx` - ❌ NOT TRANSLATED
- `new/NewMemberForm.tsx` - ❌ NOT TRANSLATED
- `error.tsx` - ❌ NOT TRANSLATED
- `loading.tsx` - ❌ NOT TRANSLATED

#### Hardcoded Strings Found:
```
MembersWorkspaceUnified.tsx: Table headers, filter labels, button text
NewMemberForm.tsx: Form labels, validation messages, button text
EditMemberForm.tsx: Form labels, validation messages
MemberDepartmentAssignmentForm.tsx: Labels, buttons
MemberHouseholdReassignForm.tsx: Labels, buttons
MemberStatusChangeForm.tsx: Labels, buttons, options
MemberTransferForm.tsx: Labels, buttons
RemoveMemberDepartmentForm.tsx: Labels, buttons
```

---

### 3. Departments Module (`/c/[churchSlug]/departments/*`)

#### Files Scanned:
- `page.tsx` - ✅ TRANSLATED
- `[departmentId]/page.tsx` - ❌ NOT TRANSLATED
- `[departmentId]/announcements/page.tsx` - ❌ NOT TRANSLATED
- `[departmentId]/events/page.tsx` - ❌ NOT TRANSLATED
- `components/DepartmentsWorkspaceUnified.tsx` - ❌ NOT TRANSLATED
- `new/page.tsx` - ❌ NOT TRANSLATED
- `new/DepartmentForm.tsx` - ❌ NOT TRANSLATED

#### Hardcoded Strings Found:
```
[departmentId]/page.tsx: "Department Details", "Members", "Events", action buttons
DepartmentsWorkspaceUnified.tsx: Table headers, filter labels, empty states
DepartmentForm.tsx: Form labels, validation messages
```

---

### 4. Households Module (`/c/[churchSlug]/households/*`)

#### Files Scanned:
- `page.tsx` - ✅ TRANSLATED
- `[householdId]/page.tsx` - ❌ NOT TRANSLATED
- `new/page.tsx` - ❌ NOT TRANSLATED
- `new/HouseholdForm.tsx` - ❌ NOT TRANSLATED
- `error.tsx` - ❌ NOT TRANSLATED
- `loading.tsx` - ❌ NOT TRANSLATED

#### Hardcoded Strings Found:
```
[householdId]/page.tsx: "Household Details", "Members", action buttons
HouseholdForm.tsx: Form labels, validation messages, button text
```

---

### 5. Events Module (`/c/[churchSlug]/events/*`)

#### Files Scanned:
- `page.tsx` - ✅ TRANSLATED
- `components/EventsWorkspaceUnified.tsx` - ❌ NOT TRANSLATED
- `error.tsx` - ❌ NOT TRANSLATED
- `loading.tsx` - ❌ NOT TRANSLATED

#### Hardcoded Strings Found:
```
EventsWorkspaceUnified.tsx: Table headers, filter labels, status badges, empty states
```

---

### 6. Treasury Module (`/c/[churchSlug]/treasury/*`)

#### Files Scanned:
- `page.tsx` - ✅ TRANSLATED
- `components/TreasuryWorkspace.tsx` - ✅ TRANSLATED
- `components/TitheEntryForm.tsx` - ❌ NOT TRANSLATED
- `in/new/MoneyInForm.tsx` - ❌ NOT TRANSLATED
- `in/new/page.tsx` - ❌ NOT TRANSLATED
- `in/[entryId]/edit/InflowEditForm.tsx` - ❌ NOT TRANSLATED
- `in/[entryId]/edit/page.tsx` - ❌ NOT TRANSLATED
- `out/new/MoneyOutForm.tsx` - ❌ NOT TRANSLATED
- `out/new/page.tsx` - ❌ NOT TRANSLATED
- `out/[entryId]/edit/OutflowEditForm.tsx` - ❌ NOT TRANSLATED
- `out/[entryId]/edit/page.tsx` - ❌ NOT TRANSLATED
- `funds/new/FundCreateForm.tsx` - ❌ NOT TRANSLATED
- `audit/page.tsx` - ❌ NOT TRANSLATED

#### Hardcoded Strings Found:
```
TitheEntryForm.tsx: Form labels, member selector, amount fields
MoneyInForm.tsx: Form labels, validation messages, fund selector
MoneyOutForm.tsx: Form labels, validation messages, expense categories
InflowEditForm.tsx: Edit form labels, buttons
OutflowEditForm.tsx: Edit form labels, buttons
FundCreateForm.tsx: Fund creation form labels
```

---

### 7. Reports Module (`/c/[churchSlug]/reports/*`)

#### Files Scanned:
- `page.tsx` - ✅ TRANSLATED
- `ReportsWorkspace.tsx` - ❌ NOT TRANSLATED
- `ReportsFilterRail.tsx` - ❌ NOT TRANSLATED
- `ReportsOverviewSection.tsx` - ❌ NOT TRANSLATED
- `ReportsSectionLoading.tsx` - ❌ NOT TRANSLATED
- `tabs/*.tsx` (8 files) - ❌ NOT TRANSLATED

#### Hardcoded Strings Found:
```
ReportsWorkspace.tsx: Tab labels, workspace title
ReportsFilterRail.tsx: Filter labels, date pickers
ReportsOverviewSection.tsx: Section titles, stat cards
Reports tabs: All tab content, charts, tables
```

---

### 8. Settings Module (`/c/[churchSlug]/settings/*`)

#### Files Scanned:
- `page.tsx` - ✅ TRANSLATED
- `SettingsTabs.tsx` - ✅ TRANSLATED
- `error.tsx` - ❌ NOT TRANSLATED
- `loading.tsx` - ❌ NOT TRANSLATED

#### Hardcoded Strings Found:
```
error.tsx: Error messages
loading.tsx: Loading text
```

---

### 9-13. Other Modules (Leadership, Approvals, Office, Attendance, Calendar, Announcements, Access Control)

All have page.tsx with basic hero translated but workspace components NOT TRANSLATED.

---

### 14. Member Portal (`/my/[churchSlug]/*`)

#### Files Scanned:
- `page.tsx` - ✅ Shell only
- `components/MemberPortalShell.tsx` - ✅ TRANSLATED
- `components/MemberPortalWorkspace.tsx` - ❌ NOT TRANSLATED

#### Hardcoded Strings Found:
```
MemberPortalWorkspace.tsx: Tab content, profile forms, department lists
```

---

### 15. Platform (`/platform/*`)

#### Files Scanned:
- `platform/page.tsx` - ❌ NOT TRANSLATED
- `platform/churches/page.tsx` - ❌ NOT TRANSLATED
- `platform/churches/ChurchStatusToggle.tsx` - ❌ NOT TRANSLATED
- `platform/settings/page.tsx` - ❌ NOT TRANSLATED
- `platform/support/page.tsx` - ❌ NOT TRANSLATED

#### Hardcoded Strings Found:
```
PlatformDashboardClient.tsx: Dashboard cards, metrics, charts
PlatformChurchesClient.tsx: Church list, filters, actions
Platform settings and support pages
```

---

### 16. Public Routes (`/(public)/*`)

#### Files Scanned:
- `page.tsx` (landing) - ✅ TRANSLATED
- `login/page.tsx` - ✅ TRANSLATED
- `register/page.tsx` - ❌ NOT TRANSLATED
- `create-church/page.tsx` - ❌ NOT TRANSLATED
- `create-church/CreateChurchForm.tsx` - ⚠️ PARTIAL
- `join/[churchSlug]/page.tsx` - ❌ NOT TRANSLATED
- `invite/[token]/page.tsx` - ❌ NOT TRANSLATED

---

## Notable Risks and Blockers

### 1. **Server vs Client Component Boundaries**
- Many pages are Server Components that cannot use `useI18n` hook
- Solution: Use cookie-based translation helper
- Risk: Must ensure no hydration mismatches

### 2. **Dynamic Content**
- Server action result messages are hardcoded
- Toast notifications need translation
- Form validation messages need translation

### 3. **Third-Party Components**
- Some shadcn/ui components may have internal English
- Date pickers need locale configuration

### 4. **Workspace Components Complexity**
- Many workspace components have complex nested structures
- Filter rails, data tables, form builders all need translation
- Some use dynamic labels from database

### 5. **Translation Key Organization**
- Need consistent naming convention
- Some keys duplicate existing translations
- Need to maintain type safety

---

## Priority Order for Implementation

### Priority 1: High-Impact Pages
1. Members workspace (MembersWorkspaceUnified.tsx)
2. Member forms (NewMemberForm.tsx, EditMemberForm.tsx)
3. Treasury forms (MoneyInForm.tsx, MoneyOutForm.tsx)
4. Dashboard sections (DashboardActivityFeed, DashboardQuickActions)

### Priority 2: Medium-Impact
5. Departments workspace
6. Events workspace
7. Households detail and forms
8. Reports tabs

### Priority 3: Lower-Impact
9. Settings forms
10. Public routes (register, join, invite)
11. Platform pages
12. Error and loading states

---

## Translation Keys Needed (Estimated)

| Category | Estimated Keys Needed |
|----------|----------------------|
| Form labels | 150+ |
| Button text | 80+ |
| Table headers | 60+ |
| Empty states | 40+ |
| Validation messages | 50+ |
| Toast messages | 30+ |
| Error messages | 30+ |
| Filter labels | 40+ |
| Tab labels | 30+ |
| **TOTAL** | **~510** |

---

## Recommended Implementation Strategy

1. **Phase 1: Members Module** (Highest user impact)
   - MembersWorkspaceUnified.tsx
   - NewMemberForm.tsx
   - EditMemberForm.tsx

2. **Phase 2: Treasury Forms** (Critical for operations)
   - MoneyInForm.tsx
   - MoneyOutForm.tsx
   - TitheEntryForm.tsx

3. **Phase 3: Dashboard & Workspaces**
   - Dashboard sections
   - Departments workspace
   - Events workspace

4. **Phase 4: Reports & Settings**
   - Reports tabs
   - Settings forms

5. **Phase 5: Public & Platform**
   - Public forms
   - Platform pages

---

## Files with Use of useI18n (Already Translated Pattern)

1. `src/components/navigation/ChurchSidebar.tsx` - ✅ Uses useI18n
2. `src/components/navigation/ChurchHeader.tsx` - ✅ Uses useI18n
3. `src/app/(member)/my/[churchSlug]/components/MemberPortalShell.tsx` - ✅ Uses useI18n
4. `src/app/(church)/c/[churchSlug]/settings/SettingsTabs.tsx` - ✅ Uses useI18n
5. `src/app/(church)/c/[churchSlug]/treasury/components/TreasuryWorkspace.tsx` - ✅ Uses useI18n

---

## PowerShell Commands for Scanning

```powershell
# Find all TSX files with hardcoded strings
Get-ChildItem -Path "src/app" -Recurse -Filter "*.tsx" | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  # Look for hardcoded English strings in JSX
  $matches = [regex]::Matches($content, '(?<=>|\s)"[A-Z][a-z]+[^"]*"(?=\s*<|\s*\{)')
  if ($matches.Count -gt 0) {
    [PSCustomObject]@{
      File = $_.FullName.Replace($PWD, "")
      Matches = $matches.Count
    }
  }
}

# Find files not using useI18n
Get-ChildItem -Path "src/app" -Recurse -Filter "*.tsx" | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if ($content -match '"use client"' -and -not ($content -match 'useI18n')) {
    $_.FullName.Replace($PWD, "")
  }
}
```

---

## Conclusion

The i18n foundation is solid with ~470 existing keys. However, approximately 70 files still contain significant hardcoded English strings, particularly in:
- Workspace components (members, departments, events, treasury)
- Form components (member forms, treasury forms)
- Dashboard sections
- Reports tabs

Total estimated work: 510+ additional translation keys needed across 70+ files.
