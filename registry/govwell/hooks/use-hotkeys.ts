import { useEffect, useRef } from 'react';

// Single-key shortcuts for a whole screen — A to approve, / to search,
// J and K to move — that stay out of the way: they don't fire while someone
// is typing in a field, inside an open dialog, or with ⌘/Ctrl/Alt held,
// unless the binding asks for that modifier (mod+k works from anywhere).
// Enter and Space also leave a control that was focused from the keyboard
// to press itself; after a click they're the screen's again.
//
//   useHotkeys({ a: approve, '/': focusSearch, 'mod+k': openPalette, n: nextInspection });
//
// Keys are case-insensitive: a letter or symbol, or a key name (enter, space,
// escape, arrowup, …). Prefix with mod+ (⌘ or Ctrl), ctrl+, meta+, alt+ or
// shift+. Without shift+ a binding fires whether or not Shift is held, so
// the handler can read event.shiftKey for a bigger step. A handled key's
// default is prevented; return false from the handler to let it through.

export type HotkeyHandler = (event: KeyboardEvent) => void | false;

const NAMES: Record<string, string> = {
  space: ' ',
  esc: 'escape',
  return: 'enter',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
};
const TEXT_INPUTS = new Set([
  'text',
  'search',
  'email',
  'number',
  'password',
  'tel',
  'url',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
]);
const TYPING_ROLES = new Set(['textbox', 'combobox', 'spinbutton', 'slider', 'searchbox']);
const CONTROL_ROLES = new Set(['button', 'checkbox', 'radio', 'switch', 'tab', 'option', 'link', 'treeitem']);
const CONTROL_TAGS = new Set(['BUTTON', 'SUMMARY', 'INPUT', 'SELECT', 'TEXTAREA']);

/** whether a key event's target is somewhere the keys mean typing */
export function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true;
  if (target.tagName === 'INPUT') return TEXT_INPUTS.has((target as HTMLInputElement).type);
  return TYPING_ROLES.has(target.getAttribute('role') ?? '');
}

/**
 * whether Enter or Space on this target should press it rather than run a
 * shortcut: a control someone reached from the keyboard. One that was only
 * clicked isn't :focus-visible, so the screen's keys still apply.
 */
export function ownsActivation(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const role = target.getAttribute('role') ?? '';
  const control =
    CONTROL_TAGS.has(target.tagName) ||
    (target.tagName === 'A' && target.hasAttribute('href')) ||
    CONTROL_ROLES.has(role) ||
    role.startsWith('menuitem');
  if (!control) return false;
  try {
    return target.matches(':focus-visible');
  } catch {
    return true;
  }
}

type Binding = { key: string; mod: boolean; ctrl: boolean; meta: boolean; alt: boolean; shift: boolean };

const parsed = new Map<string, Binding>();

function parse(spec: string): Binding {
  const cached = parsed.get(spec);
  if (cached) return cached;
  const parts = spec.toLowerCase().split('+');
  let key = parts.pop()!;
  // "+" and "shift++" name the plus key itself
  if (key === '') {
    key = '+';
    parts.pop();
  }
  const has = (m: string) => parts.includes(m);
  const b = { key: NAMES[key] ?? key, mod: has('mod'), ctrl: has('ctrl'), meta: has('meta'), alt: has('alt'), shift: has('shift') };
  parsed.set(spec, b);
  return b;
}

function matches(b: Binding, e: KeyboardEvent) {
  if (e.key.toLowerCase() !== b.key) return false;
  const wantsCtrl = b.ctrl || (b.mod && !e.metaKey);
  const wantsMeta = b.meta || (b.mod && !e.ctrlKey);
  if (e.ctrlKey !== wantsCtrl || e.metaKey !== wantsMeta || e.altKey !== b.alt) return false;
  return !b.shift || e.shiftKey;
}

export function useHotkeys(keys: Record<string, HotkeyHandler>, { enabled = true }: { enabled?: boolean } = {}) {
  const latest = useRef(keys);
  useEffect(() => {
    latest.current = keys;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      for (const [spec, handler] of Object.entries(latest.current)) {
        const b = parse(spec);
        if (!matches(b, e)) continue;
        const modified = b.mod || b.ctrl || b.meta || b.alt;
        const inDialog = e.target instanceof Element && e.target.closest('[role="dialog"], [role="alertdialog"]');
        if (!modified && (isTyping(e.target) || inDialog)) return;
        if (!modified && (b.key === 'enter' || b.key === ' ') && ownsActivation(e.target)) return;
        if (handler(e) !== false) e.preventDefault();
        return;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enabled]);
}
