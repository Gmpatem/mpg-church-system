# MPG Church System - Agent Instructions

## Project Purpose

This is a multi-tenant church operations application built with Next.js, TypeScript, Tailwind, shadcn-style Radix components, Supabase, and Vercel.

For UI work, build a reusable workspace system rather than unrelated page designs.

## Mandatory UI Workflow

Before changing any page UI:

1. Read the relevant route and its imported components.
2. Inspect `src/components/workspace/*`.
3. Inspect `src/components/ui/*`.
4. Run `npx shadcn@latest info`.
5. Check whether the required component already exists locally.
6. Start the development server with `npm run dev`.
7. Open the affected route through Playwright or the configured browser tooling.
8. Capture a before screenshot at the required viewport.
9. Make the smallest safe visual change.
10. Capture an after screenshot.
11. Compare structure, spacing, overflow, responsive behavior, and interactions.
12. Run `npm run lint` and `npm run build` before reporting completion.

Do not claim a visual task is complete without inspecting the rendered result.

## Existing Components First

Prefer components from:

- `src/components/workspace/*`
- `src/components/ui/*`
- `src/components/mobile/*`
- `src/components/navigation/*`

Do not create duplicate implementations of:

- Button
- Input
- Select
- Table
- Badge
- Avatar
- Tooltip
- Popover
- Dropdown Menu
- Dialog
- Sheet
- Drawer
- Skeleton
- Empty State
- Pagination
- Workspace header
- Workspace filter bar
- Workspace table
- Workspace right rail

Use the installed `build-web-apps:shadcn` Codex skill as the canonical shadcn guidance source. Do not copy or recreate that skill inside this repository.

## shadcn Workflow

This repository currently has shadcn-style components but no root `components.json`; `npx shadcn@latest info` must be treated as the source of truth for the current state.

Before adding a component:

```bash
npx shadcn@latest info
npx shadcn@latest search @shadcn -q "<need>"
npx shadcn@latest docs <component>
npx shadcn@latest add <component> --dry-run
```

Before updating an installed component:

```bash
npx shadcn@latest add <component> --diff <file>
```

Never overwrite a locally modified component without explicit approval. Do not reinitialize shadcn, switch presets, run `add --all`, or replace the global CSS during ordinary page work.

## UI Architecture

Operational workspaces should generally follow:

```text
WorkspaceHeader
FilterToolbar
MainWorkspaceGrid
|-- PrimaryRegistry
`-- RightInspector
```

For desktop registry/detail pages, prefer:

```css
grid-template-columns: minmax(0, 1fr) 320px;
```

or, when approved by the reference:

```css
grid-template-columns: minmax(0, 1fr) 340px;
```

Requirements:

- Add `min-w-0` to grid and flex children containing tables.
- Wide tables must scroll inside their own wrapper.
- Never create a browser-level horizontal scrollbar.
- At desktop widths, a right inspector must remain beside the registry.
- Do not place a desktop inspector below the registry.
- Do not use narrow centered `max-w-*` wrappers for operational workspaces.
- Use the full width available inside the application shell.

## Visual Rules

- No decorative gradients in operational workspaces.
- No oversized marketing-style hero banners.
- Avoid card soup.
- Prefer one cohesive header over separate title and KPI cards.
- Prefer inline metrics over six or eight large statistic cards.
- Use one primary accent color.
- Use semantic design tokens rather than arbitrary colors.
- Use neutral borders and restrained shadows.
- Use typography and spacing for hierarchy.
- Keep related buttons the same height and radius.
- Keep data tables dense but readable.
- Use status dots plus labels where appropriate.
- Zero values should look quiet, not alarming.
- Do not install dashboard templates to solve a single layout problem.

## shadcn Composition Rules

- Use existing component variants before custom styling.
- Use semantic tokens such as `bg-background`, `text-foreground`, and `text-muted-foreground`.
- Use `gap-*`, not `space-x-*` or `space-y-*`.
- Use `size-*` for equal width and height.
- Use `cn()` for conditional classes.
- Use `Separator`, not custom horizontal-rule markup.
- Use `Skeleton` for loading placeholders.
- Use the existing empty-state component.
- Every Dialog, Sheet, and Drawer must have an accessible title.
- Every Avatar must include a fallback.
- Icon-only buttons require an accessible label.
- Use `lucide-react`, the icon package already used by the local UI components.
- Do not hardcode a different icon package.

## Browser Verification

For desktop workspace UI, verify at:

- 1440px
- 1366px
- 1024px

For responsive behavior, verify at:

- 768px
- 390px

Use Playwright or the configured browser tooling to inspect:

- page-level horizontal overflow
- component alignment
- sticky behavior
- dropdowns and sheets
- row selection
- right-rail placement
- empty states
- loading states
- long text
- missing data

When a reference screenshot is provided, compare the implementation against it directly.

## Safety Rules

UI-only work must not change:

- database schema
- migrations
- Supabase RLS
- authentication
- tenant checks
- server actions
- queries
- permissions
- route contracts
- search parameters
- form bindings
- notification side effects
- approval side effects
- treasury side effects

Do not move Supabase queries into client components for visual convenience. Do not delete components until imports and runtime behavior have been verified.

## Validation

Before editing:

```bash
git status --short
```

After editing:

```bash
npm run lint
npm run build
```

The production build performs TypeScript validation. Report failures honestly and do not claim checks passed unless they were actually run.
