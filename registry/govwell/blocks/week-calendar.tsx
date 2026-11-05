'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusBadge, statusHue, type StatusHue } from '@/components/ui/status-badge';
import { ToneBadge, type Tone } from '@/components/ui/tone-badge';
import { cn } from '@/lib/utils';

// One week, Monday to Sunday, with what's booked in it at its time — the
// inspections calendar: an inspector sees the shape of their week, the office
// sees who's where. Done and not done alike; a finished one carries a tick.
//
// Wide, it's a time grid: hours down the left, a column per day, each event
// a block placed by its start and end (side by side when they overlap), and a
// Hope line at the current time on today. Narrow (or `layout="list"`), it's a
// list by day. Today's column is marked with a Hope square by its date. An
// event's colour comes from its tone (the ToneBadge tones) or its status (an
// org's status name and hue, as StatusBadge maps it): a tint fill with a rail
// in the status colour. Prev / next week and "This week" move it; the week is
// controlled (`weekStart` + `onWeekChange`) or left to the calendar.
//
// Events with no time yet don't belong here; keep them in a list beside it
// (pass a note into `toolbar`).

export type WeekCalendarEvent = {
  id: string;
  title: string;
  start: Date | string;
  /** default an hour after the start (`defaultDurationMinutes`) */
  end?: Date | string;
  /** a second line: the record and address */
  subtitle?: string;
  /** a third line, e.g. the inspector */
  meta?: string;
  /** colour by tone… */
  tone?: Tone;
  /** …or by an org status (wins over tone), shown as a StatusBadge in the list */
  status?: { name: string; color?: string | null };
  /** a short label for the tone, shown as a ToneBadge in the list ("booked", "passed") */
  label?: string;
  /** finished (passed, failed, cancelled) — gets a tick */
  done?: boolean;
  /** makes the event a link… (or use onEventClick for a button) */
  href?: string;
};

type Hue = StatusHue | 'neutral';

const TONE_HUE: Record<Tone, Hue> = {
  neutral: 'neutral',
  phosphor: 'neutral',
  ok: 'field',
  info: 'sky',
  warning: 'amber',
  system: 'amber',
  destructive: 'red',
  signal: 'red',
  muted: 'ash',
  dim: 'ash',
};

// a tint fill and a rail in the status colour; red has no brand tint, so it's white with a red rail
const HUE_CLASS: Record<Hue, string> = {
  neutral: 'bg-background border-l-foreground',
  sky: 'bg-sky-tint text-tint-foreground border-l-info',
  hope: 'bg-hope-tint text-tint-foreground border-l-primary',
  amber: 'bg-hope-tint text-tint-foreground border-l-warning',
  field: 'bg-field-tint text-tint-foreground border-l-ok',
  ash: 'bg-ash-tint text-tint-foreground border-l-muted-foreground',
  red: 'bg-background border-l-destructive',
  draft: 'bg-background border-l-input border-dashed',
};

const eventHue = (e: WeekCalendarEvent): Hue => (e.status ? statusHue(e.status.color) : TONE_HUE[e.tone ?? 'neutral']);

// ── dates (local, by calendar date so DST days can't shift them) ─────────────

const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));

/** local midnight of the Monday on or before `d` */
export function weekStartOf(d: Date): Date {
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
}

/** YYYY-MM-DD in local time — a week's key for a URL */
export function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

const time = (d: Date, locale?: string) => d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });

const hourLabel = (h: number, locale?: string) => new Date(2000, 0, 1, h).toLocaleTimeString(locale, { hour: 'numeric' });

/** "Nov 2 – 8, 2026" or "Oct 26 – Nov 1, 2026" — Intl collapses what the two ends share */
function weekLabel(start: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).formatRange(start, addDays(start, 6));
}

type Placed = { event: WeekCalendarEvent; start: Date; end: Date; lane: number; lanes: number };

/** the day's events in start order, each given a lane so overlapping ones sit side by side */
export function layoutDay(events: WeekCalendarEvent[], defaultDurationMinutes = 60): Placed[] {
  const items = events
    .map((event) => {
      const start = toDate(event.start);
      const end = event.end ? toDate(event.end) : new Date(start.getTime() + defaultDurationMinutes * 60_000);
      return { event, start, end: end > start ? end : new Date(start.getTime() + 15 * 60_000), lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime());

  // clusters of events that overlap each other, laid out together
  let cluster: Placed[] = [];
  let clusterEnd = 0;
  const laneEnds: number[] = [];
  const close = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    for (const p of cluster) p.lanes = lanes;
    cluster = [];
    laneEnds.length = 0;
  };
  for (const item of items) {
    if (cluster.length > 0 && item.start.getTime() >= clusterEnd) close();
    let lane = laneEnds.findIndex((end) => end <= item.start.getTime());
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.end.getTime();
    item.lane = lane;
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end.getTime());
  }
  if (cluster.length > 0) close();
  return items;
}

// ── the calendar ─────────────────────────────────────────────────────────────

type WeekCalendarProps = {
  events: WeekCalendarEvent[];
  /** the Monday shown (controlled); any day in the week will do */
  weekStart?: Date;
  /** the week to start on when uncontrolled; default this week */
  defaultWeekStart?: Date;
  onWeekChange?: (weekStart: Date) => void;
  onEventClick?: (event: WeekCalendarEvent) => void;
  /** `auto` (default) is the grid from 48rem of width and the list below it */
  layout?: 'auto' | 'grid' | 'list';
  /** the grid's first and last hours; widened to fit any event outside them */
  startHour?: number;
  endHour?: number;
  /** pixels per hour in the grid; default 56 */
  hourHeight?: number;
  defaultDurationMinutes?: number;
  /** what "now" is (for today's mark and the time line); default the current time */
  now?: Date;
  locale?: string;
  /** more controls, right of the week's label (a scope switch, "3 not scheduled") */
  toolbar?: ReactNode;
  /** said on a day with nothing booked (list layout); default "Nothing booked" */
  emptyLabel?: string;
  className?: string;
};

export function WeekCalendar({
  events,
  weekStart: weekStartProp,
  defaultWeekStart,
  onWeekChange,
  onEventClick,
  layout = 'auto',
  startHour = 7,
  endHour = 18,
  hourHeight = 56,
  defaultDurationMinutes = 60,
  now: nowProp,
  locale,
  toolbar,
  emptyLabel = 'Nothing booked',
  className,
}: WeekCalendarProps) {
  // keep today's mark and the time line moving, unless "now" is given
  const [tick, setTick] = useState(() => new Date());
  useEffect(() => {
    if (nowProp) return;
    const id = window.setInterval(() => setTick(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [nowProp]);
  const now = nowProp ?? tick;

  const [ownWeek, setOwnWeek] = useState(() => weekStartOf(defaultWeekStart ?? nowProp ?? new Date()));
  const weekStart = weekStartOf(weekStartProp ?? ownWeek);
  const go = (next: Date) => {
    if (weekStartProp === undefined) setOwnWeek(next);
    onWeekChange?.(next);
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const thisWeek = sameDay(weekStartOf(now), weekStart);
  const byDay = days.map((day) =>
    layoutDay(
      events.filter((e) => sameDay(toDate(e.start), day)),
      defaultDurationMinutes,
    ),
  );

  const showGrid = layout !== 'list';
  const showList = layout !== 'grid';

  return (
    <div data-slot="week-calendar" className={cn('@container flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Previous week" onClick={() => go(addDays(weekStart, -7))}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="sm" disabled={thisWeek} onClick={() => go(weekStartOf(now))}>
            This week
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next week" onClick={() => go(addDays(weekStart, 7))}>
            <ChevronRightIcon />
          </Button>
          <h2 data-slot="week-calendar-label" aria-live="polite" className="ml-2 text-xl font-normal tracking-tight">
            {weekLabel(weekStart, locale)}
          </h2>
        </div>
        {toolbar}
      </div>

      {showGrid && (
        <TimeGrid
          className={layout === 'auto' ? 'hidden @3xl:block' : undefined}
          days={days}
          byDay={byDay}
          now={now}
          startHour={startHour}
          endHour={endHour}
          hourHeight={hourHeight}
          locale={locale}
          onEventClick={onEventClick}
        />
      )}
      {showList && (
        <DayList
          className={layout === 'auto' ? '@3xl:hidden' : undefined}
          days={days}
          byDay={byDay}
          now={now}
          locale={locale}
          emptyLabel={emptyLabel}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
}

const dayName = (d: Date, locale?: string) => d.toLocaleDateString(locale, { weekday: 'short' });
const fullDay = (d: Date, locale?: string) => d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });

function eventName(p: Placed, locale?: string) {
  const e = p.event;
  const what = e.status?.name ?? e.label;
  return [`${time(p.start, locale)} – ${time(p.end, locale)}`, e.title, e.subtitle, what, e.done ? 'done' : null]
    .filter(Boolean)
    .join(', ');
}

/** the event as a button, a link or plain, with the shared look */
function EventShell({
  placed,
  onEventClick,
  className,
  style,
  children,
}: {
  placed: Placed;
  onEventClick?: (e: WeekCalendarEvent) => void;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const e = placed.event;
  const hue = eventHue(e);
  const shared = {
    'data-slot': 'week-calendar-event',
    'data-hue': hue,
    'data-done': e.done || undefined,
    style,
    className: cn(
      'block border border-border border-l-4 text-left text-foreground outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
      HUE_CLASS[hue],
      (onEventClick || e.href) && 'cursor-pointer hover:border-foreground',
      className,
    ),
  };
  if (e.href) {
    return (
      <a href={e.href} {...shared} onClick={onEventClick ? () => onEventClick(e) : undefined}>
        {children}
      </a>
    );
  }
  if (onEventClick) {
    return (
      <button type="button" {...shared} onClick={() => onEventClick(e)}>
        {children}
      </button>
    );
  }
  return <div {...shared}>{children}</div>;
}

function TimeGrid({
  days,
  byDay,
  now,
  startHour,
  endHour,
  hourHeight,
  locale,
  onEventClick,
  className,
}: {
  days: Date[];
  byDay: Placed[][];
  now: Date;
  startHour: number;
  endHour: number;
  hourHeight: number;
  locale?: string;
  onEventClick?: (e: WeekCalendarEvent) => void;
  className?: string;
}) {
  // widen the hours to fit everything booked
  const all = byDay.flat();
  const first = Math.min(startHour, ...all.map((p) => p.start.getHours()));
  const last = Math.max(endHour, ...all.map((p) => (sameDay(p.start, p.end) ? Math.ceil(minutesOfDay(p.end) / 60) : 24)));
  const hours = Array.from({ length: last - first }, (_, i) => first + i);
  const height = hours.length * hourHeight;
  const top = (minutes: number) => ((minutes - first * 60) / 60) * hourHeight;

  return (
    <div data-slot="week-calendar-grid" className={cn('border border-border', className)}>
      <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-border">
        <div aria-hidden />
        {days.map((day) => {
          const today = sameDay(day, now);
          return (
            <div
              key={isoDate(day)}
              data-today={today || undefined}
              className={cn('flex items-center gap-2 border-l border-border px-2 py-3', today && 'bg-hope-tint text-tint-foreground')}
            >
              {/* muted grey fails on the dark Hope tint; today's day name takes the tint's own text colour */}
              <span className={cn('eyebrow-type text-xs', today ? 'text-tint-foreground' : 'text-muted-foreground')}>
                {dayName(day, locale)}
              </span>
              <span className={cn('text-xl font-normal tabular-nums', today && 'bg-primary px-1.5 text-primary-foreground')}>
                {day.getDate()}
              </span>
              {today && <span className="sr-only">today</span>}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))]" style={{ height }}>
        <div aria-hidden className="relative">
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums first:translate-y-0"
              style={{ top: top(h * 60) + (h === first ? 4 : 0) }}
            >
              {hourLabel(h, locale)}
            </div>
          ))}
        </div>
        {days.map((day, i) => {
          const today = sameDay(day, now);
          const nowMinutes = minutesOfDay(now);
          return (
            <div
              key={isoDate(day)}
              role="group"
              aria-label={`${fullDay(day, locale)}${today ? ', today' : ''}`}
              className="relative border-l border-border"
            >
              {hours.map((h) => (
                <div
                  key={h}
                  aria-hidden
                  className="absolute inset-x-0 border-t border-border first:border-t-0"
                  style={{ top: top(h * 60) }}
                />
              ))}
              {byDay[i]!.map((p) => {
                const startMin = minutesOfDay(p.start);
                const endMin = sameDay(p.start, p.end) ? minutesOfDay(p.end) : 24 * 60;
                const short = endMin - startMin < 45;
                return (
                  <EventShell
                    key={p.event.id}
                    placed={p}
                    onEventClick={onEventClick}
                    className="absolute overflow-hidden px-1.5 py-1 text-xs leading-snug"
                    style={{
                      top: top(startMin) + 1,
                      height: Math.max(top(endMin) - top(startMin) - 2, hourHeight / 3),
                      left: `calc(${(p.lane / p.lanes) * 100}% + 2px)`,
                      width: `calc(${100 / p.lanes}% - 4px)`,
                    }}
                  >
                    {/* the block shows what fits; screen readers get it all */}
                    <span className="sr-only">{eventName(p, locale)}</span>
                    <span aria-hidden className="flex items-center gap-1 tabular-nums">
                      {time(p.start, locale)}
                      {p.event.done && <CheckIcon aria-hidden className="size-3 shrink-0" />}
                    </span>
                    {!short && (
                      <span aria-hidden className="block truncate font-normal">
                        {p.event.title}
                      </span>
                    )}
                    {!short && p.event.subtitle && (
                      <span aria-hidden className="block truncate opacity-80">
                        {p.event.subtitle}
                      </span>
                    )}
                  </EventShell>
                );
              })}
              {today && nowMinutes >= first * 60 && nowMinutes <= last * 60 && (
                <div
                  data-slot="week-calendar-now"
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-primary"
                  style={{ top: top(nowMinutes) }}
                >
                  <span className="absolute -top-[3px] -left-1 size-2 bg-primary" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayList({
  days,
  byDay,
  now,
  locale,
  emptyLabel,
  onEventClick,
  className,
}: {
  days: Date[];
  byDay: Placed[][];
  now: Date;
  locale?: string;
  emptyLabel: string;
  onEventClick?: (e: WeekCalendarEvent) => void;
  className?: string;
}) {
  return (
    <ol data-slot="week-calendar-list" className={cn('flex flex-col border border-border', className)}>
      {days.map((day, i) => {
        const today = sameDay(day, now);
        const items = byDay[i]!;
        const headingId = `wc-${isoDate(day)}`;
        return (
          <li
            key={isoDate(day)}
            aria-labelledby={headingId}
            data-today={today || undefined}
            className="border-b border-border last:border-b-0"
          >
            <h3
              id={headingId}
              className={cn('flex items-center gap-2 px-4 py-2 text-sm', today ? 'bg-hope-tint text-tint-foreground' : 'bg-muted')}
            >
              {today && <span aria-hidden className="size-2 bg-primary" />}
              <span className="font-normal">{fullDay(day, locale)}</span>
              {today && <span className="eyebrow-type text-xs">Today</span>}
            </h3>
            {items.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">{emptyLabel}</p>
            ) : (
              <ul className="flex flex-col gap-2 p-2">
                {items.map((p) => (
                  <li key={p.event.id}>
                    <EventShell placed={p} onEventClick={onEventClick} className="flex w-full items-start gap-3 px-3 py-2 text-sm">
                      <span className="w-28 shrink-0 tabular-nums">
                        {time(p.start, locale)}
                        <span className="block text-xs opacity-80">to {time(p.end, locale)}</span>
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-1.5 font-normal">
                          {p.event.done && <CheckIcon aria-label="Done" className="size-4 shrink-0" />}
                          {p.event.title}
                        </span>
                        {p.event.subtitle && <span className="truncate opacity-80">{p.event.subtitle}</span>}
                        {p.event.meta && <span className="truncate opacity-80">{p.event.meta}</span>}
                      </span>
                      {p.event.status ? (
                        <StatusBadge status={p.event.status} className="shrink-0" />
                      ) : p.event.label ? (
                        <ToneBadge tone={p.event.tone} className="shrink-0">
                          {p.event.label}
                        </ToneBadge>
                      ) : null}
                    </EventShell>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
