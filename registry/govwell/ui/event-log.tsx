'use client';

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

import { Badge, type badgeVariants } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

// An activity timeline for a record — a permit, a case, a licence — newest
// first: a vertical Ash rule with a square node for each event, the text in
// Light type, and beneath it when it happened and who or what did it (a
// square tint badge: a person, an automation, the system). An optional
// status sits at the far end of the line. Events that arrive after the log
// first renders fade in; the ones it opened with don't. EventLogFilter
// narrows it by source. The caller orders the events.
//
//   <EventLog aria-label="Activity">
//     {events.map((e) => (
//       <EventLogItem key={e.id} time="9:42 AM" dateTime={e.at} tag="Inspector" tone="ok">{e.text}</EventLogItem>
//     ))}
//   </EventLog>

// the node's colour, and the text's when the event needs attention
const TONES = {
  default: { node: 'bg-foreground', text: '' },
  foreground: { node: 'bg-foreground', text: '' },
  ok: { node: 'bg-ok', text: '' },
  info: { node: 'bg-info', text: '' },
  warning: { node: 'bg-warning', text: '' },
  destructive: { node: 'bg-destructive', text: 'text-error' },
  muted: { node: 'bg-ash-tint', text: 'text-muted-foreground' },
  // the signal-tone names
  phosphor: { node: 'bg-foreground', text: '' },
  system: { node: 'bg-warning', text: '' },
  signal: { node: 'bg-destructive', text: 'text-error' },
  dim: { node: 'bg-ash-tint', text: 'text-muted-foreground' },
} as const;

type EventLogTone = keyof typeof TONES;

// set once the log has rendered: entries that mount after that are news
const Settled = React.createContext<React.RefObject<boolean>>({ current: false });

function EventLog({ className, children, ...props }: React.ComponentProps<'ol'>) {
  const settled = React.useRef(false);
  React.useEffect(() => {
    settled.current = true;
  }, []);
  return (
    <Settled.Provider value={settled}>
      <ol data-slot="event-log" className={cn('relative flex min-h-0 flex-col overflow-y-auto', className)} {...props}>
        {children}
      </ol>
    </Settled.Provider>
  );
}

function EventLogItem({
  time,
  dateTime,
  tag,
  tagVariant = 'ash',
  tone = 'default',
  end,
  textClassName,
  className,
  children,
  ...props
}: React.ComponentProps<'li'> & {
  /** when it happened, as shown */
  time: React.ReactNode;
  /** a machine-readable time for the <time> element */
  dateTime?: string;
  /** who or what did it: a person, Automation, System */
  tag?: React.ReactNode;
  /** the tag badge's colour: a tint (default ash, sky, field) or outline */
  tagVariant?: VariantProps<typeof badgeVariants>['variant'];
  tone?: EventLogTone;
  /** a status at the far end of the line: a badge, a count, a link */
  end?: React.ReactNode;
  /** extra classes for the text, e.g. a strike-through */
  textClassName?: string;
}) {
  const settled = React.useContext(Settled);
  // read once, when the line mounts
  const [fresh] = React.useState(() => settled.current);
  const t = TONES[tone] ?? TONES.default;
  return (
    <li
      data-slot="event-log-item"
      data-tone={tone}
      data-fresh={fresh ? '' : undefined}
      className={cn(
        // the rule runs down the left through each node; it stops at the last
        'group/event relative flex gap-4 pb-5 pl-6 last:pb-0',
        "before:absolute before:top-2 before:bottom-0 before:left-[4.5px] before:w-px before:bg-border before:content-[''] last:before:hidden",
        fresh && 'animate-in duration-200 fade-in-0 slide-in-from-top-1 motion-reduce:animate-none',
        className,
      )}
      {...props}
    >
      <span aria-hidden data-slot="event-log-node" className={cn('absolute top-1.5 left-0 size-2.5', t.node)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className={cn('min-w-0 text-base font-light', t.text, textClassName)}>{children}</span>
        <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {tag !== undefined && (
            <Badge data-slot="event-log-tag" variant={tagVariant} className="px-1.5 py-1">
              {tag}
            </Badge>
          )}
          <time dateTime={dateTime} className="tabular-nums">
            {time}
          </time>
        </span>
      </div>
      {end !== undefined && <span className="shrink-0">{end}</span>}
    </li>
  );
}

function EventLogEmpty({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="event-log-empty" className={cn('py-2 text-muted-foreground', className)} {...props} />;
}

/** pick one source to show, or all of them */
function EventLogFilter<T extends string>({
  options,
  value,
  onValueChange,
  className,
  'aria-label': label = 'Filter the activity',
}: {
  options: { value: T; label: React.ReactNode; className?: string }[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <ToggleGroup
      data-slot="event-log-filter"
      variant="outline"
      size="sm"
      spacing={0}
      value={[value]}
      onValueChange={(v: string[]) => v[0] && onValueChange(v[0] as T)}
      aria-label={label}
      className={className}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className={o.className}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export { EventLog, EventLogEmpty, EventLogFilter, EventLogItem, type EventLogTone };
