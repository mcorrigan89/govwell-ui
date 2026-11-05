import { act, cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEMOS } from '@/docs/demos';
import { ExampleApp } from '@/docs/example-app/app';

// Every demo, and the sample app's pages, through axe's WCAG 2.2 A/AA rules.
// jsdom has no layout, so colour contrast (tests/contrast.test.ts holds the
// palette to AA) and anything needing real geometry are left to a browser
// audit; this catches the structural failures: names, roles, labels, nesting.

// jsdom gaps the demos touch
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;
Element.prototype.scrollIntoView ??= function () {};
Element.prototype.getAnimations ??= () => [];
globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as typeof matchMedia;

// maps need a real canvas and network; they're covered in tests/maps.test.tsx with mocks
const SKIP = new Set(['map', 'mini-map', 'point-picker', 'area-picker', 'vector-tile-layer']);

const RULES: axe.RunOptions = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  rules: {
    // needs layout and computed colours; checked in tests/contrast.test.ts and in the browser
    'color-contrast': { enabled: false },
    // Base UI's focus guards (aria-hidden spans that bounce focus back into a popup) trip it by design
    'aria-hidden-focus': { enabled: false },
  },
  resultTypes: ['violations'],
};

async function violations(root: Element) {
  const result = await axe.run(root, RULES);
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 120)).join(' | ')}`);
}

afterEach(() => {
  cleanup();
  location.hash = '';
});

describe('accessibility (axe, WCAG 2.2 A/AA)', () => {
  vi.setConfig({ testTimeout: 20_000 });

  for (const [name, Demo] of Object.entries(DEMOS)) {
    if (SKIP.has(name)) continue;
    it(`${name} demo`, async () => {
      const { container } = render(<Demo />);
      await act(async () => {});
      expect(await violations(container)).toEqual([]);
    });
  }

  for (const hash of ['#/insights', '#/records/building', '#/records/building/bld-2026-0101', '#/calendar', '#/payments/invoices']) {
    it(`sample app ${hash}`, async () => {
      location.hash = hash;
      const { container } = render(<ExampleApp />);
      await act(async () => {});
      expect(await violations(container)).toEqual([]);
    });
  }
});
