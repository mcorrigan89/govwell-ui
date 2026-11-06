import { useEffect, useState } from 'react';

// Whether the page is dark right now: <html data-mode="dark">, or "system"
// while the OS prefers dark. For what can't read a CSS variable — a map's
// canvas, a chart drawn in hex — and so has to pick its colours in script.

// null where there's no matchMedia (a test's jsdom)
const query = () => (typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null);

function isDark() {
  if (typeof document === 'undefined') return false;
  const mode = document.documentElement.dataset.mode;
  return mode === 'dark' || (mode === 'system' && !!query()?.matches);
}

export function useDark() {
  const [dark, setDark] = useState(isDark);
  useEffect(() => {
    const update = () => setDark(isDark());
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
    const media = query();
    media?.addEventListener('change', update);
    update();
    return () => {
      observer.disconnect();
      media?.removeEventListener('change', update);
    };
  }, []);
  return dark;
}
