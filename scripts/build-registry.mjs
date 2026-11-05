// Writes registry.json from the item list below, then runs `shadcn build`,
// which inlines each file's source into public/r/<name>.json — what
// `npx shadcn add <url>` installs. REGISTRY_URL is where public/ will be
// served (items reference each other by URL, and the theme loads GT Standard
// from public/fonts on the same host).
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { themeCss } from './theme-css.mjs';
import { DARK, LIGHT } from './palette.mjs';

const BASE = (process.env.REGISTRY_URL ?? 'http://localhost:5175').replace(/\/+$/, '');
const url = (name) => `${BASE}/r/${name}.json`;

const THEME = url('theme');
const UTILS = url('utils');

// a palette as custom properties, for plain CSS rules
const vars = (palette) => Object.fromEntries(Object.entries(palette).map(([k, v]) => [`--${k}`, v]));

// GT Standard (Grilli Type), licensed to GovWell, lives in public/fonts with
// a stylesheet of @font-face rules (gt-standard.css). Apps load that
// stylesheet from this registry's host with a <link>; the fonts are never
// copied into a consumer's repo, so the registry must stay private. (The
// shadcn CLI can't write @font-face rules: it reads everything inside an
// at-rule as nested selectors.)
const FONT_CSS = `${BASE}/fonts/gt-standard.css`;

// ── the theme: tokens, type, utilities ─────────────────────────────────────
const theme = {
  name: 'theme',
  type: 'registry:theme',
  title: 'GovWell theme',
  description: `The GovWell palette, GT Standard type and the base grid: Slate type on white (or white on Slate in dark mode), Hope for the main action, square corners throughout. Load the fonts with <link rel="stylesheet" href="${FONT_CSS}" />.`,
  dependencies: ['tw-animate-css', 'shadcn'],
  cssVars: {
    theme: {
      'font-sans': "'GT Standard', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      'font-mono': "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    },
    // shadcn writes these to :root; dark mode is a data-mode attribute
    // (below), so both are the light palette
    light: LIGHT,
    dark: LIGHT,
  },
  css: {
    '@import "tw-animate-css"': {},
    '@import "shadcn/tailwind.css"': {},
    ':root': { 'color-scheme': 'light' },
    // light is the default; data-mode="dark" on <html> pins dark, and
    // data-mode="system" follows the OS
    ':root[data-mode="dark"]': { 'color-scheme': 'dark', ...vars(DARK) },
    '@media (prefers-color-scheme: dark)': {
      ':root[data-mode="system"]': { 'color-scheme': 'dark', ...vars(DARK) },
    },
    '@layer base': {
      '*': { '@apply border-border outline-ring/50': {} },
      // body copy is Light with a touch of tracking and 140% leading, as the
      // brand book's web type sets it
      body: {
        '@apply bg-background text-foreground font-light antialiased': {},
        'letter-spacing': '0.01em',
        'line-height': '1.4',
      },
      html: { '@apply font-sans': {} },
      // headlines are Regular, never bold, with slightly tight tracking
      'h1, h2, h3, h4, h5, h6': { 'font-weight': '400', 'letter-spacing': '-0.015em', 'line-height': '1.2' },
    },
    // the base grid from the brand book: square cells in a faint line
    '@utility base-grid': {
      'background-image':
        'linear-gradient(var(--gridline) 1px, transparent 1px), linear-gradient(90deg, var(--gridline) 1px, transparent 1px)',
      'background-size': 'var(--grid-size, 48px) var(--grid-size, 48px)',
    },
    // the eyebrow's type: small uppercase with 4% tracking
    '@utility eyebrow-type': {
      'font-size': '0.875rem',
      'font-weight': '400',
      'line-height': '1',
      'letter-spacing': '0.04em',
      'text-transform': 'uppercase',
    },
  },
};

const utils = {
  name: 'utils',
  type: 'registry:lib',
  title: 'Utils',
  description: 'cn(): merges class names, letting later Tailwind classes win.',
  dependencies: ['clsx', 'tailwind-merge'],
  files: [{ path: 'registry/govwell/lib/utils.ts', type: 'registry:lib' }],
};

// ── hooks ──────────────────────────────────────────────────────────────────
const HOOKS = {
  'use-color-mode': {
    title: 'useColorMode',
    description: 'Light (the default), dark, or follow the OS, on <html data-mode>, remembered between visits.',
  },
};
const hookItems = Object.entries(HOOKS).map(([name, spec]) => ({
  name,
  type: 'registry:hook',
  title: spec.title,
  description: spec.description,
  files: [{ path: `registry/govwell/hooks/${name}.ts`, type: 'registry:hook' }],
}));

// ── components ─────────────────────────────────────────────────────────────
// name → { description, deps (npm), ui (other registry items it imports) }
const UI = {
  accordion: {
    description: 'Stacked sections that open and close, with Regular-weight questions between Ash hairlines and a thin plus or minus.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  'alert-dialog': {
    description: 'A confirmation that has to be answered, on a square panel over a Slate wash.',
    deps: ['@base-ui/react'],
    ui: ['button'],
  },
  'aspect-ratio': { description: 'Holds its content to a fixed width-to-height ratio.', deps: [] },
  avatar: {
    description:
      'A person as a circle with their image, or their initials on the grey surface, with an optional status dot and group count.',
    deps: ['@base-ui/react'],
  },
  badge: {
    description: 'A small square label in the eyebrow’s type, on a brand tint or a solid status colour.',
    deps: ['@base-ui/react', 'class-variance-authority'],
  },
  breadcrumb: {
    description: 'A trail of muted links to the current page, with thin chevrons between and the page you are on in Regular.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  button: {
    description: 'Square buttons in GT Standard Light: a Hope primary, a Slate secondary, outline, ghost, destructive and link.',
    deps: ['@base-ui/react', 'class-variance-authority'],
  },
  'button-group': {
    description: 'Buttons, inputs and selects butted together into one square strip, with grey text plates and hairline separators.',
    deps: ['@base-ui/react', 'class-variance-authority'],
    ui: ['separator'],
  },
  card: { description: 'A square panel with an Ash hairline, for a header (with an eyebrow), content and footer.', deps: [] },
  checkbox: {
    description: 'A small square box with a Concrete edge that fills Slate, with the tick knocked out, when checked.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  collapsible: { description: 'An unstyled section that shows and hides behind a trigger.', deps: ['@base-ui/react'] },
  combobox: {
    description: 'A select you can type into to filter, with Slate chips for several values.',
    deps: ['@base-ui/react', 'lucide-react'],
    ui: ['button', 'input-group'],
  },
  command: {
    description: 'A searchable list of commands in a square panel, inline or as a ⌘K palette.',
    deps: ['cmdk', 'lucide-react'],
    ui: ['dialog', 'input-group'],
  },
  'context-menu': {
    description: 'The dropdown menu’s panel, opened by right-click or long-press.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  dialog: {
    description: 'A modal on a square panel over a Slate wash, with a Regular-weight title.',
    deps: ['@base-ui/react', 'lucide-react'],
    ui: ['button'],
  },
  drawer: {
    description: 'A square panel that slides in from an edge and can be swiped away, with a grab bar.',
    deps: ['@base-ui/react'],
  },
  'dropdown-menu': {
    description: 'A menu in a square floating panel, with a grey band on the highlighted item.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  empty: {
    description: 'An empty state in a dashed frame, its icon on a Hope tint inside the node frame, with a Regular title and a next step.',
    deps: ['class-variance-authority'],
    ui: ['node-frame'],
  },
  eyebrow: {
    description: 'GovWell’s signpost: an uppercase label on a brand tint, with an icon on a square tile under its corner.',
    deps: ['class-variance-authority'],
  },
  field: {
    description: 'Labels, controls, help text and errors composed into form fields; takes errors from any form library.',
    deps: ['class-variance-authority'],
    ui: ['label'],
  },
  'flag-mark': { description: 'The GovWell flag mark and the full logo, from GovWell’s artwork, in the current colour.', deps: [] },
  'grid-panel': {
    description: 'A panel on the base grid around one intersection: colour block and copy above, flag mark and image below.',
    deps: ['class-variance-authority'],
    ui: ['flag-mark'],
  },
  'hover-card': { description: 'A preview on hover, in a square floating panel with an Ash hairline.', deps: ['@base-ui/react'] },
  input: { description: 'A square text box with a Concrete edge that darkens on hover and focus.', deps: ['@base-ui/react'] },
  'input-group': {
    description: 'An input with icons, units or buttons attached, in one square box.',
    deps: ['@base-ui/react', 'class-variance-authority'],
    ui: ['button'],
  },
  'input-otp': {
    description: 'A one-time code entered one character per square box, in groups that share their edges.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  item: {
    description: 'A list row with media, a Regular title, a description and actions: plain, in a hairline panel or on grey.',
    deps: ['@base-ui/react', 'class-variance-authority'],
    ui: ['separator'],
  },
  kbd: { description: 'A keyboard key as a small square in mono type on the muted surface.', deps: [] },
  label: { description: 'A form label in Regular weight.', deps: [] },
  menubar: {
    description: 'A plain bar of menus with a hairline edge; the open menu sits on a grey band.',
    deps: ['@base-ui/react'],
    ui: ['dropdown-menu'],
  },
  'native-select': {
    description: 'The browser’s own select in a square box like the input, for long lists, phones and forms that work without JavaScript.',
    deps: ['lucide-react'],
  },
  'navigation-menu': {
    description: 'Site navigation with Light triggers that open a square panel of links; the active link has a Hope bar on its left edge.',
    deps: ['@base-ui/react', 'class-variance-authority', 'lucide-react'],
  },
  'node-frame': {
    description: 'The “tech layer”: a dotted frame with square nodes at its corners, around an icon, image or content.',
    deps: [],
  },
  pagination: {
    description: 'Previous, numbered and next page links, with the current page as a square Slate block.',
    deps: ['lucide-react'],
    ui: ['button'],
  },
  popover: { description: 'Content in a square floating panel, anchored to its trigger.', deps: ['@base-ui/react'] },
  'radio-group': {
    description: 'A set of round options, one chosen at a time, the chosen one marked with a Slate edge and dot.',
    deps: ['@base-ui/react'],
  },
  select: {
    description: 'A square box that opens its options in a square floating panel, the chosen one ticked.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  separator: { description: 'A hairline rule, across or down.', deps: ['@base-ui/react'] },
  sheet: {
    description: 'A square panel that slides in from an edge and runs its full length.',
    deps: ['@base-ui/react', 'lucide-react'],
    ui: ['button'],
  },
  skeleton: { description: 'A flat, square grey block that pulses where content will load.', deps: [] },
  slider: {
    description: 'A thin Ash track with the chosen range drawn in Slate and square thumbs; one value or a range.',
    deps: ['@base-ui/react'],
  },
  spinner: { description: 'A loading indicator: a dotted ring with a solid square node travelling round it.', deps: [] },
  stat: { description: 'A key figure: a large Regular-weight number with a short caption.', deps: [] },
  switch: {
    description: 'A square switch: a Concrete block on white when off, a Slate box with the block slid across when on.',
    deps: ['@base-ui/react'],
  },
  tabs: {
    description: 'Tabs on a quiet grey strip with the chosen tab a Slate block, or a line variant with a 2px underline.',
    deps: ['@base-ui/react', 'class-variance-authority'],
  },
  textarea: { description: 'A multi-line square text box with a Concrete edge that grows with its text.', deps: [] },
  toggle: {
    description: 'A button in Light type that stays pressed in, shown as a Slate block, until pressed again.',
    deps: ['@base-ui/react', 'class-variance-authority'],
  },
  'toggle-group': {
    description: 'A row of toggles, one or several pressed, spaced apart or butted into one square strip.',
    deps: ['@base-ui/react', 'class-variance-authority'],
    ui: ['toggle'],
  },
  tooltip: { description: 'A short label on hover or focus, in a small inverse Slate panel.', deps: ['@base-ui/react'] },
};
const uiItems = Object.entries(UI).map(([name, spec]) => ({
  name,
  type: 'registry:ui',
  title: name.replace(/(^|-)(\w)/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase()),
  description: spec.description,
  dependencies: spec.deps,
  registryDependencies: [THEME, UTILS, ...(spec.ui ?? []).map(url)],
  files: [{ path: `registry/govwell/ui/${name}.tsx`, type: 'registry:ui' }],
}));

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'govwell',
  homepage: BASE,
  items: [theme, utils, ...hookItems, ...uiItems],
};

// every file an item names must exist
for (const item of registry.items) {
  for (const f of item.files ?? []) {
    if (!existsSync(f.path)) throw new Error(`${item.name}: missing ${f.path}`);
  }
}
writeFileSync('registry.json', JSON.stringify(registry, null, 2) + '\n');
// the preview's copy of the theme, from the same source
writeFileSync('src/theme.generated.css', `/* generated by scripts/build-registry.mjs — do not edit */\n${themeCss([theme])}`);
// the item list the preview renders
writeFileSync(
  'src/items.generated.json',
  JSON.stringify(
    registry.items.map(({ name, type, title, description }) => ({ name, type, title, description })),
    null,
    2,
  ) + '\n',
);
execFileSync('npx', ['shadcn', 'build', '--output', 'public/r'], { stdio: 'inherit' });
console.log(`registry: ${registry.items.length} items → public/r (base ${BASE})`);
