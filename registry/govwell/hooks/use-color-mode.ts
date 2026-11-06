import { useCallback, useLayoutEffect, useState } from 'react';

// Light, dark, or whatever the OS prefers, remembered between visits. Light is
// the default (white page, Slate type); dark puts the page on Slate. The mode
// lives on <html data-mode>, so it reaches everything, portals included.
// Call this once, near the root.
//
//   const [mode, setMode] = useColorMode();
//
// To avoid a flash of light on a dark reload, run applyColorMode() before
// React renders (it reads the same stored choice).

export type ColorMode = 'light' | 'dark' | 'system';

const MODES: ColorMode[] = ['light', 'dark', 'system'];

/** the stored choice, or light */
export function storedColorMode(key = 'govwell-mode'): ColorMode {
  try {
    const v = localStorage.getItem(key);
    return MODES.includes(v as ColorMode) ? (v as ColorMode) : 'light';
  } catch {
    return 'light';
  }
}

/** put a mode on <html>: light is the default, so it clears the attribute */
export function applyColorMode(mode: ColorMode = storedColorMode()) {
  const root = document.documentElement;
  if (mode === 'light') delete root.dataset.mode;
  else root.dataset.mode = mode;
}

export function useColorMode(key = 'govwell-mode'): [ColorMode, (mode: ColorMode) => void] {
  const [mode, setState] = useState<ColorMode>(() => storedColorMode(key));
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  const setMode = useCallback(
    (next: ColorMode) => {
      setState(next);
      try {
        localStorage.setItem(key, next);
      } catch {
        // private windows and blocked storage: the choice lasts for this visit
      }
    },
    [key],
  );
  return [mode, setMode];
}
