# i18n Audit Report - MPG Church System

**Date:** April 2025  
**Scope:** Full application EN/FR language support audit  
**Auditor:** AI Assistant  

---

## Summary Status

| Metric | Count | Percentage |
|--------|-------|------------|
| Total TSX Files Scanned | ~216 | 100% |
| Files Using i18n | ~35 | ~16% |
| Partially Translated | ~45 | ~21% |
| Not Translated | ~136 | ~63% |

**Overall Status:** ⚠️ PARTIAL - Core navigation and shared components translated, many feature pages still have hardcoded English

---

## Coverage by Module

### ✅ Fully Translated (Using useI18n)

| File | Module | Notes |
|------|--------|-------|
| `src/components/navigation/ChurchSidebar.tsx` | Navigation | All nav items, labels translated |
| `src/components/navigation/ChurchHeader.tsx` | Navigation | Page labels, notifications, user menu translated |
| `src/app/(member)/my/[churchSlug]/components/MemberPortalShell.tsx` | Member Portal | Navigation, labels, welcome message translated |
| `src/app/(public)/page.tsx` | Public | Landing page fully translated |
| `src/app/(public)/login/page.tsx` | Public | Login page translated |
| `src/app/(public)/login/LoginForm.tsx` | Public | Form labels, errors translated |
| `src/components/marketing/MarketingHeader.tsx` | Marketing | Navigation translated |
| `src/components/marketing/MarketingFooter.tsx` | Marketing | Footer content translated |
| `src/components/marketing/LanguageSwitcher.tsx` | Shared | Language toggle component |

### 🟡 Partially Translated

| File | Module | Status | Notes |
|------|--------|--------|-------|
| `src/app/(church)/c/[churchSlug]/page.tsx` | Church | Partial | Uses WorkspaceHero with hardcoded strings |
| `src/app/(church)/c/[churchSlug]/dashboard/page.tsx` | Church | Partial | Dashboard content has hardcoded strings |
| `src/app/(church)/c/[churchSlug]/members/page.tsx` | Members | Partial | Some UI elements not translated |
| `src/app/(church)/c/[churchSlug]/settings/SettingsTabs.tsx` | Settings | Partial | Church settings form labels not translated |
| `src/app/(platform)/platform/settings/page.tsx` | Platform | Partial | Platform settings partially translated |
| `src/app/(public)/create-church/CreateChurchForm.tsx` | Public | Partial | Form uses church namespace |

### ❌ Not Translated (Hardcoded English)

#### Church Workspace (/c/[churchSlug]/*)
- `src/app/(church)/c/[churchSlug]/members/*.tsx` - Member forms, tables, actions
- `src/app/(church)/c/[churchSlug]/households/*.tsx` - Household forms and lists
- `src/app/(church)/c/[churchSlug]/departments/*.tsx` - Department forms and lists
- `src/app/(church)/c/[churchSlug]/treasury/**/*.tsx` - Treasury forms, tables, transactions
- `src/app/(church)/c/[churchSlug]/events/**/*.tsx` - Event forms and lists
- `src/app/(church)/c/[churchSlug]/reports/**/*.tsx` - Reports tabs, filters, data tables
- `src/app/(church)/c/[churchSlug]/attendance/*.tsx` - Attendance recording forms
- `src/app/(church)/c/[churchSlug]/calendar/*.tsx` - Calendar views
- `src/app/(church)/c/[churchSlug]/office/*.tsx` - Office workspace components
- `src/app/(church)/c/[churchSlug]/approvals/*.tsx` - Approvals inbox
- `src/app/(church)/c/[churchSlug]/access-control/*.tsx` | Access control panels
- `src/app/(church)/c/[churchSlug]/announcements/*.tsx` | Announcements
- `src/app/(church)/c/[churchSlug]/leadership/*.tsx` | Leadership management

#### Member Portal (/my/[churchSlug])
- `src/app/(member)/my/[churchSlug]/page.tsx` - Main portal page content
- `src/app/(member)/my/[churchSlug]/components/MemberPortalWorkspace.tsx` - Workspace content

#### Platform Admin (/platform/*)
- `src/app/(platform)/platform/page.tsx` - Platform dashboard
- `src/app/(platform)/platform/churches/*.tsx` - Church management
- `src/features/platform/components/*.tsx` - Platform UI components

#### Public Pages
- `src/app/(public)/register/*.tsx` - Registration forms
- `src/app/(public)/invite/[token]/*.tsx` - Invite claim flow
- `src/app/(public)/join/[churchSlug]/*.tsx` | Member join flow

#### Feature Components
- `src/features/departments/components/*.tsx` | Department management
- `src/features/events/components/*.tsx` | Event management
- `src/features/calendar/components/*.tsx` | Calendar components
- `src/features/treasury/components/*.tsx` | Treasury management
- `src/features/reports/components/*.tsx` | Reports workspace
- `src/features/approvals/components/*.tsx` | Approvals UI
- `src/features/office/components/*.tsx` | Office workspace
- `src/features/leadership/components/*.tsx` | Leadership management

#### Shared/UI Components
- `src/components/workspace/*.tsx` | Workspace components (accept translated strings via props)
- `src/components/ui/*.tsx` | UI primitives (not translated - accept labels via props)

---

## Translation Dictionary Coverage

### Common Namespace (~30 keys)
- ✅ Basic actions: save, cancel, delete, edit, create, search
- ✅ Status: active, inactive, invited
- ✅ Feedback: error, success, warning, info
- ✅ UI labels: loading, notFound, noResults
- ✅ Added: user, noEmail, notifications, markAllRead, noNotifications, unknownTime, openNavigation, church, overview

### Auth Namespace (~15 keys)
- ✅ Login/register forms
- ✅ Field labels: email, password, fullName
- ✅ Error messages

### Navigation Namespace (~20 keys)
- ✅ Main nav: dashboard, members, departments, treasury, events, etc.
- ✅ Added: workspace, office, approvals, accessControl, calendar, announcements, leadership, memberPortal, overview

### Feature Namespaces
- ✅ members: Member management labels (~50 keys)
- ✅ departments: Department labels (~10 keys)
- ✅ households: Household labels (~10 keys)
- ✅ events: Event labels (~10 keys)
- ✅ attendance: Attendance labels (~8 keys)
- ✅ treasury: Treasury labels (~12 keys)
- ✅ reports: Report labels (~12 keys)
- ✅ settings: Settings labels (~12 keys)
- ✅ platform: Platform admin labels (~10 keys)
- ✅ church: Church creation labels (~15 keys)
- ✅ landing: Landing page content (~20 keys)
- ✅ Added: dashboard (~8 keys), errors (~5 keys), memberPortal (~7 keys)

---

## Notable Risks & Edge Cases

### 1. **Server Components Limitation**
Many pages use Server Components which cannot use the `useI18n` hook. These need to:
- Either be converted to Client Components ("use client")
- Or accept translated strings via props from client parent components
- Or use a server-side translation solution

**Affected:** Most `/c/[churchSlug]/*` pages that are server-rendered

### 2. **Dynamic Content**
- Server action result messages are mostly hardcoded English
- Form validation messages need translation
- Date/time formatting uses Intl but may need locale-aware formats

### 3. **Third-Party Components**
- Calendar components may have hardcoded English
- Some shadcn/ui components have internal English text

### 4. **Mixed Language State**
When switching languages:
- ✅ Navigation updates immediately
- ⚠️ Page content may require refresh for server components
- ✅ Client components update reactively

### 5. **Incomplete French Translations**
Some newer keys may have machine-translated French that needs native speaker review:
- `memberPortal.accountReady` - Long sentence
- Technical terms like "workspace", "dashboard" may need contextual review

---

## Recommendations

### Priority 1 (Critical User Paths)
1. ✅ Navigation (DONE)
2. ✅ Header/Footer (DONE)
3. 🔄 Member Portal (PARTIAL - needs content translation)
4. 🔄 Dashboard (PARTIAL - needs content translation)

### Priority 2 (High Traffic)
1. Members list and detail views
2. Treasury forms and tables
3. Event forms and lists
4. Settings pages

### Priority 3 (Medium)
1. Reports workspace
2. Departments management
3. Households management
4. Calendar views

### Priority 4 (Lower)
1. Office workspace
2. Approvals workflow
3. Access control
4. Platform admin

---

## Technical Debt

1. **Hydration Handling**: Components use `mounted` state to prevent hydration mismatches
2. **Type Safety**: Translations type is properly exported and used
3. **Fallbacks**: Many components use `t.key || "Fallback"` pattern
4. **Server-Only Code**: Properly separated in `src/features/i18n/locale.ts`

---

## Conclusion

The i18n foundation is solid with proper infrastructure:
- ✅ I18nProvider with localStorage persistence
- ✅ Language switcher component with 3 variants
- ✅ EN/FR dictionaries with ~350+ keys
- ✅ Type-safe translation system
- ✅ Navigation and shell components fully translated

**Estimated Remaining Work:** 60-70% of pages need translation implementation, requiring approximately 30-40 hours of development work to achieve 95%+ coverage.
