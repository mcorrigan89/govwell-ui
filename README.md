# GovWell UI

GovWell's brand as a React + Tailwind v4 design system, distributed as a
**private** [shadcn registry](https://ui.shadcn.com/docs/registry). It follows
the GovWell Brand Standards (March 2026) and govwell.com: Slate type on white,
Hope for the main action, GT Standard, square corners, the eyebrow label and
the base grid.

Private because it serves GT Standard, which is licensed to GovWell.

## Items

- `theme`: the palette (Jet, Slate, Concrete, Cement, Ash, Base, Hope, Sky,
  Field, their tints, status colours), type, and the `base-grid` and
  `eyebrow-type` utilities. Light by default, dark on Slate.
- `utils`, `use-color-mode`.
- GovWell pieces: `eyebrow`, `flag-mark` (the logo), `node-frame`, `stat`,
  `grid-panel`.
- Blocks (install to `components/blocks`): `app-shell` (the staff app frame),
  `data-table` (sorting, filtering, selection with bulk actions, pinned
  columns, drag reordering), `sign-in`.
- Product pieces, ported from the GovWell app and govwell-cqrs: `query-state`,
  `status-badge`, `actor-badge`, `tone-badge`, `readout`, `meter`,
  `distribution`, `seal`, `event-log`, `spotlight` (highlight and tours),
  `confirm-dialog`, `page-header`, `banner`, `steps`, `tile`, `quick-tip`,
  `link`, `number-input`, `time-input`, `date-range-picker`,
  `segmented-control`, `toolbar`, `color-picker`, `file-upload`,
  `rich-text-editor`, `key-hints` and the `use-hotkeys` hook.
- More from govwell-cqrs: `description-list`, `copy-button`, `markdown` (with
  the theme's `govwell-prose`), `highlight`, `tree`, `lightbox`,
  `download-link`, `deadline`, `relative-time`, `busy-hold`, `error-page`,
  `settings-section`, `condition-builder` and `rule-builder` (same stored
  format as cqrs), and the blocks `user-menu` and `week-calendar`.
- Maps (Leaflet): `map`, `mini-map`, `point-picker`, `area-picker`,
  `vector-tile-layer`, and `client-only` for lazy-loading them in
  server-rendered apps.
- The AI chat kit: `message`, `bubble`, `attachment`, `marker`,
  `message-scroller`, `questionnaire`, `chat-composer`.
- The standard set: accordion, alert, alert-dialog, aspect-ratio, avatar,
  badge, breadcrumb, button, button-group, calendar, card, carousel, chart,
  checkbox, collapsible, combobox, command, context-menu, date-picker, dialog,
  drawer, dropdown-menu, empty, field, hover-card, input, input-group,
  input-otp, item, kbd, label, menubar, native-select, navigation-menu,
  pagination, popover, progress, radio-group, resizable, scroll-area, select,
  separator, sheet, skeleton, slider, sonner (toasts), spinner, switch, table,
  tabs, textarea, toggle, toggle-group and tooltip.

## Using it

In a React + Tailwind v4 project that has run `npx shadcn@latest init`, add the
registry to `components.json`:

```json
"registries": {
  "@govwell": "https://<private-registry-host>/r/{name}.json"
}
```

Install the theme and what you need:

```bash
npx shadcn@latest add @govwell/theme
npx shadcn@latest add @govwell/button @govwell/eyebrow @govwell/card
```

Load GT Standard from the registry host, once, in your HTML:

```html
<link rel="stylesheet" href="https://<private-registry-host>/fonts/gt-standard.css" />
```

Set `data-mode="dark"` on `<html>` for dark mode, or `data-mode="system"` to
follow the OS; the `use-color-mode` hook does this and remembers the choice.

## Working on it

```bash
pnpm install
pnpm dev        # registry + preview at :5175
pnpm test       # vitest
pnpm verify     # install every item into a fresh app and build it
```

`http://localhost:5175/?example=app` is a sample staff app built from the
registry and laid out like GovWell's app today: the sidebar on a grey ground,
a white content panel, a permits list, a permit with its workflow, Insights
and the inspection calendar (made-up data for a fictional town).

See [CLAUDE.md](CLAUDE.md) for the architecture and styling conventions, and
[PLAN.md](PLAN.md) for the brand analysis and decisions.
