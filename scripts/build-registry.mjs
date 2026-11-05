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
const UI = {};
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
