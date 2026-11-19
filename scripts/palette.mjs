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
  slate: '#000000',
  concrete: '#7c7c7c',
  cement: '#b1b1b1',
  ash: '#d9d9d9',
  'base-grey': '#ececec',
  hope: '#feaf0e',
  sky: '#41aaeb',
  field: '#39c25e',
};

// The tag families: five colours in four steps each, lightest (100) to
// darkest (400), for tags and statuses. Tags look the same in both modes: a
// 100 tint (or a 200 for the second shade in a family) with black type, or a
// strong 300 fill (black type, but white on Ribbon Cutting's red).
//   Gold Standard  — waiting on someone (fees due, awaiting the applicant)
//   Blueprint      — in progress (submitted, in review, inspections)
//   Groundwork     — neutral or closed
//   Greenlight     — done (issued, approved)
//   Ribbon Cutting — a problem (denied, violation)
export const TAG_FAMILIES = {
  'gold-100': '#fee6b2',
  'gold-200': '#fedb92',
  'gold-300': '#fec54e',
  'gold-400': '#feaf0d',
  'blueprint-100': '#bce1f8',
  'blueprint-200': '#8bcbf3',
  'blueprint-300': '#40aaeb',
  'blueprint-400': '#1283ca',
  'groundwork-100': '#dacdc9',
  'groundwork-200': '#a2908b',
  'groundwork-300': '#85655d',
  'groundwork-400': '#482921',
  'greenlight-100': '#c2e5d4',
  'greenlight-200': '#76c09e',
  'greenlight-300': '#39c25e', // the brand's Field
  'greenlight-400': '#003d1f',
  'ribbon-100': '#f9d2d3',
  'ribbon-200': '#e39394',
  'ribbon-300': '#b90b0e',
  'ribbon-400': '#690002',
  // a tag's type: black on every tint, white on the one fill too dark for it
  'tag-foreground': '#000000',
  'tag-foreground-inverse': '#ffffff',
};

// Light is the default: a white page with Slate type, as on govwell.com.
export const LIGHT = {
  ...BRAND,
  ...TAG_FAMILIES,
  background: '#ffffff',
  foreground: '#000000',
  card: '#ffffff',
  'card-foreground': '#000000',
  popover: '#ffffff',
  'popover-foreground': '#000000',
  // the main action is Hope with Slate type (white on Hope is 1.85:1)
  primary: '#feaf0e',
  'primary-foreground': '#000000',
  // the second action is a Slate block
  secondary: '#000000',
  'secondary-foreground': '#ffffff',
  muted: '#ececec',
  // Concrete is 4.17:1 on white, just under AA; muted text is a step darker
  'muted-foreground': '#666666',
  accent: '#ececec',
  'accent-foreground': '#000000',
  border: '#d9d9d9',
  // a control's edge must reach 3:1 against the page: Concrete, not Ash
  input: '#7c7c7c',
  ring: '#000000',
  // status fills; Hope, Sky and Field always carry Slate type
  ok: '#39c25e',
  'ok-foreground': '#000000',
  // the tags' colours: Blueprint 300 for info, Gold Standard 300 for a
  // warning, Ribbon Cutting 300 for errors and destructive actions
  info: '#40aaeb',
  'info-foreground': '#000000',
  warning: '#fec54e',
  'warning-foreground': '#000000',
  destructive: '#b90b0e',
  'destructive-foreground': '#ffffff',
  error: '#b90b0e',
  // the eyebrow tints: each brand colour at 30% on the page
  'hope-tint': '#ffe7b7',
  'sky-tint': '#c6e6f9',
  'field-tint': '#c4edcf',
  'ash-tint': '#d9d9d9',
  // two status tints beyond the brand's three accents, so the six colours an
  // org can give a status all look different: amber (the warning orange) and
  // teal (between Sky and Field). Status and tags only; never text, never a
  // main action.
  'amber-tint': '#f1c39a',
  teal: '#3db6a4',
  'teal-tint': '#b7e4dd',
  'tint-foreground': '#000000',
  // lines of the base grid (the base-grid utility)
  gridline: '#e6e6e6',
  // chart series, in order. On white the first series is Slate: Hope, Sky
  // and Field are under 3:1 on white, so they follow as supporting series.
  'chart-1': '#000000',
  'chart-2': '#feaf0e',
  'chart-3': '#41aaeb',
  'chart-4': '#39c25e',
  'chart-5': '#7c7c7c',
  // past five series: the two status extensions, then a deep Sky
  'chart-6': '#dc6803',
  'chart-7': '#3db6a4',
  'chart-8': '#1b6fa3',
  radius: '0rem',
};

// Dark: Slate is the ground, as on the brand book's own pages; Hope stays
// the accent and becomes the focus ring.
export const DARK = {
  ...LIGHT,
  background: '#000000',
  foreground: '#ffffff',
  card: '#2a2a2a',
  'card-foreground': '#ffffff',
  popover: '#2a2a2a',
  'popover-foreground': '#ffffff',
  secondary: '#ffffff',
  'secondary-foreground': '#000000',
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
  // stronger than 30%: on Slate the muted versions read as Hope's and Field's tints
  'amber-tint': '#733711',
  'teal-tint': '#1f5a55',
  'tint-foreground': '#ffffff',
  gridline: '#333333',
  // on Slate, Hope leads and every series reads
  'chart-1': '#feaf0e',
  'chart-2': '#ffffff',
  'chart-3': '#41aaeb',
  'chart-4': '#39c25e',
  'chart-5': '#b1b1b1',
  'chart-6': '#f08a3c',
  'chart-7': '#3db6a4',
  // deep Sky is too dark on Slate; a pale Sky instead
  'chart-8': '#9dd3f5',
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
  ['tint-foreground', 'amber-tint'],
  ['tint-foreground', 'teal-tint'],
  // tags: every tint and fill a tag uses, with its type
  ...['gold', 'blueprint', 'groundwork', 'greenlight', 'ribbon'].flatMap((family) => [
    ['tag-foreground', `${family}-100`],
    ['tag-foreground', `${family}-200`],
  ]),
  ['tag-foreground', 'gold-300'],
  ['tag-foreground', 'gold-400'],
  ['tag-foreground', 'blueprint-300'],
  ['tag-foreground-inverse', 'groundwork-300'],
  ['tag-foreground', 'greenlight-300'],
  ['tag-foreground-inverse', 'ribbon-300'],
  ['tag-foreground-inverse', 'groundwork-400'],
  ['tag-foreground-inverse', 'greenlight-400'],
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
