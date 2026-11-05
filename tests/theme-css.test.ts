// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { themeCss } from '../scripts/theme-css.mjs';

const theme = {
  cssVars: {
    theme: { 'font-sans': 'Inter', 'color-sign': 'var(--sign)' },
    light: { sign: '#0b0b0b', primary: '#ffffff', radius: '0rem' },
  },
  css: {
    '@import "tw-animate-css"': {},
    '@utility sign': { color: 'white' },
  },
};
const extra = { css: { '@import "@fontsource-variable/inter"': {}, '.extra': { 'font-size': '17px' } } };

describe('themeCss', () => {
  const css = themeCss([theme, extra]);

  it('puts every item’s @import before any other rule', () => {
    const lines = css.split('\n');
    expect(lines.slice(0, 2)).toEqual(['@import "tw-animate-css";', '@import "@fontsource-variable/inter";']);
    expect(css.match(/@import/g)).toHaveLength(2);
  });

  it('maps palette tokens to Tailwind colors, except radius and ones the theme already names', () => {
    expect(css).toContain('--color-primary: var(--primary);');
    expect(css).not.toContain('--color-radius');
    expect(css.match(/--color-sign:/g)).toHaveLength(1);
  });

  it('writes the palette and the rest of the css as plain rules', () => {
    expect(css).toContain(':root {\n  --sign: #0b0b0b;');
    expect(css).toContain('@utility sign {\n  color: white;\n}');
    expect(css).toContain('.extra {\n  font-size: 17px;\n}');
  });
});
