'use client';

import * as React from 'react';
import { ClockIcon } from 'lucide-react';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

// A time of day in a square text box, like <Input>, with a clock at its
// leading edge. Type it however it comes — "2:30 pm", "2p", "1430", "14:30" —
// and it settles into "2:30 PM" (or "14:30" with hourCycle={24}) when the
// box loses focus or Enter is pressed. ArrowUp/ArrowDown move it by `step`
// minutes (an hour with Shift). The value is a 24-hour "HH:mm" string, the
// same as a native time input's, and clearing the box gives null.

type HourCycle = 12 | 24;

const pad = (n: number) => String(n).padStart(2, '0');

const toMinutes = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const fromMinutes = (minutes: number) => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
};

/** Reads what someone typed as a time of day; returns "HH:mm" or null. */
function parseTime(text: string): string | null {
  const s = text.trim().toLowerCase().replace(/\./g, '');
  if (!s) return null;
  const match = /^(\d{1,2})(?:[:h ]?(\d{2}))?\s*(a|am|p|pm)?$/.exec(s);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.[0];
  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'a' && hours === 12) hours = 0;
    if (meridiem === 'p' && hours !== 12) hours += 12;
  } else if (hours > 23) {
    return null;
  }
  return `${pad(hours)}:${pad(minutes)}`;
}

/** Shows an "HH:mm" value as "2:30 PM" or "14:30". */
function formatTime(value: string | null | undefined, hourCycle: HourCycle = 12): string {
  if (!value) return '';
  const [h = 0, m = 0] = value.split(':').map(Number);
  if (hourCycle === 24) return `${pad(h)}:${pad(m)}`;
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

function TimeInput({
  value: valueProp,
  defaultValue,
  onValueChange,
  hourCycle = 12,
  step = 15,
  min,
  max,
  placeholder,
  disabled,
  className,
  onBlur,
  onKeyDown,
  ...props
}: Omit<React.ComponentProps<'input'>, 'value' | 'defaultValue' | 'onChange' | 'type' | 'step' | 'min' | 'max'> & {
  /** "HH:mm" (24-hour), or null when empty */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  hourCycle?: HourCycle;
  /** minutes moved by ArrowUp/ArrowDown */
  step?: number;
  /** earliest allowed time, "HH:mm" */
  min?: string;
  /** latest allowed time, "HH:mm" */
  max?: string;
}) {
  const isControlled = valueProp !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<string | null>(defaultValue ?? null);
  const value = isControlled ? valueProp : uncontrolled;
  const [text, setText] = React.useState(() => formatTime(value, hourCycle));
  const [editing, setEditing] = React.useState(false);

  // a value set from outside (a form reset, a hydrate) replaces the text, but
  // never while someone is typing in the box
  const [shown, setShown] = React.useState({ value, hourCycle });
  if (!editing && (shown.value !== value || shown.hourCycle !== hourCycle)) {
    setShown({ value, hourCycle });
    setText(formatTime(value, hourCycle));
  }

  const clamp = (next: string) => {
    let minutes = toMinutes(next);
    if (min) minutes = Math.max(toMinutes(min), minutes);
    if (max) minutes = Math.min(toMinutes(max), minutes);
    return fromMinutes(minutes);
  };

  const emit = (next: string | null) => {
    if (!isControlled) setUncontrolled(next);
    if (next !== value) onValueChange?.(next);
  };

  const commit = () => {
    const parsed = parseTime(text);
    if (text.trim() === '') {
      emit(null);
      setText('');
    } else if (parsed) {
      const next = clamp(parsed);
      emit(next);
      setText(formatTime(next, hourCycle));
    } else {
      // not a time: put back what it was
      setText(formatTime(value, hourCycle));
    }
  };

  return (
    <InputGroup data-slot="time-input" data-disabled={disabled || undefined} className={cn('w-48', className)}>
      <InputGroupAddon>
        <ClockIcon className="text-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder ?? (hourCycle === 12 ? 'h:mm AM' : 'HH:mm')}
        disabled={disabled}
        value={text}
        className="pl-1.5 tabular-nums"
        onChange={(e) => {
          setEditing(true);
          setText(e.target.value);
          // clearing the box empties the value at once, like a native time input
          if (e.target.value === '') emit(null);
        }}
        onBlur={(e) => {
          setEditing(false);
          commit();
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === 'Enter') {
            setEditing(false);
            commit();
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const current = parseTime(text) ?? value;
            const by = (e.shiftKey ? 60 : step) * (e.key === 'ArrowUp' ? 1 : -1);
            // from empty, start at the top of the current hour
            const base = current ? toMinutes(current) : new Date().getHours() * 60;
            // snap to the step grid before moving, so 2:07 goes to 2:15, not 2:22
            const snapped =
              current && !e.shiftKey && toMinutes(current) % step !== 0
                ? by > 0
                  ? Math.ceil(base / step) * step
                  : Math.floor(base / step) * step
                : base + by;
            const next = clamp(fromMinutes(snapped));
            setEditing(false);
            emit(next);
            setText(formatTime(next, hourCycle));
          }
        }}
        {...props}
      />
    </InputGroup>
  );
}

export { formatTime, parseTime, TimeInput };
