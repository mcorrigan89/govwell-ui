# Plan: GovWell UI

A React + Tailwind v4 design system in GovWell's brand, built from the GovWell
Brand Standards (March 2026, v.01) and govwell.com. It ships the same way as
[Headway](../nyc_design) and [Phosphor](../phosphor): as a **shadcn registry**.
Teams install the source with `npx shadcn add @govwell/<item>` and own the copy.

Headway is the starting point. Its tooling, registry build, preview, colour
modes, contrast tests and component APIs carry over; only the visual layer
changes.

## What the brand asks for

From the brand book and the live site (values read from govwell.com's CSS):

- **Mostly black and white, with one bright accent.** "Jet Black provides a
  strong, modern foundation… Hope, our vibrant accent color, highlights moments
  of progress and possibility… White creates the space that allows everything
  to breathe."
- **Calm, light type.** GT Standard throughout. Headlines are Regular (400),
  not bold; body is Light (300) on the site. Headings have slightly tight
  tracking (−0.02em at 64px), body has a little extra (1%) with 140% leading.
- **Square corners.** The business card specifies "Corners: Square". The hero
  form, Hope buttons, eyebrow chips and modal on the site are all square.
  The site's nav uses pill buttons and its mega-menu cards use 12px radius;
  those are the exception, not the rule.
- **The eyebrow label** is the brand's signature UI element: a small uppercase
  label (+4% tracking) on a 30% tint of a brand colour, with an icon on a
  matching square tile tucked under its lower-left corner. That makes the
  two-square "intersection" of the flag mark.
- **Squares as connectors.** The expressive icons are line drawings with
  dotted construction lines and small solid squares at the nodes, described as
  the "tech layer" that augments government services.
- **The grid and its intersection.** Layouts sit on a square base grid with
  one highlighted intersection, often with colour blocks and photography in
  the quadrants.
- **Tone: human, a patient tech mentor, purposeful joy.** Utilitarian, but not
  clinical.

## Foundations

### Colour

Brand palette (from the book):

| Token      | Hex       | Role                                                           |
| ---------- | --------- | -------------------------------------------------------------- |
| `jet`      | `#000000` | Logo, strongest black                                          |
| `slate`    | `#202020` | Text on light; dark-mode ground (the site's body text is this) |
| `concrete` | `#7c7c7c` | Borders, disabled, decorative greys                            |
| `cement`   | `#b1b1b1` | Borders and rules                                              |
| `ash`      | `#d9d9d9` | Hairlines, dividers                                            |
| `base`     | `#ececec` | Subtle surfaces (the grid backgrounds in the book)             |
| `white`    | `#ffffff` | Ground in light mode                                           |
| `hope`     | `#feaf0e` | The accent: primary action, progress, highlights               |
| `sky`      | `#41aaeb` | Extended palette: info, links on dark                          |
| `field`    | `#39c25e` | Extended palette: success                                      |

The book also uses 30% and 50% tints of Hope, Sky, Field and Ash for the
eyebrow chips and tiles. These become tokens (`hope-tint`, `sky-tint`, …).

Contrast decisions (checked, WCAG AA):

- **Hope, Sky and Field always carry Slate text, never white.** Slate on Hope
  is 8.8:1, while white on Hope is 1.85:1. On a white ground, none of the
  three is used as a text colour.
- **Muted text needs a darker grey than Concrete.** Concrete on white is
  4.17:1, just under AA. Muted text becomes `#666666` (5.7:1 on white, 4.9:1 on
  Base), with Concrete kept for borders and decoration. This is a small step
  outside the book's palette.
- **The brand has no red**, but a UI needs one for errors and destructive
  actions. Proposal: `#b42318` for fills with white text (6.6:1) and for error
  text on white, and a lighter red for text in dark mode. See open questions.
- **Semantic mapping:** `primary` = Hope (Slate text); `ok` = Field; `info` =
  Sky; `warning` = Hope as well, or a deeper amber (open question);
  `destructive` = the red above. Focus ring = Slate on light, Hope on dark.

### Type

- **GT Standard** (Grilli Type) is a licensed font, so a public registry can't
  ship it. The theme names it first in the stack, so any app that loads it
  (as govwell.com already does) gets it. It falls back to a free, similar
  grotesque installed with the theme (Inter, or Geist; see open questions).
  Stack: `'GT Standard', 'Gt Standard', 'Inter Variable', system-ui, sans-serif`.
- Weights: Light 300 for body and CTAs, Regular 400 for headlines, Bold 700
  only for subheads and table headings (the book's "M Bold"). The UI uses fewer
  bold labels than Headway did.
- Eyebrow: 14px uppercase, Regular, +4% tracking.
- Scale (from the site): 64 / 48 / 32 / 24 / 18 / 16 / 14 / 12.8, with 120%
  leading for display, 140% for text.

### Shape, space, depth

- Radius 0 throughout. Pills are not part of the component set. If the
  marketing nav's pill buttons are wanted, they could be a button variant
  later.
- Hairline borders in Ash (light) or a 1px white/10 (dark). Shadows only on
  floating layers (menus, popovers, dialogs), soft and neutral.
- 4px spacing base and an 8-column square grid, matching the book's base grid.
  A `bg-grid` utility draws the base grid lines for hero and empty areas.

### Colour modes

**Light first**, since the website and most applications are white. Dark mode
uses Slate (`#202020`) as the ground, as the book's own pages do, with Jet
for raised panels and Hope as the accent. Both are built from the start using
Headway's setup: `data-mode`, the `use-color-mode` hook and contrast tests per
mode. There is no `on-sign` equivalent: GovWell panels follow the mode rather
than always being black.

### Icons

The brand uses StreamlineHQ, mostly the Sharp/filled styles. Streamline is a
paid licence, so registry components default to `lucide-react` like shadcn,
and every icon slot accepts any SVG. If GovWell's Streamline licence covers
it, a later step can add a small `@govwell/icons` item with the curated set
from page 44 of the book.

## Components

### Signature pieces (new)

| Item         | What it is                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `eyebrow`    | The eyebrow label: an uppercase tinted chip with an icon tile under its lower-left corner. Tones `hope`, `field`, `sky`, `ash`.                 |
| `flag-mark`  | The GovWell flag mark and wordmark as SVG components, in Jet, Slate or White. Logo files come from GovWell's brand assets; I won't redraw them. |
| `node-frame` | The "tech layer" frame: a dotted box with solid square nodes at its corners, around an icon, image or block of content.                         |
| `stat`       | A large Regular-weight figure with a short caption, as in the site's metrics strip (7000+, 200+, 98%).                                          |
| `grid-panel` | A section laid on the base grid with one highlighted intersection and optional colour block, for heroes and feature callouts.                   |

### The standard set (from Headway, restyled)

All 57 general-purpose components Headway has, with the same APIs: accordion,
alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button,
button-group, calendar, card, carousel, chart, checkbox, collapsible, combobox,
command, context-menu, date-picker, dialog, drawer, dropdown-menu, empty,
field, hover-card, input, input-group, input-otp, item, kbd, label, menubar,
native-select, navigation-menu, pagination, popover, progress, radio-group,
resizable, scroll-area, select, separator, sheet, skeleton, slider, sonner,
spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip, plus
`theme`, `utils` and `use-color-mode`.

Headway's subway pieces (route bullet, arrow, sign, strip map) are not
carried over.

How the main ones change in the GovWell look:

- **Button:** primary is a square Hope block with Slate text in Light weight
  (the site's "Learn more"). Secondary is Slate with white text, then outline,
  ghost and link. Destructive uses the new red.
- **Input / select / textarea:** square, white with an Ash border on light
  (Slate-tinted on dark), 48–50px tall at the default size as on the site,
  border turns Slate on focus.
- **Card:** square, white on Base or with an Ash hairline. An optional eyebrow
  sits in the header.
- **Badge:** square, tinted like the eyebrow chips (30% tints with Slate text).
- **Alert / toast:** square, a tinted tile carries the status colour and the
  text stays Slate.
- **Dialog:** square white panel with the close button in its own square
  outside the corner, as on the site's video modal.
- **Tabs, menus, table:** quiet. Hairlines, Regular-weight labels, and the
  active state marked in Slate or with a Hope bar.
- **Chart:** series in Hope, Sky, Field, Slate and Concrete, checked for
  contrast on the chart's background in both modes.

Later candidates (GovWell product pieces): status timeline for a permit or
case, fee table, application checklist, map pin card. These come after the
base system.

## Repo structure

The same as Headway, renamed:

```
registry/govwell/{ui,lib,hooks}
scripts/{build-registry,theme-css,palette,verify-install}.mjs
src/{main.tsx,demos.tsx,demos/*.tsx,styles.css}
tests/
```

The tooling is the same too: pnpm, Vite, React 19, Tailwind v4, TypeScript,
oxlint, oxfmt, vitest and the shadcn CLI, with the same scripts (`dev`,
`registry`, `build`, `check-types`, `lint`, `format`, `test`, `verify`). The
preview keeps the sidebar routing, `?item=` and the mode switch. Demo content
uses permits, licences, inspections, payments and resident requests, not
transit.

## Steps

Each step is a stacked Graphite branch, as in Headway.

1. **Scaffold:** copy Headway's tooling, registry build and preview, rename to
   GovWell, and strip all components and subway demos. Run `git init` and
   `gt init`.
2. **Theme:** palette tokens and tints for light and dark, type stack and
   scale, radius, the `bg-grid` utility, contrast tests for both modes.
3. **Signature pieces:** eyebrow, node frame, stat, grid panel, and the
   flag mark once logo files are supplied.
4. **Conventions:** write GovWell's styling rules into CLAUDE.md (as Headway's
   "Styling conventions"), then restyle the base pieces: button, input, label,
   field, card, badge, separator, popover, dialog, input group.
5. **The rest of the set**, ported from Headway in groups (forms, overlays and
   menus, navigation and display, data and time) by parallel agents. Each
   group is reviewed in Chrome in both modes and committed as its own branch.
6. **Verify and document:** `pnpm verify`, README and CLAUDE.md.

**Done when** every item installs into a fresh app through `shadcn add`, and
`check-types`, `lint`, `format:check`, `test` and `verify` all pass in both
colour modes.

## Ground rules

- **Use GovWell's own assets for the logo.** The flag mark and wordmark
  should come from GovWell's files, not be redrawn by me.
- **Don't ship licensed fonts or icons in the public registry.** GT Standard
  and Streamline are referenced and loaded by the app, not bundled.
- **Follow the book first.** Where the site and the book differ (pill nav
  buttons, rounded mega-menu cards), the book wins, and this plan says so.
- **Accessibility over brand purity** where they clash. The muted-text grey
  and the error red above are the two current cases, and both are listed here.

## Decisions made while building

- **Fonts:** GT Standard is used and served from the registry host
  (`public/fonts`, Light, Regular, Medium and Bold). Apps load
  `/fonts/gt-standard.css` with a `<link>`; the shadcn CLI can't write
  `@font-face` rules, and the font files must not be copied into consumers'
  repos. The registry and repo stay private.
- **Logo:** `flag-mark` is generated from the logo SVG on govwell.com
  (`assets/govwell-logo.svg`), not redrawn.
- **Error red:** `#b42318` (fills and text on white), `#ff8a7a` for red text
  in dark mode.
- **Warning:** a deeper amber, `#dc6803` with Slate text, so warnings don't
  look like the Hope primary button.
- **Icons:** lucide for now.
- **Charts:** on white the first series is Slate (Hope, Sky and Field are
  under 3:1 on white); on Slate, Hope leads.
- **Selected states are Slate** (checkbox, radio, switch, toggles, tabs,
  calendar days, pagination); Hope marks the one main action and progress.
- **Token names:** the brand's Base is `base-grey` and the grid line colour
  is `gridline`, because `base` and `grid` collide with Tailwind's
  `text-base` and `bg-grid`. A test guards against this.
- **Preview port:** 5175, so it can run beside Headway's previews.

## Open questions

1. **Error red:** keep `#b42318`, or does product design have a red?
2. **Icons:** does GovWell's Streamline licence allow including the curated
   icon set from the brand book?
3. **Hosting:** where should the private registry be served from (it needs
   to serve `public/r` and `public/fonts`)?
