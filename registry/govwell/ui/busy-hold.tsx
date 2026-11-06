'use client';

import * as React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// While slow work runs on a region (the AI reading a set of plans, 20–60
// seconds), the region holds still rather than vanishing behind a loader:
// everything stays in view, dimmed, and a disabled <fieldset> disables every
// control inside it at once, so nobody edits text that's about to be
// replaced. Above it, a status line with the brand spinner says what's
// happening, how long it has taken so far, and what to expect. It never
// covers the content: people read what's there while they wait.
//
// The region is aria-busy while held, and the status line is a polite live
// region, so a screen reader hears it start once (not every second).
//
//   <BusyHold busy={reading} label="Reading the site plan">
//     <PermitForm />
//   </BusyHold>

/** "8s", "1m 05s" */
function formatElapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

/** milliseconds since `running` last turned true, ticking each second; 0 while not running */
function useElapsed(running: boolean, since?: Date | number) {
  const [start, setStart] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!running) {
      // oxlint-disable-next-line react/set-state-in-effect
      setStart(null);
      return;
    }
    const begun = since != null ? new Date(since).getTime() : Date.now();
    setStart(begun);
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running, since]);
  return start == null ? 0 : now - start;
}

type BusyHoldProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  /** hold the region: disable its controls, dim it and show the status line */
  busy: boolean;
  /** what's happening, in a few words: "Reading the site plan" */
  label: React.ReactNode;
  /** the line under it; default says editing is paused and how long it usually takes */
  hint?: React.ReactNode;
  /** when the work started, if before this mounted (a page reload mid-run) */
  startedAt?: Date | number;
  /** show the time so far; default true */
  showElapsed?: boolean;
  /** keep the status line in view while the region scrolls; default true */
  sticky?: boolean;
  /** classes for the <fieldset> that holds the content */
  contentClassName?: string;
};

function BusyHold({
  busy,
  label,
  hint = 'Editing is paused until it’s done — usually under a minute.',
  startedAt,
  showElapsed = true,
  sticky = true,
  className,
  contentClassName,
  children,
  ...props
}: BusyHoldProps) {
  const elapsed = useElapsed(busy, startedAt);
  return (
    <div data-slot="busy-hold" data-busy={busy || undefined} className={cn('flex flex-col gap-4', className)} {...props}>
      {/* the live region is always there, so assistive tech catches the
          moment it fills; it's empty (and takes no room) while idle */}
      <div
        role="status"
        aria-live="polite"
        data-slot="busy-hold-status"
        className={cn(
          busy ? 'flex' : 'hidden',
          'z-20 items-start gap-3 border border-border border-l-4 border-l-primary bg-background p-4',
          sticky && 'sticky top-2',
        )}
      >
        {busy && (
          <>
            <Spinner aria-hidden role="presentation" aria-label={undefined} className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-normal">{label}</span>
                {showElapsed && (
                  // the seconds change every tick; keep them out of the live announcement
                  <span data-slot="busy-hold-elapsed" aria-hidden className="text-sm text-muted-foreground tabular-nums">
                    {formatElapsed(elapsed)}
                  </span>
                )}
              </div>
              {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            </div>
          </>
        )}
      </div>
      <fieldset
        data-slot="busy-hold-content"
        disabled={busy}
        aria-busy={busy}
        className={cn(
          'm-0 min-w-0 border-0 p-0 transition-opacity duration-150',
          // links aren't disabled by a fieldset; stop pointer use of them too
          busy && 'pointer-events-none opacity-60 select-none',
          contentClassName,
        )}
      >
        {children}
      </fieldset>
    </div>
  );
}

export { BusyHold, formatElapsed, useElapsed };
