import * as React from 'react';
import { CheckIcon, ClockIcon, PauseIcon } from 'lucide-react';
import { cva } from 'class-variance-authority';

import { ToneBadge } from '@/components/ui/tone-badge';
import { cn } from '@/lib/utils';

// A deadline told as what's left or how late it is ("3 days left", "Due
// today", "2 days late") rather than as a date someone has to subtract in
// their head. The tone says how worried to be: Field while there's plenty of
// time, amber when it's close, red once it's passed, Ash while it's paused or
// once it's met. The date itself is on the <time> (as its title, so it shows
// on hover, and in dateTime for machines).
//
// Two looks: `text` (default) — a small square in the tone's colour before
// plain text, for rows and detail lists — and `badge`, the square eyebrow
// ToneBadge for tables and cards.
//
//   <Deadline due="2026-11-12" />
//   <Deadline due={record.dueAt} status="paused" remainingDays={5} variant="badge" />

type DeadlineTone = 'ok' | 'warning' | 'destructive' | 'muted';
type DeadlineStatus = 'open' | 'paused' | 'met';

const DAY_MS = 86_400_000;

const toDate = (d: Date | string | number) => (d instanceof Date ? d : new Date(d));

/** whole calendar days from `from` to `to` in local time (negative when `to`
 *  is earlier). Counted by date, not by 24-hour blocks, so a deadline at 9am
 *  tomorrow is "1 day" away at 5pm today, and a DST day can't shift it. */
function daysBetween(from: Date | string | number, to: Date | string | number): number {
  const a = toDate(from);
  const b = toDate(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / DAY_MS);
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

type FormatDeadlineOptions = {
  /** what "now" is; default the current time */
  now?: Date | string | number;
  /** open, paused or met; default open */
  status?: DeadlineStatus;
  /** days left when it was paused, said as "5 days left when it resumes" */
  remainingDays?: number;
  /** when it was met, said as "Met Nov 3" */
  metAt?: Date | string | number;
  /** within this many days (inclusive) it turns amber; default 3 */
  soonDays?: number;
  /** `day` counts calendar days (default); `hour` counts hours inside the
   *  last two days, as a clock-time deadline needs ("5 hours left") */
  precision?: 'day' | 'hour';
  /** for the dates; default the browser's */
  locale?: string;
};

type FormattedDeadline = {
  /** the words: "3 days left", "Due today", "2 days late", "Paused", "Met Nov 3" */
  text: string;
  tone: DeadlineTone;
  /** calendar days from now to the due date (negative when late) */
  days: number;
  /** the due date in full, for the title */
  dueLabel: string;
  /** the due date, short: "Nov 12" (with the year when it isn't this one) */
  dateText: string;
};

// the year only when it isn't this one
const shortDate = (d: Date, locale: string | undefined, now: Date) =>
  d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });

const fullDate = (d: Date, locale?: string, withTime = false) =>
  d.toLocaleString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });

/** the words and tone for a deadline, without rendering it */
function formatDeadline(due: Date | string | number, options: FormatDeadlineOptions = {}): FormattedDeadline {
  const { now = new Date(), status = 'open', remainingDays, metAt, soonDays = 3, precision = 'day', locale } = options;
  const dueDate = toDate(due);
  const nowDate = toDate(now);
  const days = daysBetween(nowDate, dueDate);
  const dueLabel = `Due ${fullDate(dueDate, locale, precision === 'hour')}`;
  const dateText = shortDate(dueDate, locale, nowDate);

  if (status === 'met') {
    return { text: metAt ? `Met ${shortDate(toDate(metAt), locale, nowDate)}` : 'Met', tone: 'muted', days, dueLabel, dateText };
  }
  if (status === 'paused') {
    const text = remainingDays != null ? `Paused · ${plural(remainingDays, 'day')} left when it resumes` : 'Paused';
    return { text, tone: 'muted', days, dueLabel, dateText };
  }

  if (precision === 'hour') {
    const ms = dueDate.getTime() - nowDate.getTime();
    const hours = Math.abs(ms) / 3_600_000;
    if (hours < 48) {
      // whole hours, rounded down, but never "0 hours"
      const span = plural(Math.max(1, Math.floor(hours)), 'hour');
      return ms >= 0
        ? { text: `${span} left`, tone: 'warning', days, dueLabel, dateText }
        : { text: `${span} late`, tone: 'destructive', days, dueLabel, dateText };
    }
  }

  if (days < 0) return { text: `${plural(-days, 'day')} late`, tone: 'destructive', days, dueLabel, dateText };
  if (days === 0) return { text: 'Due today', tone: 'warning', days, dueLabel, dateText };
  if (days === 1) return { text: 'Due tomorrow', tone: 'warning', days, dueLabel, dateText };
  return { text: `${plural(days, 'day')} left`, tone: days <= soonDays ? 'warning' : 'ok', days, dueLabel, dateText };
}

const deadlineVariants = cva('inline-flex w-fit shrink-0 items-center gap-2 whitespace-nowrap', {
  variants: {
    tone: {
      ok: '',
      warning: '',
      destructive: 'text-error',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: { tone: 'ok' },
});

const MARK: Record<DeadlineTone, string> = {
  ok: 'bg-ok',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground',
};

type DeadlineProps = Omit<React.ComponentProps<'time'>, 'children' | 'dateTime'> &
  FormatDeadlineOptions & {
    due: Date | string | number;
    /** `text` (a square mark and words) or `badge` (the square ToneBadge) */
    variant?: 'text' | 'badge';
    /** also say the date after the words: "3 days left · Nov 12" */
    showDate?: boolean;
  };

function Deadline({
  due,
  now,
  status = 'open',
  remainingDays,
  metAt,
  soonDays,
  precision,
  locale,
  variant = 'text',
  showDate = false,
  className,
  title,
  ...props
}: DeadlineProps) {
  const f = formatDeadline(due, { now, status, remainingDays, metAt, soonDays, precision, locale });
  const dueDate = toDate(due);
  const words = showDate && status === 'open' ? `${f.text} · ${f.dateText}` : f.text;
  const Icon = status === 'met' ? CheckIcon : status === 'paused' ? PauseIcon : ClockIcon;

  const timeProps = {
    'data-slot': 'deadline',
    'data-tone': f.tone,
    'data-status': status,
    dateTime: dueDate.toISOString(),
    title: title ?? f.dueLabel,
    ...props,
  };

  if (variant === 'badge') {
    // the badge renders as the <time>, so the date stays on it
    return (
      <ToneBadge tone={f.tone} render={<time {...timeProps} />} className={className}>
        <Icon aria-hidden />
        {words}
      </ToneBadge>
    );
  }
  return (
    <time {...timeProps} className={cn(deadlineVariants({ tone: f.tone }), className)}>
      <span data-slot="deadline-mark" aria-hidden className={cn('size-2 shrink-0', MARK[f.tone])} />
      {words}
    </time>
  );
}

export { Deadline, daysBetween, deadlineVariants, formatDeadline, type DeadlineStatus, type DeadlineTone, type FormattedDeadline };
