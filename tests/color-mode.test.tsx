import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { applyColorMode, storedColorMode, useColorMode } from '@/hooks/use-color-mode';
import { useDark } from '@/hooks/use-dark';

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.mode;
});

describe('useColorMode', () => {
  it('starts light, with no attribute on <html>', () => {
    const { result } = renderHook(() => useColorMode());
    expect(result.current[0]).toBe('light');
    expect(document.documentElement.dataset.mode).toBeUndefined();
  });

  it('sets data-mode and remembers the choice', () => {
    const { result } = renderHook(() => useColorMode());
    act(() => result.current[1]('dark'));
    expect(document.documentElement.dataset.mode).toBe('dark');
    expect(storedColorMode()).toBe('dark');
  });

  it('ignores a stored value it does not know', () => {
    localStorage.setItem('govwell-mode', 'sepia');
    expect(storedColorMode()).toBe('light');
    applyColorMode();
    expect(document.documentElement.dataset.mode).toBeUndefined();
  });
});

describe('useDark', () => {
  it('follows data-mode on <html> as it changes', async () => {
    const { result } = renderHook(() => useDark());
    expect(result.current).toBe(false);
    await act(async () => {
      document.documentElement.dataset.mode = 'dark';
      await Promise.resolve();
    });
    expect(result.current).toBe(true);
    await act(async () => {
      delete document.documentElement.dataset.mode;
      await Promise.resolve();
    });
    expect(result.current).toBe(false);
  });
});
