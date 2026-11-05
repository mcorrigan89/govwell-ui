# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GovWell UI is GovWell's brand as a React + Tailwind v4 design system, distributed as a **private shadcn registry** (consumers run `npx shadcn add @govwell/<name>` and own the copied source). It follows the GovWell Brand Standards (March 2026, v.01) and govwell.com; `PLAN.md` has the brand analysis, decisions and open questions. The structure is copied from the sibling repo `../nyc_design` (Headway), which in turn follows `../phosphor`.

**Keep it private.** `public/fonts` holds GT Standard (Grilli Type), licensed to GovWell. Don't publish the registry or the repo.

## Commands

```bash
pnpm install
pnpm dev          # builds the registry, then runs the preview on :5175 (?item=<name>,<name> for a few; #/<name> from the sidebar)
pnpm registry     # regenerate registry.json, public/r/*.json and src/*.generated.*
pnpm check-types  # tsc --noEmit over src/, registry/ and tests/
pnpm lint         # oxlint (.oxlintrc.json)
pnpm format       # oxfmt in place; `pnpm format:check` to only check
pnpm test         # vitest run; `pnpm test tests/signature.test.tsx -t 'Eyebrow'` for one test
pnpm build        # registry + type-check + vite build → dist/
pnpm verify       # install every item into a fresh app in .verify/ and build it
```

`check-types`, `lint`, `format:check`, `test` and `verify` are the checks. Commits are made with the Graphite CLI (`gt create`), one branch per piece of work, stacked on `main`.

## Architecture

- **`scripts/build-registry.mjs` is the source of truth**: the item list (`UI` map: description, npm `deps`, registry `ui` deps) and the theme item (fonts stack, `base-grid` and `eyebrow-type` utilities, base type rules). Colours live in `scripts/palette.mjs` (`BRAND`, `LIGHT`, `DARK`, `TEXT_PAIRS`, `UI_PAIRS`, `contrast()`); `tests/contrast.test.ts` holds both modes to WCAG AA. Outputs (`registry.json`, `public/r/`, `src/theme.generated.css`, `src/items.generated.json`) are gitignored.
- **Colour modes**: light is the default (`LIGHT`, written to `:root`). `DARK` applies under `:root[data-mode="dark"]` (and `data-mode="system"` when the OS prefers dark). `use-color-mode` sets the attribute.
- **Fonts**: GT Standard is served from the registry host at `/fonts/gt-standard.css` (+ woff files). Apps load it with a `<link>`; the preview does so in `index.html`. The shadcn CLI can't write `@font-face` rules (it reads everything inside an at-rule as nested selectors), which is why it isn't in the theme item.
- Palette values must be **literals**, not `var(...)`. Don't name a token anything that collides with a utility (a `grid` token made `bg-grid` a background colour; it's `gridline` now).
- **Registry sources** in `registry/govwell/{ui,lib,hooks}` import each other only via consumer-style aliases (`@/components/ui/*`, `@/lib/*`, `@/hooks/*`).
- Components follow shadcn conventions on **Base UI** (`@base-ui/react`, not Radix): `data-slot` attributes, `cva` variants, `cn()`, composition via the `render` prop. APIs match Headway's (and Phosphor's) versions of the same components.
- **Preview** (`src/main.tsx`): demos come from `DEMOS` in `src/demos.tsx`, which spreads the group files in `src/demos/*.tsx`. Tests live in `tests/`.
- **Sample app** (`src/example-app/`, opened with `?example=app`, linked from the preview header): a GovWell staff app built from the registry, laid out like the real app's `SidebarLayout` (a 230px sidebar on the `muted` ground that collapses to 48px with ⌘\, and a white bordered content panel inset 10px from the top and right; the assistant opens as a 400px panel beside it). Pages follow the real app's `<Page>`: a padded header (icon, title, subtitle, actions) over a body with a 16px/24px gutter. It covers Insights, a records list with saved-view tabs, a record with tabs and a workflow column, and the inspection calendar; other nav entries render a placeholder. Data in `data.ts` is seeded and dated relative to today. Tested in `tests/example-app.test.tsx`.

## Styling conventions

- **Square**: `rounded-none` everywhere (the radius token is 0). Only avatars, radio dots and similar true circles use `rounded-full`. No pills.
- **Type**: GT Standard. Body is Light (300, set on `body`), headlines and titles are Regular (400, `font-normal`) with `tracking-tight` at large sizes, never bold. UI labels, menu items and button text: Light or Regular. Bold (700) only for small subheads and table headings. Eyebrows and badges use the `eyebrow-type` utility (14px uppercase, 4% tracking). `font-mono` only for code (`kbd`).
- **Colour** comes from tokens only:
  - `primary` = Hope with Slate text, for the main action. `secondary` = Slate (white in dark mode).
  - Text: `foreground`, `muted-foreground` (#666, not Concrete), `error` for red text.
  - Surfaces: `background`, `card`, `popover`, `muted`, `accent` (hover/highlight). Lines: `border` (Ash hairline), `input` (Concrete, control edges).
  - Status fills: `ok` (Field), `info` (Sky), `warning` (amber), `destructive` (red), each with `-foreground`. Hope, Sky and Field always carry Slate text, never white; never use them as text colours on white.
  - Tints: `hope-tint`, `sky-tint`, `field-tint`, `ash-tint` with `tint-foreground`, for eyebrows, badges, soft highlights and status tiles.
- **Focus**: `outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring`. `outline-solid` is required (Tailwind v4's `outline-none` sets the style to none). Highlighted items in menus and lists use `bg-accent` instead of a ring.
- **Controls with a text box** (input, textarea, select trigger, input group, OTP slots): `h-12` default, `border border-input bg-background px-4 text-base font-light`, `hover:border-foreground`, `focus-visible:border-foreground` + the ring, `aria-invalid:border-error`, `placeholder:text-muted-foreground`.
- **Checked / on / selected**: Slate fills (`bg-secondary text-secondary-foreground`) for checkboxes, radios, switches, selected days and pressed toggles; Hope (`bg-primary`) only where it marks progress or the one main action (a progress bar, the current step).
- **Floating panels** (popover, menus, tooltip, hover card, select/combobox/command popups): `border border-border bg-popover text-popover-foreground shadow-lg`, square. Modals (dialog, alert dialog, sheet, drawer): the same panel, `p-8`, over `bg-slate/60`; titles `text-3xl font-normal tracking-tight`. Tooltips are the inverse: `bg-secondary text-secondary-foreground`.
- **Status surfaces** (alert, toast): a square panel with the status shown on a tile or rail in the status colour; body text stays `foreground`.
- **No glow, no gradients, no rounded corners.** Shadows only on floating layers. Disabled is `opacity-40`.
- **Motion**: the `tw-animate-css` enter/exit classes; keep it short (100–200ms). No colour transitions on a selection that moves between siblings (segmented control, toggle group, tabs, pagination): the old and new fills cross-fade and read as a flicker. Swap instantly.
- Components must read correctly in light and dark; check both with the preview's mode switch.

## Adding a component

1. Put the source in `registry/govwell/ui/`.
2. Add it to `UI` in `scripts/build-registry.mjs` (npm deps and any `ui` registry deps).
3. Add its name to one of the `CATEGORIES` in the same file (the build fails if an item has no category). The preview groups its sidebar and pages by category; `#/c/<category>` shows one group.
4. Add a demo to a file in `src/demos/` (spread into `DEMOS` in `src/demos.tsx`) and a test in `tests/`.
5. Run `pnpm verify`.
