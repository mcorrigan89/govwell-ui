'use client';

import * as React from 'react';
import { CalendarIcon, CheckIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// A start–end range, picked from a list of presets ("Today", "Last 7 days",
// "Month to date"…) or as a custom range on a two-month calendar, in one
// square popover. The trigger looks like <DatePicker>'s: a text box with a
// Concrete edge and a calendar at the end. The value keeps which preset was
// picked, so "Last 7 days" stays rolling — the dates are worked out again
// from today each time it's read — while a custom range keeps its dates.
// `from` is the start of its day and `to` the end of its day.

type DateRangeValue = {
  /** a preset's `value`, or "custom" */
  type: string;
  from?: Date;
  to?: Date;
};

type DateRangePreset = {
  value: string;
  label: string;
  /** the range relative to `today` (local midnight) */
  range: (today: Date) => { from: Date; to: Date };
};

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const DEFAULT_PRESETS: DateRangePreset[] = [
  { value: 'today', label: 'Today', range: (t) => ({ from: t, to: t }) },
  { value: 'yesterday', label: 'Yesterday', range: (t) => ({ from: addDays(t, -1), to: addDays(t, -1) }) },
  { value: 'last-7-days', label: 'Last 7 days', range: (t) => ({ from: addDays(t, -7), to: t }) },
  { value: 'month-to-date', label: 'Month to date', range: (t) => ({ from: new Date(t.getFullYear(), t.getMonth(), 1), to: t }) },
  { value: 'last-4-weeks', label: 'Last 4 weeks', range: (t) => ({ from: addDays(t, -28), to: t }) },
  { value: 'last-12-weeks', label: 'Last 12 weeks', range: (t) => ({ from: addDays(t, -84), to: t }) },
  { value: 'year-to-date', label: 'Year to date', range: (t) => ({ from: new Date(t.getFullYear(), 0, 1), to: t }) },
  { value: 'last-6-months', label: 'Last 6 months', range: (t) => ({ from: addMonths(t, -6), to: t }) },
  { value: 'last-12-months', label: 'Last 12 months', range: (t) => ({ from: addMonths(t, -12), to: t }) },
];

/** The dates a value stands for today: a preset's are worked out again, a custom range's are its own. */
function resolveDateRange(value: DateRangeValue | undefined, presets = DEFAULT_PRESETS, today = new Date()): { from?: Date; to?: Date } {
  if (!value) return {};
  const preset = presets.find((p) => p.value === value.type);
  if (!preset) return { from: value.from, to: value.to };
  const { from, to } = preset.range(startOfDay(today));
  return { from: startOfDay(from), to: endOfDay(to) };
}

/** "March 3 – 14", "March 3 – April 2", "Dec 28, 2025 – Jan 4, 2026"; the year only when it isn't this one. */
function formatDateRange(from: Date | undefined, to: Date | undefined, today = new Date()): string {
  if (!from && !to) return '';
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', opts);
  const md: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const mdy: Intl.DateTimeFormatOptions = { ...md, year: 'numeric' };
  if (!from || !to) return `${from ? fmt(from, mdy) : 'Not set'} – ${to ? fmt(to, mdy) : 'Not set'}`;
  const thisYear = today.getFullYear();
  const sameYear = from.getFullYear() === to.getFullYear();
  if (sameDay(from, to)) return fmt(from, from.getFullYear() === thisYear ? md : mdy);
  if (!sameYear) return `${fmt(from, mdy)} – ${fmt(to, mdy)}`;
  const withYear = from.getFullYear() !== thisYear;
  if (from.getMonth() === to.getMonth()) return `${fmt(from, md)} – ${to.getDate()}${withYear ? `, ${to.getFullYear()}` : ''}`;
  return `${fmt(from, md)} – ${fmt(to, withYear ? mdy : md)}`;
}

const formatInput = (d: Date | undefined) => (d ? `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}` : '');

/** Reads M/D/YYYY or YYYY-MM-DD; only a complete, real date. */
function parseDateInput(text: string): Date | undefined {
  const s = text.trim();
  let y: number, m: number, d: number;
  let match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (match) [m, d, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return undefined;
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d ? date : undefined;
}

function DateRangePicker({
  value,
  onValueChange,
  presets = DEFAULT_PRESETS,
  allowCustom = true,
  placeholder = 'Pick a date range',
  numberOfMonths = 2,
  disabled,
  className,
  calendar,
  ...props
}: Omit<React.ComponentProps<'button'>, 'value' | 'defaultValue' | 'onChange'> & {
  value?: DateRangeValue;
  onValueChange?: (value: DateRangeValue) => void;
  presets?: DateRangePreset[];
  /** offer "Custom range" with the calendar (default true) */
  allowCustom?: boolean;
  placeholder?: string;
  numberOfMonths?: number;
  /** extra props for the calendar: disabled days, month range, locale… */
  calendar?: Omit<React.ComponentProps<typeof Calendar>, 'mode' | 'selected' | 'onSelect' | 'required'>;
}) {
  const [open, setOpen] = React.useState(false);
  const [showCustom, setShowCustom] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const { from, to } = resolveDateRange(value, presets);
  const isCustom = value?.type === 'custom';

  const choose = (preset: DateRangePreset) => {
    const range = resolveDateRange({ type: preset.value }, presets);
    onValueChange?.({ type: preset.value, ...range });
    setOpen(false);
  };

  const commitCustom = (nextFrom: Date | undefined, nextTo: Date | undefined) => {
    // a range needs both ends, in order
    if (!nextFrom || !nextTo || startOfDay(nextFrom) > startOfDay(nextTo)) return;
    onValueChange?.({ type: 'custom', from: startOfDay(nextFrom), to: endOfDay(nextTo) });
  };

  // arrow keys move between the presets, like a menu
  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-slot=date-range-picker-preset]') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
    e.preventDefault();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setShowCustom(isCustom);
      }}
    >
      <PopoverTrigger
        data-slot="date-range-picker"
        data-placeholder={from || to ? undefined : ''}
        disabled={disabled}
        className={cn(
          "flex h-12 w-72 items-center justify-between gap-2 rounded-none border border-input bg-background px-4 text-base font-light whitespace-nowrap text-foreground transition-colors outline-none hover:border-foreground focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-error data-placeholder:text-muted-foreground data-popup-open:border-foreground [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
        {...props}
      >
        <span className="truncate">{from || to ? formatDateRange(from, to) : placeholder}</span>
        <CalendarIcon className="shrink-0 text-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] flex-col gap-0 p-0 sm:flex-row">
        <div
          ref={listRef}
          role="toolbar"
          aria-orientation="vertical"
          tabIndex={-1}
          aria-label="Date ranges"
          onKeyDown={onListKeyDown}
          className="flex min-w-48 flex-col p-1 outline-none sm:border-r sm:border-border"
        >
          {presets.map((preset) => (
            <PresetButton key={preset.value} selected={value?.type === preset.value} onClick={() => choose(preset)}>
              {preset.label}
            </PresetButton>
          ))}
          {allowCustom && (
            <PresetButton selected={isCustom} aria-expanded={showCustom} onClick={() => setShowCustom(true)}>
              Custom range
            </PresetButton>
          )}
        </div>
        {allowCustom && showCustom && (
          <CustomRange from={from} to={to} onCommit={commitCustom} numberOfMonths={numberOfMonths} calendar={calendar} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function PresetButton({ selected, className, children, ...props }: React.ComponentProps<'button'> & { selected?: boolean }) {
  return (
    <button
      type="button"
      data-slot="date-range-picker-preset"
      aria-pressed={selected}
      className={cn(
        'flex h-10 w-full items-center justify-between gap-4 rounded-none px-3 text-left text-sm font-light text-foreground outline-none hover:bg-accent focus-visible:bg-accent',
        className,
      )}
      {...props}
    >
      {children}
      {selected && <CheckIcon className="size-4 shrink-0" />}
    </button>
  );
}

function CustomRange({
  from,
  to,
  onCommit,
  numberOfMonths,
  calendar,
}: {
  from?: Date;
  to?: Date;
  onCommit: (from: Date | undefined, to: Date | undefined) => void;
  numberOfMonths: number;
  calendar?: Omit<React.ComponentProps<typeof Calendar>, 'mode' | 'selected' | 'onSelect' | 'required'>;
}) {
  const [startText, setStartText] = React.useState(formatInput(from));
  const [endText, setEndText] = React.useState(formatInput(to));
  // two months show the end month on the right
  const [month, setMonth] = React.useState(() => from ?? (numberOfMonths > 1 ? addMonths(to ?? new Date(), -1) : (to ?? new Date())));
  const startId = React.useId();
  const endId = React.useId();

  const startRef = React.useRef<HTMLInputElement>(null);
  const endRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setStartText(formatInput(from));
    setEndText(formatInput(to));
  };

  // a range picked on the calendar fills the boxes, but a box being typed in keeps its text
  const fromTime = from?.getTime();
  const toTime = to?.getTime();
  React.useEffect(() => {
    if (document.activeElement !== startRef.current) setStartText(formatInput(fromTime === undefined ? undefined : new Date(fromTime)));
    if (document.activeElement !== endRef.current) setEndText(formatInput(toTime === undefined ? undefined : new Date(toTime)));
  }, [fromTime, toTime]);

  return (
    <div data-slot="date-range-picker-custom" className="flex flex-col gap-4 border-t border-border p-4 sm:border-t-0">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label htmlFor={startId} className="flex flex-col gap-1.5 text-sm font-normal">
          Start date
          <Input
            ref={startRef}
            id={startId}
            placeholder="M/D/YYYY"
            value={startText}
            onChange={(e) => {
              setStartText(e.target.value);
              const parsed = parseDateInput(e.target.value);
              if (parsed) onCommit(parsed, to);
            }}
            onBlur={() => {
              const parsed = parseDateInput(startText);
              // an empty start means a one-day range on the end date; a start
              // after the end moves the end up to it
              if (!startText.trim() && to) onCommit(to, to);
              else if (parsed && to && parsed > to) onCommit(parsed, parsed);
              else reset();
            }}
          />
        </label>
        <label htmlFor={endId} className="flex flex-col gap-1.5 text-sm font-normal">
          End date
          <Input
            ref={endRef}
            id={endId}
            placeholder="M/D/YYYY"
            value={endText}
            onChange={(e) => {
              setEndText(e.target.value);
              const parsed = parseDateInput(e.target.value);
              if (parsed) onCommit(from, parsed);
            }}
            onBlur={() => {
              const parsed = parseDateInput(endText);
              if (!endText.trim() && from) onCommit(from, from);
              else if (parsed && from && parsed < startOfDay(from)) onCommit(parsed, parsed);
              else reset();
            }}
          />
        </label>
      </div>
      <Calendar
        {...calendar}
        className={cn('p-0', calendar?.className)}
        mode="range"
        numberOfMonths={numberOfMonths}
        month={month}
        onMonthChange={setMonth}
        selected={{ from: from && startOfDay(from), to: to && startOfDay(to) }}
        onSelect={(range) => {
          if (!range) return;
          onCommit(range.from ?? from, range.to ?? to);
        }}
      />
    </div>
  );
}

export { DateRangePicker, DEFAULT_PRESETS, formatDateRange, resolveDateRange };
export type { DateRangePreset, DateRangeValue };
