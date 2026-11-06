// The theme's colours, from the GovWell Brand Standards (March 2026, v.01).
// Kept apart from build-registry.mjs so tests can check them
// (tests/contrast.test.ts).
//
// Literal values only: the shadcn CLI maps a color token to --color-<name>
// in @theme, but a var(...) value to a self-referencing --<name>, which would
// leave bg-primary and friends undefined.

// The brand palette, named as the book names it.
export const BRAND = {
  jet: '#000000',
  slate: '#202020',
  concrete: '#7c7c7c',
  cement: '#b1b1b1',
  ash: '#d9d9d9',
  base: '#ececec',
  hope: '#feaf0e',
  sky: '#41aaeb',
  field: '#39c25e',
};

// Light is the default: a white page with Slate type, as on govwell.com.
export const LIGHT = {
  ...BRAND,
  background: '#ffffff',
  foreground: '#202020',
  card: '#ffffff',
  'card-foreground': '#202020',
  popover: '#ffffff',
  'popover-foreground': '#202020',
  // the main action is Hope with Slate type (white on Hope is 1.85:1)
  primary: '#feaf0e',
  'primary-foreground': '#202020',
  // the second action is a Slate block
  secondary: '#202020',
  'secondary-foreground': '#ffffff',
  muted: '#ececec',
  // Concrete is 4.17:1 on white, just under AA; muted text is a step darker
  'muted-foreground': '#666666',
  accent: '#ececec',
  'accent-foreground': '#202020',
  border: '#d9d9d9',
  // a control's edge must reach 3:1 against the page: Concrete, not Ash
  input: '#7c7c7c',
  ring: '#202020',
  // status fills; Hope, Sky and Field always carry Slate type
  ok: '#39c25e',
  'ok-foreground': '#202020',
  info: '#41aaeb',
  'info-foreground': '#202020',
  warning: '#dc6803',
  'warning-foreground': '#202020',
  // the brand has no red; this one is for errors and destructive actions
  destructive: '#b42318',
  'destructive-foreground': '#ffffff',
  error: '#b42318',
  // the eyebrow tints: each brand colour at 30% on the page
  'hope-tint': '#ffe7b7',
  'sky-tint': '#c6e6f9',
  'field-tint': '#c4edcf',
  'ash-tint': '#d9d9d9',
  'tint-foreground': '#202020',
  // lines of the base grid (the base-grid utility)
  gridline: '#e6e6e6',
  // chart series, in order. On white the first series is Slate: Hope, Sky
  // and Field are under 3:1 on white, so they follow as supporting series.
  'chart-1': '#202020',
  'chart-2': '#feaf0e',
  'chart-3': '#41aaeb',
  'chart-4': '#39c25e',
  'chart-5': '#7c7c7c',
  radius: '0rem',
};

// Dark: Slate is the ground, as on the brand book's own pages; Hope stays
// the accent and becomes the focus ring.
export const DARK = {
  ...LIGHT,
  background: '#202020',
  foreground: '#ffffff',
  card: '#2a2a2a',
  'card-foreground': '#ffffff',
  popover: '#2a2a2a',
  'popover-foreground': '#ffffff',
  secondary: '#ffffff',
  'secondary-foreground': '#202020',
  muted: '#2a2a2a',
  'muted-foreground': '#b1b1b1',
  accent: '#333333',
  'accent-foreground': '#ffffff',
  border: '#3d3d3d',
  input: '#7c7c7c',
  ring: '#feaf0e',
  error: '#ff8a7a',
  // the same tints, at 30% on Slate, carrying white type
  'hope-tint': '#634b1b',
  'sky-tint': '#2e4a5c',
  'field-tint': '#2c4f35',
  'ash-tint': '#4d4d4d',
  'tint-foreground': '#ffffff',
  gridline: '#333333',
  // on Slate, Hope leads and every series reads
  'chart-1': '#feaf0e',
  'chart-2': '#ffffff',
  'chart-3': '#41aaeb',
  'chart-4': '#39c25e',
  'chart-5': '#b1b1b1',
};

// text-on-surface pairs that must meet WCAG AA (4.5:1), in both modes
export const TEXT_PAIRS = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['foreground', 'muted'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'muted'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['ok-foreground', 'ok'],
  ['info-foreground', 'info'],
  ['warning-foreground', 'warning'],
  ['destructive-foreground', 'destructive'],
  ['error', 'background'],
  ['error', 'card'],
  ['tint-foreground', 'hope-tint'],
  ['tint-foreground', 'sky-tint'],
  ['tint-foreground', 'field-tint'],
  ['tint-foreground', 'ash-tint'],
];

// non-text pairs that must reach 3:1: control edges, the focus ring, and the
// chart series that carry the most weight
export const UI_PAIRS = [
  ['input', 'background'],
  ['ring', 'background'],
  ['ring', 'card'],
  ['chart-1', 'card'],
];

// WCAG relative luminance and contrast ratio, for hex colours
export function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
