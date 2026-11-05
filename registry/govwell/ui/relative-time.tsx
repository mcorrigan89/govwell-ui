'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

// When something happened, or will, said the way people say it: "5 minutes
// ago", "yesterday", "in 2 days". It's a <time> with the moment in dateTime
// and the full date and time as its title, so the exact value is a hover
// away. The words keep themselves current — every few seconds while the
// moment is under an hour away, every minute under a day, hourly after that
// — and stop when it's off the page. Plain text in the surrounding type;
// colour it where it sits.
//
//   <RelativeTime date={comment.createdAt} />
//   <RelativeTime date={hearing.at} style="short" />

type RelativeTimeStyle = 'long' | 'short' | 'narrow';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const toDate = (d: Date | string | number) => (d instanceof Date ? d : new Date(d));

type FormatRelativeOptions = {
  /** what "now" is; default the current time */
  now?: Date | string | number;
  locale?: string;
  /** Intl's style: long "5 minutes ago", short "5 min. ago", narrow "5m ago"; default long */
  style?: RelativeTimeStyle;
  /** said for anything under 45 seconds either way; default "just now" */
  justNow?: string;
};

const formatters = new Map<string, Intl.RelativeTimeFormat>();
function formatter(locale: string | undefined, style: RelativeTimeStyle) {
  const key = `${locale ?? ''}|${style}`;
  let f = formatters.get(key);
  if (!f) {
    // numeric: 'auto' says "yesterday" and "tomorrow" rather than "1 day ago"
    f = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style });
    formatters.set(key, f);
  }
  return f;
}

/** "5 minutes ago", "yesterday", "in 2 weeks" — the largest unit that fits, rounded */
function formatRelative(date: Date | string | number, options: FormatRelativeOptions = {}): string {
  const { now = Date.now(), locale, style = 'long', justNow = 'just now' } = options;
  const diff = toDate(date).getTime() - toDate(now).getTime();
  const abs = Math.abs(diff);
  if (Number.isNaN(diff)) return '';
  if (abs < 45 * SECOND) return justNow;
  const f = formatter(locale, style);
  const round = (unit: number) => Math.round(diff / unit);
  if (abs < 45 * MINUTE) return f.format(round(MINUTE), 'minute');
  if (abs < 22 * HOUR) return f.format(round(HOUR), 'hour');
  if (abs < 7 * DAY) return f.format(round(DAY), 'day');
  if (abs < 30 * DAY) return f.format(round(7 * DAY), 'week');
  if (abs < 365 * DAY) return f.format(round(30 * DAY), 'month');
  return f.format(round(365 * DAY), 'year');
}

/** how often the words can change for a moment this far away */
function refreshInterval(distance: number) {
  if (distance < HOUR) return 15 * SECOND;
  if (distance < DAY) return MINUTE;
  return HOUR;
}

type RelativeTimeProps = Omit<React.ComponentProps<'time'>, 'children' | 'dateTime'> &
  Omit<FormatRelativeOptions, 'now'> & {
    date: Date | string | number;
    /** milliseconds between refreshes; default picks one from how far away
     *  the moment is; 0 never refreshes */
    refreshMs?: number;
  };

function RelativeTime({ date, locale, style, justNow, refreshMs, className, title, ...props }: RelativeTimeProps) {
  const d = toDate(date);
  const t = d.getTime();
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (refreshMs === 0 || Number.isNaN(t)) return;
    // a chain of timeouts rather than one interval, so the pace slows as the
    // moment recedes ("in 2 days" doesn't need checking every 15 seconds)
    let id: number;
    const tick = () => {
      id = window.setTimeout(
        () => {
          setNow(Date.now());
          tick();
        },
        refreshMs ?? refreshInterval(Math.abs(t - Date.now())),
      );
    };
    tick();
    return () => window.clearTimeout(id);
  }, [t, refreshMs]);

  const valid = !Number.isNaN(d.getTime());
  const full = valid
    ? d.toLocaleString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : undefined;

  return (
    <time
      data-slot="relative-time"
      dateTime={valid ? d.toISOString() : undefined}
      title={title ?? full}
      // the server's "now" and the browser's differ by a moment
      suppressHydrationWarning
      className={cn('whitespace-nowrap', className)}
      {...props}
    >
      {valid ? formatRelative(d, { now, locale, style, justNow }) : ''}
    </time>
  );
}

export { RelativeTime, formatRelative, type RelativeTimeStyle };
