// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { contrast, DARK, LIGHT, TEXT_PAIRS, UI_PAIRS } from '../scripts/palette.mjs';

// Colour tokens become text-*, bg-* and border-* utilities, so a token named
// like a size or a layout keyword quietly recolours everything using that
// utility (a 'base' token turned every text-base grey; a 'grid' token made
// bg-grid a fill).
const RESERVED = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  'grid',
  'none',
  'auto',
  'full',
  'clip',
  'fixed',
  'center',
  'left',
  'right',
  'top',
  'bottom',
  'x',
  'y',
];

describe('token names', () => {
  it('never collide with Tailwind size or layout keywords', () => {
    expect(Object.keys(LIGHT).filter((name) => RESERVED.includes(name))).toEqual([]);
  });
});

describe.each([
  ['light', LIGHT as Record<string, string>],
  ['dark', DARK as Record<string, string>],
])('%s palette', (_, palette) => {
  it.each(TEXT_PAIRS)('%s on %s meets WCAG AA for text', (fg, bg) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)('%s on %s reaches 3:1', (fg, bg) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(3);
  });
});
