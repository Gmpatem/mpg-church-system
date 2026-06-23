# Church Workspace Interaction System

This system gives church workspace routes one shared loading, feedback, async-state, and motion language. It lives under `src/components/church-workspace` and is intentionally UI-only: it does not change Supabase queries, RLS, route contracts, form bindings, notifications, approvals, or treasury side effects.

## Use The Shared Primitives

- Use `ChurchWorkspaceSkeleton` for route `loading.tsx` files instead of page-level spinners.
- Use `ChurchActionFeedback` for success, error, warning, info, offline, and progress messages.
- Use `ChurchFieldError` and `ChurchErrorSummary` for form validation feedback.
- Use `ChurchLoadingButton`, `ChurchSaveStatus`, and `ChurchRefreshIndicator` for submit and refresh states.
- Use `ChurchAsyncState` or `ChurchAsyncBoundary` when a panel must switch between loading, empty, error, offline, partial, and content states.
- Use `ChurchPendingOverlay` only for local panel-level work, never as a page blocker.
- Use the motion wrappers from `src/components/church-workspace/motion` for subtle content, tab, rail, and updated-state transitions.

## Loading Patterns

Route loaders should be deterministic and sized like the final workspace. Pick the closest variant:

- `dashboard` for overview and reporting pages.
- `registry` for table plus right-rail workspaces.
- `detail` for member, household, or department detail pages.
- `form` for settings and focused edit pages.
- `calendar` for event or calendar views.
- `list` for announcement-style feeds.

Skeleton widths are fixed, not randomized, so screenshots and layout checks remain stable.

## Feedback Rules

Feedback must be honest and tied to the real async state:

- Do not show success until the server action or mutation actually succeeds.
- Do not show progress percentages unless a real value is available.
- Use `progress` for indeterminate work and `ChurchProgressFeedback` for real progress values.
- Use `offline` or `ChurchOfflineActionState` when an action is queued or waiting for connectivity.
- Keep destructive errors scoped to the failed action; avoid blocking the whole page when only one panel failed.

## Accessibility

- Errors use `role="alert"` and summaries focus on mount.
- Non-urgent updates use polite live regions.
- Loading skeletons expose `aria-busy` and a screen-reader label.
- Icon-only dismiss buttons include labels.
- Motion respects `prefers-reduced-motion`.

## Motion

Motion is CSS-only and intentionally restrained:

- `ChurchContentTransition` for page or panel content appearing.
- `ChurchTabTransition` for tab body changes.
- `ChurchRailTransition` for right inspector updates.
- `ChurchUpdatedHighlight` for short-lived updated-row emphasis.

The global reduced-motion media query disables these animations and skeleton pulse.

## Adding New Pages

1. Build the route with existing workspace and UI components first.
2. Add a route `loading.tsx` using the closest `ChurchWorkspaceSkeleton` variant.
3. Represent submit, save, refresh, offline, empty, partial, and error states with the shared primitives.
4. Do not move server queries into client components for visual convenience.
5. Verify desktop and mobile widths for overflow, right-rail placement, and long text.
