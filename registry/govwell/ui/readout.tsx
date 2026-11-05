import * as React from 'react';

import { cn } from '@/lib/utils';

// A figure on a dashboard strip — open cases, permits issued, fees due — in
// the <Stat> style at a working size: a Regular-weight number with tight
// tracking and tabular figures, its label beneath in muted Light type.
// The tone marks the label with a small square in the status colour (the
// figure itself stays Jet/White, since Field and amber aren't text colours);
// attention turns the figure red, dim greys it out.
//
//   <Readout label="Issued" value="1,284" tone="ok" />

const MARKER = {
  neutral: '',
  ok: 'bg-ok',
  info: 'bg-info',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: '',
  // the signal-tone names
  phosphor: '',
  system: 'bg-warning',
  signal: 'bg-destructive',
  dim: '',
} as const;

type ReadoutTone = keyof typeof MARKER;

function Readout({
  label,
  value,
  tone = 'neutral',
  className,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: ReadoutTone;
}) {
  const dim = tone === 'dim' || tone === 'muted';
  const alarm = tone === 'destructive' || tone === 'signal';
  return (
    <div data-slot="readout" data-tone={tone} className={cn('flex flex-col gap-1', className)} {...props}>
      <span
        data-slot="readout-value"
        className={cn(
          'text-3xl leading-none font-normal tracking-tight tabular-nums',
          dim && 'text-muted-foreground',
          alarm && 'text-error',
        )}
      >
        {value}
      </span>
      <span data-slot="readout-label" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {MARKER[tone] && <span aria-hidden className={cn('size-2 shrink-0', MARKER[tone])} />}
        {label}
      </span>
    </div>
  );
}

export { Readout, type ReadoutTone };
