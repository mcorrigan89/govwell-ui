// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { contrast, DARK, LIGHT, TEXT_PAIRS, UI_PAIRS } from '../scripts/palette.mjs';

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
