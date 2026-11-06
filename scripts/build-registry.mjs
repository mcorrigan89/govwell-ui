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
  'use-hotkeys': {
    title: 'useHotkeys',
    description:
      'Single-key and modifier shortcuts for a screen that stay quiet while someone is typing, inside a dialog, or on a focused control.',
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
  'actor-badge': {
    description: 'The who-did-it chip: a person by initials, or the system, an automation or the AI assistant by an icon on a tint.',
    deps: ['lucide-react'],
    ui: ['avatar'],
  },
  alert: {
    description: 'A square notice with the icon on a status-colour tile, a left rail for statuses, and a Regular title.',
    deps: ['class-variance-authority'],
  },
  'alert-dialog': {
    description: 'A confirmation that has to be answered, on a square panel over a Slate wash.',
    deps: ['@base-ui/react'],
    ui: ['button'],
  },
  'aspect-ratio': { description: 'Holds its content to a fixed width-to-height ratio.', deps: [] },
  attachment: {
    description:
      'A file card in a message or composer with an Ash hairline, a file tile, name and detail, and idle, uploading, processing, error and done states.',
    deps: ['@base-ui/react', 'class-variance-authority'],
    ui: ['button'],
  },
  avatar: {
    description:
      'A person as a circle with their image, or their initials on the grey surface, with an optional status dot and group count.',
    deps: ['@base-ui/react'],
  },
  badge: {
    description: 'A small square label in the eyebrow’s type, on a brand tint or a solid status colour.',
    deps: ['@base-ui/react', 'class-variance-authority'],
  },
  banner: {
    description:
      'A full-width band like govwell.com’s announcement bar, in Hope or a status colour, with an action, foldable details and a remembered dismissal.',
    deps: ['class-variance-authority', 'lucide-react'],
  },
  breadcrumb: {
    description: 'A trail of muted links to the current page, with thin chevrons between and the page you are on in Regular.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  bubble: {
    description:
      'A square message body in Light type: Slate for your own messages, plain or muted for the assistant, plus tinted, outline and unsent variants.',
    deps: ['@base-ui/react', 'class-variance-authority'],
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
  calendar: {
    description:
      'A month grid on a square card: today underlined in Hope, the chosen day a Slate block, a range on grey between Slate ends.',
    deps: ['react-day-picker', 'lucide-react'],
    ui: ['button'],
  },
  card: { description: 'A square panel with an Ash hairline, for a header (with an eyebrow), content and footer.', deps: [] },
  carousel: {
    description: 'A strip of slides you swipe, drag or step through with square outlined arrow buttons.',
    deps: ['embla-carousel-react', 'lucide-react'],
    ui: ['button'],
  },
  chart: {
    description: 'Recharts on a square card, with series colours that follow the mode and a floating-panel tooltip.',
    deps: ['recharts'],
  },
  'chat-composer': {
    description: 'Where you write to the assistant: a growing textarea and a Hope send button; Enter sends, Shift+Enter adds a line.',
    deps: ['lucide-react'],
    ui: ['button', 'spinner'],
  },
  checkbox: {
    description: 'A small square box with a Concrete edge that fills Slate, with the tick knocked out, when checked.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  collapsible: { description: 'An unstyled section that shows and hides behind a trigger.', deps: ['@base-ui/react'] },
  'color-picker': {
    description: 'A swatch in a text-box trigger that opens a square popover with a colour field, a hex box and GovWell brand presets.',
    deps: ['react-colorful'],
    ui: ['popover'],
  },
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
  'confirm-dialog': {
    description:
      'A one-call confirm or cancel on the alert dialog, declarative or as a promise, with destructive styling and a pending state.',
    deps: ['lucide-react'],
    ui: ['alert-dialog', 'spinner'],
  },
  'context-menu': {
    description: 'The dropdown menu’s panel, opened by right-click or long-press.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  'date-picker': {
    description: 'A date field that looks like a text input and opens a calendar in a square popover.',
    deps: ['lucide-react'],
    ui: ['calendar', 'popover'],
  },
  'date-range-picker': {
    description: 'A start–end date range picked from presets or as a custom range on a two-month calendar, in a square popover.',
    deps: ['lucide-react'],
    ui: ['calendar', 'input', 'popover'],
  },
  dialog: {
    description: 'A modal on a square panel over a Slate wash, with a Regular-weight title.',
    deps: ['@base-ui/react', 'lucide-react'],
    ui: ['button'],
  },
  distribution: {
    description: 'One flat square bar split by share in the chart colours, with a square-swatch legend beneath.',
    deps: [],
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
  'event-log': {
    description:
      'An activity timeline, newest first: an Ash rule with square status nodes, the time and a tint badge for who did it, plus a source filter.',
    deps: ['class-variance-authority'],
    ui: ['badge', 'toggle-group'],
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
  'file-upload': {
    description:
      'A dashed drop zone (or a button) that checks type, size and count, and lists files with progress, errors and remove buttons.',
    deps: ['lucide-react'],
    ui: ['button', 'progress'],
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
  'key-hints': {
    description: 'A one-line legend of a screen’s shortcuts: square keycaps and what they do, in small muted type.',
    deps: [],
    ui: ['kbd'],
  },
  label: { description: 'A form label in Regular weight.', deps: [] },
  link: {
    description:
      'A text link with a 1px underline that thickens on hover; external links get an arrow; renders as a router link through render.',
    deps: ['@base-ui/react', 'class-variance-authority', 'lucide-react'],
  },
  marker: {
    description: 'A line in a conversation that isn’t a message: a note, a separator, or an activity row showing a tool call’s status.',
    deps: ['@base-ui/react', 'class-variance-authority', 'lucide-react'],
    ui: ['spinner'],
  },
  menubar: {
    description: 'A plain bar of menus with a hairline edge; the open menu sits on a grey band.',
    deps: ['@base-ui/react'],
    ui: ['dropdown-menu'],
  },
  message: {
    description: 'One turn in a conversation: avatar, a small header, content and footer; your own messages sit on the right.',
    deps: [],
  },
  'message-scroller': {
    description:
      'A conversation’s scrolling area that follows new answers at the end, holds still while you read back, and jumps to the end.',
    deps: ['@shadcn/react', 'lucide-react'],
    ui: ['button'],
  },
  meter: { description: 'An n-of-m count drawn as square segments, filled Slate or a status colour.', deps: [] },
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
  'number-input': {
    description: 'A number in a square text box with an optional unit, steppers, arrow-key stepping and min/max clamping.',
    deps: ['@base-ui/react', 'lucide-react'],
  },
  'page-header': {
    description: 'The top of a page: an optional eyebrow, a Regular title with a count, a subtitle, search and actions; also PageSection.',
    deps: ['lucide-react'],
    ui: ['badge', 'eyebrow', 'input-group'],
  },
  pagination: {
    description: 'Previous, numbered and next page links, with the current page as a square Slate block.',
    deps: ['lucide-react'],
    ui: ['button'],
  },
  popover: { description: 'Content in a square floating panel, anchored to its trigger.', deps: ['@base-ui/react'] },
  progress: {
    description: 'A square progress bar: Hope on a grey track, or a status colour by tone, with an optional label and value.',
    deps: ['@base-ui/react', 'class-variance-authority'],
  },
  'query-state': {
    description: 'Loading, failed and empty states for a page or a table row, never shown in place of each other.',
    deps: ['lucide-react'],
    ui: ['alert', 'button', 'empty', 'spinner', 'table'],
  },
  questionnaire: {
    description: 'A short run of questions, one at a time, as a real form: square choice cards, a text answer, and Next and Submit.',
    deps: ['@shadcn/react', 'lucide-react'],
    ui: ['button'],
  },
  'quick-tip': {
    description: 'An inline “?” that opens help in a popover on click, or a tooltip on hover.',
    deps: ['lucide-react'],
    ui: ['popover', 'tooltip'],
  },
  'radio-group': {
    description: 'A set of round options, one chosen at a time, the chosen one marked with a Slate edge and dot.',
    deps: ['@base-ui/react'],
  },
  readout: {
    description: 'A dashboard figure: a large Regular-weight tabular number with a muted label, marked by tone.',
    deps: [],
  },
  resizable: {
    description: 'Panels split by hairline dividers you drag to resize, with an optional square grip.',
    deps: ['react-resizable-panels'],
  },
  'rich-text-editor': {
    description:
      'A TipTap rich-text box framed like a textarea, with a formatting toolbar, HTML value, read-only and disabled states, and optional merge fields.',
    deps: ['@tiptap/core', '@tiptap/pm', '@tiptap/react', '@tiptap/starter-kit', '@tiptap/extensions', 'lucide-react'],
    ui: ['button', 'dropdown-menu', 'input', 'toolbar'],
  },
  'scroll-area': { description: 'A box that scrolls with a thin square scrollbar.', deps: ['@base-ui/react'] },
  seal: {
    description:
      'A line-art stamp for issued, approved or certified: a square frame with corner nodes, the flag mark and the word on a status band.',
    deps: [],
  },
  'segmented-control': {
    description: 'Mutually exclusive options in a quiet strip, the chosen one a Slate block; sizes, icons, and full or fitted width.',
    deps: ['@base-ui/react', 'class-variance-authority'],
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
  sonner: {
    description: 'Toasts as square panels that follow the mode, with a status rail and the icon on a status-colour tile.',
    deps: ['sonner', 'lucide-react'],
  },
  spinner: { description: 'A loading indicator: a dotted ring with a solid square node travelling round it.', deps: [] },
  spotlight: {
    description: 'A Hope ring on a target with a square callout anchored beside it, and a guided tour with Back, Next and Done.',
    deps: ['@base-ui/react', 'class-variance-authority', 'lucide-react'],
    ui: ['button'],
  },
  stat: { description: 'A key figure: a large Regular-weight number with a short caption.', deps: [] },
  'status-badge': {
    description: 'An organisation’s status (a name and a hue) on a brand tint with a small square dot; no status reads as Draft.',
    deps: ['class-variance-authority'],
  },
  steps: {
    description:
      'Progress through a process as square markers: finished Slate, current Hope, error red; horizontal or vertical, optionally clickable.',
    deps: ['lucide-react'],
  },
  switch: {
    description: 'A square switch: a Concrete block on white when off, a Slate box with the block slid across when on.',
    deps: ['@base-ui/react'],
  },
  table: { description: 'A dense table with a grey header row in Regular type, hairline rows and tabular figures.', deps: [] },
  tabs: {
    description: 'Tabs on a quiet grey strip with the chosen tab a Slate block, or a line variant with a 2px underline.',
    deps: ['@base-ui/react', 'class-variance-authority'],
  },
  textarea: { description: 'A multi-line square text box with a Concrete edge that grows with its text.', deps: [] },
  tile: {
    description: 'A clickable card: an icon on a tint, a title and a line of description; a Slate edge when selected; a button or a link.',
    deps: ['@base-ui/react', 'class-variance-authority'],
  },
  'time-input': {
    description:
      'A time of day in a square text box that takes “2p”, “1430” or “2:30 pm”, settles to 12- or 24-hour time, and steps with the arrow keys.',
    deps: ['lucide-react'],
    ui: ['input-group'],
  },
  toggle: {
    description: 'A button in Light type that stays pressed in, shown as a Slate block, until pressed again.',
    deps: ['@base-ui/react', 'class-variance-authority'],
  },
  'toggle-group': {
    description: 'A row of toggles, one or several pressed, spaced apart or butted into one square strip.',
    deps: ['@base-ui/react', 'class-variance-authority'],
    ui: ['toggle'],
  },
  'tone-badge': {
    description: 'A square status badge picked by tone; also accepts Phosphor’s tone names, so code written for Phosphor keeps working.',
    deps: [],
    ui: ['badge'],
  },
  toolbar: {
    description: 'Groups of buttons, toggles and links in one square strip with separators and arrow-key focus; plain or floating.',
    deps: ['@base-ui/react', 'class-variance-authority'],
    ui: ['button', 'toggle', 'tooltip'],
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

// ── blocks ─────────────────────────────────────────────────────────────────
// larger compositions, installed to components/blocks so they can import each
// other and the ui items: name → { title, description, deps, ui }
const BLOCKS = {
  'app-shell': {
    title: 'App shell',
    description:
      'The staff app frame: a Slate sidebar with the GovWell logo and nav grouped by kind of work, the current page marked in Hope, collapsible to an icon rail, a drawer on phones, and a white top bar and page.',
    deps: ['lucide-react'],
    ui: ['flag-mark', 'sheet', 'tooltip'],
  },
  'data-table': {
    title: 'Data table',
    description:
      'A table that sorts, filters, pages, hides columns and selects rows, with a bulk-action bar, a pinned header and first column, drag or keyboard reordering, expandable rows, and loading and empty states.',
    deps: ['@tanstack/react-table', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', 'lucide-react'],
    ui: ['table', 'button', 'checkbox', 'dropdown-menu', 'input-group', 'pagination', 'empty', 'spinner'],
  },
  'sign-in': {
    title: 'Sign in',
    description:
      'A square sign-in card on the base grid under the GovWell logo: email and password or an emailed link, with a Hope button.',
    deps: [],
    ui: ['button', 'input', 'label', 'flag-mark'],
  },
};
const blockItems = Object.entries(BLOCKS).map(([name, spec]) => ({
  name,
  type: 'registry:block',
  title: spec.title,
  description: spec.description,
  dependencies: spec.deps,
  registryDependencies: [THEME, UTILS, ...(spec.ui ?? []).map(url)],
  files: [{ path: `registry/govwell/blocks/${name}.tsx`, type: 'registry:component', target: `components/blocks/${name}.tsx` }],
}));

// ── categories ─────────────────────────────────────────────────────────────
// every item belongs to exactly one, in this order; the preview groups its
// sidebar and pages by them, and the registry carries them as `categories`
const CATEGORIES = [
  { id: 'foundations', title: 'Foundations', items: ['theme', 'utils', 'use-color-mode', 'use-hotkeys'] },
  { id: 'brand', title: 'Brand', items: ['eyebrow', 'flag-mark', 'node-frame', 'grid-panel', 'stat', 'seal'] },
  {
    id: 'actions',
    title: 'Actions',
    items: ['button', 'button-group', 'link', 'toggle', 'toggle-group', 'segmented-control', 'toolbar'],
  },
  {
    id: 'forms',
    title: 'Forms',
    items: [
      'field',
      'label',
      'input',
      'input-group',
      'textarea',
      'number-input',
      'select',
      'native-select',
      'combobox',
      'checkbox',
      'radio-group',
      'switch',
      'slider',
      'input-otp',
      'calendar',
      'date-picker',
      'date-range-picker',
      'time-input',
      'color-picker',
      'file-upload',
      'rich-text-editor',
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    items: ['navigation-menu', 'breadcrumb', 'tabs', 'pagination', 'steps', 'accordion', 'collapsible', 'command', 'key-hints'],
  },
  {
    id: 'overlays',
    title: 'Overlays',
    items: [
      'dialog',
      'alert-dialog',
      'confirm-dialog',
      'sheet',
      'drawer',
      'popover',
      'hover-card',
      'tooltip',
      'quick-tip',
      'dropdown-menu',
      'context-menu',
      'menubar',
      'spotlight',
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    items: ['alert', 'banner', 'sonner', 'progress', 'spinner', 'skeleton', 'empty', 'query-state'],
  },
  {
    id: 'status',
    title: 'Status and identity',
    items: ['badge', 'status-badge', 'tone-badge', 'actor-badge', 'avatar', 'kbd'],
  },
  {
    id: 'data',
    title: 'Data display',
    items: ['table', 'item', 'readout', 'meter', 'distribution', 'chart', 'event-log', 'carousel'],
  },
  {
    id: 'layout',
    title: 'Layout',
    items: ['page-header', 'card', 'tile', 'separator', 'aspect-ratio', 'scroll-area', 'resizable'],
  },
  {
    id: 'chat',
    title: 'AI chat',
    items: ['message', 'bubble', 'attachment', 'marker', 'message-scroller', 'chat-composer', 'questionnaire'],
  },
  { id: 'blocks', title: 'Blocks', items: ['app-shell', 'data-table', 'sign-in'] },
];
const categoryOf = new Map(CATEGORIES.flatMap((c) => c.items.map((name) => [name, c.id])));

const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'govwell',
  homepage: BASE,
  items: [theme, utils, ...hookItems, ...uiItems, ...blockItems],
};

// every item has a category, and every category names real items
{
  const names = new Set(registry.items.map((i) => i.name));
  const missing = [...names].filter((n) => !categoryOf.has(n));
  const unknown = [...categoryOf.keys()].filter((n) => !names.has(n));
  if (missing.length) throw new Error(`no category for: ${missing.join(', ')} (add them to CATEGORIES)`);
  if (unknown.length) throw new Error(`CATEGORIES names items that don't exist: ${unknown.join(', ')}`);
  if (categoryOf.size !== CATEGORIES.reduce((n, c) => n + c.items.length, 0)) throw new Error('an item is in two categories');
  for (const item of registry.items) item.categories = [categoryOf.get(item.name)];
}

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
    {
      categories: CATEGORIES.map(({ id, title }) => ({ id, title })),
      // in category order, then as listed within the category
      items: registry.items
        .map(({ name, type, title, description }) => ({ name, type, title, description, category: categoryOf.get(name) }))
        .sort(
          (a, b) =>
            CATEGORIES.findIndex((c) => c.id === a.category) - CATEGORIES.findIndex((c) => c.id === b.category) ||
            CATEGORIES.find((c) => c.id === a.category).items.indexOf(a.name) -
              CATEGORIES.find((c) => c.id === b.category).items.indexOf(b.name),
        ),
    },
    null,
    2,
  ) + '\n',
);
execFileSync('npx', ['shadcn', 'build', '--output', 'public/r'], { stdio: 'inherit' });
console.log(`registry: ${registry.items.length} items → public/r (base ${BASE})`);
